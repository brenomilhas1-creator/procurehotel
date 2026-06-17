#!/usr/bin/env python3
"""Gerar SQL para importar as 4 tabelas reais do user."""
import json

with open('/tmp/parsed_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

suppliers = {
    'alpha_food': {
        'name': 'Alpha Food',
        'tax_id': 'PT5000234567',
        'contact_email': 'orders@alphafood.pt',
        'contact_phone': '+351 21 345 6789',
        'address': 'Av. da Indústria, 35, 2780-205 Oeiras, Portugal',
        'is_preferred': False,
    },
    'gergran': {
        'name': 'Gergran',
        'tax_id': 'PT5000345678',
        'contact_email': 'comercial@gergran.pt',
        'contact_phone': '+351 21 456 7890',
        'address': 'Rua dos Cereais, 12, 2695-027 São João da Talha, Portugal',
        'is_preferred': True,
    },
    'lusigel': {
        'name': 'Lusigel',
        'tax_id': None,
        'contact_email': None,
        'contact_phone': None,
        'address': 'Portugal',
        'is_preferred': False,
    },
}

out = ["BEGIN;", ""]
out.append("-- 1) Fornecedores")
for key, s in suppliers.items():
    tax = f"'{s['tax_id']}'" if s['tax_id'] else "NULL"
    email = f"'{s['contact_email']}'" if s['contact_email'] else "NULL"
    phone = f"'{s['contact_phone']}'" if s['contact_phone'] else "NULL"
    addr = f"'{s['address']}'" if s['address'] else "NULL"
    pref = "true" if s['is_preferred'] else "false"
    name_esc = s['name'].replace("'", "''")
    out.append(f"""INSERT INTO suppliers (name, tax_id, contact_email, contact_phone, address, is_preferred, sort_order, is_active, updated_at)
SELECT '{name_esc}', {tax}, {email}, {phone}, {addr}, {pref}, 9, true, now()
WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE name = '{name_esc}');""")
out.append("")

out.append("-- 2) Produtos e supplier_prices")
out.append("")
for source_key, items in data.items():
    out.append(f"-- {source_key.upper()} ({len(items)} items)")
    if source_key == 'alpha_food':
        sup_name = 'Alpha Food'
    elif source_key == 'gergran':
        sup_name = 'Gergran'
    elif source_key == 'makro':
        sup_name = 'Makro'
    elif source_key == 'lusigel':
        sup_name = 'Lusigel'
    else:
        sup_name = 'Unknown'

    for item in items:
        name = item.get('master_name', '').replace("'", "''")[:255]
        sku = item.get('sku', '')
        if sku:
            sku = sku.replace("'", "''")[:64]
        if source_key == 'alpha_food':
            unit = 'un'
            category = 'Mercearia'
            price = item.get('price_alpha_food')
            source_ref = 'tabela ALPHA FOOD.xlsx'
            tax_rate = 6
        elif source_key == 'gergran':
            unit = item.get('unit', 'un')
            category = item.get('category', 'Padaria')
            price = item.get('price')
            source_ref = 'Tabela Gergran.xlsx'
            tax_rate = item.get('tax_rate', 6)
        elif source_key == 'makro':
            unit = 'un'
            category = item.get('category', 'Mercearia')
            price = item.get('price')
            source_ref = 'tabela makro.xlsx'
            tax_rate = 6
        elif source_key == 'lusigel':
            unit = item.get('unit', 'un')
            category = item.get('category', 'Pastelaria')
            price = item.get('price')
            source_ref = 'lusigel.xlsx'
            tax_rate = item.get('tax_rate', 6)
        if not name or not price or price <= 0:
            continue
        cat_esc = (category or 'Mercearia').replace("'", "''")
        out.append(f"""DO $$
DECLARE
  v_product_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products WHERE master_name = '{name}') THEN
    INSERT INTO products (master_name, sku, category, unit, is_active)
    VALUES ('{name}', '{sku}', '{cat_esc}', '{unit}'::unit_of_measure, true)
    RETURNING id INTO v_product_id;
  ELSE
    SELECT id INTO v_product_id FROM products WHERE master_name = '{name}' LIMIT 1;
  END IF;
  INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, source, source_ref, is_current, notes)
  SELECT (SELECT id FROM suppliers WHERE name = '{sup_name}'),
         v_product_id, {price}, {price}, 1, 1, 'EUR', 'import', '{source_ref}',
         true, 'Importado de {source_ref} (tabela do utilizador)'
  ON CONFLICT (product_id, supplier_id) DO UPDATE SET
    price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true,
    source = 'import', source_ref = EXCLUDED.source_ref, valid_until = NULL,
    notes = EXCLUDED.notes, updated_at = now();
END $$;""")

out.append("")
out.append("COMMIT;")

with open('/workspace/scripts/import-user-tables-2026-06-16.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(out))

print(f"SQL gerado: {len(out)} linhas, {len(data['alpha_food'])+len(data['gergran'])+len(data['makro'])+len(data['lusigel'])} items")
