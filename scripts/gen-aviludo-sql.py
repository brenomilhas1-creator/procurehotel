#!/usr/bin/env python3
"""Gerar SQL para preços Aviludo da tabela comparativa."""
import openpyxl

wb = openpyxl.load_workbook('/tmp/uploads/1781264370648-tabela_makro.xlsx', data_only=True)
ws = wb.active

aviludo_items = []
for i, row in enumerate(ws.iter_rows(values_only=True), 1):
    if i < 2:
        continue
    codigo = str(row[0] or '').strip().lower() if row[0] else ''
    if codigo == 'aviludo':
        desc = str(row[1] or '').strip() if row[1] else None
        price = row[5] if row[5] else None
        if desc and price and isinstance(price, (int, float)) and price > 0:
            aviludo_items.append({
                'master_name': desc[:255],
                'price': float(price),
            })

out = ['BEGIN;']
for item in aviludo_items:
    name = item['master_name'].replace("'", "''")
    out.append(f"""DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = '{name}') THEN
    INSERT INTO products (master_name, category, unit, is_active)
    VALUES ('{name}', 'Mercearia', 'un', true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = '{name}' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = 'Aviludo'),
         v_product_id, {item['price']}, {item['price']}, 1, 1, 'EUR', 'import', 'tabela makro.xlsx',
         true, 'Preço Aviludo (comparativo de mercado)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, notes = EXCLUDED.notes, updated_at = now();
END $$;""")
out.append('COMMIT;')

with open('/workspace/scripts/import-aviludo-2026-06-16.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(out))

print(f"SQL Aviludo gerado: {len(aviludo_items)} items")
