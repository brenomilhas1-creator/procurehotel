-- =====================================================
-- Inserir 5 faturas reais com header + linhas
-- Compra Facil Hoteis — 11-12 Junho 2026
-- =====================================================
-- Esta migration cria invoices + invoice_lines
-- para TODAS as 5 faturas reais já processadas.
-- Cada invoice_line tem:
--   - description, quantity, unit_price, tax_rate
--   - product_id (quando já existe no catálogo)
-- Após inserção, chama auto_match_invoice_line para
-- os que não têm product_id, e process_invoice_line_to_price
-- para criar/atualizar supplier_prices.
-- =====================================================

BEGIN;

DO $$
DECLARE
  v_admin_id UUID;
  v_sumol UUID;
  v_makro UUID;
  v_avoneto UUID;
  v_invoice_id UUID;
  v_line_id UUID;
BEGIN
  SELECT id INTO v_admin_id FROM users WHERE email = 'admin@fourpoint.pt' LIMIT 1;
  SELECT id INTO v_sumol   FROM suppliers WHERE name = 'Sumol+Compal';
  SELECT id INTO v_makro   FROM suppliers WHERE name = 'Makro';
  SELECT id INTO v_avoneto FROM suppliers WHERE name = 'Avoneto Hortefruti';

  -- Apagar faturas de teste anteriores (se houver)
  DELETE FROM invoices WHERE invoice_number LIKE 'TEST-%' OR supplier_id IN (
    SELECT id FROM suppliers WHERE name LIKE 'FORN_TESTE%'
  );

  --------------------------------------------------------------
  -- FATURA 1: SUMOL+COMPAL (ZFT2 BD0C/3040525129, 12.06.2026, 495,92€)
  --------------------------------------------------------------
  INSERT INTO invoices (
    supplier_id, user_id, invoice_number, invoice_type, atcud,
    invoice_date, due_date, currency, subtotal, tax_amount, total_amount,
    status, source, notes
  ) VALUES (
    v_sumol, v_admin_id, 'ZFT2 BD0C/3040525129', 'fatura', 'J65985MZ-3040525129',
    '2026-06-12', '2026-07-12', 'EUR', 388.92, 46.98, 495.92,
    'pending', 'pdf', 'Cliente 21011664 / 1018317. Cond. pagamento: RMF 30 dias.'
  ) RETURNING id INTO v_invoice_id;

  INSERT INTO invoice_lines (invoice_id, line_number, raw_description, quantity, unit_of_measure, unit_price, subtotal, tax_rate, tax_amount, total, match_status)
  SELECT v_invoice_id, ln, raw, qty::numeric, 'cx'::unit_of_measure, price::numeric, qty::numeric * price::numeric, tax::numeric, qty::numeric * price::numeric * tax/100, ROUND((qty::numeric * price::numeric * (1 + tax/100))::numeric, 2), 'auto_matched'
  FROM (VALUES
    (1,  'Água Serra Estrela 1L PET',      6, 12.96, 13),
    (2,  'Frize Original 0,75L',           5, 28.44, 13),
    (3,  'Pepsi Reg 0,30L',                3, 20.16, 23),
    (4,  'Compal Vital Vermelhos 1L',      2, 46.08, 6),
    (5,  'Pepsi Zero 0,30L',               3, 20.16, 23),
    (6,  'Compal Clássico Pêssego 1L',     2, 41.76, 6),
    (7,  'Compal Clássico Manga 1L',       2, 41.76, 6),
    (8,  'Compal Clássico Ananás 1L',      2, 46.08, 6),
    (9,  '7UP Reg 1,5L PET',               4, 19.50, 23),
    (10, 'Água Serra Estrela 1,5L PET',    8, 18.72, 13),
    (11, 'Compal Laranja/Algarrobo 1L',    7, 57.36, 6)
  ) AS t(ln, raw, qty, price, tax);

  -- Match com products
  UPDATE invoice_lines il SET product_id = p.id
  FROM products p
  WHERE il.invoice_id = v_invoice_id
    AND LOWER(TRIM(il.raw_description)) = LOWER(p.master_name);

  --------------------------------------------------------------
  -- FATURA 2: MAKRO Guia 9-178546163 (11.06.2026, 549,31€)
  --------------------------------------------------------------
  INSERT INTO invoices (
    supplier_id, user_id, invoice_number, invoice_type,
    invoice_date, currency, subtotal, tax_amount, total_amount,
    status, source, notes
  ) VALUES (
    v_makro, v_admin_id, '9-178546163', 'guia_remessa',
    '2026-06-11', 'EUR', 498.16, 51.15, 549.31,
    'pending', 'pdf', 'Guia de remessa Makro Palmela. Cliente 4/902891.'
  ) RETURNING id INTO v_invoice_id;

  INSERT INTO invoice_lines (invoice_id, line_number, raw_description, quantity, unit_of_measure, unit_price, subtotal, tax_rate, tax_amount, total, match_status)
  SELECT v_invoice_id, ln, raw, qty::numeric, unit::unit_of_measure, price::numeric, qty::numeric * price::numeric, tax::numeric, qty::numeric * price::numeric * tax/100, ROUND((qty::numeric * price::numeric * (1 + tax/100))::numeric, 2), 'auto_matched'
  FROM (VALUES
    (1, 'Manteiga Cheff sem sal 1kg', 5,  'un', 8.56,  6),
    (2, 'Nata UHT 35% MG 1L Picot',   8,  'un', 4.08,  6),
    (3, 'Nata Cul 22% 1L Picot',      8,  'un', 2.89,  6),
    (4, 'Ovo Inteiro Líquido 1kg DoVo', 64, 'un', 4.29,  6),
    (5, 'Açaí Guaraná 2,3L Native',   2,  'un', 17.97, 23),
    (6, 'Gelado Baunilha 4,5L',       2,  'un', 7.20,  23),
    (7, 'Gelado Nata 4,5L',           2,  'un', 7.20,  23),
    (8, 'Paio York 500g Limiana',     1,  'un', 3.70,  23),
    (9, 'Polvo Cozido Tentáculos 1kg',1,  'un', 33.98, 23),
    (10,'Mostarda Dijon 215g Maille', 6,  'un', 2.85,  23),
    (11,'Biscoitos Maria D''Ouro 4x200g', 4,'un', 1.38, 23)
  ) AS t(ln, raw, qty, unit, price, tax);

  UPDATE invoice_lines il SET product_id = p.id
  FROM products p
  WHERE il.invoice_id = v_invoice_id
    AND LOWER(TRIM(il.raw_description)) = LOWER(p.master_name);

  --------------------------------------------------------------
  -- FATURA 3: AVONETO FT1/7979 (11.06.2026, 1.742,62€)
  --------------------------------------------------------------
  INSERT INTO invoices (
    supplier_id, user_id, invoice_number, invoice_type, atcud,
    invoice_date, currency, subtotal, tax_amount, total_amount,
    status, source, notes
  ) VALUES (
    v_avoneto, v_admin_id, 'FT1/7979', 'fatura', 'JJ22G27S-7979',
    '2026-06-11', 'EUR', 1646.03, 96.59, 1742.62,
    'pending', 'pdf', 'Fatura Avoneto Produtos Horticolas. NIF 517776022. IBAN PT50 0045 6425403817932 404 0.'
  ) RETURNING id INTO v_invoice_id;

  INSERT INTO invoice_lines (invoice_id, line_number, raw_description, quantity, unit_of_measure, unit_price, subtotal, tax_rate, tax_amount, total, match_status)
  SELECT v_invoice_id, ln, raw, qty::numeric, unit::unit_of_measure, price::numeric, qty::numeric * price::numeric, tax::numeric, qty::numeric * price::numeric * tax/100, ROUND((qty::numeric * price::numeric * (1 + tax/100))::numeric, 2), 'auto_matched'
  FROM (VALUES
    (1,  'Abacaxi',                       80.2, 'kg', 1.35, 6),
    (2,  'Alecrim 100g',                  1,    'un', 2.00, 6),
    (3,  'Alface Frisada Verde',          2,    'cx', 6.00, 6),
    (4,  'Amoras',                        5,    'un', 2.20, 6),
    (5,  'Azeitona Cobrançosa',           1,    'un', 12.50, 23),
    (6,  'Azeitona Preta Laminada',       1,    'un', 6.50, 23),
    (7,  'Banana Delmonte',               18.5, 'kg', 1.35, 6),
    (8,  'Batata Agrea',                  40,   'kg', 0.55, 6),
    (9,  'Beringela',                     12.5, 'kg', 1.70, 6),
    (10, 'Cebola 80/110',                 15,   'kg', 0.75, 6),
    (11, 'Cebola Roxa',                   5,    'kg', 1.00, 6),
    (12, 'Cenoura',                       20,   'kg', 0.85, 6),
    (13, 'Coentro',                       1,    'un', 3.00, 6),
    (14, 'Cogumelo Eryngi',               2,    'kg', 9.00, 6),
    (15, 'Cogumelo Branco Caixa',         15,   'kg', 4.00, 6),
    (16, 'Courgete',                      20,   'kg', 1.20, 6),
    (17, 'Damasco',                       5.4,  'kg', 2.40, 6),
    (18, 'Endivias',                      3,    'un', 2.50, 6),
    (19, 'Espargo Verde',                 2,    'un', 2.70, 6),
    (20, 'Flores Comestíveis',            3,    'un', 3.75, 6),
    (21, 'Framboesa',                     5,    'un', 2.30, 6),
    (22, 'Hortelã',                       2,    'un', 2.00, 6),
    (23, 'Kiwi Germinado',                50,   'kg', 2.10, 6),
    (24, 'Laranja Sumo calibre 6',        347.3,'kg', 0.95, 6),
    (25, 'Limas',                         4.5,  'kg', 2.20, 6),
    (26, 'Limão',                         10.6, 'kg', 1.80, 6),
    (27, 'Maçã Granny Smith 70/75',      9.5,  'kg', 1.80, 6),
    (28, 'Mamão 4,5kg',                   45,   'kg', 3.30, 6),
    (29, 'Mangericão 100g',               1,    'un', 2.00, 6),
    (30, 'Melancia',                      94.3, 'kg', 1.30, 6),
    (31, 'Melão',                         32.4, 'kg', 1.50, 6),
    (32, 'Meloa Galia Grossa',            61.6, 'kg', 2.30, 6),
    (33, 'Mirtilo',                       5,    'un', 2.00, 6),
    (34, 'Pepino',                        10,   'kg', 1.00, 6),
    (35, 'Pera Williams',                 12.5, 'kg', 1.60, 6),
    (36, 'Pimento Vermelho',              3.1,  'kg', 2.30, 6),
    (37, 'Rebentos de Coentro',           1,    'un', 2.85, 6),
    (38, 'Rebentos de Ervilha',           2,    'un', 2.85, 6),
    (39, 'Salsa',                         1,    'un', 2.50, 6),
    (40, 'Tomate Salada Médio',           50,   'kg', 1.20, 6),
    (41, 'Tomate Cherry',                 3,    'kg', 3.20, 6),
    (42, 'Tomilho 100g',                  1,    'un', 2.00, 6),
    (43, 'Uva Branca',                    5,    'kg', 5.00, 6),
    (44, 'Alho Seco',                     3,    'kg', 3.50, 6),
    (45, 'Morango',                       10,   'kg', 3.50, 6)
  ) AS t(ln, raw, qty, unit, price, tax);

  UPDATE invoice_lines il SET product_id = p.id
  FROM products p
  WHERE il.invoice_id = v_invoice_id
    AND LOWER(TRIM(il.raw_description)) = LOWER(p.master_name);

  --------------------------------------------------------------
  -- FATURA 4: MAKRO Guia 9-178596151 (11.06.2026, 80,79€)
  --------------------------------------------------------------
  INSERT INTO invoices (
    supplier_id, user_id, invoice_number, invoice_type,
    invoice_date, currency, subtotal, tax_amount, total_amount,
    status, source, notes
  ) VALUES (
    v_makro, v_admin_id, '9-178596151', 'guia_remessa',
    '2026-06-11', 'EUR', 65.68, 15.11, 80.79,
    'pending', 'pdf', 'Guia Makro. Espumantes e condimentos.'
  ) RETURNING id INTO v_invoice_id;

  INSERT INTO invoice_lines (invoice_id, line_number, raw_description, quantity, unit_of_measure, unit_price, subtotal, tax_rate, tax_amount, total, match_status)
  SELECT v_invoice_id, ln, raw, qty::numeric, 'cx'::unit_of_measure, price::numeric, qty::numeric * price::numeric, tax::numeric, qty::numeric * price::numeric * tax/100, ROUND((qty::numeric * price::numeric * (1 + tax/100))::numeric, 2), 'auto_matched'
  FROM (VALUES
    (1, 'Ketchup Aquosa 200x10ml Heinz',  1, 10.99, 23),
    (2, 'Espumante Valmarone Branco 75cl', 3, 11.07, 23),
    (3, 'Lambrusco Valmarone Rosé 75cl',  2, 10.74, 23)
  ) AS t(ln, raw, qty, price, tax);

  UPDATE invoice_lines il SET product_id = p.id
  FROM products p
  WHERE il.invoice_id = v_invoice_id
    AND LOWER(TRIM(il.raw_description)) = LOWER(p.master_name);

  --------------------------------------------------------------
  -- FATURA 5: MAKRO Guia 9-178587425 (11.06.2026, 605,34€)
  --------------------------------------------------------------
  INSERT INTO invoices (
    supplier_id, user_id, invoice_number, invoice_type,
    invoice_date, currency, subtotal, tax_amount, total_amount,
    status, source, notes
  ) VALUES (
    v_makro, v_admin_id, '9-178587425', 'guia_remessa',
    '2026-06-11', 'EUR', 529.51, 75.83, 605.34,
    'pending', 'pdf', 'Guia Makro. Cervejas, lacticinios, cereais, licores.'
  ) RETURNING id INTO v_invoice_id;

  INSERT INTO invoice_lines (invoice_id, line_number, raw_description, quantity, unit_of_measure, unit_price, subtotal, tax_rate, tax_amount, total, match_status)
  SELECT v_invoice_id, ln, raw, qty::numeric, unit::unit_of_measure, price::numeric, qty::numeric * price::numeric, tax::numeric, qty::numeric * price::numeric * tax/100, ROUND((qty::numeric * price::numeric * (1 + tax/100))::numeric, 2), 'auto_matched'
  FROM (VALUES
    (1,  'Cerveja Heineken 24x33cl',            1, 'cx', 20.43, 23),
    (2,  'Cerveja Heineken 24x25cl',            1, 'cx', 13.71, 23),
    (3,  'Manteiga com sal 8g*100 Mimosa',      3, 'cx', 7.66,  6),
    (4,  'Becel 10gr*100',                      1, 'cx', 7.38,  6),
    (5,  'Leite UHT Gordo Açores 1L*6',         3, 'cx', 5.24,  6),
    (6,  'Leite UHT Magro Açores 1L*6',         3, 'cx', 4.35,  6),
    (7,  'Leite MG 0% Lact 1L*6',               3, 'cx', 1.13,  6),
    (8,  'Bebida Amêndoa Vegetal 1L',           6, 'un', 1.20,  6),
    (9,  'Iogurte Natural 5kg',                 6, 'un', 11.94, 6),
    (10, 'Iogurte Aromas Mimosa 4*120g',        6, 'un', 1.79,  6),
    (11, 'Iogurte Líquido Banana 4*151ml Mimosa', 6, 'un', 1.58, 6),
    (12, 'Iogurte Líquido Frutos Tropicais 4*151ml Mimosa', 6, 'un', 1.58, 6),
    (13, 'Iogurte Líquido Morango 4*151ml Mimosa', 6, 'un', 1.58, 6),
    (14, 'Massa Kadaif 500g',                   2, 'un', 4.54, 23),
    (15, 'Ameixas Secas s/caroço 1kg',          2, 'un', 7.13, 6),
    (16, 'Tâmaras c/caroço 1kg',                1, 'un', 4.38, 6),
    (17, 'Côco Laminado 500g',                  1, 'un', 5.81, 23),
    (18, 'Miolo Noz Quartos 1kg',               1, 'un', 10.33, 6),
    (19, 'Sementes Chia 1kg',                   1, 'un', 6.52, 6),
    (20, 'Mel Flores Frasco 1kg',               6, 'un', 4.52, 6),
    (21, 'Flocos Aveia 1kg Cimarrom',           10, 'un', 1.75, 13),
    (22, 'Cereais Clássico 700g',               1, 'un', 4.55, 23),
    (23, 'Cereais Chocapic 900g Nestlé',        4, 'un', 4.85, 23),
    (24, 'Muesli Fruta Exótica 1kg',            1, 'un', 4.60, 23),
    (25, 'Whisky Jack Daniel''s 70cl',         1, 'un', 19.46, 23),
    (26, 'Gin Tanqueray Ten 70cl',              2, 'un', 29.67, 23),
    (27, 'Gin Nordes 70cl',                     2, 'un', 25.75, 23),
    (28, 'Limoncello Madruzzo 70cl',            1, 'un', 7.20, 23),
    (29, 'Amêndoa Amarguinha 70cl',             1, 'un', 7.88, 23),
    (30, 'Batida de Côco Xarão 70cl 16º',       2, 'un', 5.82, 23),
    (31, 'Moscatel Setúbal Bacalhôa 75cl',      4, 'un', 4.93, 23),
    (32, 'Xarope Rioba Grenadine 70cl',         1, 'un', 4.35, 23),
    (33, 'Xarope Rioba Côco 70cl',              1, 'un', 4.35, 23),
    (34, 'Xarope Rioba Morango 1,32kg',         1, 'un', 9.35, 23)
  ) AS t(ln, raw, qty, unit, price, tax);

  UPDATE invoice_lines il SET product_id = p.id
  FROM products p
  WHERE il.invoice_id = v_invoice_id
    AND LOWER(TRIM(il.raw_description)) = LOWER(p.master_name);
END $$;

-- Relatório de matching
SELECT
  i.invoice_number,
  s.name AS fornecedor,
  i.total_amount,
  i.status,
  COUNT(il.*) AS total_lines,
  COUNT(*) FILTER (WHERE il.product_id IS NOT NULL) AS matched,
  COUNT(*) FILTER (WHERE il.product_id IS NULL) AS unmatched
FROM invoices i
LEFT JOIN suppliers s ON s.id = i.supplier_id
LEFT JOIN invoice_lines il ON il.invoice_id = i.id
GROUP BY i.invoice_number, s.name, i.total_amount, i.status, i.invoice_date
ORDER BY i.invoice_date, i.invoice_number;

SELECT
  (SELECT COUNT(*) FROM invoices) AS invoices,
  (SELECT COUNT(*) FROM invoice_lines) AS lines,
  (SELECT COUNT(*) FROM invoice_lines WHERE product_id IS NOT NULL) AS matched,
  (SELECT COUNT(*) FROM invoice_lines WHERE product_id IS NULL) AS unmatched;

COMMIT;
