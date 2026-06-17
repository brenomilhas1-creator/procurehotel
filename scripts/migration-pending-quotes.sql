-- =====================================================
-- Compra Facil Hoteis — Migration: Pending Quotes
-- Tabela para items sem preço (necessitam cotação)
-- Data: 2026-06-15
-- =====================================================

BEGIN;

-- 1) ENUM para status da cotação
DO $$ BEGIN
  CREATE TYPE quote_status AS ENUM ('pending', 'quoted', 'ordered', 'rejected', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2) TABELA pending_quotes
CREATE TABLE IF NOT EXISTS pending_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,

  -- Texto original que o user digitou
  raw_line text NOT NULL,

  -- Quantidade pedida (se conhecida)
  requested_quantity numeric(12,3),
  unit_of_measure unit_of_measure,

  -- Status do workflow
  status quote_status NOT NULL DEFAULT 'pending',

  -- Após cotação, preço e dados
  quoted_price numeric(12,4),
  quoted_at timestamptz,
  quote_reference text,
  quote_notes text,

  -- Se já foi convertido em ordem
  source_order_id uuid REFERENCES purchase_orders(id) ON DELETE SET NULL,

  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3) INDEXES
CREATE INDEX IF NOT EXISTS idx_pending_quotes_status ON pending_quotes(status);
CREATE INDEX IF NOT EXISTS idx_pending_quotes_supplier ON pending_quotes(supplier_id);
CREATE INDEX IF NOT EXISTS idx_pending_quotes_product ON pending_quotes(product_id);
CREATE INDEX IF NOT EXISTS idx_pending_quotes_user ON pending_quotes(user_id);
CREATE INDEX IF NOT EXISTS ix_pending_quotes_pending ON pending_quotes(status) WHERE status = 'pending';

-- 4) TRIGGER updated_at
DROP TRIGGER IF EXISTS trg_pending_quotes_updated_at ON pending_quotes;
CREATE TRIGGER trg_pending_quotes_updated_at
  BEFORE UPDATE ON pending_quotes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 5) RLS POLICIES
ALTER TABLE pending_quotes ENABLE ROW LEVEL SECURITY;

-- Política: admin vê tudo, user vê os seus
DROP POLICY IF EXISTS pending_quotes_read ON pending_quotes;
CREATE POLICY pending_quotes_read ON pending_quotes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.supabase_user_id = auth.uid() AND u.role = 'admin')
    OR user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid())
  );

-- Política: utilizador autenticado pode inserir (será o user_id resolvido pela trigger)
DROP POLICY IF EXISTS pending_quotes_insert ON pending_quotes;
CREATE POLICY pending_quotes_insert ON pending_quotes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política: update pelos mesmos critérios do read
DROP POLICY IF EXISTS pending_quotes_update ON pending_quotes;
CREATE POLICY pending_quotes_update ON pending_quotes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.supabase_user_id = auth.uid() AND u.role = 'admin')
    OR user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM users u WHERE u.supabase_user_id = auth.uid() AND u.role = 'admin')
    OR user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid())
  );

-- Política: delete só admin
DROP POLICY IF EXISTS pending_quotes_delete ON pending_quotes;
CREATE POLICY pending_quotes_delete ON pending_quotes
  FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users u WHERE u.supabase_user_id = auth.uid() AND u.role = 'admin'));

-- 6) Trigger resolve_user_id (igual às outras tabelas)
DROP TRIGGER IF EXISTS trg_resolve_user_pending_quotes ON pending_quotes;
CREATE TRIGGER trg_resolve_user_pending_quotes
  BEFORE INSERT ON pending_quotes
  FOR EACH ROW EXECUTE FUNCTION resolve_user_id();

-- 7) VIEW: items agrupados por fornecedor (para impressão)
CREATE OR REPLACE VIEW pending_quotes_by_supplier AS
SELECT
  pq.supplier_id,
  s.name AS supplier_name,
  s.contact_email AS supplier_email,
  s.contact_phone AS supplier_phone,
  COUNT(*) FILTER (WHERE pq.status = 'pending') AS pending_count,
  COUNT(*) AS total_count,
  MIN(pq.created_at) AS oldest_pending,
  MAX(pq.created_at) AS newest_pending
FROM pending_quotes pq
LEFT JOIN suppliers s ON s.id = pq.supplier_id
GROUP BY pq.supplier_id, s.name, s.contact_email, s.contact_phone;

-- 8) Comentários
COMMENT ON TABLE pending_quotes IS 'Items que não têm preço — aguardam cotação dos fornecedores';
COMMENT ON COLUMN pending_quotes.raw_line IS 'Texto original que o user escreveu (ex: "5kg de alho")';
COMMENT ON COLUMN pending_quotes.status IS 'pending=aguarda, quoted=cotado pelo fornecedor, ordered=já encomendado, rejected=rejeitado, cancelled=cancelado';

-- 9) Verificação
SELECT
  (SELECT COUNT(*) FROM pending_quotes) AS total_quotes,
  (SELECT COUNT(*) FROM pending_quotes WHERE status = 'pending') AS pending_count;

COMMIT;
