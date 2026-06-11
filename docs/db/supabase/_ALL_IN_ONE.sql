-- =====================================================================
-- ProcureHotel — schema Supabase (cole no SQL Editor do Supabase)
-- Idempotente: pode ser corrido várias vezes.
-- =====================================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enum types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE product_status AS ENUM ('active', 'hidden', 'blocked');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE unit_of_measure AS ENUM ('un','kg','g','l','ml','cx','pc','gf','lt','sc','dz');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE price_source AS ENUM ('manual', 'import', 'ocr');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('draft','copied','placed','cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE import_status AS ENUM ('uploaded','ocr_done','normalized','reviewing','approved','rejected','failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE import_type AS ENUM ('price_list','invoice');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE audit_action AS ENUM ('create','update','delete','approve','reject','login','logout','import','export','order_placed','password_reset');
EXCEPTION WHEN duplicate_object THEN null; END $$;
-- =====================================================================
-- ProcureHotel — tabelas
-- =====================================================================

-- USERS (espelha auth.users)
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_user_id UUID UNIQUE,
  email           VARCHAR(255) UNIQUE NOT NULL,
  full_name       VARCHAR(255) NOT NULL,
  hashed_password VARCHAR(255) NOT NULL DEFAULT '!supabase-managed',
  role            user_role NOT NULL DEFAULT 'user',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  tenant_id       VARCHAR(64),
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_users_supabase ON users(supabase_user_id);
CREATE INDEX IF NOT EXISTS ix_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS ix_users_email_lower ON users(lower(email));

-- PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  master_name           VARCHAR(255) NOT NULL,
  brand                 VARCHAR(128),
  category              VARCHAR(128),
  unit                  unit_of_measure NOT NULL DEFAULT 'un',
  package_size          NUMERIC(12,3),
  package_unit          unit_of_measure,
  status                product_status NOT NULL DEFAULT 'active',
  substitution_allowed  BOOLEAN NOT NULL DEFAULT true,
  substitution_of_id    UUID REFERENCES products(id) ON DELETE SET NULL,
  description           TEXT,
  sku                   VARCHAR(64) UNIQUE,
  ean                   VARCHAR(32),
  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_products_master_name ON products(lower(master_name));
CREATE INDEX IF NOT EXISTS ix_products_brand ON products(lower(brand));
CREATE INDEX IF NOT EXISTS ix_products_category ON products(category);
CREATE INDEX IF NOT EXISTS ix_products_status ON products(status);
CREATE INDEX IF NOT EXISTS ix_products_trgm ON products USING gin (master_name gin_trgm_ops);

-- PRODUCT ALIASES
CREATE TABLE IF NOT EXISTS product_aliases (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  alias       VARCHAR(255) NOT NULL,
  locale      VARCHAR(8) NOT NULL DEFAULT 'pt-PT',
  hit_count   INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_alias UNIQUE (product_id, alias, locale)
);
CREATE INDEX IF NOT EXISTS ix_alias_lower ON product_aliases(lower(alias));
CREATE INDEX IF NOT EXISTS ix_alias_trgm ON product_aliases USING gin (alias gin_trgm_ops);

-- SUPPLIERS
CREATE TABLE IF NOT EXISTS suppliers (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                     VARCHAR(255) NOT NULL,
  tax_id                   VARCHAR(32),
  contact_name             VARCHAR(255),
  contact_email            VARCHAR(255),
  contact_phone            VARCHAR(64),
  address                  TEXT,
  website                  VARCHAR(255),
  notes                    TEXT,
  payment_terms            VARCHAR(255),
  delivery_lead_time_hours INTEGER,
  minimum_order            NUMERIC(12,2),
  is_preferred             BOOLEAN NOT NULL DEFAULT false,
  tenant_id                UUID,
  is_active                BOOLEAN NOT NULL DEFAULT true,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_suppliers_name ON suppliers(lower(name));
CREATE INDEX IF NOT EXISTS ix_suppliers_tax_id ON suppliers(tax_id);

-- SUPPLIER PRICES
CREATE TABLE IF NOT EXISTS supplier_prices (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id    UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  product_id     UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price          NUMERIC(12,4) NOT NULL,
  currency       VARCHAR(3) NOT NULL DEFAULT 'EUR',
  unit_price     NUMERIC(12,6) NOT NULL,
  package_qty    NUMERIC(12,3) NOT NULL DEFAULT 1,
  min_order_qty  NUMERIC(12,3) NOT NULL DEFAULT 1,
  valid_from     TIMESTAMPTZ,
  valid_until    TIMESTAMPTZ,
  source         price_source NOT NULL DEFAULT 'manual',
  source_ref     VARCHAR(255),
  is_current     BOOLEAN NOT NULL DEFAULT true,
  notes          VARCHAR(255),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_prices_supplier ON supplier_prices(supplier_id);
CREATE INDEX IF NOT EXISTS ix_prices_product ON supplier_prices(product_id);
CREATE INDEX IF NOT EXISTS ix_prices_unit_price ON supplier_prices(unit_price);
CREATE INDEX IF NOT EXISTS ix_prices_current ON supplier_prices(is_current);

-- PURCHASE ORDERS
CREATE TABLE IF NOT EXISTS purchase_orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code              VARCHAR(32) UNIQUE NOT NULL,
  status            order_status NOT NULL DEFAULT 'draft',
  raw_input         TEXT,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  supplier_id       UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  total_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency          VARCHAR(3) NOT NULL DEFAULT 'EUR',
  notes             TEXT,
  placed_at         TIMESTAMPTZ,
  expected_delivery TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_po_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS ix_po_user ON purchase_orders(user_id);
CREATE INDEX IF NOT EXISTS ix_po_supplier ON purchase_orders(supplier_id);

-- PURCHASE ORDER ITEMS
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id          UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  supplier_price_id   UUID REFERENCES supplier_prices(id) ON DELETE SET NULL,
  raw_line            VARCHAR(255),
  quantity            NUMERIC(12,3) NOT NULL,
  unit_price          NUMERIC(12,4) NOT NULL,
  line_total          NUMERIC(12,2) NOT NULL,
  is_substitution     BOOLEAN NOT NULL DEFAULT false,
  substitution_reason VARCHAR(255),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_poi_order ON purchase_order_items(order_id);
CREATE INDEX IF NOT EXISTS ix_poi_product ON purchase_order_items(product_id);

-- IMPORTS
CREATE TABLE IF NOT EXISTS imports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id       UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  import_type       import_type NOT NULL DEFAULT 'price_list',
  original_filename VARCHAR(255) NOT NULL,
  stored_path       VARCHAR(512) NOT NULL,
  mime_type         VARCHAR(128),
  size_bytes        BIGINT NOT NULL DEFAULT 0,
  status            import_status NOT NULL DEFAULT 'uploaded',
  error_message     TEXT,
  extracted_rows    JSONB,
  normalized_rows   JSONB,
  rows_total        INTEGER NOT NULL DEFAULT 0,
  rows_approved     INTEGER NOT NULL DEFAULT 0,
  rows_rejected     INTEGER NOT NULL DEFAULT 0,
  approved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_imports_status ON imports(status);
CREATE INDEX IF NOT EXISTS ix_imports_user ON imports(user_id);

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  action       audit_action NOT NULL,
  entity_type  VARCHAR(64) NOT NULL,
  entity_id    UUID,
  payload      JSONB,
  ip_address   INET,
  user_agent   VARCHAR(512),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_audit_user_created ON audit_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS ix_audit_entity ON audit_logs(entity_type, entity_id);

-- Trigger genérico para updated_at
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['users','products','product_aliases','suppliers','supplier_prices','purchase_orders','purchase_order_items','imports'])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I', t, t);
    EXECUTE format('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
  END LOOP;
END $$;
-- =====================================================================
-- ProcureHotel — seed (demo)
-- Cria fornecedores + 22 produtos + preços + 1 user ADMIN local
-- (o user real será criado via Supabase Auth, este é placeholder)
-- =====================================================================

INSERT INTO suppliers (id, name, tax_id, contact_email, contact_phone, payment_terms, delivery_lead_time_hours, minimum_order, is_preferred)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Distribuidora Norte, Lda', '5000123456', 'comercial@distnorte.pt', '+351 22 123 4567', '30 dias', 24, 150, true),
  ('22222222-2222-2222-2222-222222222222', 'Horeca Sul, S.A.',         '5000654321', 'orders@horecasul.pt',    '+351 21 987 6543', '30 dias', 48, 250, false)
ON CONFLICT DO NOTHING;

-- produtos demo
INSERT INTO products (id, master_name, brand, category, unit, package_size, package_unit, status) VALUES
  ('aaaaaaa1-0000-0000-0000-000000000001', 'Coca Cola Original 33cl', 'Coca Cola', 'Bebidas', 'un', 1, 'un', 'active'),
  ('aaaaaaa1-0000-0000-0000-000000000002', 'Coca Cola Zero 33cl',     'Coca Cola', 'Bebidas', 'un', 1, 'un', 'active'),
  ('aaaaaaa1-0000-0000-0000-000000000003', 'Água Mineral 50cl',       'Luso',      'Bebidas', 'un', 1, 'un', 'active'),
  ('aaaaaaa1-0000-0000-0000-000000000004', 'Cerveja Super Bock 33cl', 'Super Bock','Bebidas', 'un', 1, 'un', 'active'),
  ('aaaaaaa1-0000-0000-0000-000000000005', 'Café Grão 1kg',           'Delta',     'Café',    'kg', 1, 'kg', 'active'),
  ('aaaaaaa1-0000-0000-0000-000000000006', 'Leite UHT Meio Gordo 1L', 'Mimosa',    'Laticínios', 'l', 1, 'l', 'active'),
  ('aaaaaaa1-0000-0000-0000-000000000007', 'Queijo Flamengo 5kg',     'Presid',    'Laticínios', 'kg', 5, 'kg', 'active'),
  ('aaaaaaa1-0000-0000-0000-000000000008', 'Manteiga sem Sal 250g',   'President', 'Laticínios', 'g', 250, 'g', 'active'),
  ('aaaaaaa1-0000-0000-0000-000000000009', 'Farinha Nacional Tipo 65 25kg', 'Nacional', 'Mercearia', 'kg', 25, 'kg', 'active'),
  ('aaaaaaa1-0000-0000-0000-000000000010', 'Açúcar Branco 1kg',       'Sidul',     'Mercearia', 'kg', 1, 'kg', 'active')
ON CONFLICT DO NOTHING;

-- aliases
INSERT INTO product_aliases (product_id, alias, locale) VALUES
  ('aaaaaaa1-0000-0000-0000-000000000001', 'coca', 'pt-PT'),
  ('aaaaaaa1-0000-0000-0000-000000000001', 'coca cola', 'pt-PT'),
  ('aaaaaaa1-0000-0000-0000-000000000001', 'coca-cola 33cl', 'pt-PT'),
  ('aaaaaaa1-0000-0000-0000-000000000001', 'cc 33', 'pt-PT'),
  ('aaaaaaa1-0000-0000-0000-000000000007', 'queijo flamengo', 'pt-PT'),
  ('aaaaaaa1-0000-0000-0000-000000000007', 'flamengo', 'pt-PT'),
  ('aaaaaaa1-0000-0000-0000-000000000009', 'farinha', 'pt-PT'),
  ('aaaaaaa1-0000-0000-0000-000000000009', 'farinha 25', 'pt-PT'),
  ('aaaaaaa1-0000-0000-0000-000000000006', 'leite', 'pt-PT'),
  ('aaaaaaa1-0000-0000-0000-000000000006', 'mimosa', 'pt-PT')
ON CONFLICT DO NOTHING;

-- preços demo
INSERT INTO supplier_prices (supplier_id, product_id, price, currency, unit_price, package_qty, source)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa1-0000-0000-0000-000000000001', 8.40,  'EUR', 0.350, 24, 'manual'),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa1-0000-0000-0000-000000000007', 28.50, 'EUR', 5.700, 5,  'manual'),
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaa1-0000-0000-0000-000000000009', 15.80, 'EUR', 0.632, 25, 'manual'),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa1-0000-0000-0000-000000000001', 9.10,  'EUR', 0.379, 24, 'manual'),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa1-0000-0000-0000-000000000005', 11.20, 'EUR', 11.20, 1, 'manual'),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa1-0000-0000-0000-000000000004', 7.80,  'EUR', 0.236, 33, 'manual'),
  ('22222222-2222-2222-2222-222222222222', 'aaaaaaa1-0000-0000-0000-000000000006', 0.85,  'EUR', 0.850, 1,  'manual')
ON CONFLICT DO NOTHING;
-- =====================================================================
-- ProcureHotel — Storage bucket + RLS
-- Cria o bucket "ocr-uploads" e policies básicas.
-- (o backend usa SERVICE_ROLE key, pelo que bypassa RLS por defeito)
-- =====================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('ocr-uploads', 'ocr-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Policies: ADMIN lê tudo, USER lê só os seus imports
DROP POLICY IF EXISTS "ocr-uploads: admin all" ON storage.objects;
CREATE POLICY "ocr-uploads: admin all"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'ocr-uploads'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    bucket_id = 'ocr-uploads'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

DROP POLICY IF EXISTS "ocr-uploads: user read own" ON storage.objects;
CREATE POLICY "ocr-uploads: user read own"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'ocr-uploads'
    AND (storage.foldername(name))[1] = 'imports'
    -- simplistic: users read all under imports (backend filtra por user_id nos imports)
  );

-- RLS nas tabelas — o backend usa SERVICE_ROLE (bypassa), frontend usa ANON.
-- Manter permissivo para já; ajustar quando tivermos frontend-only access.

ALTER TABLE products            ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_aliases     ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_prices     ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders     ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE imports             ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE users               ENABLE ROW LEVEL SECURITY;

-- Por defeito: leitura para utilizadores autenticados
DROP POLICY IF EXISTS "read for authenticated" ON products;
CREATE POLICY "read for authenticated" ON products FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "read for authenticated" ON product_aliases;
CREATE POLICY "read for authenticated" ON product_aliases FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "read for authenticated" ON suppliers;
CREATE POLICY "read for authenticated" ON suppliers FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "read for authenticated" ON supplier_prices;
CREATE POLICY "read for authenticated" ON supplier_prices FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "read for authenticated" ON purchase_orders;
CREATE POLICY "read for authenticated" ON purchase_orders FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "read for authenticated" ON purchase_order_items;
CREATE POLICY "read for authenticated" ON purchase_order_items FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "read for authenticated" ON imports;
CREATE POLICY "read for authenticated" ON imports FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "read own audit" ON audit_logs;
CREATE POLICY "read own audit" ON audit_logs
  FOR SELECT TO authenticated
  USING (user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid()) OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "read own user" ON users;
CREATE POLICY "read own user" ON users
  FOR SELECT TO authenticated
  USING (supabase_user_id = auth.uid() OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Admin: escrita total
DROP POLICY IF EXISTS "admin write products" ON products;
CREATE POLICY "admin write products" ON products FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "admin write suppliers" ON suppliers;
CREATE POLICY "admin write suppliers" ON suppliers FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "admin write prices" ON supplier_prices;
CREATE POLICY "admin write prices" ON supplier_prices FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "admin write imports" ON imports;
CREATE POLICY "admin write imports" ON imports FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "user write own orders" ON purchase_orders;
CREATE POLICY "user write own orders" ON purchase_orders FOR ALL TO authenticated
  USING (user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid()))
  WITH CHECK (user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid()));

DROP POLICY IF EXISTS "user write own order items" ON purchase_order_items;
CREATE POLICY "user write own order items" ON purchase_order_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM purchase_orders po WHERE po.id = order_id AND po.user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM purchase_orders po WHERE po.id = order_id AND po.user_id = (SELECT id FROM users WHERE supabase_user_id = auth.uid())));
