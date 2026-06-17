BEGIN;

-- 1) Fornecedores
INSERT INTO suppliers (name, tax_id, contact_email, contact_phone, address, is_preferred, sort_order, is_active, updated_at)
SELECT 'Alpha Food', 'PT5000234567', 'orders@alphafood.pt', '+351 21 345 6789', 'Av. da Indústria, 35, 2780-205 Oeiras, Portugal', false, 9, true, now()
WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'Alpha Food');
INSERT INTO suppliers (name, tax_id, contact_email, contact_phone, address, is_preferred, sort_order, is_active, updated_at)
SELECT 'Gergran', 'PT5000345678', 'comercial@gergran.pt', '+351 21 456 7890', 'Rua dos Cereais, 12, 2695-027 São João da Talha, Portugal', true, 9, true, now()
WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'Gergran');
INSERT INTO suppliers (name, tax_id, contact_email, contact_phone, address, is_preferred, sort_order, is_active, updated_at)
SELECT 'Lusigel', NULL, NULL, NULL, 'Portugal', false, 9, true, now()
WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'Lusigel');

-- 2) Produtos e supplier_prices

-- ALPHA_FOOD (138 items)
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'QUEIJO FRESCO VACA LONGA DURAÇÃO 1 KG - CAMPAINHA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('QUEIJO FRESCO VACA LONGA DURAÇÃO 1 KG - CAMPAINHA', '0205026645', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'QUEIJO FRESCO VACA LONGA DURAÇÃO 1 KG - CAMPAINHA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 4.5, 4.5, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'PLACA CHEESECAKE F.SILV. PRE-CORT (50) CX 2*2,3 KG - NUTRIVA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('PLACA CHEESECAKE F.SILV. PRE-CORT (50) CX 2*2,3 KG - NUTRIVA', '0420000054', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'PLACA CHEESECAKE F.SILV. PRE-CORT (50) CX 2*2,3 KG - NUTRIVA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 35.9, 35.9, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'MANTEIGA C/SAL 1 KG - AGROS') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('MANTEIGA C/SAL 1 KG - AGROS', '0209026574', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'MANTEIGA C/SAL 1 KG - AGROS' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 8.3, 8.3, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'VINHO TINTO 5 LT BIBOX - BRIOSO') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('VINHO TINTO 5 LT BIBOX - BRIOSO', '05030A8547', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'VINHO TINTO 5 LT BIBOX - BRIOSO' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 4.1, 4.1, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'MANTEIGA S/SAL 1 KG - GRESSO') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('MANTEIGA S/SAL 1 KG - GRESSO', '0209026580', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'MANTEIGA S/SAL 1 KG - GRESSO' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 8.9, 8.9, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'NATAS P/BATER 35% 1 LT - RENY PICOT') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('NATAS P/BATER 35% 1 LT - RENY PICOT', '0210000003', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'NATAS P/BATER 35% 1 LT - RENY PICOT' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 4.32, 4.32, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'DOCE FRAMBOESA 4 KG BALDE - CASA PRISCA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('DOCE FRAMBOESA 4 KG BALDE - CASA PRISCA', '0421000022', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'DOCE FRAMBOESA 4 KG BALDE - CASA PRISCA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 14.6, 14.6, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'DOCE F. VERMELHOS 4 KG BALDE - CASA PRISCA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('DOCE F. VERMELHOS 4 KG BALDE - CASA PRISCA', '0421000024', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'DOCE F. VERMELHOS 4 KG BALDE - CASA PRISCA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 14.6, 14.6, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'FEIJAO LATA PRETO 2,5 KG (PLE 1,6 KG) - FRAMI') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('FEIJAO LATA PRETO 2,5 KG (PLE 1,6 KG) - FRAMI', '0425074871', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'FEIJAO LATA PRETO 2,5 KG (PLE 1,6 KG) - FRAMI' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 2.76, 2.76, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'PASTEL DE BACALHAU (+-60 GR) CX 60 UN- GWF') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('PASTEL DE BACALHAU (+-60 GR) CX 60 UN- GWF', '0404000020', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'PASTEL DE BACALHAU (+-60 GR) CX 60 UN- GWF' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 27.95, 27.95, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'FRANGO PEITO CONG.QUALIKO CX 10 KG (2*5 KG)') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('FRANGO PEITO CONG.QUALIKO CX 10 KG (2*5 KG)', '0901004204', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'FRANGO PEITO CONG.QUALIKO CX 10 KG (2*5 KG)' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 52.1, 52.1, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'AMEIXA SECA S/ CAROCO 1 KG - DALPHA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('AMEIXA SECA S/ CAROCO 1 KG - DALPHA', '0617000006', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'AMEIXA SECA S/ CAROCO 1 KG - DALPHA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 6.99, 6.99, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'ARROZ BASMATI LONGO EXTRA 1 KG - CACAROLA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('ARROZ BASMATI LONGO EXTRA 1 KG - CACAROLA', '0601052444', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'ARROZ BASMATI LONGO EXTRA 1 KG - CACAROLA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 1.96, 1.96, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'PEPPERONI FAT 500 GR - MACAL') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('PEPPERONI FAT 500 GR - MACAL', '0110011137', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'PEPPERONI FAT 500 GR - MACAL' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 5.65, 5.65, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'MAIONESE 4,6 KG - HELLMANNS') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('MAIONESE 4,6 KG - HELLMANNS', '04090G6140', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'MAIONESE 4,6 KG - HELLMANNS' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 19.04, 19.04, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'VINHO BRANCO 5 LT BIBOX - BRIOSO') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('VINHO BRANCO 5 LT BIBOX - BRIOSO', '05030A8545', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'VINHO BRANCO 5 LT BIBOX - BRIOSO' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 4.25, 4.25, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'MOZZARELLA RALADA 2 KG - MIMOS') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('MOZZARELLA RALADA 2 KG - MIMOS', '1002037041', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'MOZZARELLA RALADA 2 KG - MIMOS' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 11.6, 11.6, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'GRAN MORAVIA CUNHAS +- 1 KG - BRAZZALE') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('GRAN MORAVIA CUNHAS +- 1 KG - BRAZZALE', '1002037090', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'GRAN MORAVIA CUNHAS +- 1 KG - BRAZZALE' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 12.85, 12.85, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'CHAMUÇA DE CARNE (+-55 GR) CX 60 UN - GWF') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('CHAMUÇA DE CARNE (+-55 GR) CX 60 UN - GWF', '0404000021', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'CHAMUÇA DE CARNE (+-55 GR) CX 60 UN - GWF' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 29.69, 29.69, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'IOGURTE LIQUIDO FRUTOS TROPICAIS 4*160 GR - YOGGI') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('IOGURTE LIQUIDO FRUTOS TROPICAIS 4*160 GR - YOGGI', '0208000035', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'IOGURTE LIQUIDO FRUTOS TROPICAIS 4*160 GR - YOGGI' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 1.36, 1.36, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'FRANGO PEITO GRELHADO CONG. SACO 2,5 KG') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('FRANGO PEITO GRELHADO CONG. SACO 2,5 KG', '1801000119', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'FRANGO PEITO GRELHADO CONG. SACO 2,5 KG' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 6.85, 6.85, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'RISSOL DE CARNE (+-60 GR) CX 50 UN - GWF') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('RISSOL DE CARNE (+-60 GR) CX 50 UN - GWF', '0404000023', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'RISSOL DE CARNE (+-60 GR) CX 50 UN - GWF' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 19.9, 19.9, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'MEL - FRS_1 KG - DE FLOR') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('MEL - FRS_1 KG - DE FLOR', '0514000018', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'MEL - FRS_1 KG - DE FLOR' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 4.76, 4.76, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'FRANGO PEITO CONG CVALE HALAL CX 12 KG (6*2 KG) BRASIL') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('FRANGO PEITO CONG CVALE HALAL CX 12 KG (6*2 KG) BRASIL', '1803000003', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'FRANGO PEITO CONG CVALE HALAL CX 12 KG (6*2 KG) BRASIL' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 56.9, 56.9, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'PETIT GATEAU CHOCOLATE CX 18*80 GR - NUTRIVA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('PETIT GATEAU CHOCOLATE CX 18*80 GR - NUTRIVA', '0418000072', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'PETIT GATEAU CHOCOLATE CX 18*80 GR - NUTRIVA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 13.89, 13.89, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'COXAS DE FRANGO MINEIRA (+-75 GR) CX 40 UN - GWF') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('COXAS DE FRANGO MINEIRA (+-75 GR) CX 40 UN - GWF', '0404000032', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'COXAS DE FRANGO MINEIRA (+-75 GR) CX 40 UN - GWF' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 25.9, 25.9, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'ATUM BOLSA (PLE 950 GR) 1 KG - LA FRAGUA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('ATUM BOLSA (PLE 950 GR) 1 KG - LA FRAGUA', '0606000044', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'ATUM BOLSA (PLE 950 GR) 1 KG - LA FRAGUA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 5.86, 5.86, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'POLPA DE MANGA 960 GR (PLE 850 GR) - KOALA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('POLPA DE MANGA 960 GR (PLE 850 GR) - KOALA', '0610000007', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'POLPA DE MANGA 960 GR (PLE 850 GR) - KOALA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 2.75, 2.75, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'MANTEIGA C/SAL 120*8 GR - NOVA ACORES') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('MANTEIGA C/SAL 120*8 GR - NOVA ACORES', '0221000004', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'MANTEIGA C/SAL 120*8 GR - NOVA ACORES' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 8.2, 8.2, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'PROFITEROLES C/ CHOCOLATE CX 6*750 GR - NUTRIVA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('PROFITEROLES C/ CHOCOLATE CX 6*750 GR - NUTRIVA', '0420000067', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'PROFITEROLES C/ CHOCOLATE CX 6*750 GR - NUTRIVA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 52.89, 52.89, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'PAIO YORK FAT 500 GR - MACAL') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('PAIO YORK FAT 500 GR - MACAL', '0111010411', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'PAIO YORK FAT 500 GR - MACAL' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 4.09, 4.09, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'PRESUNTO FAT 9M 500 GR - MACAL') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('PRESUNTO FAT 9M 500 GR - MACAL', '0111010579', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'PRESUNTO FAT 9M 500 GR - MACAL' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 6.76, 6.76, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'COUVE FLOR FALDO 2,5 KG - GELCAMPO') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('COUVE FLOR FALDO 2,5 KG - GELCAMPO', '0305031640', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'COUVE FLOR FALDO 2,5 KG - GELCAMPO' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 4.1, 4.1, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'OLEO ALTO RENDIMENTO 10 LT - SABORES CHEFE') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('OLEO ALTO RENDIMENTO 10 LT - SABORES CHEFE', '04010A1067', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'OLEO ALTO RENDIMENTO 10 LT - SABORES CHEFE' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 17.3, 17.3, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'ARROZ AGULHA LONGO EXTRA BRANQUEADO 1 KG - CACAROLA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('ARROZ AGULHA LONGO EXTRA BRANQUEADO 1 KG - CACAROLA', '0405000018', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'ARROZ AGULHA LONGO EXTRA BRANQUEADO 1 KG - CACAROLA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 1.1, 1.1, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'LEITE CONDENSADO 370 GR - BELLA VILA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('LEITE CONDENSADO 370 GR - BELLA VILA', '0413000004', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'LEITE CONDENSADO 370 GR - BELLA VILA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 1.28, 1.28, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'CEREAIS CHOCOMAX 1 KG - NACIONAL') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('CEREAIS CHOCOMAX 1 KG - NACIONAL', '0420000006', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'CEREAIS CHOCOMAX 1 KG - NACIONAL' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 3.6, 3.6, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'MUESLI 1 KG - HAHNE') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('MUESLI 1 KG - HAHNE', '0420000008', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'MUESLI 1 KG - HAHNE' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 3.89, 3.89, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'FEIJAO LATA ENCARNADO 2,5 KG (PLE 1,6 KG) - FRAMI') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('FEIJAO LATA ENCARNADO 2,5 KG (PLE 1,6 KG) - FRAMI', '0425074875', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'FEIJAO LATA ENCARNADO 2,5 KG (PLE 1,6 KG) - FRAMI' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 2.85, 2.85, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'TOMATE POLPA GRF 1 LT - TREVI') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('TOMATE POLPA GRF 1 LT - TREVI', '0427000002', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'TOMATE POLPA GRF 1 LT - TREVI' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 1.25, 1.25, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'AMENDOA LAMINADA 1 KG - DALPHA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('AMENDOA LAMINADA 1 KG - DALPHA', '0431095012', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'AMENDOA LAMINADA 1 KG - DALPHA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 11.49, 11.49, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'NOZ MIOLO QUARTOS 1 KG - DALPHA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('NOZ MIOLO QUARTOS 1 KG - DALPHA', '0431095080', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'NOZ MIOLO QUARTOS 1 KG - DALPHA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 9.98, 9.98, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'MAIONESE 3,6 KG - FRAMI') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('MAIONESE 3,6 KG - FRAMI', '0608000056', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'MAIONESE 3,6 KG - FRAMI' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 6.6, 6.6, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'BEBIDA SOJA 1 LT - ALTEZA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('BEBIDA SOJA 1 LT - ALTEZA', '0701000002', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'BEBIDA SOJA 1 LT - ALTEZA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 0.86, 0.86, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'MOLHO DE OSTRAS 2,27 KG - LKK') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('MOLHO DE OSTRAS 2,27 KG - LKK', '1111000022', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'MOLHO DE OSTRAS 2,27 KG - LKK' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 10.89, 10.89, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'TARTE DE AMENDOA CX 3*900 GR - NUTRIVA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('TARTE DE AMENDOA CX 3*900 GR - NUTRIVA', '0420000046', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'TARTE DE AMENDOA CX 3*900 GR - NUTRIVA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 37.5, 37.5, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'AÇAFRÃO MOIDO 750 GR - ASA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('AÇAFRÃO MOIDO 750 GR - ASA', '0606000126', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'AÇAFRÃO MOIDO 750 GR - ASA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 4.4, 4.4, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'IOGURTE NATURAL 5 KG - REGALO') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('IOGURTE NATURAL 5 KG - REGALO', '0227000001', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'IOGURTE NATURAL 5 KG - REGALO' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 9.7, 9.7, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'GUANCIALE – SIMONINI') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('GUANCIALE – SIMONINI', '0109010835', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'GUANCIALE – SIMONINI' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 13.12, 13.12, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'MANTEIGA S/SAL 120*8 GR - NOVA ACORES') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('MANTEIGA S/SAL 120*8 GR - NOVA ACORES', '0221000005', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'MANTEIGA S/SAL 120*8 GR - NOVA ACORES' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 8.5, 8.5, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'TRANCHE DE BOLACHA CROCANTE +- 1 KG - NUTRIVA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('TRANCHE DE BOLACHA CROCANTE +- 1 KG - NUTRIVA', '0420000050', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'TRANCHE DE BOLACHA CROCANTE +- 1 KG - NUTRIVA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 10.92, 10.92, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'PEITO FRANGO FAT 500 GR - MACAL') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('PEITO FRANGO FAT 500 GR - MACAL', '0110011139', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'PEITO FRANGO FAT 500 GR - MACAL' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 3.49, 3.49, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'IOGURTE NATURAL CREMOSO 3,5 KG - REGALO') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('IOGURTE NATURAL CREMOSO 3,5 KG - REGALO', '0208000020', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'IOGURTE NATURAL CREMOSO 3,5 KG - REGALO' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 6.84, 6.84, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'KETCHUP SAQUETAS CX 500*10 GR - PALADIN') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('KETCHUP SAQUETAS CX 500*10 GR - PALADIN', '0621000044', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'KETCHUP SAQUETAS CX 500*10 GR - PALADIN' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 17.8, 17.8, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'OVO LIQUIDO GALINHAS SOLO 1 LT - EUROVO') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('OVO LIQUIDO GALINHAS SOLO 1 LT - EUROVO', '0302033563', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'OVO LIQUIDO GALINHAS SOLO 1 LT - EUROVO' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 4.15, 4.15, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'MAIONESE SAQUETAS CX 500*10 GR - PALADIN') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('MAIONESE SAQUETAS CX 500*10 GR - PALADIN', '0621000009', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'MAIONESE SAQUETAS CX 500*10 GR - PALADIN' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 24.1, 24.1, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'IOGURTE LIQUIDO MOR/BANANA 4*160 GR - YOGGI') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('IOGURTE LIQUIDO MOR/BANANA 4*160 GR - YOGGI', '0208000034', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'IOGURTE LIQUIDO MOR/BANANA 4*160 GR - YOGGI' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 1.36, 1.36, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'CEREAIS + LINHA 750 GR - NACIONAL') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('CEREAIS + LINHA 750 GR - NACIONAL', '0501052152', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'CEREAIS + LINHA 750 GR - NACIONAL' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 3.6, 3.6, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'TRANCHE DE BOLACHA C/ LEITE CONDENSADO +- 1,2 KG - NUTRIVA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('TRANCHE DE BOLACHA C/ LEITE CONDENSADO +- 1,2 KG - NUTRIVA', '0420000049', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'TRANCHE DE BOLACHA C/ LEITE CONDENSADO +- 1,2 KG - NUTRIVA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 9.69, 9.69, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'MAIONESE SAQUETA 10 ML*200 UN - COSAMI') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('MAIONESE SAQUETA 10 ML*200 UN - COSAMI', '1706000004', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'MAIONESE SAQUETA 10 ML*200 UN - COSAMI' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 12.0, 12.0, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'DOCE ABOBORA 340 GRS - MONTE CALVO') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('DOCE ABOBORA 340 GRS - MONTE CALVO', '0504000013', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'DOCE ABOBORA 340 GRS - MONTE CALVO' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 1.26, 1.26, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'PAIO YORK 1/2 KG - MACAL') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('PAIO YORK 1/2 KG - MACAL', '0102010402', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'PAIO YORK 1/2 KG - MACAL' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 4.4, 4.4, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'FIAMBRE FAT PERNA 500 GR - MACAL') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('FIAMBRE FAT PERNA 500 GR - MACAL', '0111010991', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'FIAMBRE FAT PERNA 500 GR - MACAL' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 2.62, 2.62, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'BACON FAT 500 GR (ATMOSFERA) - MACAL') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('BACON FAT 500 GR (ATMOSFERA) - MACAL', '0119000055', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'BACON FAT 500 GR (ATMOSFERA) - MACAL' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 2.82, 2.82, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'GORGONZOLA DOP +-1,5 KG - CASA LEONARDI') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('GORGONZOLA DOP +-1,5 KG - CASA LEONARDI', '0202020442', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'GORGONZOLA DOP +-1,5 KG - CASA LEONARDI' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 11.66, 11.66, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'LEITE MEIO GORDO 1 LT - AGROS PROFISSIONAL') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('LEITE MEIO GORDO 1 LT - AGROS PROFISSIONAL', '0208000004', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'LEITE MEIO GORDO 1 LT - AGROS PROFISSIONAL' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 0.75, 0.75, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'LEITE MEIO GORDO 1 LT - UNILEITE') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('LEITE MEIO GORDO 1 LT - UNILEITE', '0208000011', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'LEITE MEIO GORDO 1 LT - UNILEITE' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 0.79, 0.79, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'NATAS P/CULINARIA 22% 1 LT - RENY PICOT') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('NATAS P/CULINARIA 22% 1 LT - RENY PICOT', '0210000002', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'NATAS P/CULINARIA 22% 1 LT - RENY PICOT' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 3.07, 3.07, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'OVO CASCA L CX 15 DUZIAS - SABOROSOS') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('OVO CASCA L CX 15 DUZIAS - SABOROSOS', '0211021181', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'OVO CASCA L CX 15 DUZIAS - SABOROSOS' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 39.0, 39.0, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'CLARA LIQUIDA PASTEURIZADA 1 LT - EUROVO') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('CLARA LIQUIDA PASTEURIZADA 1 LT - EUROVO', '0211021238', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'CLARA LIQUIDA PASTEURIZADA 1 LT - EUROVO' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 2.22, 2.22, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'ERVILHA MEDIA FINA SACO 2,5 KG - GELCAMPO') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('ERVILHA MEDIA FINA SACO 2,5 KG - GELCAMPO', '0305031500', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'ERVILHA MEDIA FINA SACO 2,5 KG - GELCAMPO' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 4.25, 4.25, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'BROCULOS SACO 2,5 KG - GELCAMPO') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('BROCULOS SACO 2,5 KG - GELCAMPO', '0305031650', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'BROCULOS SACO 2,5 KG - GELCAMPO' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 4.35, 4.35, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'SPAGHETTI ALLA CHITARRA NIDI 2 KG - UNIPASTA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('SPAGHETTI ALLA CHITARRA NIDI 2 KG - UNIPASTA', '0310000006', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'SPAGHETTI ALLA CHITARRA NIDI 2 KG - UNIPASTA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 14.97, 14.97, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'ARROZ CAROLINO LONGO EXTRA BRANQUEADO 1 KG - CACAROLA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('ARROZ CAROLINO LONGO EXTRA BRANQUEADO 1 KG - CACAROLA', '0405000019', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'ARROZ CAROLINO LONGO EXTRA BRANQUEADO 1 KG - CACAROLA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 1.1, 1.1, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'MASSA ESPARGUETE 2 KG - NAPOLITANA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('MASSA ESPARGUETE 2 KG - NAPOLITANA', '0406000041', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'MASSA ESPARGUETE 2 KG - NAPOLITANA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 2.45, 2.45, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'BOLACHA MARIA 4*200 GR - AMANHECER') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('BOLACHA MARIA 4*200 GR - AMANHECER', '0415000016', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'BOLACHA MARIA 4*200 GR - AMANHECER' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 1.75, 1.75, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'CEREAIS CORN FLAKES 1 KG - NACIONAL') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('CEREAIS CORN FLAKES 1 KG - NACIONAL', '0420000004', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'CEREAIS CORN FLAKES 1 KG - NACIONAL' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 2.8, 2.8, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'DOCE ABOBORA 4 KG BALDE - CASA PRISCA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('DOCE ABOBORA 4 KG BALDE - CASA PRISCA', '0421000019', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'DOCE ABOBORA 4 KG BALDE - CASA PRISCA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 12.95, 12.95, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'FEIJAO LATA MANTEIGA 2,5 KG (PLE 1,6 KG) - FRAMI') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('FEIJAO LATA MANTEIGA 2,5 KG (PLE 1,6 KG) - FRAMI', '0425074873', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'FEIJAO LATA MANTEIGA 2,5 KG (PLE 1,6 KG) - FRAMI' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 2.76, 2.76, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'FEIJAO LATA FRADE 2,5 KG (PLE 1,6 KG) - FRAMI') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('FEIJAO LATA FRADE 2,5 KG (PLE 1,6 KG) - FRAMI', '0425074874', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'FEIJAO LATA FRADE 2,5 KG (PLE 1,6 KG) - FRAMI' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 2.76, 2.76, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'SAL SAQUETAS CX 2000*1 GR - PALADIN') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('SAL SAQUETAS CX 2000*1 GR - PALADIN', '0430095049', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'SAL SAQUETAS CX 2000*1 GR - PALADIN' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 6.25, 6.25, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'TAMARAS SECA S/CAROCO 1 KG - DALPHA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('TAMARAS SECA S/CAROCO 1 KG - DALPHA', '0431095005', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'TAMARAS SECA S/CAROCO 1 KG - DALPHA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 4.69, 4.69, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'MASCARPONE 500 GR - BRAZZALE') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('MASCARPONE 500 GR - BRAZZALE', '1002037074', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'MASCARPONE 500 GR - BRAZZALE' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 3.85, 3.85, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'PENNE RIGATE Nº 41 1 KG - DE CECCO') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('PENNE RIGATE Nº 41 1 KG - DE CECCO', '1036000091', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'PENNE RIGATE Nº 41 1 KG - DE CECCO' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 3.37, 3.37, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'TOMATE CUBOS ITALIANO 2,5 KG - VESU') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('TOMATE CUBOS ITALIANO 2,5 KG - VESU', '1037000134', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'TOMATE CUBOS ITALIANO 2,5 KG - VESU' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 4.5, 4.5, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'TOMATE SECO FRS 700 GR (PLE 420 GR) – VESU') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('TOMATE SECO FRS 700 GR (PLE 420 GR) – VESU', '0614000031', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'TOMATE SECO FRS 700 GR (PLE 420 GR) – VESU' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 8.09, 8.09, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'PEITO FRANGO BARRA - MACAL') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('PEITO FRANGO BARRA - MACAL', '0106011194', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'PEITO FRANGO BARRA - MACAL' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 5.3, 5.3, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'RISSOL DE CAMARAO (+-60 GR) CX 50 UN - GWF') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('RISSOL DE CAMARAO (+-60 GR) CX 50 UN - GWF', '0404000018', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'RISSOL DE CAMARAO (+-60 GR) CX 50 UN - GWF' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 20.9, 20.9, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'MASAGO (OVAS CAPELAO) RED 500 GR') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('MASAGO (OVAS CAPELAO) RED 500 GR', '0412027020', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'MASAGO (OVAS CAPELAO) RED 500 GR' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 7.89, 7.89, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'QUEIJO CABRA ATABAFADO 2*90 GR - QTA OLIVAL') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('QUEIJO CABRA ATABAFADO 2*90 GR - QTA OLIVAL', '0202020470', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'QUEIJO CABRA ATABAFADO 2*90 GR - QTA OLIVAL' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 3.76, 3.76, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'PLACA BRIGADEIRO PRE-CORT (50) CX 2*2,3 KG - NUTRIVA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('PLACA BRIGADEIRO PRE-CORT (50) CX 2*2,3 KG - NUTRIVA', '0420000053', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'PLACA BRIGADEIRO PRE-CORT (50) CX 2*2,3 KG - NUTRIVA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 31.5, 31.5, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'OVAS SALMAO 500 GR - IKURA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('OVAS SALMAO 500 GR - IKURA', '1104000004', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'OVAS SALMAO 500 GR - IKURA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 49.47, 49.47, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'MASAGO (OVAS CAPELAO) PRETO 500 GR - SEACON') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('MASAGO (OVAS CAPELAO) PRETO 500 GR - SEACON', '1104000002', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'MASAGO (OVAS CAPELAO) PRETO 500 GR - SEACON' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 7.89, 7.89, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'BATATA FRITA RODELAS LISA 1 KG TI-TI') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('BATATA FRITA RODELAS LISA 1 KG TI-TI', '0603053028', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'BATATA FRITA RODELAS LISA 1 KG TI-TI' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 6.5, 6.5, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'BURRATA VACA 150 GR - LATTE BIANCO') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('BURRATA VACA 150 GR - LATTE BIANCO', '0212000094', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'BURRATA VACA 150 GR - LATTE BIANCO' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 2.29, 2.29, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'PLACA DE COOKIES PRE-CORT (50) CX 2*2,3 KG - NUTRIVA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('PLACA DE COOKIES PRE-CORT (50) CX 2*2,3 KG - NUTRIVA', '0420000055', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'PLACA DE COOKIES PRE-CORT (50) CX 2*2,3 KG - NUTRIVA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 31.9, 31.9, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'MUFFIN CHOCOLATE CX 30*90 GR - NUTRIVA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('MUFFIN CHOCOLATE CX 30*90 GR - NUTRIVA', '0418000070', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'MUFFIN CHOCOLATE CX 30*90 GR - NUTRIVA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 17.5, 17.5, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'QUEIJO ILHA 4M DOP 300 GR - SAO JORGE') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('QUEIJO ILHA 4M DOP 300 GR - SAO JORGE', '0204020528', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'QUEIJO ILHA 4M DOP 300 GR - SAO JORGE' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 4.19, 4.19, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'MOSTARDA SAQUETAS CX 1000*5 GR - PALADIN') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('MOSTARDA SAQUETAS CX 1000*5 GR - PALADIN', '0621000011', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'MOSTARDA SAQUETAS CX 1000*5 GR - PALADIN' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 20.0, 20.0, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'ENSOPADO DE CHOCOLATE +- 1,5 KG - NUTRIVA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('ENSOPADO DE CHOCOLATE +- 1,5 KG - NUTRIVA', '0420000039', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'ENSOPADO DE CHOCOLATE +- 1,5 KG - NUTRIVA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 9.2, 9.2, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'MASAGO (OVAS CAPELAO) GREEN WASABI 500 GR') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('MASAGO (OVAS CAPELAO) GREEN WASABI 500 GR', '0412027019', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'MASAGO (OVAS CAPELAO) GREEN WASABI 500 GR' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 7.89, 7.89, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'QUEIJO PRATO VACA (VACUO) +- 1,1 KG - ALAVAO') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('QUEIJO PRATO VACA (VACUO) +- 1,1 KG - ALAVAO', '0202020481', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'QUEIJO PRATO VACA (VACUO) +- 1,1 KG - ALAVAO' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 8.77, 8.77, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'COGUMELOS LAMINADOS 820 GR (PLE 420 GR) - S. GULA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('COGUMELOS LAMINADOS 820 GR (PLE 420 GR) - S. GULA', '0611000002', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'COGUMELOS LAMINADOS 820 GR (PLE 420 GR) - S. GULA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 2.14, 2.14, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'QUEIJO PRATO VACA BARRADO (VACUO) +- 1,1 KG - ALAVAO') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('QUEIJO PRATO VACA BARRADO (VACUO) +- 1,1 KG - ALAVAO', '0202020480', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'QUEIJO PRATO VACA BARRADO (VACUO) +- 1,1 KG - ALAVAO' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 8.77, 8.77, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'NOVILHO LOMBO 5+ LBS S/C BRASIL +- 3 KG') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('NOVILHO LOMBO 5+ LBS S/C BRASIL +- 3 KG', '0407000081', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'NOVILHO LOMBO 5+ LBS S/C BRASIL +- 3 KG' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 29.5, 29.5, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'FRANGO PEITO ASSADO BOLSA 5 (+- 260 GR) - TELLO') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('FRANGO PEITO ASSADO BOLSA 5 (+- 260 GR) - TELLO', '0319000008', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'FRANGO PEITO ASSADO BOLSA 5 (+- 260 GR) - TELLO' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 13.5, 13.5, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'OLEO ALTO RENDIMENTO 10 LT - HOSTEOLEO') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('OLEO ALTO RENDIMENTO 10 LT - HOSTEOLEO', '0602050495', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'OLEO ALTO RENDIMENTO 10 LT - HOSTEOLEO' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 20.99, 20.99, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'PASTEL DE BACALHAU (+-30 GR) CX 100 UN - GWF') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('PASTEL DE BACALHAU (+-30 GR) CX 100 UN - GWF', '0404000025', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'PASTEL DE BACALHAU (+-30 GR) CX 100 UN - GWF' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 25.2, 25.2, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'FRANGO PEITO QUALIKO CX 10 KG (4*2,5 KG) UCRÂNIA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('FRANGO PEITO QUALIKO CX 10 KG (4*2,5 KG) UCRÂNIA', '1801000156', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'FRANGO PEITO QUALIKO CX 10 KG (4*2,5 KG) UCRÂNIA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 57.8, 57.8, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'IOGURTE AROMA TUTTI 4*120 GR - LONGA VIDA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('IOGURTE AROMA TUTTI 4*120 GR - LONGA VIDA', '0208000030', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'IOGURTE AROMA TUTTI 4*120 GR - LONGA VIDA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 0.8, 0.8, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'BEBIDA AVEIA C/CALCIO 1 LT - FRIAS') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('BEBIDA AVEIA C/CALCIO 1 LT - FRIAS', '0810000009', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'BEBIDA AVEIA C/CALCIO 1 LT - FRIAS' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 1.24, 1.24, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'BURRATA VACA 100 GR - LATTE BIANCO') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('BURRATA VACA 100 GR - LATTE BIANCO', '0203020513', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'BURRATA VACA 100 GR - LATTE BIANCO' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 1.62, 1.62, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'MANTEIGA DE AMENDOIM CREMOSA 340 GR - TREVI') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('MANTEIGA DE AMENDOIM CREMOSA 340 GR - TREVI', '0513000001', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'MANTEIGA DE AMENDOIM CREMOSA 340 GR - TREVI' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 1.86, 1.86, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'AZEITE TRADICIONAL 5 LT - CACHOPO') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('AZEITE TRADICIONAL 5 LT - CACHOPO', '1502000002', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'AZEITE TRADICIONAL 5 LT - CACHOPO' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 21.1, 21.1, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'CHEESECAKE DE F. SILVESTRES +- 1,5 KG - NUTRIVA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('CHEESECAKE DE F. SILVESTRES +- 1,5 KG - NUTRIVA', '0420000035', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'CHEESECAKE DE F. SILVESTRES +- 1,5 KG - NUTRIVA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 10.7, 10.7, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'TRANCHE DE PROFITEROLES +- 1,3 KG - NUTRIVA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('TRANCHE DE PROFITEROLES +- 1,3 KG - NUTRIVA', '0420000051', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'TRANCHE DE PROFITEROLES +- 1,3 KG - NUTRIVA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 13.69, 13.69, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'AGUA TONICA TP 6*200 ML - SCHWEPPES') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('AGUA TONICA TP 6*200 ML - SCHWEPPES', '0801000012', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'AGUA TONICA TP 6*200 ML - SCHWEPPES' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 4.9, 4.9, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'FRANGO BIFES IQF CX +-5 KG') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('FRANGO BIFES IQF CX +-5 KG', '0406000142', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'FRANGO BIFES IQF CX +-5 KG' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 8.55, 8.55, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'QUEIJO PRATO ILHA AZUL +- 1 KG - LACTAÇORES') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('QUEIJO PRATO ILHA AZUL +- 1 KG - LACTAÇORES', '0202020446', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'QUEIJO PRATO ILHA AZUL +- 1 KG - LACTAÇORES' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 8.65, 8.65, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'IOGURTE LIQUIDO MORANGO 4*160 GR - YOGGI') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('IOGURTE LIQUIDO MORANGO 4*160 GR - YOGGI', '0208000033', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'IOGURTE LIQUIDO MORANGO 4*160 GR - YOGGI' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 1.36, 1.36, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'QUEIJO FAT FLAMENGO 500 GR - CHEESELAND') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('QUEIJO FAT FLAMENGO 500 GR - CHEESELAND', '0211021256', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'QUEIJO FAT FLAMENGO 500 GR - CHEESELAND' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 2.98, 2.98, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'OVO LIQUIDO PASTEURIZADO 1 LT - EUROVO') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('OVO LIQUIDO PASTEURIZADO 1 LT - EUROVO', '1211000006', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'OVO LIQUIDO PASTEURIZADO 1 LT - EUROVO' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 3.65, 3.65, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'IOGURTE AROMA BANANA 4*120 GR - LONGA VIDA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('IOGURTE AROMA BANANA 4*120 GR - LONGA VIDA', '0208000029', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'IOGURTE AROMA BANANA 4*120 GR - LONGA VIDA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 0.8, 0.8, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'AZEITONA PRETA S/CAROÇO 3,150 KG (PLE 1,450 KG)') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('AZEITONA PRETA S/CAROÇO 3,150 KG (PLE 1,450 KG)', '0423070735', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'AZEITONA PRETA S/CAROÇO 3,150 KG (PLE 1,450 KG)' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 7.25, 7.25, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'FILETES PESCADA PANADO CX 6 KG - I&J') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('FILETES PESCADA PANADO CX 6 KG - I&J', '0408079716', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'FILETES PESCADA PANADO CX 6 KG - I&J' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 38.6, 38.6, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'LEITE MAGRO 1 LT - GRESSO') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('LEITE MAGRO 1 LT - GRESSO', '0208000006', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'LEITE MAGRO 1 LT - GRESSO' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 0.9, 0.9, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'DOCE LARANJA 4 KG BALDE - CASA PRISCA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('DOCE LARANJA 4 KG BALDE - CASA PRISCA', '0421000023', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'DOCE LARANJA 4 KG BALDE - CASA PRISCA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 1380.0, 1380.0, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'LEITE MEIO GORDO S/LACTOSE 1 LT - NOVA ACORES') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('LEITE MEIO GORDO S/LACTOSE 1 LT - NOVA ACORES', '0702000001', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'LEITE MEIO GORDO S/LACTOSE 1 LT - NOVA ACORES' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 1.05, 1.05, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'MUFFIN MAÇA&CANELA CX 30*90 GR - NUTRIVA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('MUFFIN MAÇA&CANELA CX 30*90 GR - NUTRIVA', '0418000071', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'MUFFIN MAÇA&CANELA CX 30*90 GR - NUTRIVA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 18.5, 18.5, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'PLACA CARAMELO SALGADO PRE-CORT (50) CX 2*2,3 KG - NUTRIVA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('PLACA CARAMELO SALGADO PRE-CORT (50) CX 2*2,3 KG - NUTRIVA', '0420000058', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'PLACA CARAMELO SALGADO PRE-CORT (50) CX 2*2,3 KG - NUTRIVA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 35.9, 35.9, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'BOLO BRIGADEIRO +- 1,5 KG - NUTRIVA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('BOLO BRIGADEIRO +- 1,5 KG - NUTRIVA', '0420000036', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'BOLO BRIGADEIRO +- 1,5 KG - NUTRIVA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 10.8, 10.8, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'BOLO DE BOLACHA CREME CAFE +- 1,2 KG - NUTRIVA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('BOLO DE BOLACHA CREME CAFE +- 1,2 KG - NUTRIVA', '0420000038', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'BOLO DE BOLACHA CREME CAFE +- 1,2 KG - NUTRIVA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 11.31, 11.31, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'PORCO GUISAR FR.VACUO MACAL') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('PORCO GUISAR FR.VACUO MACAL', '0904000017', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'PORCO GUISAR FR.VACUO MACAL' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 4.3, 4.3, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'CROQUETES DE CARNE (+-32 GR) CX 100 UN - GWF') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('CROQUETES DE CARNE (+-32 GR) CX 100 UN - GWF', '0404000027', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'CROQUETES DE CARNE (+-32 GR) CX 100 UN - GWF' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 24.5, 24.5, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'BEBIDA AMENDOA C/CALCIO 1 LT - FRIAS') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('BEBIDA AMENDOA C/CALCIO 1 LT - FRIAS', '0810000008', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'BEBIDA AMENDOA C/CALCIO 1 LT - FRIAS' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 1.28, 1.28, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'PLACA BROWNIE C/ NOZES PRE-CORT (36) CX 2*1,35 KG - NUTRIVA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('PLACA BROWNIE C/ NOZES PRE-CORT (36) CX 2*1,35 KG - NUTRIVA', '0420000056', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'PLACA BROWNIE C/ NOZES PRE-CORT (36) CX 2*1,35 KG - NUTRIVA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 35.9, 35.9, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'ACUCAR BRANCO 1 KG - SIDUL') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('ACUCAR BRANCO 1 KG - SIDUL', '0502000017', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'ACUCAR BRANCO 1 KG - SIDUL' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 0.95, 0.95, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'IOGURTE AROMA MORANGO 4*120 GR - LONGA VIDA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('IOGURTE AROMA MORANGO 4*120 GR - LONGA VIDA', '0208000028', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'IOGURTE AROMA MORANGO 4*120 GR - LONGA VIDA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Alpha Food'),
         v_product_id, 0.8, 0.8, 1, 1, 'EUR', 'import', 'tabela ALPHA FOOD.xlsx',
         true, 'Importado de tabela ALPHA FOOD.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
-- GERGRAN (31 items)
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Baguete Branca S/ Glúten 125g') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Baguete Branca S/ Glúten 125g', '76661', 'Padaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Baguete Branca S/ Glúten 125g' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Gergran'),
         v_product_id, 2.132, 2.132, 1, 1, 'EUR', 'import', 'Tabela Gergran.xlsx',
         true, 'Importado de Tabela Gergran.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Bolinha 5 Sementes S/ Glúten 40g') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Bolinha 5 Sementes S/ Glúten 40g', '76660', 'Padaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Bolinha 5 Sementes S/ Glúten 40g' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Gergran'),
         v_product_id, 1.0420833333333333, 1.0420833333333333, 1, 1, 'EUR', 'import', 'Tabela Gergran.xlsx',
         true, 'Importado de Tabela Gergran.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Bolinha Alfarroba S/ Glúten 40g') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Bolinha Alfarroba S/ Glúten 40g', '76659', 'Padaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Bolinha Alfarroba S/ Glúten 40g' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Gergran'),
         v_product_id, 1.0209000000000001, 1.0209000000000001, 1, 1, 'EUR', 'import', 'Tabela Gergran.xlsx',
         true, 'Importado de Tabela Gergran.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Bolinha Artesanal Top Sementes 40g') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Bolinha Artesanal Top Sementes 40g', '28699', 'Padaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Bolinha Artesanal Top Sementes 40g' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Gergran'),
         v_product_id, 0.158916, 0.158916, 1, 1, 'EUR', 'import', 'Tabela Gergran.xlsx',
         true, 'Importado de Tabela Gergran.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Bolinha Branca S/ Glúten 40g') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Bolinha Branca S/ Glúten 40g', '76658', 'Padaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Bolinha Branca S/ Glúten 40g' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Gergran'),
         v_product_id, 1.0209000000000001, 1.0209000000000001, 1, 1, 'EUR', 'import', 'Tabela Gergran.xlsx',
         true, 'Importado de Tabela Gergran.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Pão de Forma S/ Glúten 350g') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Pão de Forma S/ Glúten 350g', '76853', 'Padaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Pão de Forma S/ Glúten 350g' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Gergran'),
         v_product_id, 5.0758, 5.0758, 1, 1, 'EUR', 'import', 'Tabela Gergran.xlsx',
         true, 'Importado de Tabela Gergran.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Pão Saloio Fatiado S/ Glúten 500g') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Pão Saloio Fatiado S/ Glúten 500g', '76849', 'Padaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Pão Saloio Fatiado S/ Glúten 500g' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Gergran'),
         v_product_id, 7.3389999999999995, 7.3389999999999995, 1, 1, 'EUR', 'import', 'Tabela Gergran.xlsx',
         true, 'Importado de Tabela Gergran.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Banda Ópera Chocolate e Café 650g') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Banda Ópera Chocolate e Café 650g', '75641', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Banda Ópera Chocolate e Café 650g' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Gergran'),
         v_product_id, 13.30143448157355, 13.30143448157355, 1, 1, 'EUR', 'import', 'Tabela Gergran.xlsx',
         true, 'Importado de Tabela Gergran.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Bolinho de Coco S/ Glúten 70g') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Bolinho de Coco S/ Glúten 70g', '76402', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Bolinho de Coco S/ Glúten 70g' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Gergran'),
         v_product_id, 0.9758, 0.9758, 1, 1, 'EUR', 'import', 'Tabela Gergran.xlsx',
         true, 'Importado de Tabela Gergran.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Croissant S/ Glúten 80g') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Croissant S/ Glúten 80g', '76810', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Croissant S/ Glúten 80g' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Gergran'),
         v_product_id, 1.5170000000000003, 1.5170000000000003, 1, 1, 'EUR', 'import', 'Tabela Gergran.xlsx',
         true, 'Importado de Tabela Gergran.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mil-Folhas 135g') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mil-Folhas 135g', '76275', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mil-Folhas 135g' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Gergran'),
         v_product_id, 1.9630800000000002, 1.9630800000000002, 1, 1, 'EUR', 'import', 'Tabela Gergran.xlsx',
         true, 'Importado de Tabela Gergran.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Bola de Berlim Caramelo 21g') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Bola de Berlim Caramelo 21g', '27054', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Bola de Berlim Caramelo 21g' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Gergran'),
         v_product_id, 0.41, 0.41, 1, 1, 'EUR', 'import', 'Tabela Gergran.xlsx',
         true, 'Importado de Tabela Gergran.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Bola de Berlim Chocolate 21g') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Bola de Berlim Chocolate 21g', '27056', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Bola de Berlim Chocolate 21g' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Gergran'),
         v_product_id, 0.4264, 0.4264, 1, 1, 'EUR', 'import', 'Tabela Gergran.xlsx',
         true, 'Importado de Tabela Gergran.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Bola de Berlim Maçã 21g') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Bola de Berlim Maçã 21g', '27053', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Bola de Berlim Maçã 21g' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Gergran'),
         v_product_id, 0.41, 0.41, 1, 1, 'EUR', 'import', 'Tabela Gergran.xlsx',
         true, 'Importado de Tabela Gergran.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Bola Berlim Morango 21g') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Bola Berlim Morango 21g', '77797', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Bola Berlim Morango 21g' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Gergran'),
         v_product_id, 0.41, 0.41, 1, 1, 'EUR', 'import', 'Tabela Gergran.xlsx',
         true, 'Importado de Tabela Gergran.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Deliloop com Açúcar 28g') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Deliloop com Açúcar 28g', '28720', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Deliloop com Açúcar 28g' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Gergran'),
         v_product_id, 0.31652, 0.31652, 1, 1, 'EUR', 'import', 'Tabela Gergran.xlsx',
         true, 'Importado de Tabela Gergran.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Deliloop Topping Chocolate 31g') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Deliloop Topping Chocolate 31g', '28721', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Deliloop Topping Chocolate 31g' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Gergran'),
         v_product_id, 0.36203, 0.36203, 1, 1, 'EUR', 'import', 'Tabela Gergran.xlsx',
         true, 'Importado de Tabela Gergran.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Muffin Cacau Recheio Choco Avelã 26g') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Muffin Cacau Recheio Choco Avelã 26g', '28253', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Muffin Cacau Recheio Choco Avelã 26g' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Gergran'),
         v_product_id, 0.611515, 0.611515, 1, 1, 'EUR', 'import', 'Tabela Gergran.xlsx',
         true, 'Importado de Tabela Gergran.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Muffin Caramelo 26g') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Muffin Caramelo 26g', '75476', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Muffin Caramelo 26g' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Gergran'),
         v_product_id, 0.6436999999999999, 0.6436999999999999, 1, 1, 'EUR', 'import', 'Tabela Gergran.xlsx',
         true, 'Importado de Tabela Gergran.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Muffin Maçã Canela 26g') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Muffin Maçã Canela 26g', '75475', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Muffin Maçã Canela 26g' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Gergran'),
         v_product_id, 0.611515, 0.611515, 1, 1, 'EUR', 'import', 'Tabela Gergran.xlsx',
         true, 'Importado de Tabela Gergran.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Muffin Mirtilo 26g') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Muffin Mirtilo 26g', '74738', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Muffin Mirtilo 26g' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Gergran'),
         v_product_id, 0.6436999999999999, 0.6436999999999999, 1, 1, 'EUR', 'import', 'Tabela Gergran.xlsx',
         true, 'Importado de Tabela Gergran.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Pão de Deus 35g') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Pão de Deus 35g', '19843', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Pão de Deus 35g' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Gergran'),
         v_product_id, 0.31078, 0.31078, 1, 1, 'EUR', 'import', 'Tabela Gergran.xlsx',
         true, 'Importado de Tabela Gergran.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Sortido Mini Fashion Deliloop 38g') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Sortido Mini Fashion Deliloop 38g', '19141', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Sortido Mini Fashion Deliloop 38g' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Gergran'),
         v_product_id, 0.6478, 0.6478, 1, 1, 'EUR', 'import', 'Tabela Gergran.xlsx',
         true, 'Importado de Tabela Gergran.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Pastel Nata S/ Glúten 65g') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Pastel Nata S/ Glúten 65g', '76808', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Pastel Nata S/ Glúten 65g' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Gergran'),
         v_product_id, 1.2710000000000001, 1.2710000000000001, 1, 1, 'EUR', 'import', 'Tabela Gergran.xlsx',
         true, 'Importado de Tabela Gergran.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Sortido Muffins S/ Glúten 90g') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Sortido Muffins S/ Glúten 90g', '76656', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Sortido Muffins S/ Glúten 90g' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Gergran'),
         v_product_id, 1.5497999999999998, 1.5497999999999998, 1, 1, 'EUR', 'import', 'Tabela Gergran.xlsx',
         true, 'Importado de Tabela Gergran.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Tortita Limão S/ Glúten 60g') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Tortita Limão S/ Glúten 60g', '76454', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Tortita Limão S/ Glúten 60g' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Gergran'),
         v_product_id, 0.9758, 0.9758, 1, 1, 'EUR', 'import', 'Tabela Gergran.xlsx',
         true, 'Importado de Tabela Gergran.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Croissant 19% Manteiga Integral Sementes 30g') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Croissant 19% Manteiga Integral Sementes 30g', '27237', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Croissant 19% Manteiga Integral Sementes 30g' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Gergran'),
         v_product_id, 0.26875499999999997, 0.26875499999999997, 1, 1, 'EUR', 'import', 'Tabela Gergran.xlsx',
         true, 'Importado de Tabela Gergran.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Delícia Creme Francês 25g') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Delícia Creme Francês 25g', '77966', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Delícia Creme Francês 25g' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Gergran'),
         v_product_id, 0.17916999999999997, 0.17916999999999997, 1, 1, 'EUR', 'import', 'Tabela Gergran.xlsx',
         true, 'Importado de Tabela Gergran.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Dueto Chocolate Laranja 35g') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Dueto Chocolate Laranja 35g', '19816', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Dueto Chocolate Laranja 35g' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Gergran'),
         v_product_id, 0.2747, 0.2747, 1, 1, 'EUR', 'import', 'Tabela Gergran.xlsx',
         true, 'Importado de Tabela Gergran.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Dueto Creme Limão 35g') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Dueto Creme Limão 35g', '19817', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Dueto Creme Limão 35g' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Gergran'),
         v_product_id, 0.23779999999999998, 0.23779999999999998, 1, 1, 'EUR', 'import', 'Tabela Gergran.xlsx',
         true, 'Importado de Tabela Gergran.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Sortido Mini Salgados 20g') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Sortido Mini Salgados 20g', '27359', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Sortido Mini Salgados 20g' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Gergran'),
         v_product_id, 0.20336000000000004, 0.20336000000000004, 1, 1, 'EUR', 'import', 'Tabela Gergran.xlsx',
         true, 'Importado de Tabela Gergran.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
-- MAKRO (29 items)
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'OVO INTEIRO LIQUIDO 1KG "DOVO"') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('OVO INTEIRO LIQUIDO 1KG "DOVO"', '82404', 'OVOS', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'OVO INTEIRO LIQUIDO 1KG "DOVO"' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Makro'),
         v_product_id, 4.29, 4.29, 1, 1, 'EUR', 'import', 'tabela makro.xlsx',
         true, 'Importado de tabela makro.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'MC BACON FATIADO 1,2KG') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('MC BACON FATIADO 1,2KG', '162202', 'BACON/ BANHA/ TOUCINHO', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'MC BACON FATIADO 1,2KG' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Makro'),
         v_product_id, 6.17, 6.17, 1, 1, 'EUR', 'import', 'tabela makro.xlsx',
         true, 'Importado de tabela makro.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'MC OLEO ALTO RENDIMENTO 10LT') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('MC OLEO ALTO RENDIMENTO 10LT', '130223', 'ÓLEOS&AZEITES', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'MC OLEO ALTO RENDIMENTO 10LT' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Makro'),
         v_product_id, 17.45, 17.45, 1, 1, 'EUR', 'import', 'tabela makro.xlsx',
         true, 'Importado de tabela makro.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'MC QJ FLAMENGO FATIADO 1KG') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('MC QJ FLAMENGO FATIADO 1KG', '122860', 'SEMI-MOLE/ SEMI-DURO', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'MC QJ FLAMENGO FATIADO 1KG' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Makro'),
         v_product_id, 5.99, 5.99, 1, 1, 'EUR', 'import', 'tabela makro.xlsx',
         true, 'Importado de tabela makro.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'MANT CHEF C/SAL 1KG GRESSO') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('MANT CHEF C/SAL 1KG GRESSO', '35253', 'MANTEIGA', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'MANT CHEF C/SAL 1KG GRESSO' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Makro'),
         v_product_id, 8.35, 8.35, 1, 1, 'EUR', 'import', 'tabela makro.xlsx',
         true, 'Importado de tabela makro.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'MANT CHEF S/S 1KG GRESSO') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('MANT CHEF S/S 1KG GRESSO', '215052', 'MANTEIGA', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'MANT CHEF S/S 1KG GRESSO' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Makro'),
         v_product_id, 8.56, 8.56, 1, 1, 'EUR', 'import', 'tabela makro.xlsx',
         true, 'Importado de tabela makro.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'NATA UHT 35%MG 1L R PICOT') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('NATA UHT 35%MG 1L R PICOT', '52484', 'NATAS', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'NATA UHT 35%MG 1L R PICOT' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Makro'),
         v_product_id, 4.08, 4.08, 1, 1, 'EUR', 'import', 'tabela makro.xlsx',
         true, 'Importado de tabela makro.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'NATA CUL 22%G 1LT R PICOT') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('NATA CUL 22%G 1LT R PICOT', '62014', 'NATAS', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'NATA CUL 22%G 1LT R PICOT' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Makro'),
         v_product_id, 2.89, 2.89, 1, 1, 'EUR', 'import', 'tabela makro.xlsx',
         true, 'Importado de tabela makro.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'QJ PRATO CURADO ILHA AZUL 1KG') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('QJ PRATO CURADO ILHA AZUL 1KG', '161476', 'SEMI-MOLE/ SEMI-DURO', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'QJ PRATO CURADO ILHA AZUL 1KG' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Makro'),
         v_product_id, 8.95, 8.95, 1, 1, 'EUR', 'import', 'tabela makro.xlsx',
         true, 'Importado de tabela makro.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'MPM HAMB PREM. B.ANGUS IRL C 16X200') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('MPM HAMB PREM. B.ANGUS IRL C 16X200', '154391', 'REFEIÇ?ES PRONTAS A COZINHAR C', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'MPM HAMB PREM. B.ANGUS IRL C 16X200' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Makro'),
         v_product_id, 43.53, 43.53, 1, 1, 'EUR', 'import', 'tabela makro.xlsx',
         true, 'Importado de tabela makro.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'CX.P/HAMB.13X12,5X9CM 50U') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('CX.P/HAMB.13X12,5X9CM 50U', '151571', 'Descartáveis', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'CX.P/HAMB.13X12,5X9CM 50U' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Makro'),
         v_product_id, 6.99, 6.99, 1, 1, 'EUR', 'import', 'tabela makro.xlsx',
         true, 'Importado de tabela makro.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'MIGAS PALOCO PAC. 5KG ARO') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('MIGAS PALOCO PAC. 5KG ARO', '18989', 'PEIXE SECO', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'MIGAS PALOCO PAC. 5KG ARO' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Makro'),
         v_product_id, 25.99, 25.99, 1, 1, 'EUR', 'import', 'tabela makro.xlsx',
         true, 'Importado de tabela makro.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'MC PAO ESP.SANDWICH 1KG') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('MC PAO ESP.SANDWICH 1KG', '117505', 'P?O DE LONGA DURAÇ?O', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'MC PAO ESP.SANDWICH 1KG' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Makro'),
         v_product_id, 2.16, 2.16, 1, 1, 'EUR', 'import', 'tabela makro.xlsx',
         true, 'Importado de tabela makro.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'QJ.GRANA PADANO (1KG)ZANETTI') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('QJ.GRANA PADANO (1KG)ZANETTI', '252243', 'QUEIJO DURO', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'QJ.GRANA PADANO (1KG)ZANETTI' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Makro'),
         v_product_id, 15.6, 15.6, 1, 1, 'EUR', 'import', 'tabela makro.xlsx',
         true, 'Importado de tabela makro.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'PAIO YORK FT 500G LIMIANA') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('PAIO YORK FT 500G LIMIANA', '157309', 'CARNE COZIDA', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'PAIO YORK FT 500G LIMIANA' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Makro'),
         v_product_id, 3.7, 3.7, 1, 1, 'EUR', 'import', 'tabela makro.xlsx',
         true, 'Importado de tabela makro.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'MC QJ FRESCO BARRA 1KG') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('MC QJ FRESCO BARRA 1KG', '161938', 'QUEIJO FRESCO/ REQUEIJ?O', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'MC QJ FRESCO BARRA 1KG' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Makro'),
         v_product_id, 4.78, 4.78, 1, 1, 'EUR', 'import', 'tabela makro.xlsx',
         true, 'Importado de tabela makro.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'MPRO ROLOS INDUST.2F.2X350MT') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('MPRO ROLOS INDUST.2F.2X350MT', '142018', 'LENÇOS E HIGIENE PROFISSIONAL', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'MPRO ROLOS INDUST.2F.2X350MT' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Makro'),
         v_product_id, 18.28, 18.28, 1, 1, 'EUR', 'import', 'tabela makro.xlsx',
         true, 'Importado de tabela makro.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'SIGMA ETIQ VALIDADE PK2 1000UN') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('SIGMA ETIQ VALIDADE PK2 1000UN', '157892', 'Papel', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'SIGMA ETIQ VALIDADE PK2 1000UN' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Makro'),
         v_product_id, 5.9, 5.9, 1, 1, 'EUR', 'import', 'tabela makro.xlsx',
         true, 'Importado de tabela makro.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'SACOS LIXO 800X1200-10KG FAPIL') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('SACOS LIXO 800X1200-10KG FAPIL', '151049', 'Sacos do Lixo', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'SACOS LIXO 800X1200-10KG FAPIL' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Makro'),
         v_product_id, 17.0, 17.0, 1, 1, 'EUR', 'import', 'tabela makro.xlsx',
         true, 'Importado de tabela makro.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'MPRO PELIC ADERENTE 44CMX300M') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('MPRO PELIC ADERENTE 44CMX300M', '153767', 'Descartáveis', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'MPRO PELIC ADERENTE 44CMX300M' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Makro'),
         v_product_id, 39.0, 39.0, 1, 1, 'EUR', 'import', 'tabela makro.xlsx',
         true, 'Importado de tabela makro.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'MC FIAMBRE PERNA FAT 3x350G') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('MC FIAMBRE PERNA FAT 3x350G', 'aviludo', 'FIAMBRE', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'MC FIAMBRE PERNA FAT 3x350G' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Makro'),
         v_product_id, 5.29, 5.29, 1, 1, 'EUR', 'import', 'tabela makro.xlsx',
         true, 'Importado de tabela makro.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'leite meio gordo') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('leite meio gordo', 'aviludo', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'leite meio gordo' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Makro'),
         v_product_id, 4.25, 4.25, 1, 1, 'EUR', 'import', 'tabela makro.xlsx',
         true, 'Importado de tabela makro.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'feijão frade cozido uli 6x2,500kg') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('feijão frade cozido uli 6x2,500kg', 'None', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'feijão frade cozido uli 6x2,500kg' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Makro'),
         v_product_id, 16.1, 16.1, 1, 1, 'EUR', 'import', 'tabela makro.xlsx',
         true, 'Importado de tabela makro.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'feijão manteiga cozido uli 6x2,500kg') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('feijão manteiga cozido uli 6x2,500kg', 'None', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'feijão manteiga cozido uli 6x2,500kg' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Makro'),
         v_product_id, 16.1, 16.1, 1, 1, 'EUR', 'import', 'tabela makro.xlsx',
         true, 'Importado de tabela makro.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'feijão preto cozido uli 6x2,500kg') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('feijão preto cozido uli 6x2,500kg', 'None', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'feijão preto cozido uli 6x2,500kg' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Makro'),
         v_product_id, 16.1, 16.1, 1, 1, 'EUR', 'import', 'tabela makro.xlsx',
         true, 'Importado de tabela makro.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Cogumelos Cortados Uli Lt.12x780 Gr') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Cogumelos Cortados Uli Lt.12x780 Gr', 'None', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Cogumelos Cortados Uli Lt.12x780 Gr' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Makro'),
         v_product_id, 24.0, 24.0, 1, 1, 'EUR', 'import', 'tabela makro.xlsx',
         true, 'Importado de tabela makro.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Presunto Fatiado Uli 500 Gr') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Presunto Fatiado Uli 500 Gr', 'None', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Presunto Fatiado Uli 500 Gr' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Makro'),
         v_product_id, 6.7, 6.7, 1, 1, 'EUR', 'import', 'tabela makro.xlsx',
         true, 'Importado de tabela makro.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Couve Bruxelas Cong. Metro Chef 4x2,5 kg') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Couve Bruxelas Cong. Metro Chef 4x2,5 kg', 'aviludo', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Couve Bruxelas Cong. Metro Chef 4x2,5 kg' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Makro'),
         v_product_id, 15.95, 15.95, 1, 1, 'EUR', 'import', 'tabela makro.xlsx',
         true, 'Importado de tabela makro.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Espinafres Folhas Cong.MetroChef 4x2,5kg') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Espinafres Folhas Cong.MetroChef 4x2,5kg', 'alpha', 'Mercearia', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Espinafres Folhas Cong.MetroChef 4x2,5kg' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Makro'),
         v_product_id, 11.67, 11.67, 1, 1, 'EUR', 'import', 'tabela makro.xlsx',
         true, 'Importado de tabela makro.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
-- LUSIGEL (32 items)
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Croissant (PL) 25g (225Un./Cx)') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Croissant (PL) 25g (225Un./Cx)', '25957', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Croissant (PL) 25g (225Un./Cx)' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Lusigel'),
         v_product_id, 0.187, 0.187, 1, 1, 'EUR', 'import', 'lusigel.xlsx',
         true, 'Importado de lusigel.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Napolitana (PL) 25g (250UUn./Cx)') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Napolitana (PL) 25g (250UUn./Cx)', '25960', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Napolitana (PL) 25g (250UUn./Cx)' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Lusigel'),
         v_product_id, 0.211, 0.211, 1, 1, 'EUR', 'import', 'lusigel.xlsx',
         true, 'Importado de lusigel.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Caracol (PL) 30g (120Un./Cx)') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Caracol (PL) 30g (120Un./Cx)', '25958', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Caracol (PL) 30g (120Un./Cx)' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Lusigel'),
         v_product_id, 0.203, 0.203, 1, 1, 'EUR', 'import', 'lusigel.xlsx',
         true, 'Importado de lusigel.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Chausson de Maçã 40g (150Unid./Cx)') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Chausson de Maçã 40g (150Unid./Cx)', '25275', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Chausson de Maçã 40g (150Unid./Cx)' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Lusigel'),
         v_product_id, 0.319, 0.319, 1, 1, 'EUR', 'import', 'lusigel.xlsx',
         true, 'Importado de lusigel.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Rocher de Coco 10g (200Un./Cx)') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Rocher de Coco 10g (200Un./Cx)', '25263', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Rocher de Coco 10g (200Un./Cx)' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Lusigel'),
         v_product_id, 0.188, 0.188, 1, 1, 'EUR', 'import', 'lusigel.xlsx',
         true, 'Importado de lusigel.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Pão opéra selec. 55g (100Un./Cx)') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Pão opéra selec. 55g (100Un./Cx)', '70081', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Pão opéra selec. 55g (100Un./Cx)' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Lusigel'),
         v_product_id, 0.211, 0.211, 1, 1, 'EUR', 'import', 'lusigel.xlsx',
         true, 'Importado de lusigel.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Chapata 45g (80Un./Cx)') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Chapata 45g (80Un./Cx)', '29549', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Chapata 45g (80Un./Cx)' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Lusigel'),
         v_product_id, 0.229, 0.229, 1, 1, 'EUR', 'import', 'lusigel.xlsx',
         true, 'Importado de lusigel.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Pão Losango Padeiro" Nat. 50g (200Un./Cx)"') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Pão Losango Padeiro" Nat. 50g (200Un./Cx)"', '853219', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Pão Losango Padeiro" Nat. 50g (200Un./Cx)"' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Lusigel'),
         v_product_id, 0.281, 0.281, 1, 1, 'EUR', 'import', 'lusigel.xlsx',
         true, 'Importado de lusigel.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Pão Losangulo Multicereais (PC) 50g (80Un./Cx)') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Pão Losangulo Multicereais (PC) 50g (80Un./Cx)', '70230', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Pão Losangulo Multicereais (PC) 50g (80Un./Cx)' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Lusigel'),
         v_product_id, 0.371, 0.371, 1, 1, 'EUR', 'import', 'lusigel.xlsx',
         true, 'Importado de lusigel.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Bola de Berlim Doce 19g (105Un./Cx)') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Bola de Berlim Doce 19g (105Un./Cx)', '25235', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Bola de Berlim Doce 19g (105Un./Cx)' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Lusigel'),
         v_product_id, 0.209, 0.209, 1, 1, 'EUR', 'import', 'lusigel.xlsx',
         true, 'Importado de lusigel.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Bola Berlim Morango 27g (105Un./Cx)') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Bola Berlim Morango 27g (105Un./Cx)', '22275', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Bola Berlim Morango 27g (105Un./Cx)' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Lusigel'),
         v_product_id, 0.373, 0.373, 1, 1, 'EUR', 'import', 'lusigel.xlsx',
         true, 'Importado de lusigel.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Bola de Berlim Doce Maçã 27g (105Un./Cx)') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Bola de Berlim Doce Maçã 27g (105Un./Cx)', '25236', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Bola de Berlim Doce Maçã 27g (105Un./Cx)' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Lusigel'),
         v_product_id, 0.37, 0.37, 1, 1, 'EUR', 'import', 'lusigel.xlsx',
         true, 'Importado de lusigel.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Bola Berlim Doce Frutos Verm. 27g (105Un./Cx') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Bola Berlim Doce Frutos Verm. 27g (105Un./Cx', '25237', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Bola Berlim Doce Frutos Verm. 27g (105Un./Cx' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Lusigel'),
         v_product_id, 0.37, 0.37, 1, 1, 'EUR', 'import', 'lusigel.xlsx',
         true, 'Importado de lusigel.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Bola Berlim Doce Caram. 27g (105Un./Cx)') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Bola Berlim Doce Caram. 27g (105Un./Cx)', '25239', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Bola Berlim Doce Caram. 27g (105Un./Cx)' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Lusigel'),
         v_product_id, 0.394, 0.394, 1, 1, 'EUR', 'import', 'lusigel.xlsx',
         true, 'Importado de lusigel.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Bola Berlim Doce Choc. e Avelã 27g (105Un./') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Bola Berlim Doce Choc. e Avelã 27g (105Un./', '25241', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Bola Berlim Doce Choc. e Avelã 27g (105Un./' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Lusigel'),
         v_product_id, 0.369, 0.369, 1, 1, 'EUR', 'import', 'lusigel.xlsx',
         true, 'Importado de lusigel.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Bola Berlim Pistachio 25g (105Un./') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Bola Berlim Pistachio 25g (105Un./', '71371', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Bola Berlim Pistachio 25g (105Un./' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Lusigel'),
         v_product_id, 0.428, 0.428, 1, 1, 'EUR', 'import', 'lusigel.xlsx',
         true, 'Importado de lusigel.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Muffin Tulipa 22g (84Un./Cx)') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Muffin Tulipa 22g (84Un./Cx)', '22277', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Muffin Tulipa 22g (84Un./Cx)' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Lusigel'),
         v_product_id, 0.395, 0.395, 1, 1, 'EUR', 'import', 'lusigel.xlsx',
         true, 'Importado de lusigel.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Muffins Choc. Avelã 26g (42Un./Cx)') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Muffins Choc. Avelã 26g (42Un./Cx)', '832340', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Muffins Choc. Avelã 26g (42Un./Cx)' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Lusigel'),
         v_product_id, 0.695, 0.695, 1, 1, 'EUR', 'import', 'lusigel.xlsx',
         true, 'Importado de lusigel.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Muffins Caramelo Salgado 26g (42Un./Cx)') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Muffins Caramelo Salgado 26g (42Un./Cx)', '832339', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Muffins Caramelo Salgado 26g (42Un./Cx)' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Lusigel'),
         v_product_id, 0.701, 0.701, 1, 1, 'EUR', 'import', 'lusigel.xlsx',
         true, 'Importado de lusigel.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'MINI MUFFIN S TULIPE FOURRES 35g (46Un./Cx)') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('MINI MUFFIN S TULIPE FOURRES 35g (46Un./Cx)', '25283', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'MINI MUFFIN S TULIPE FOURRES 35g (46Un./Cx)' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Lusigel'),
         v_product_id, 0.605, 0.605, 1, 1, 'EUR', 'import', 'lusigel.xlsx',
         true, 'Importado de lusigel.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Muffins Tulipa Pasteleiro 35g (36Un./Cx)') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Muffins Tulipa Pasteleiro 35g (36Un./Cx)', '70173', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Muffins Tulipa Pasteleiro 35g (36Un./Cx)' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Lusigel'),
         v_product_id, 0.747, 0.747, 1, 1, 'EUR', 'import', 'lusigel.xlsx',
         true, 'Importado de lusigel.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Pancake Ø90 25g (80Un./Cx)') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Pancake Ø90 25g (80Un./Cx)', '25047', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Pancake Ø90 25g (80Un./Cx)' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Lusigel'),
         v_product_id, 0.377, 0.377, 1, 1, 'EUR', 'import', 'lusigel.xlsx',
         true, 'Importado de lusigel.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Crepe Doce Ø 100 15g (180Un./Cx)') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Crepe Doce Ø 100 15g (180Un./Cx)', '25385', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Crepe Doce Ø 100 15g (180Un./Cx)' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Lusigel'),
         v_product_id, 0.205, 0.205, 1, 1, 'EUR', 'import', 'lusigel.xlsx',
         true, 'Importado de lusigel.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Pão Forma Fatiado 1000g (5Un./Cx)') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Pão Forma Fatiado 1000g (5Un./Cx)', '70181', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Pão Forma Fatiado 1000g (5Un./Cx)' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Lusigel'),
         v_product_id, 5.28, 5.28, 1, 1, 'EUR', 'import', 'lusigel.xlsx',
         true, 'Importado de lusigel.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Pão Rustico Fatiado 1000g (5Un./Cx)') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Pão Rustico Fatiado 1000g (5Un./Cx)', '70182', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Pão Rustico Fatiado 1000g (5Un./Cx)' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Lusigel'),
         v_product_id, 5.397, 5.397, 1, 1, 'EUR', 'import', 'lusigel.xlsx',
         true, 'Importado de lusigel.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Doots Recheados sortidos 22g (112Un./Cx)') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Doots Recheados sortidos 22g (112Un./Cx)', '70414', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Doots Recheados sortidos 22g (112Un./Cx)' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Lusigel'),
         v_product_id, 0.298, 0.298, 1, 1, 'EUR', 'import', 'lusigel.xlsx',
         true, 'Importado de lusigel.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Doot''s® Chocolate 30g (80Un./Cx)') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Doot''s® Chocolate 30g (80Un./Cx)', '25358', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Doot''s® Chocolate 30g (80Un./Cx)' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Lusigel'),
         v_product_id, 0.261, 0.261, 1, 1, 'EUR', 'import', 'lusigel.xlsx',
         true, 'Importado de lusigel.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Doot''s® 28g (80Un./Cx)') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Doot''s® 28g (80Un./Cx)', '25689', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Doot''s® 28g (80Un./Cx)' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Lusigel'),
         v_product_id, 0.248, 0.248, 1, 1, 'EUR', 'import', 'lusigel.xlsx',
         true, 'Importado de lusigel.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Trança de Noz Pécan 42g (120Unid./Cx)') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Trança de Noz Pécan 42g (120Unid./Cx)', '648223', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Trança de Noz Pécan 42g (120Unid./Cx)' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Lusigel'),
         v_product_id, 31.527, 31.527, 1, 1, 'EUR', 'import', 'lusigel.xlsx',
         true, 'Importado de lusigel.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Seleção Dinamarquesa 42g (120Unid./Cx)') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Seleção Dinamarquesa 42g (120Unid./Cx)', '648225', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Seleção Dinamarquesa 42g (120Unid./Cx)' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Lusigel'),
         v_product_id, 30.483, 30.483, 1, 1, 'EUR', 'import', 'lusigel.xlsx',
         true, 'Importado de lusigel.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Mini Pastel de Nata Artesanal 28Gr (100 unid./Cx)') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Mini Pastel de Nata Artesanal 28Gr (100 unid./Cx)', '11067', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Mini Pastel de Nata Artesanal 28Gr (100 unid./Cx)' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Lusigel'),
         v_product_id, 20.234, 20.234, 1, 1, 'EUR', 'import', 'lusigel.xlsx',
         true, 'Importado de lusigel.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Pastel de Nata Artesanal 66Gr (104 unid./Cx)') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('Pastel de Nata Artesanal 66Gr (104 unid./Cx)', '95155', 'Pastelaria', 'un'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Pastel de Nata Artesanal 66Gr (104 unid./Cx)' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Lusigel'),
         v_product_id, 36.036, 36.036, 1, 1, 'EUR', 'import', 'lusigel.xlsx',
         true, 'Importado de lusigel.xlsx (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;

COMMIT;