BEGIN;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'MC FIAMBRE PERNA FAT 3x350G') THEN
    INSERT INTO products (master_name, category, unit, is_active)
    VALUES ('MC FIAMBRE PERNA FAT 3x350G', 'Mercearia', 'un', true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'MC FIAMBRE PERNA FAT 3x350G' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Aviludo'),
         v_product_id, 7.29, 7.29, 1, 1, 'EUR', 'import', 'tabela makro.xlsx',
         true, 'Preço Aviludo (comparativo de mercado)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'leite meio gordo') THEN
    INSERT INTO products (master_name, category, unit, is_active)
    VALUES ('leite meio gordo', 'Mercearia', 'un', true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'leite meio gordo' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Aviludo'),
         v_product_id, 4.35, 4.35, 1, 1, 'EUR', 'import', 'tabela makro.xlsx',
         true, 'Preço Aviludo (comparativo de mercado)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, notes = EXCLUDED.notes, updated_at = now();
END $$;
DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = 'Couve Bruxelas Cong. Metro Chef 4x2,5 kg') THEN
    INSERT INTO products (master_name, category, unit, is_active)
    VALUES ('Couve Bruxelas Cong. Metro Chef 4x2,5 kg', 'Mercearia', 'un', true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = 'Couve Bruxelas Cong. Metro Chef 4x2,5 kg' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Aviludo'),
         v_product_id, 18.96, 18.96, 1, 1, 'EUR', 'import', 'tabela makro.xlsx',
         true, 'Preço Aviludo (comparativo de mercado)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, notes = EXCLUDED.notes, updated_at = now();
END $$;
COMMIT;