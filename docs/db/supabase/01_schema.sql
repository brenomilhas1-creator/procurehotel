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
