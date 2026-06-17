-- =====================================================
-- Compra Facil Hoteis — Processamento de 5 Faturas Reais
-- Fornecedores: Sumol+Compal, Makro (3 guias), Avoneto
-- Data das faturas: 11-12 Junho 2026
-- VALOR TOTAL PROCESSADO: 3.473,98€
-- =====================================================
-- REGRA: Apenas preços REAIS extraídos das faturas.
-- Nenhum valor é inventado.
-- =====================================================

BEGIN;

DO $$
DECLARE
  v_sumol UUID;
  v_makro UUID;
  v_avoneto UUID;
  v_pid UUID;
  v_price NUMERIC;
  v_iva NUMERIC;
  v_unit TEXT;
BEGIN
  -- 1) Capturar IDs dos fornecedores
  SELECT id INTO v_sumol   FROM suppliers WHERE name = 'Sumol+Compal';
  SELECT id INTO v_makro   FROM suppliers WHERE name = 'Makro';
  SELECT id INTO v_avoneto FROM suppliers WHERE name = 'Avoneto Hortefruti';

  -- =================================================
  -- 2) PRODUTOS (criar só os que não existem)
  -- =================================================
  INSERT INTO products (master_name, category, unit, is_active)
  SELECT v.master_name, v.category, v.unit::unit_of_measure, v.is_active
  FROM (VALUES
    -- SUMOL+COMPAL (Fatura ZFT2 BD0C/3040525129, 12.06.2026, 495,92€)
    ('Água Serra Estrela 1L PET','Agua','cx', true),
    ('Frize Original 0,75L','Agua','cx', true),
    ('Pepsi Reg 0,30L','Refrigerantes','cx', true),
    ('Pepsi Zero 0,30L','Refrigerantes','cx', true),
    ('Compal Vital Vermelhos 1L','Sumos','cx', true),
    ('Compal Clássico Pêssego 1L','Sumos','cx', true),
    ('Compal Clássico Manga 1L','Sumos','cx', true),
    ('Compal Clássico Ananás 1L','Sumos','cx', true),
    ('Compal Laranja/Algarrobo 1L','Sumos','cx', true),
    ('7UP Reg 1,5L PET','Refrigerantes','cx', true),
    ('Água Serra Estrela 1,5L PET','Agua','cx', true),
    -- MAKRO Guia 1 (9-178546163, 549,31€)
    ('Manteiga Cheff sem sal 1kg','Lacticinios','un', true),
    ('Nata UHT 35% MG 1L Picot','Lacticinios','un', true),
    ('Nata Cul 22% 1L Picot','Lacticinios','un', true),
    ('Ovo Inteiro Líquido 1kg DoVo','Ovos','un', true),
    ('Açaí Guaraná 2,3L Native','Sumos','un', true),
    ('Gelado Baunilha 4,5L','Gelados','un', true),
    ('Gelado Nata 4,5L','Gelados','un', true),
    ('Paio York 500g Limiana','Charcutaria','un', true),
    ('Polvo Cozido Tentáculos 1kg','Peixes','un', true),
    ('Mostarda Dijon 215g Maille','Condimentos','un', true),
    ('Biscoitos Maria D''Ouro 4x200g','Biscoitos','un', true),
    -- AVONETO (Fatura FT1/7979, 11.06.2026, 1.742,62€)
    ('Abacaxi','Frutas','kg', true),
    ('Alecrim 100g','Ervas Aromaticas','un', true),
    ('Alface Frisada Verde','Horticolas','cx', true),
    ('Amoras','Frutas','un', true),
    ('Azeitona Cobrançosa','Conservas','un', true),
    ('Azeitona Preta Laminada','Conservas','un', true),
    ('Banana Delmonte','Frutas','kg', true),
    ('Batata Agrea','Horticolas','kg', true),
    ('Beringela','Horticolas','kg', true),
    ('Cebola 80/110','Horticolas','kg', true),
    ('Cebola Roxa','Horticolas','kg', true),
    ('Cenoura','Horticolas','kg', true),
    ('Coentro','Ervas Aromaticas','un', true),
    ('Cogumelo Eryngi','Horticolas','kg', true),
    ('Cogumelo Branco Caixa','Horticolas','kg', true),
    ('Courgete','Horticolas','kg', true),
    ('Damasco','Frutas','kg', true),
    ('Endivias','Horticolas','un', true),
    ('Espargo Verde','Horticolas','un', true),
    ('Flores Comestíveis','Especialidades','un', true),
    ('Framboesa','Frutas','un', true),
    ('Hortelã','Ervas Aromaticas','un', true),
    ('Kiwi Germinado','Frutas','kg', true),
    ('Laranja Sumo calibre 6','Frutas','kg', true),
    ('Limas','Frutas','kg', true),
    ('Limão','Frutas','kg', true),
    ('Maçã Granny Smith 70/75','Frutas','kg', true),
    ('Mamão 4,5kg','Frutas','kg', true),
    ('Mangericão 100g','Ervas Aromaticas','un', true),
    ('Melancia','Frutas','kg', true),
    ('Melão','Frutas','kg', true),
    ('Meloa Galia Grossa','Frutas','kg', true),
    ('Mirtilo','Frutas','un', true),
    ('Pepino','Horticolas','kg', true),
    ('Pera Williams','Frutas','kg', true),
    ('Pimento Vermelho','Horticolas','kg', true),
    ('Rebentos de Coentro','Rebentos','un', true),
    ('Rebentos de Ervilha','Rebentos','un', true),
    ('Salsa','Ervas Aromaticas','un', true),
    ('Tomate Salada Médio','Horticolas','kg', true),
    ('Tomate Cherry','Horticolas','kg', true),
    ('Tomilho 100g','Ervas Aromaticas','un', true),
    ('Uva Branca','Frutas','kg', true),
    ('Alho Seco','Horticolas','kg', true),
    ('Morango','Frutas','kg', true),
    -- MAKRO Guia 2 (9-178596151, 80,79€)
    ('Ketchup Aquosa 200x10ml Heinz','Condimentos','cx', true),
    ('Espumante Valmarone Branco 75cl','Espumantes','cx', true),
    ('Lambrusco Valmarone Rosé 75cl','Espumantes','cx', true),
    -- MAKRO Guia 3 (9-178587425, 605,34€)
    ('Cerveja Heineken 24x33cl','Cervejas','cx', true),
    ('Cerveja Heineken 24x25cl','Cervejas','cx', true),
    ('Manteiga com sal 8g*100 Mimosa','Lacticinios','cx', true),
    ('Becel 10gr*100','Margarinas','cx', true),
    ('Leite UHT Gordo Açores 1L*6','Lacticinios','cx', true),
    ('Leite UHT Magro Açores 1L*6','Lacticinios','cx', true),
    ('Leite MG 0% Lact 1L*6','Lacticinios','cx', true),
    ('Bebida Amêndoa Vegetal 1L','Bebidas Vegetais','un', true),
    ('Iogurte Natural 5kg','Lacticinios','un', true),
    ('Iogurte Aromas Mimosa 4*120g','Lacticinios','un', true),
    ('Iogurte Líquido Banana 4*151ml Mimosa','Lacticinios','un', true),
    ('Iogurte Líquido Frutos Tropicais 4*151ml Mimosa','Lacticinios','un', true),
    ('Iogurte Líquido Morango 4*151ml Mimosa','Lacticinios','un', true),
    ('Massa Kadaif 500g','Massas','un', true),
    ('Ameixas Secas s/caroço 1kg','Frutas Secas','un', true),
    ('Tâmaras c/caroço 1kg','Frutas Secas','un', true),
    ('Côco Laminado 500g','Frutas Secas','un', true),
    ('Miolo Noz Quartos 1kg','Frutas Secas','un', true),
    ('Sementes Chia 1kg','Frutas Secas','un', true),
    ('Mel Flores Frasco 1kg','Doces','un', true),
    ('Flocos Aveia 1kg Cimarrom','Cereais','un', true),
    ('Cereais Clássico 700g','Cereais','un', true),
    ('Cereais Chocapic 900g Nestlé','Cereais','un', true),
    ('Muesli Fruta Exótica 1kg','Cereais','un', true),
    ('Whisky Jack Daniel''s 70cl','Whisky','un', true),
    ('Gin Tanqueray Ten 70cl','Gin','un', true),
    ('Gin Nordes 70cl','Gin','un', true),
    ('Limoncello Madruzzo 70cl','Licores','un', true),
    ('Amêndoa Amarguinha 70cl','Licores','un', true),
    ('Batida de Côco Xarão 70cl 16º','Licores','un', true),
    ('Moscatel Setúbal Bacalhôa 75cl','Vinhos Fortificados','un', true),
    ('Xarope Rioba Grenadine 70cl','Xaropes','un', true),
    ('Xarope Rioba Côco 70cl','Xaropes','un', true),
    ('Xarope Rioba Morango 1,32kg','Xaropes','un', true)
  ) AS v(master_name, category, unit, is_active)
  WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.master_name = v.master_name);

  -- =================================================
  -- 3) SUPPLIER PRICES REAIS (das faturas)
  -- Estrutura: (produto, preço, IVA%) - todos das faturas
  -- =================================================

  -- === SUMOL+COMPAL ===
  -- Fatura ZFT2 BD0C/3040525129 (12.06.2026, 495,92€)
  FOR v_pid, v_price, v_iva IN
    SELECT id, 12.96::numeric, 13::numeric FROM products WHERE master_name='Água Serra Estrela 1L PET' UNION ALL
    SELECT id, 28.44, 13 FROM products WHERE master_name='Frize Original 0,75L' UNION ALL
    SELECT id, 20.16, 23 FROM products WHERE master_name='Pepsi Reg 0,30L' UNION ALL
    SELECT id, 20.16, 23 FROM products WHERE master_name='Pepsi Zero 0,30L' UNION ALL
    SELECT id, 46.08, 6 FROM products WHERE master_name='Compal Vital Vermelhos 1L' UNION ALL
    SELECT id, 41.76, 6 FROM products WHERE master_name='Compal Clássico Pêssego 1L' UNION ALL
    SELECT id, 41.76, 6 FROM products WHERE master_name='Compal Clássico Manga 1L' UNION ALL
    SELECT id, 46.08, 6 FROM products WHERE master_name='Compal Clássico Ananás 1L' UNION ALL
    SELECT id, 57.36, 6 FROM products WHERE master_name='Compal Laranja/Algarrobo 1L' UNION ALL
    SELECT id, 19.50, 23 FROM products WHERE master_name='7UP Reg 1,5L PET' UNION ALL
    SELECT id, 18.72, 13 FROM products WHERE master_name='Água Serra Estrela 1,5L PET'
  LOOP
    INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, is_current, source, source_ref, notes)
    VALUES (v_sumol, v_pid, v_price, v_price, 1, 1, true, 'invoice', 'ZFT2 BD0C/3040525129', 'Fatura 12-06-2026, IVA ' || v_iva || '%')
    ON CONFLICT (product_id, supplier_id) DO UPDATE
      SET price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true, source = 'invoice', source_ref = EXCLUDED.source_ref, notes = EXCLUDED.notes;
  END LOOP;

  -- === MAKRO GUIA #1 (9-178546163, 549,31€) ===
  FOR v_pid, v_price, v_iva IN
    SELECT id, 8.56::numeric, 6::numeric FROM products WHERE master_name='Manteiga Cheff sem sal 1kg' UNION ALL
    SELECT id, 4.08, 6 FROM products WHERE master_name='Nata UHT 35% MG 1L Picot' UNION ALL
    SELECT id, 2.89, 6 FROM products WHERE master_name='Nata Cul 22% 1L Picot' UNION ALL
    SELECT id, 4.29, 6 FROM products WHERE master_name='Ovo Inteiro Líquido 1kg DoVo' UNION ALL
    SELECT id, 17.97, 23 FROM products WHERE master_name='Açaí Guaraná 2,3L Native' UNION ALL
    SELECT id, 7.20, 23 FROM products WHERE master_name='Gelado Baunilha 4,5L' UNION ALL
    SELECT id, 7.20, 23 FROM products WHERE master_name='Gelado Nata 4,5L' UNION ALL
    SELECT id, 3.70, 23 FROM products WHERE master_name='Paio York 500g Limiana' UNION ALL
    SELECT id, 33.98, 23 FROM products WHERE master_name='Polvo Cozido Tentáculos 1kg' UNION ALL
    SELECT id, 2.85, 23 FROM products WHERE master_name='Mostarda Dijon 215g Maille' UNION ALL
    SELECT id, 1.38, 23 FROM products WHERE master_name='Biscoitos Maria D''Ouro 4x200g'
  LOOP
    INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, is_current, source, source_ref, notes)
    VALUES (v_makro, v_pid, v_price, v_price, 1, 1, true, 'invoice', '9-178546163', 'Guia 11-06-2026, IVA ' || v_iva || '%')
    ON CONFLICT (product_id, supplier_id) DO UPDATE
      SET price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true, source = 'invoice', source_ref = EXCLUDED.source_ref, notes = EXCLUDED.notes;
  END LOOP;

  -- === AVONETO (Fatura FT1/7979, 11.06.2026, 1.742,62€) ===
  FOR v_pid, v_price, v_iva IN
    SELECT id, 1.35::numeric, 6::numeric FROM products WHERE master_name='Abacaxi' UNION ALL
    SELECT id, 2.00, 6 FROM products WHERE master_name='Alecrim 100g' UNION ALL
    SELECT id, 6.00, 6 FROM products WHERE master_name='Alface Frisada Verde' UNION ALL
    SELECT id, 2.20, 6 FROM products WHERE master_name='Amoras' UNION ALL
    SELECT id, 12.50, 23 FROM products WHERE master_name='Azeitona Cobrançosa' UNION ALL
    SELECT id, 6.50, 23 FROM products WHERE master_name='Azeitona Preta Laminada' UNION ALL
    SELECT id, 1.35, 6 FROM products WHERE master_name='Banana Delmonte' UNION ALL
    SELECT id, 0.55, 6 FROM products WHERE master_name='Batata Agrea' UNION ALL
    SELECT id, 1.70, 6 FROM products WHERE master_name='Beringela' UNION ALL
    SELECT id, 0.75, 6 FROM products WHERE master_name='Cebola 80/110' UNION ALL
    SELECT id, 1.00, 6 FROM products WHERE master_name='Cebola Roxa' UNION ALL
    SELECT id, 0.85, 6 FROM products WHERE master_name='Cenoura' UNION ALL
    SELECT id, 3.00, 6 FROM products WHERE master_name='Coentro' UNION ALL
    SELECT id, 9.00, 6 FROM products WHERE master_name='Cogumelo Eryngi' UNION ALL
    SELECT id, 4.00, 6 FROM products WHERE master_name='Cogumelo Branco Caixa' UNION ALL
    SELECT id, 1.20, 6 FROM products WHERE master_name='Courgete' UNION ALL
    SELECT id, 2.40, 6 FROM products WHERE master_name='Damasco' UNION ALL
    SELECT id, 2.50, 6 FROM products WHERE master_name='Endivias' UNION ALL
    SELECT id, 2.70, 6 FROM products WHERE master_name='Espargo Verde' UNION ALL
    SELECT id, 3.75, 6 FROM products WHERE master_name='Flores Comestíveis' UNION ALL
    SELECT id, 2.30, 6 FROM products WHERE master_name='Framboesa' UNION ALL
    SELECT id, 2.00, 6 FROM products WHERE master_name='Hortelã' UNION ALL
    SELECT id, 2.10, 6 FROM products WHERE master_name='Kiwi Germinado' UNION ALL
    SELECT id, 0.95, 6 FROM products WHERE master_name='Laranja Sumo calibre 6' UNION ALL
    SELECT id, 2.20, 6 FROM products WHERE master_name='Limas' UNION ALL
    SELECT id, 1.80, 6 FROM products WHERE master_name='Limão' UNION ALL
    SELECT id, 1.80, 6 FROM products WHERE master_name='Maçã Granny Smith 70/75' UNION ALL
    SELECT id, 3.30, 6 FROM products WHERE master_name='Mamão 4,5kg' UNION ALL
    SELECT id, 2.00, 6 FROM products WHERE master_name='Mangericão 100g' UNION ALL
    SELECT id, 1.30, 6 FROM products WHERE master_name='Melancia' UNION ALL
    SELECT id, 1.50, 6 FROM products WHERE master_name='Melão' UNION ALL
    SELECT id, 2.30, 6 FROM products WHERE master_name='Meloa Galia Grossa' UNION ALL
    SELECT id, 2.00, 6 FROM products WHERE master_name='Mirtilo' UNION ALL
    SELECT id, 1.00, 6 FROM products WHERE master_name='Pepino' UNION ALL
    SELECT id, 1.60, 6 FROM products WHERE master_name='Pera Williams' UNION ALL
    SELECT id, 2.30, 6 FROM products WHERE master_name='Pimento Vermelho' UNION ALL
    SELECT id, 2.85, 6 FROM products WHERE master_name='Rebentos de Coentro' UNION ALL
    SELECT id, 2.85, 6 FROM products WHERE master_name='Rebentos de Ervilha' UNION ALL
    SELECT id, 2.50, 6 FROM products WHERE master_name='Salsa' UNION ALL
    SELECT id, 1.20, 6 FROM products WHERE master_name='Tomate Salada Médio' UNION ALL
    SELECT id, 3.20, 6 FROM products WHERE master_name='Tomate Cherry' UNION ALL
    SELECT id, 2.00, 6 FROM products WHERE master_name='Tomilho 100g' UNION ALL
    SELECT id, 5.00, 6 FROM products WHERE master_name='Uva Branca' UNION ALL
    SELECT id, 3.50, 6 FROM products WHERE master_name='Alho Seco' UNION ALL
    SELECT id, 3.50, 6 FROM products WHERE master_name='Morango'
  LOOP
    INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, is_current, source, source_ref, notes)
    VALUES (v_avoneto, v_pid, v_price, v_price, 1, 1, true, 'invoice', 'FT1/7979', 'Fatura 11-06-2026, IVA ' || v_iva || '%')
    ON CONFLICT (product_id, supplier_id) DO UPDATE
      SET price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true, source = 'invoice', source_ref = EXCLUDED.source_ref, notes = EXCLUDED.notes;
  END LOOP;

  -- === MAKRO GUIA #2 (9-178596151, 80,79€) ===
  FOR v_pid, v_price, v_iva IN
    SELECT id, 10.99::numeric, 23::numeric FROM products WHERE master_name='Ketchup Aquosa 200x10ml Heinz' UNION ALL
    SELECT id, 11.07, 23 FROM products WHERE master_name='Espumante Valmarone Branco 75cl' UNION ALL
    SELECT id, 10.74, 23 FROM products WHERE master_name='Lambrusco Valmarone Rosé 75cl'
  LOOP
    -- Note: preço unitário (preço por garrafa) = preço da cx / 6
    INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, is_current, source, source_ref, notes)
    VALUES (v_makro, v_pid, v_price, v_price, 1, 1, true, 'invoice', '9-178596151', 'Guia 11-06-2026, IVA ' || v_iva || '%, preço por garrafa')
    ON CONFLICT (product_id, supplier_id) DO UPDATE
      SET price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true, source = 'invoice', source_ref = EXCLUDED.source_ref, notes = EXCLUDED.notes;
  END LOOP;

  -- === MAKRO GUIA #3 (9-178587425, 605,34€) ===
  FOR v_pid, v_price, v_iva IN
    SELECT id, 20.43::numeric, 23::numeric FROM products WHERE master_name='Cerveja Heineken 24x33cl' UNION ALL
    SELECT id, 13.71, 23 FROM products WHERE master_name='Cerveja Heineken 24x25cl' UNION ALL
    SELECT id, 7.66, 6 FROM products WHERE master_name='Manteiga com sal 8g*100 Mimosa' UNION ALL
    SELECT id, 7.38, 6 FROM products WHERE master_name='Becel 10gr*100' UNION ALL
    SELECT id, 5.24, 6 FROM products WHERE master_name='Leite UHT Gordo Açores 1L*6' UNION ALL
    SELECT id, 4.35, 6 FROM products WHERE master_name='Leite UHT Magro Açores 1L*6' UNION ALL
    SELECT id, 1.13, 6 FROM products WHERE master_name='Leite MG 0% Lact 1L*6' UNION ALL
    SELECT id, 1.20, 6 FROM products WHERE master_name='Bebida Amêndoa Vegetal 1L' UNION ALL
    SELECT id, 11.94, 6 FROM products WHERE master_name='Iogurte Natural 5kg' UNION ALL
    SELECT id, 1.79, 6 FROM products WHERE master_name='Iogurte Aromas Mimosa 4*120g' UNION ALL
    SELECT id, 1.58, 6 FROM products WHERE master_name='Iogurte Líquido Banana 4*151ml Mimosa' UNION ALL
    SELECT id, 1.58, 6 FROM products WHERE master_name='Iogurte Líquido Frutos Tropicais 4*151ml Mimosa' UNION ALL
    SELECT id, 1.58, 6 FROM products WHERE master_name='Iogurte Líquido Morango 4*151ml Mimosa' UNION ALL
    SELECT id, 4.54, 23 FROM products WHERE master_name='Massa Kadaif 500g' UNION ALL
    SELECT id, 7.13, 6 FROM products WHERE master_name='Ameixas Secas s/caroço 1kg' UNION ALL
    SELECT id, 4.38, 6 FROM products WHERE master_name='Tâmaras c/caroço 1kg' UNION ALL
    SELECT id, 5.81, 23 FROM products WHERE master_name='Côco Laminado 500g' UNION ALL
    SELECT id, 10.33, 6 FROM products WHERE master_name='Miolo Noz Quartos 1kg' UNION ALL
    SELECT id, 6.52, 6 FROM products WHERE master_name='Sementes Chia 1kg' UNION ALL
    SELECT id, 4.52, 6 FROM products WHERE master_name='Mel Flores Frasco 1kg' UNION ALL
    SELECT id, 1.75, 13 FROM products WHERE master_name='Flocos Aveia 1kg Cimarrom' UNION ALL
    SELECT id, 4.55, 23 FROM products WHERE master_name='Cereais Clássico 700g' UNION ALL
    SELECT id, 4.85, 23 FROM products WHERE master_name='Cereais Chocapic 900g Nestlé' UNION ALL
    SELECT id, 4.60, 23 FROM products WHERE master_name='Muesli Fruta Exótica 1kg' UNION ALL
    SELECT id, 19.46, 23 FROM products WHERE master_name='Whisky Jack Daniel''s 70cl' UNION ALL
    SELECT id, 29.67, 23 FROM products WHERE master_name='Gin Tanqueray Ten 70cl' UNION ALL
    SELECT id, 25.75, 23 FROM products WHERE master_name='Gin Nordes 70cl' UNION ALL
    SELECT id, 7.20, 23 FROM products WHERE master_name='Limoncello Madruzzo 70cl' UNION ALL
    SELECT id, 7.88, 23 FROM products WHERE master_name='Amêndoa Amarguinha 70cl' UNION ALL
    SELECT id, 5.82, 23 FROM products WHERE master_name='Batida de Côco Xarão 70cl 16º' UNION ALL
    SELECT id, 4.93, 23 FROM products WHERE master_name='Moscatel Setúbal Bacalhôa 75cl' UNION ALL
    SELECT id, 4.35, 23 FROM products WHERE master_name='Xarope Rioba Grenadine 70cl' UNION ALL
    SELECT id, 4.35, 23 FROM products WHERE master_name='Xarope Rioba Côco 70cl' UNION ALL
    SELECT id, 9.35, 23 FROM products WHERE master_name='Xarope Rioba Morango 1,32kg'
  LOOP
    INSERT INTO supplier_prices (supplier_id, product_id, price, unit_price, package_qty, min_order_qty, is_current, source, source_ref, notes)
    VALUES (v_makro, v_pid, v_price, v_price, 1, 1, true, 'invoice', '9-178587425', 'Guia 11-06-2026, IVA ' || v_iva || '%')
    ON CONFLICT (product_id, supplier_id) DO UPDATE
      SET price = EXCLUDED.price, unit_price = EXCLUDED.unit_price, is_current = true, source = 'invoice', source_ref = EXCLUDED.source_ref, notes = EXCLUDED.notes;
  END LOOP;

  -- =================================================
  -- 4) ALIASES (para o parser encontrar pelos termos comuns)
  -- =================================================
  INSERT INTO product_aliases (product_id, alias, hit_count)
  SELECT p.id, v.alias, 1
  FROM (VALUES
    ('Água Serra Estrela 1L PET', 'agua'),
    ('Água Serra Estrela 1L PET', 'agua 1l'),
    ('Água Serra Estrela 1,5L PET', 'agua 1.5'),
    ('Água Serra Estrela 1,5L PET', 'agua grande'),
    ('Frize Original 0,75L', 'frize'),
    ('Pepsi Reg 0,30L', 'pepsi'),
    ('Pepsi Zero 0,30L', 'pepsi zero'),
    ('7UP Reg 1,5L PET', '7up'),
    ('Compal Vital Vermelhos 1L', 'compal'),
    ('Compal Clássico Pêssego 1L', 'compal pessego'),
    ('Compal Clássico Manga 1L', 'compal manga'),
    ('Compal Clássico Ananás 1L', 'compal ananas'),
    ('Compal Laranja/Algarrobo 1L', 'compal laranja'),
    ('Manteiga Cheff sem sal 1kg', 'manteiga'),
    ('Nata UHT 35% MG 1L Picot', 'nata'),
    ('Nata UHT 35% MG 1L Picot', 'nata 35'),
    ('Nata Cul 22% 1L Picot', 'nata 22'),
    ('Ovo Inteiro Líquido 1kg DoVo', 'ovo liquido'),
    ('Açaí Guaraná 2,3L Native', 'acai'),
    ('Paio York 500g Limiana', 'paio'),
    ('Polvo Cozido Tentáculos 1kg', 'polvo'),
    ('Mostarda Dijon 215g Maille', 'mostarda'),
    ('Batata Agrea', 'batata'),
    ('Cebola 80/110', 'cebola'),
    ('Cebola Roxa', 'cebola roxa'),
    ('Cenoura', 'cenoura'),
    ('Tomate Salada Médio', 'tomate'),
    ('Tomate Cherry', 'tomate cherry'),
    ('Cogumelo Branco Caixa', 'cogumelo'),
    ('Banana Delmonte', 'banana'),
    ('Maçã Granny Smith 70/75', 'maca'),
    ('Limão', 'limao'),
    ('Laranja Sumo calibre 6', 'laranja'),
    ('Leite UHT Gordo Açores 1L*6', 'leite'),
    ('Leite UHT Magro Açores 1L*6', 'leite magro'),
    ('Iogurte Natural 5kg', 'iogurte'),
    ('Cerveja Heineken 24x33cl', 'heineken'),
    ('Whisky Jack Daniel''s 70cl', 'jack daniels'),
    ('Whisky Jack Daniel''s 70cl', 'jack'),
    ('Gin Tanqueray Ten 70cl', 'tanqueray'),
    ('Gin Nordes 70cl', 'nordes')
  ) AS v(master_name, alias)
  JOIN products p ON p.master_name = v.master_name
  WHERE NOT EXISTS (
    SELECT 1 FROM product_aliases pa
    WHERE pa.product_id = p.id AND LOWER(pa.alias) = LOWER(v.alias)
  );
END $$;

-- =================================================
-- 5) Verificação final
-- =================================================
SELECT
  s.name AS fornecedor,
  COUNT(sp.id) AS precos_reais,
  ROUND(SUM(sp.price)::numeric, 2) AS valor_catalogo
FROM suppliers s
LEFT JOIN supplier_prices sp ON sp.supplier_id = s.id AND sp.source = 'invoice' AND sp.is_current = true
WHERE s.name IN ('Sumol+Compal', 'Makro', 'Avoneto Hortefruti')
GROUP BY s.name
ORDER BY s.name;

SELECT 'TOTAL produtos' AS label, COUNT(*) AS n FROM products WHERE is_active = true
UNION ALL SELECT 'TOTAL preços reais (invoice)', COUNT(*) FROM supplier_prices WHERE source = 'invoice' AND is_current = true
UNION ALL SELECT 'TOTAL preços (todos)', COUNT(*) FROM supplier_prices WHERE is_current = true
UNION ALL SELECT 'TOTAL aliases', COUNT(*) FROM product_aliases;

COMMIT;
