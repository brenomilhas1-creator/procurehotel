-- =====================================================
-- Compra Facil Hoteis — Importação do Pedido Real
-- 3 fornecedores: Avoneto Hortefruti, Aviludo, Makro
-- Data: 2026-06-15
-- =====================================================

BEGIN;

-- ============================
-- 1) FORNECEDORES NOVOS
-- ============================
INSERT INTO suppliers (name, tax_id, contact_email, contact_phone, address, is_hidden, is_active, sort_order)
SELECT * FROM (VALUES
  ('Avoneto Hortefruti'::text, 'PT5012000001'::text, 'geral@avoneto.pt'::text, '+351 21 100 0001'::text, 'Marvila, Lisboa'::text, false, true, 4),
  ('Aviludo'::text, 'PT5012000002'::text, 'comercial@aviludo.pt'::text, '+351 21 100 0002'::text, 'Vila Franca de Xira'::text, false, true, 5)
) AS new_s(name, tax_id, contact_email, contact_phone, address, is_hidden, is_active, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM suppliers s WHERE s.name = new_s.name);

SELECT id, name FROM suppliers WHERE name IN ('Avoneto Hortefruti','Aviludo','Makro') ORDER BY name;

-- ============================
-- 2) PRODUTOS (com cast para unit_of_measure)
-- ============================

-- AVONETO — frescos, frutas, ervas
INSERT INTO products (master_name, category, unit, is_active)
SELECT v.master_name, v.category, v.unit::unit_of_measure, v.is_active
FROM (VALUES
  ('Batata Agrea','Horticolas','kg',true),
  ('Cebola Branca','Horticolas','kg',true),
  ('Cebola Roxa','Horticolas','kg',true),
  ('Alho','Horticolas','kg',true),
  ('Batata Nova','Horticolas','kg',true),
  ('Alface Frisada','Horticolas','un',true),
  ('Alface Iceberg','Horticolas','un',true),
  ('Uva','Frutas','kg',true),
  ('Mamão Papaia','Frutas','kg',true),
  ('Melão','Frutas','kg',true),
  ('Melancia','Frutas','kg',true),
  ('Ananás','Frutas','un',true),
  ('Kiwi','Frutas','kg',true),
  ('Maçã (variedades)','Frutas','kg',true),
  ('Coentros','Ervas Aromaticas','kg',true),
  ('Salsa','Ervas Aromaticas','kg',true),
  ('Alperce','Frutas','kg',true),
  ('Pêssego','Frutas','kg',true),
  ('Tomate Cherry','Horticolas','kg',true),
  ('Pepino','Horticolas','un',true),
  ('Pimentos Vermelhos','Horticolas','kg',true),
  ('Pimentos Verdes','Horticolas','kg',true),
  ('Endivias','Saladas','kg',true),
  ('Courgette','Horticolas','kg',true),
  ('Tomate Steak','Horticolas','kg',true),
  ('Abóbora','Horticolas','un',true),
  ('Cogumelos Paris','Horticolas','kg',true),
  ('Cenouras','Horticolas','kg',true),
  ('Meloa','Frutas','kg',true),
  ('Lombardo','Horticolas','un',true),
  ('Feijão Verde','Horticolas','kg',true),
  ('Cebolinho','Ervas Aromaticas','un',true),
  ('Rebentos de Ervilha','Rebentos','cx',true),
  ('Rebentos de Coentros','Rebentos','cx',true),
  ('Flores Comestíveis','Especialidades','un',true)
) AS v(master_name, category, unit, is_active)
WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.master_name = v.master_name);

-- AVILUDO — mercearia, lacticinios, charcutaria, congelados
INSERT INTO products (master_name, category, unit, is_active)
SELECT v.master_name, v.category, v.unit::unit_of_measure, v.is_active
FROM (VALUES
  ('Arroz Agulha','Mercearia','kg',true),
  ('Creme Balsâmico','Condimentos','l',true),
  ('Sal Grosso','Condimentos','kg',true),
  ('Feijão Preto','Mercearia','kg',true),
  ('Esparguete','Massas','kg',true),
  ('Polpa de Tomate','Conservas','kg',true),
  ('Azeite','Azeites','l',true),
  ('Óleo Alimentar','Óleos','l',true),
  ('Maionese','Molhos','kg',true),
  ('Ovos Frescos','Ovos','un',true),
  ('Açúcar Branco','Mercearia','kg',true),
  ('Leite Condensado Cozido','Lacticinios','un',true),
  ('Nata 35% MG','Lacticinios','l',true),
  ('Nata 20% MG','Lacticinios','l',true),
  ('Queijo Ilha Azul','Lacticinios','kg',true),
  ('Queijo Fresco','Lacticinios','kg',true),
  ('Manteiga sem Sal','Lacticinios','kg',true),
  ('Queijo Cheddar','Lacticinios','kg',true),
  ('Mascarpone','Lacticinios','kg',true),
  ('Bacon','Charcutaria','kg',true),
  ('Fiambre Peru','Charcutaria','kg',true),
  ('Fiambre Frango','Charcutaria','kg',true),
  ('Ovos Líquidos','Ovos','l',true),
  ('Mozzarella','Lacticinios','kg',true),
  ('Paio','Charcutaria','kg',true),
  ('Salsichas Cocktail','Charcutaria','kg',true),
  ('Feijão Manteiga','Mercearia','kg',true),
  ('Filetes Pescada','Congelados','kg',true),
  ('Salada Russa','Congelados','kg',true),
  ('Ervilhas','Congelados','kg',true),
  ('Gorgonzola','Lacticinios','kg',true)
) AS v(master_name, category, unit, is_active)
WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.master_name = v.master_name);

-- MAKRO
INSERT INTO products (master_name, category, unit, is_active)
SELECT v.master_name, v.category, v.unit::unit_of_measure, v.is_active
FROM (VALUES
  ('Guacamole','Frescos Pronto Consumo','kg',true),
  ('Chocolate Negro 70%','Mercearia','kg',true),
  ('Chocolate Branco','Mercearia','kg',true),
  ('Robalo Filetado 200/300','Peixes','kg',true)
) AS v(master_name, category, unit, is_active)
WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.master_name = v.master_name);

SELECT COUNT(*) AS total_produtos FROM products WHERE is_active = true;

-- ============================
-- 3) SUPPLIER PRICES
-- ============================
DO $$
DECLARE
  v_avoneto UUID;
  v_aviludo UUID;
  v_makro UUID;
  v_product_id UUID;
  v_price NUMERIC;
BEGIN
  SELECT id INTO v_avoneto FROM suppliers WHERE name = 'Avoneto Hortefruti';
  SELECT id INTO v_aviludo FROM suppliers WHERE name = 'Aviludo';
  SELECT id INTO v_makro  FROM suppliers WHERE name = 'Makro';

  -- ===== AVONETO =====
  FOR v_product_id, v_price IN
    SELECT id, 0.85::numeric FROM products WHERE master_name='Batata Agrea' UNION ALL
    SELECT id, 0.95 FROM products WHERE master_name='Cebola Branca' UNION ALL
    SELECT id, 1.20 FROM products WHERE master_name='Cebola Roxa' UNION ALL
    SELECT id, 4.50 FROM products WHERE master_name='Alho' UNION ALL
    SELECT id, 1.10 FROM products WHERE master_name='Batata Nova' UNION ALL
    SELECT id, 1.50 FROM products WHERE master_name='Alface Frisada' UNION ALL
    SELECT id, 1.80 FROM products WHERE master_name='Alface Iceberg' UNION ALL
    SELECT id, 2.80 FROM products WHERE master_name='Uva' UNION ALL
    SELECT id, 2.20 FROM products WHERE master_name='Mamão Papaia' UNION ALL
    SELECT id, 1.50 FROM products WHERE master_name='Melão' UNION ALL
    SELECT id, 0.80 FROM products WHERE master_name='Melancia' UNION ALL
    SELECT id, 1.90 FROM products WHERE master_name='Ananás' UNION ALL
    SELECT id, 2.95 FROM products WHERE master_name='Kiwi' UNION ALL
    SELECT id, 1.65 FROM products WHERE master_name='Maçã (variedades)' UNION ALL
    SELECT id, 6.00 FROM products WHERE master_name='Coentros' UNION ALL
    SELECT id, 5.50 FROM products WHERE master_name='Salsa' UNION ALL
    SELECT id, 3.20 FROM products WHERE master_name='Alperce' UNION ALL
    SELECT id, 2.80 FROM products WHERE master_name='Pêssego' UNION ALL
    SELECT id, 3.50 FROM products WHERE master_name='Tomate Cherry' UNION ALL
    SELECT id, 0.90 FROM products WHERE master_name='Pepino' UNION ALL
    SELECT id, 2.40 FROM products WHERE master_name='Pimentos Vermelhos' UNION ALL
    SELECT id, 2.20 FROM products WHERE master_name='Pimentos Verdes' UNION ALL
    SELECT id, 4.50 FROM products WHERE master_name='Endivias' UNION ALL
    SELECT id, 1.40 FROM products WHERE master_name='Courgette' UNION ALL
    SELECT id, 2.80 FROM products WHERE master_name='Tomate Steak' UNION ALL
    SELECT id, 1.80 FROM products WHERE master_name='Abóbora' UNION ALL
    SELECT id, 5.20 FROM products WHERE master_name='Cogumelos Paris' UNION ALL
    SELECT id, 0.75 FROM products WHERE master_name='Cenouras' UNION ALL
    SELECT id, 1.60 FROM products WHERE master_name='Meloa' UNION ALL
    SELECT id, 1.10 FROM products WHERE master_name='Lombardo' UNION ALL
    SELECT id, 3.80 FROM products WHERE master_name='Feijão Verde' UNION ALL
    SELECT id, 0.95 FROM products WHERE master_name='Cebolinho' UNION ALL
    SELECT id, 2.50 FROM products WHERE master_name='Rebentos de Ervilha' UNION ALL
    SELECT id, 2.50 FROM products WHERE master_name='Rebentos de Coentros' UNION ALL
    SELECT id, 8.00 FROM products WHERE master_name='Flores Comestíveis'
  LOOP
    INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, is_current)
    VALUES (v_avoneto, v_product_id, v_price, v_price, 1, 1, true)
    ON CONFLICT (product_id, supplier_id) DO UPDATE SET price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true;
  END LOOP;

  -- ===== AVILUDO =====
  FOR v_product_id, v_price IN
    SELECT id, 1.40::numeric FROM products WHERE master_name='Arroz Agulha' UNION ALL
    SELECT id, 8.90 FROM products WHERE master_name='Creme Balsâmico' UNION ALL
    SELECT id, 0.65 FROM products WHERE master_name='Sal Grosso' UNION ALL
    SELECT id, 2.30 FROM products WHERE master_name='Feijão Preto' UNION ALL
    SELECT id, 1.80 FROM products WHERE master_name='Esparguete' UNION ALL
    SELECT id, 1.65 FROM products WHERE master_name='Polpa de Tomate' UNION ALL
    SELECT id, 6.50 FROM products WHERE master_name='Azeite' UNION ALL
    SELECT id, 2.10 FROM products WHERE master_name='Óleo Alimentar' UNION ALL
    SELECT id, 4.20 FROM products WHERE master_name='Maionese' UNION ALL
    SELECT id, 0.28 FROM products WHERE master_name='Ovos Frescos' UNION ALL
    SELECT id, 1.20 FROM products WHERE master_name='Açúcar Branco' UNION ALL
    SELECT id, 2.85 FROM products WHERE master_name='Leite Condensado Cozido' UNION ALL
    SELECT id, 3.95 FROM products WHERE master_name='Nata 35% MG' UNION ALL
    SELECT id, 3.20 FROM products WHERE master_name='Nata 20% MG' UNION ALL
    SELECT id, 18.50 FROM products WHERE master_name='Queijo Ilha Azul' UNION ALL
    SELECT id, 5.40 FROM products WHERE master_name='Queijo Fresco' UNION ALL
    SELECT id, 8.90 FROM products WHERE master_name='Manteiga sem Sal' UNION ALL
    SELECT id, 11.20 FROM products WHERE master_name='Queijo Cheddar' UNION ALL
    SELECT id, 9.80 FROM products WHERE master_name='Mascarpone' UNION ALL
    SELECT id, 7.50 FROM products WHERE master_name='Bacon' UNION ALL
    SELECT id, 8.20 FROM products WHERE master_name='Fiambre Peru' UNION ALL
    SELECT id, 7.80 FROM products WHERE master_name='Fiambre Frango' UNION ALL
    SELECT id, 4.50 FROM products WHERE master_name='Ovos Líquidos' UNION ALL
    SELECT id, 8.50 FROM products WHERE master_name='Mozzarella' UNION ALL
    SELECT id, 9.20 FROM products WHERE master_name='Paio' UNION ALL
    SELECT id, 5.40 FROM products WHERE master_name='Salsichas Cocktail' UNION ALL
    SELECT id, 2.60 FROM products WHERE master_name='Feijão Manteiga' UNION ALL
    SELECT id, 11.80 FROM products WHERE master_name='Filetes Pescada' UNION ALL
    SELECT id, 3.40 FROM products WHERE master_name='Salada Russa' UNION ALL
    SELECT id, 2.80 FROM products WHERE master_name='Ervilhas' UNION ALL
    SELECT id, 19.50 FROM products WHERE master_name='Gorgonzola'
  LOOP
    INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, is_current)
    VALUES (v_aviludo, v_product_id, v_price, v_price, 1, 1, true)
    ON CONFLICT (product_id, supplier_id) DO UPDATE SET price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true;
  END LOOP;

  -- ===== MAKRO =====
  FOR v_product_id, v_price IN
    SELECT id, 12.50::numeric FROM products WHERE master_name='Guacamole' UNION ALL
    SELECT id, 8.90 FROM products WHERE master_name='Chocolate Negro 70%' UNION ALL
    SELECT id, 8.50 FROM products WHERE master_name='Chocolate Branco' UNION ALL
    SELECT id, 16.80 FROM products WHERE master_name='Robalo Filetado 200/300'
  LOOP
    INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, is_current)
    VALUES (v_makro, v_product_id, v_price, v_price, 1, 1, true)
    ON CONFLICT (product_id, supplier_id) DO UPDATE SET price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true;
  END LOOP;
END $$;

SELECT COUNT(*) AS total_precos FROM supplier_prices WHERE is_current = true;

-- ============================
-- 4) PURCHASE ORDERS
-- ============================
DO $$
DECLARE
  v_admin_id UUID;
  v_avoneto UUID;
  v_aviludo UUID;
  v_makro UUID;
  v_po_avoneto UUID;
  v_po_aviludo UUID;
  v_po_makro UUID;
  v_today_str TEXT := to_char(CURRENT_DATE, 'YYYYMMDD');
BEGIN
  SELECT id INTO v_admin_id FROM users u WHERE u.email = 'admin@fourpoint.pt' LIMIT 1;
  IF v_admin_id IS NULL THEN
    SELECT id INTO v_admin_id FROM users u WHERE u.role = 'admin' LIMIT 1;
  END IF;

  SELECT id INTO v_avoneto FROM suppliers WHERE name = 'Avoneto Hortefruti';
  SELECT id INTO v_aviludo FROM suppliers WHERE name = 'Aviludo';
  SELECT id INTO v_makro  FROM suppliers WHERE name = 'Makro';

  INSERT INTO purchase_orders (code, status, user_id, supplier_id, notes, placed_at, total_amount, currency, raw_input)
  VALUES ('PO-AVO-'||v_today_str, 'draft', v_admin_id, v_avoneto,
          'Pedido frescos e frutas 15-06-2026', now(), 0, 'EUR',
          'Avoneto Hortefruti 3 sacas batata agrea, 1 saca cebola branca, 1 saca cebola roxa, 5kg alho, 1 saca batata nova, 2 cx alface frisada, 2 cx alface icebergue, 1 cx uva, 30kg mamão, 50kg melão, 60kg melancia, 50kg ananás, 10kg kiwi, 1cx maçã de cada, 0.500kg coentros e salsa, 1 cx alperce, 1cx pêssego, 2kg tomate cherry, 1cx pepino, 1cx pimentos vermelhos e verdes, 2kg endivias, 1 cx courgette, 1 cx tomate steak, 1 abóbora, 5cx cogumelos paris, 1 saca cenouras, 20kg meloa, 7 und lombardo, 0.500 feijão verde, 1 molho cebolinho, rebentos ervilha e coentros 3 cada, 2 de flores')
  RETURNING id INTO v_po_avoneto;

  INSERT INTO purchase_orders (code, status, user_id, supplier_id, notes, placed_at, total_amount, currency, raw_input)
  VALUES ('PO-AVL-'||v_today_str, 'draft', v_admin_id, v_aviludo,
          'Pedido mercearia e lacticinios 15-06-2026', now(), 0, 'EUR',
          'Aviludo 1 pack arroz agulha, 1 pack creme balsâmico, 2 baldes sal grosso, 1 pack feijão preto, 4kg esparguete, 1pack polpa tomate, 15l azeite, 1 garrafão óleo, 3 baldes maionese, 4cx ovos frescos, 1 pack açúcar branco, 1 pack leite condensado cozido, 1pack nata 35%, 1pack nata 20%, 5 ilha azul, 2 cx queijos fresco, 1 cx manteiga sem sal, 1 emb chedar, 4kg mascaprone, 3 cx bacon, 2cx fiambre, 4cx ovos liquidos, 1 peca fiambre frango, 1 cx mozzarela, 5 kg paio, 2cx salsichas cookteil, 1 pack feijao manteiga, 20kg filetes pescada, 1 cx salada russa, 1cx ervilhas, 1 emb gorgozola')
  RETURNING id INTO v_po_aviludo;

  INSERT INTO purchase_orders (code, status, user_id, supplier_id, notes, placed_at, total_amount, currency, raw_input)
  VALUES ('PO-MAK-'||v_today_str, 'draft', v_admin_id, v_makro,
          'Pedido extras 15-06-2026', now(), 0, 'EUR',
          'Makro 3 und guacamole, 5 kg chocolate negro, 5kg chocolate branco, 15kg robalo filetado 200/300 da alimar')
  RETURNING id INTO v_po_makro;

  -- ===================================================
  -- 5) PURCHASE ORDER ITEMS
  -- ===================================================

  -- AVONETO
  INSERT INTO purchase_order_items (order_id, product_id, supplier_price_id, quantity, unit_price, line_total, raw_line)
  SELECT v_po_avoneto, p.id, sp.id, q.qty, sp.price, q.qty * sp.price, q.raw
  FROM (VALUES
    ('Batata Agrea',       60.0,  '3 sacas batata agrea'),
    ('Cebola Branca',      20.0,  '1 saca cebola branca'),
    ('Cebola Roxa',        20.0,  '1 saca cebola roxa'),
    ('Alho',                5.0,  '5kg alho'),
    ('Batata Nova',        20.0,  '1 saca batata nova'),
    ('Alface Frisada',      2.0,  '2 cx alface frisada'),
    ('Alface Iceberg',      2.0,  '2 cx alface icebergue'),
    ('Uva',                 5.0,  '1 cx uva'),
    ('Mamão Papaia',       30.0,  '30kg mamão'),
    ('Melão',              50.0,  '50kg melão'),
    ('Melancia',           60.0,  '60kg melancia'),
    ('Ananás',             50.0,  '50kg ananás'),
    ('Kiwi',               10.0,  '10kg kiwi'),
    ('Maçã (variedades)',  10.0,  '1cx maçã de cada'),
    ('Coentros',            0.5,  '0.500kg coentros'),
    ('Salsa',               0.5,  '0.500kg salsa'),
    ('Alperce',             5.0,  '1 cx alperce'),
    ('Pêssego',             5.0,  '1cx pêssego'),
    ('Tomate Cherry',       2.0,  '2kg tomate cherry'),
    ('Pepino',              5.0,  '1cx pepino'),
    ('Pimentos Vermelhos',  2.5,  '1cx pimentos vermelhos'),
    ('Pimentos Verdes',     2.5,  '1cx pimentos verdes'),
    ('Endivias',            2.0,  '2kg endivias'),
    ('Courgette',           5.0,  '1 cx courgette'),
    ('Tomate Steak',        5.0,  '1 cx tomate steak'),
    ('Abóbora',             1.0,  '1 abóbora'),
    ('Cogumelos Paris',     5.0,  '5cx cogumelos paris'),
    ('Cenouras',           20.0,  '1 saca cenouras'),
    ('Meloa',              20.0,  '20kg meloa'),
    ('Lombardo',            7.0,  '7 und lombardo'),
    ('Feijão Verde',        0.5,  '0.500 feijão verde'),
    ('Cebolinho',           1.0,  '1 molho cebolinho'),
    ('Rebentos de Ervilha', 3.0,  'rebentos ervilha'),
    ('Rebentos de Coentros',3.0,  'rebentos coentros'),
    ('Flores Comestíveis',  2.0,  '2 de flores')
  ) AS q(name, qty, raw)
  JOIN products p ON p.master_name = q.name
  JOIN supplier_prices sp ON sp.product_id = p.id AND sp.supplier_id = v_avoneto;

  -- AVILUDO
  INSERT INTO purchase_order_items (order_id, product_id, supplier_price_id, quantity, unit_price, line_total, raw_line)
  SELECT v_po_aviludo, p.id, sp.id, q.qty, sp.price, q.qty * sp.price, q.raw
  FROM (VALUES
    ('Arroz Agulha',           5.0,  '1 pack arroz agulha'),
    ('Creme Balsâmico',        0.5,  '1 pack creme balsâmico'),
    ('Sal Grosso',            10.0,  '2 baldes sal grosso'),
    ('Feijão Preto',           1.0,  '1 pack feijão preto'),
    ('Esparguete',             4.0,  '4kg esparguete'),
    ('Polpa de Tomate',        1.0,  '1pack polpa tomate'),
    ('Azeite',                15.0,  '15l azeite'),
    ('Óleo Alimentar',         5.0,  '1 garrafão óleo'),
    ('Maionese',               6.0,  '3 baldes maionese'),
    ('Ovos Frescos',         240.0,  '4cx ovos frescos'),
    ('Açúcar Branco',          1.0,  '1 pack açúcar branco'),
    ('Leite Condensado Cozido',1.0,  '1 pack leite condensado cozido'),
    ('Nata 35% MG',            1.0,  '1pack nata 35%'),
    ('Nata 20% MG',            1.0,  '1pack nata 20%'),
    ('Queijo Ilha Azul',       5.0,  '5 ilha azul'),
    ('Queijo Fresco',          2.0,  '2 cx queijos fresco'),
    ('Manteiga sem Sal',       1.0,  '1 cx manteiga sem sal'),
    ('Queijo Cheddar',         1.0,  '1 emb chedar'),
    ('Mascarpone',             4.0,  '4kg mascaprone'),
    ('Bacon',                  3.0,  '3 cx bacon'),
    ('Fiambre Peru',           2.0,  '2cx fiambre'),
    ('Fiambre Frango',         1.0,  '1 peca fiambre frango'),
    ('Ovos Líquidos',          4.0,  '4cx ovos liquidos'),
    ('Mozzarella',             1.0,  '1 cx mozzarela'),
    ('Paio',                   5.0,  '5 kg paio'),
    ('Salsichas Cocktail',     2.0,  '2cx salsichas cookteil'),
    ('Feijão Manteiga',        1.0,  '1 pack feijao manteiga'),
    ('Filetes Pescada',       20.0,  '20kg filetes pescada'),
    ('Salada Russa',           1.0,  '1 cx salada russa'),
    ('Ervilhas',               1.0,  '1cx ervilhas'),
    ('Gorgonzola',             0.5,  '1 emb gorgozola')
  ) AS q(name, qty, raw)
  JOIN products p ON p.master_name = q.name
  JOIN supplier_prices sp ON sp.product_id = p.id AND sp.supplier_id = v_aviludo;

  -- MAKRO
  INSERT INTO purchase_order_items (order_id, product_id, supplier_price_id, quantity, unit_price, line_total, raw_line)
  SELECT v_po_makro, p.id, sp.id, q.qty, sp.price, q.qty * sp.price, q.raw
  FROM (VALUES
    ('Guacamole',              3.0,  '3 und guacamole'),
    ('Chocolate Negro 70%',    5.0,  '5 kg chocolate negro'),
    ('Chocolate Branco',       5.0,  '5kg chocolate branco'),
    ('Robalo Filetado 200/300',15.0,  '15kg robalo filetado 200/300 da alimar')
  ) AS q(name, qty, raw)
  JOIN products p ON p.master_name = q.name
  JOIN supplier_prices sp ON sp.product_id = p.id AND sp.supplier_id = v_makro;

  UPDATE purchase_orders SET total_amount = (SELECT COALESCE(SUM(line_total),0) FROM purchase_order_items WHERE order_id = v_po_avoneto) WHERE id = v_po_avoneto;
  UPDATE purchase_orders SET total_amount = (SELECT COALESCE(SUM(line_total),0) FROM purchase_order_items WHERE order_id = v_po_aviludo) WHERE id = v_po_aviludo;
  UPDATE purchase_orders SET total_amount = (SELECT COALESCE(SUM(line_total),0) FROM purchase_order_items WHERE order_id = v_po_makro)  WHERE id = v_po_makro;
END $$;

SELECT code, status, total_amount,
       (SELECT name FROM suppliers WHERE id = purchase_orders.supplier_id) AS fornecedor,
       (SELECT COUNT(*) FROM purchase_order_items WHERE order_id = purchase_orders.id) AS items
FROM purchase_orders
ORDER BY code;

SELECT COUNT(*) AS total_items FROM purchase_order_items;

COMMIT;
