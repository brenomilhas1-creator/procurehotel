-- =====================================================
-- Migration: Sistema de Faturas (invoices) + 3-way match
-- Compra Facil Hoteis
-- =====================================================
-- CONCEITOS:
-- 1. INVOICE = cabeçalho da fatura (fornecedor, número, data, total)
-- 2. INVOICE LINE = cada item da fatura
-- 3. MATCH = ligar invoice_line a um purchase_order_item
--    para fazer 3-way match (PO ↔ GR ↔ Invoice)
-- 4. SOURCE = 'invoice' | 'import' | 'manual' | 'ocr' | 'quote'
-- 5. PRICE_TIER = 'list' (preço de tabela) | 'negotiated' | 'promo'
-- =====================================================

BEGIN;

-- 1) ENUM para tipo de documento
DO $$ BEGIN
  CREATE TYPE invoice_type AS ENUM ('fatura', 'fatura_recibo', 'guia_remessa', 'nota_credito', 'nota_debito', 'orcamento');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM ('pending', 'matched', 'partial', 'disputed', 'cancelled', 'paid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE match_status AS ENUM ('unmatched', 'auto_matched', 'manual_matched', 'disputed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE price_tier AS ENUM ('list', 'negotiated', 'promo', 'spot', 'contract');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Adicionar 'invoice' ao price_source se não existir
DO $$ BEGIN
  ALTER TYPE price_source ADD VALUE IF NOT EXISTS 'invoice';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) TABELA invoices
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

  -- Identificação
  invoice_number varchar(64) NOT NULL,        -- "ZFT2 BD0C/3040525129", "FT1/7979"
  invoice_type invoice_type NOT NULL DEFAULT 'fatura',
  atcud varchar(64),                          -- ATCUD (código QR português)
  series varchar(32),

  -- Datas
  invoice_date date NOT NULL,
  due_date date,
  received_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,

  -- Montantes (em EUR, mas pode ter outra moeda se internacional)
  currency varchar(3) NOT NULL DEFAULT 'EUR',
  subtotal numeric(12,4) NOT NULL DEFAULT 0,    -- base tributável
  tax_amount numeric(12,4) NOT NULL DEFAULT 0,   -- total IVA
  total_amount numeric(12,2) NOT NULL DEFAULT 0, -- total com IVA
  discount numeric(12,4) NOT NULL DEFAULT 0,

  -- Referências externas
  supplier_ref varchar(128),  -- nº que o fornecedor usa
  po_number_ref varchar(128), -- nº de PO que aparece na fatura
  order_id uuid REFERENCES purchase_orders(id) ON DELETE SET NULL,

  -- Workflow
  status invoice_status NOT NULL DEFAULT 'pending',
  notes text,
  pdf_path text,              -- onde está guardado o PDF original
  source varchar(32) NOT NULL DEFAULT 'manual', -- 'pdf' | 'email' | 'manual' | 'api'

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Constraint: invoice_number único POR FORNECEDOR (fornecedor pode repetir nº em séries)
  UNIQUE (supplier_id, invoice_number, series)
);

CREATE INDEX IF NOT EXISTS idx_invoices_supplier ON invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_order ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id);

DROP TRIGGER IF EXISTS trg_invoices_updated_at ON invoices;
CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_resolve_user_invoices ON invoices;
CREATE TRIGGER trg_resolve_user_invoices
  BEFORE INSERT ON invoices
  FOR EACH ROW EXECUTE FUNCTION resolve_user_id();

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS invoices_read ON invoices;
CREATE POLICY invoices_read ON invoices
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.supabase_user_id = auth.uid() AND u.role = 'admin')
    OR user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid())
  );
DROP POLICY IF EXISTS invoices_write ON invoices;
CREATE POLICY invoices_write ON invoices
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.supabase_user_id = auth.uid() AND u.role = 'admin')
    OR user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.supabase_user_id = auth.uid() AND u.role = 'admin')
    OR user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid())
  );

-- 3) TABELA invoice_lines (items da fatura)
CREATE TABLE IF NOT EXISTS invoice_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  line_number integer NOT NULL,

  -- Identificação do produto (pode ser código do fornecedor)
  supplier_sku varchar(64),         -- "147020" (código que aparece na fatura)
  raw_description text NOT NULL,    -- texto exato como aparece na fatura
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,

  -- Quantidades
  quantity numeric(12,3) NOT NULL,
  unit_of_measure unit_of_measure,
  package_qty numeric(12,3) DEFAULT 1,

  -- Preços
  unit_price numeric(12,4) NOT NULL,         -- preço por unidade
  subtotal numeric(12,4) NOT NULL,          -- qty * unit_price (sem IVA)
  tax_rate numeric(5,2) NOT NULL DEFAULT 0, -- percentagem IVA (6, 13, 23)
  tax_amount numeric(12,4) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL,             -- total com IVA (linha)

  -- 3-way match
  po_line_id uuid REFERENCES purchase_order_items(id) ON DELETE SET NULL,
  match_status match_status NOT NULL DEFAULT 'unmatched',
  match_confidence numeric(3,2) DEFAULT 0,  -- 0.00 a 1.00 (auto-match)
  matched_at timestamptz,

  -- Após match: cria/atualiza supplier_price
  generated_price_id uuid REFERENCES supplier_prices(id) ON DELETE SET NULL,

  -- Desconto (se aplicável)
  discount_pct numeric(5,2) DEFAULT 0,
  discount_amount numeric(12,4) DEFAULT 0,

  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (invoice_id, line_number)
);

CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice ON invoice_lines(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_lines_product ON invoice_lines(product_id);
CREATE INDEX IF NOT EXISTS idx_invoice_lines_po_line ON invoice_lines(po_line_id);
CREATE INDEX IF NOT EXISTS idx_invoice_lines_match ON invoice_lines(match_status);

DROP TRIGGER IF EXISTS trg_invoice_lines_updated_at ON invoice_lines;
CREATE TRIGGER trg_invoice_lines_updated_at
  BEFORE UPDATE ON invoice_lines
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS invoice_lines_read ON invoice_lines;
CREATE POLICY invoice_lines_read ON invoice_lines
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.supabase_user_id = auth.uid() AND u.role = 'admin')
    OR EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = invoice_lines.invoice_id
        AND i.user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid())
    )
  );
DROP POLICY IF EXISTS invoice_lines_write ON invoice_lines;
CREATE POLICY invoice_lines_write ON invoice_lines
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.supabase_user_id = auth.uid() AND u.role = 'admin')
    OR EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = invoice_lines.invoice_id
        AND i.user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.supabase_user_id = auth.uid() AND u.role = 'admin')
    OR EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = invoice_lines.invoice_id
        AND i.user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid())
    )
  );

-- 4) TABELA invoice_attachments (PDFs originais)
CREATE TABLE IF NOT EXISTS invoice_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  file_path text NOT NULL,             -- path no storage (ex: invoices/avoneto/2026/06/FT1-7979.pdf)
  file_name varchar(255) NOT NULL,
  file_size integer,
  mime_type varchar(64) DEFAULT 'application/pdf',
  sha256 char(64),                     -- hash para dedup
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_invoice_attach_invoice ON invoice_attachments(invoice_id);

ALTER TABLE invoice_attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS invoice_attach_read ON invoice_attachments;
CREATE POLICY invoice_attach_read ON invoice_attachments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS invoice_attach_write ON invoice_attachments;
CREATE POLICY invoice_attach_write ON invoice_attachments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users u WHERE u.supabase_user_id = auth.uid() AND u.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users u WHERE u.supabase_user_id = auth.uid() AND u.role = 'admin'));

-- 5) VIEW: estado de matching por fatura
CREATE OR REPLACE VIEW invoice_matching_summary AS
SELECT
  i.id AS invoice_id,
  i.invoice_number,
  i.invoice_date,
  s.name AS supplier_name,
  i.total_amount,
  i.status AS invoice_status,
  COUNT(il.*) AS total_lines,
  COUNT(*) FILTER (WHERE il.match_status = 'auto_matched')   AS auto_matched,
  COUNT(*) FILTER (WHERE il.match_status = 'manual_matched') AS manual_matched,
  COUNT(*) FILTER (WHERE il.match_status = 'unmatched')       AS unmatched,
  COUNT(*) FILTER (WHERE il.match_status = 'disputed')        AS disputed,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE il.match_status IN ('auto_matched','manual_matched')) / NULLIF(COUNT(*), 0),
    1
  ) AS match_pct
FROM invoices i
LEFT JOIN suppliers s ON s.id = i.supplier_id
LEFT JOIN invoice_lines il ON il.invoice_id = i.id
GROUP BY i.id, i.invoice_number, i.invoice_date, s.name, i.total_amount, i.status;

-- 6) FUNÇÃO: processar invoice_line → criar/atualizar supplier_price
-- Esta é a TRIANGULAÇÃO que o user pediu:
-- "basta triangular o item com o valor e alimentar o catalogo"
CREATE OR REPLACE FUNCTION process_invoice_line_to_price(p_line_id uuid)
RETURNS TABLE (
  ok boolean,
  message text,
  price_id uuid,
  product_id uuid,
  is_new_price boolean
) AS $$
DECLARE
  v_line invoice_lines%ROWTYPE;
  v_invoice invoices%ROWTYPE;
  v_existing_price supplier_prices%ROWTYPE;
  v_new_price_id uuid;
BEGIN
  -- 1) Carregar linha + fatura
  SELECT * INTO v_line FROM invoice_lines WHERE id = p_line_id;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Linha não encontrada'::text, NULL::uuid, NULL::uuid, false;
    RETURN;
  END IF;
  SELECT * INTO v_invoice FROM invoices WHERE id = v_line.invoice_id;
  IF v_line.product_id IS NULL THEN
    RETURN QUERY SELECT false, 'Linha sem product_id (precisa match manual)'::text, NULL::uuid, NULL::uuid, false;
    RETURN;
  END IF;

  -- 2) Verificar se já existe supplier_price para este (produto, fornecedor)
  SELECT * INTO v_existing_price
  FROM supplier_prices
  WHERE product_id = v_line.product_id
    AND supplier_id = v_invoice.supplier_id;

  -- 3) Se já existe, marcar como "old" (is_current=false) para manter histórico
  IF FOUND THEN
    UPDATE supplier_prices
    SET is_current = false, valid_until = v_invoice.invoice_date
    WHERE id = v_existing_price.id;
  END IF;

  -- 4) Criar novo supplier_price com source='invoice'
  INSERT INTO supplier_prices (
    supplier_id, product_id, price, unit_price,
    package_qty, min_order_qty, currency, source, source_ref,
    is_current, valid_from, notes
  ) VALUES (
    v_invoice.supplier_id, v_line.product_id, v_line.unit_price, v_line.unit_price,
    v_line.package_qty, 1, v_invoice.currency, 'invoice', v_invoice.invoice_number,
    true, v_invoice.invoice_date,
    'Fatura ' || v_invoice.invoice_number || ' de ' || v_invoice.invoice_date::text ||
    ' (IVA ' || v_line.tax_rate || '%, linha ' || v_line.line_number || ')'
  )
  RETURNING id INTO v_new_price_id;

  -- 5) Atualizar invoice_line com referência ao novo preço
  UPDATE invoice_lines SET generated_price_id = v_new_price_id WHERE id = p_line_id;

  RETURN QUERY SELECT
    true,
    CASE WHEN v_existing_price.id IS NOT NULL
      THEN 'Preço atualizado de ' || v_existing_price.price || ' para ' || v_line.unit_price
      ELSE 'Novo preço registado: ' || v_line.unit_price
    END,
    v_new_price_id,
    v_line.product_id,
    (v_existing_price.id IS NULL);
END;
$$ LANGUAGE plpgsql;

-- 7) FUNÇÃO: auto-match invoice_line para product_id (por descrição ou SKU)
CREATE OR REPLACE FUNCTION auto_match_invoice_line(p_line_id uuid)
RETURNS match_status AS $$
DECLARE
  v_line invoice_lines%ROWTYPE;
  v_invoice invoices%ROWTYPE;
  v_product_id uuid;
  v_confidence numeric(3,2) := 0;
BEGIN
  SELECT * INTO v_line FROM invoice_lines WHERE id = p_line_id;
  IF NOT FOUND THEN RETURN 'unmatched'; END IF;
  SELECT * INTO v_invoice FROM invoices WHERE id = v_line.invoice_id;
  IF v_line.product_id IS NOT NULL THEN RETURN 'auto_matched'; END IF;

  -- Tentar match por supplier_sku (se houver)
  IF v_line.supplier_sku IS NOT NULL THEN
    SELECT product_id INTO v_product_id
    FROM product_aliases
    WHERE LOWER(alias) = LOWER(v_line.supplier_sku)
    LIMIT 1;
    IF v_product_id IS NOT NULL THEN
      v_confidence := 0.95;
    END IF;
  END IF;

  -- Tentar match por raw_description exato
  IF v_product_id IS NULL THEN
    SELECT id INTO v_product_id FROM products
    WHERE LOWER(master_name) = LOWER(TRIM(v_line.raw_description))
    LIMIT 1;
    IF v_product_id IS NOT NULL THEN
      v_confidence := 0.90;
    END IF;
  END IF;

  -- Tentar match por alias (palavras-chave)
  IF v_product_id IS NULL THEN
    SELECT product_id INTO v_product_id
    FROM product_aliases
    WHERE LOWER(alias) = LOWER(TRIM(v_line.raw_description))
      AND hit_count > 0
    ORDER BY hit_count DESC
    LIMIT 1;
    IF v_product_id IS NOT NULL THEN
      v_confidence := 0.75;
    END IF;
  END IF;

  -- Tentar match por token (primeira palavra significativa, > 4 chars)
  IF v_product_id IS NULL THEN
    SELECT p.id INTO v_product_id
    FROM products p
    WHERE LOWER(p.master_name) LIKE '%' || LOWER(SPLIT_PART(v_line.raw_description, ' ', 1)) || '%'
       OR LOWER(p.master_name) LIKE '%' || LOWER(SPLIT_PART(v_line.raw_description, ' ', 2)) || '%'
    LIMIT 1;
    IF v_product_id IS NOT NULL THEN
      v_confidence := 0.50;
    END IF;
  END IF;

  IF v_product_id IS NOT NULL THEN
    UPDATE invoice_lines
    SET product_id = v_product_id,
        match_status = 'auto_matched',
        match_confidence = v_confidence,
        matched_at = now()
    WHERE id = p_line_id;
    RETURN 'auto_matched';
  END IF;

  RETURN 'unmatched';
END;
$$ LANGUAGE plpgsql;

-- 8) Verificação
SELECT
  (SELECT COUNT(*) FROM invoices) AS invoices_total,
  (SELECT COUNT(*) FROM invoice_lines) AS lines_total,
  (SELECT COUNT(*) FROM pg_indexes WHERE schemaname='public' AND tablename IN ('invoices','invoice_lines','invoice_attachments')) AS indices;

COMMIT;
