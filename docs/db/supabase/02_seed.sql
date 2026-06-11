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
