-- =====================================================
-- Seed: Items pendentes de cotação (workflow demo)
-- Data: 2026-06-15
-- =====================================================

BEGIN;

-- Limpar pendentes de teste anteriores
DELETE FROM pending_quotes;

DO $$
DECLARE
  v_admin_id UUID;
  v_avoneto UUID;
  v_aviludo UUID;
  v_makro UUID;
  v_product_id UUID;
BEGIN
  SELECT id INTO v_admin_id FROM users WHERE email = 'admin@fourpoint.pt' LIMIT 1;
  IF v_admin_id IS NULL THEN
    SELECT id INTO v_admin_id FROM users WHERE role = 'admin' LIMIT 1;
  END IF;
  SELECT id INTO v_avoneto FROM suppliers WHERE name = 'Avoneto Hortefruti';
  SELECT id INTO v_aviludo FROM suppliers WHERE name = 'Aviludo';
  SELECT id INTO v_makro  FROM suppliers WHERE name = 'Makro';

  -- AVONETO — items sem preço (3 pendentes)
  INSERT INTO pending_quotes (user_id, supplier_id, product_id, raw_line, requested_quantity, unit_of_measure, status, notes)
  SELECT v_admin_id, v_avoneto, p.id, q.raw_line, q.qty, q.unit::unit_of_measure, 'pending', q.notes
  FROM (VALUES
    ('Abacaxi', 3, 'un', 'A confirmar preço de abacaxi novo do fornecedor'),
    ('Caju',    5, 'kg', 'Produto novo, sem histórico de preço'),
    ('Lichia',  2, 'kg', 'Fruta da época, preço de campanha a obter')
  ) AS q(raw_line, qty, unit, notes)
  LEFT JOIN products p ON p.master_name = q.raw_line
  ON CONFLICT DO NOTHING;

  -- Se os produtos não existirem, criar como placeholders
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Abacaxi') THEN
    INSERT INTO products (master_name, category, unit, is_active) VALUES ('Abacaxi', 'Frutas', 'un', true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Caju') THEN
    INSERT INTO products (master_name, category, unit, is_active) VALUES ('Caju', 'Frutas', 'kg', true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Lichia') THEN
    INSERT INTO products (master_name, category, unit, is_active) VALUES ('Lichia', 'Frutas', 'kg', true);
  END IF;

  INSERT INTO pending_quotes (user_id, supplier_id, product_id, raw_line, requested_quantity, unit_of_measure, status, notes)
  SELECT v_admin_id, v_avoneto, p.id, q.raw_line, q.qty, q.unit::unit_of_measure, 'pending', q.notes
  FROM (VALUES
    ('Abacaxi', 3, 'un', 'A confirmar preço de abacaxi novo do fornecedor'),
    ('Caju',    5, 'kg', 'Produto novo, sem histórico de preço'),
    ('Lichia',  2, 'kg', 'Fruta da época, preço de campanha a obter')
  ) AS q(raw_line, qty, unit, notes)
  JOIN products p ON p.master_name = q.raw_line
  WHERE NOT EXISTS (
    SELECT 1 FROM pending_quotes pq
    WHERE pq.raw_line = q.raw_line AND pq.supplier_id = v_avoneto AND pq.status = 'pending'
  );

  -- AVILUDO — 4 pendentes (produtos que ainda não temos preço)
  INSERT INTO pending_quotes (user_id, supplier_id, product_id, raw_line, requested_quantity, unit_of_measure, status, notes)
  SELECT v_admin_id, v_aviludo, p.id, q.raw_line, q.qty, q.unit::unit_of_measure, 'pending', q.notes
  FROM (VALUES
    ('Carne Picada Bovina',  3.0, 'kg', 'Carne nacional - preço varia semanalmente'),
    ('Picanha',              2.0, 'kg', 'Corte premium - solicitar preço do dia'),
    ('Camarão 16/20',        1.5, 'kg', 'Camarão congelado - confirmar disponibilidade'),
    ('Polvo inteiro',        2.0, 'kg', 'Polvo fresco - depende do mercado')
  ) AS q(raw_line, qty, unit, notes)
  LEFT JOIN products p ON p.master_name = q.raw_line
  ON CONFLICT DO NOTHING;

  -- Criar products se não existirem
  INSERT INTO products (master_name, category, unit, is_active)
  SELECT v.raw_name, v.category, v.unit::unit_of_measure, true
  FROM (VALUES
    ('Carne Picada Bovina','Carnes','kg'),
    ('Picanha','Carnes','kg'),
    ('Camarão 16/20','Peixes','kg'),
    ('Polvo inteiro','Peixes','kg')
  ) AS v(raw_name, category, unit)
  WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.master_name = v.raw_name);

  INSERT INTO pending_quotes (user_id, supplier_id, product_id, raw_line, requested_quantity, unit_of_measure, status, notes)
  SELECT v_admin_id, v_aviludo, p.id, q.raw_line, q.qty, q.unit::unit_of_measure, 'pending', q.notes
  FROM (VALUES
    ('Carne Picada Bovina',  3.0, 'kg', 'Carne nacional - preço varia semanalmente'),
    ('Picanha',              2.0, 'kg', 'Corte premium - solicitar preço do dia'),
    ('Camarão 16/20',        1.5, 'kg', 'Camarão congelado - confirmar disponibilidade'),
    ('Polvo inteiro',        2.0, 'kg', 'Polvo fresco - depende do mercado')
  ) AS q(raw_line, qty, unit, notes)
  JOIN products p ON p.master_name = q.raw_line
  WHERE NOT EXISTS (
    SELECT 1 FROM pending_quotes pq
    WHERE pq.raw_line = q.raw_line AND pq.supplier_id = v_aviludo AND pq.status = 'pending'
  );

  -- MAKRO — 2 pendentes
  INSERT INTO pending_quotes (user_id, supplier_id, product_id, raw_line, requested_quantity, unit_of_measure, status, notes)
  SELECT v_admin_id, v_makro, p.id, q.raw_line, q.qty, q.unit::unit_of_measure, 'pending', q.notes
  FROM (VALUES
    ('Salmão Fresco',   2.0, 'kg', 'Salmão fresco inteiro - preço do dia'),
    ('Lulas Limpas',    1.5, 'kg', 'Lulas - depende do tamanho')
  ) AS q(raw_line, qty, unit, notes)
  LEFT JOIN products p ON p.master_name = q.raw_line
  ON CONFLICT DO NOTHING;

  INSERT INTO products (master_name, category, unit, is_active)
  SELECT v.raw_name, v.category, v.unit::unit_of_measure, true
  FROM (VALUES
    ('Salmão Fresco','Peixes','kg'),
    ('Lulas Limpas','Peixes','kg')
  ) AS v(raw_name, category, unit)
  WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.master_name = v.raw_name);

  INSERT INTO pending_quotes (user_id, supplier_id, product_id, raw_line, requested_quantity, unit_of_measure, status, notes)
  SELECT v_admin_id, v_makro, p.id, q.raw_line, q.qty, q.unit::unit_of_measure, 'pending', q.notes
  FROM (VALUES
    ('Salmão Fresco',   2.0, 'kg', 'Salmão fresco inteiro - preço do dia'),
    ('Lulas Limpas',    1.5, 'kg', 'Lulas - depende do tamanho')
  ) AS q(raw_line, qty, unit, notes)
  JOIN products p ON p.master_name = q.raw_line
  WHERE NOT EXISTS (
    SELECT 1 FROM pending_quotes pq
    WHERE pq.raw_line = q.raw_line AND pq.supplier_id = v_makro AND pq.status = 'pending'
  );
END $$;

SELECT
  s.name AS fornecedor,
  COUNT(*) AS pendentes,
  COUNT(*) FILTER (WHERE pq.status='pending') AS aguardando,
  COUNT(*) FILTER (WHERE pq.status='quoted')  AS cotados
FROM pending_quotes pq
LEFT JOIN suppliers s ON s.id = pq.supplier_id
GROUP BY s.name
ORDER BY pendentes DESC;

COMMIT;
