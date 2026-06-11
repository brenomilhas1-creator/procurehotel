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
