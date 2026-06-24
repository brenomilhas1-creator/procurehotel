-- Migration: auto-categorização (2026-06-24)
-- Função que sugere categoria baseada em keywords do nome do produto
-- Categorias existentes no sistema (verificado): Horticolas, Frutas, Ervas Aromaticas, Frutas Secas,
--   Mercearia, Bebidas, Lacticinios, Congelados, Padaria, Charcutaria, Talho, Peixaria

BEGIN;

-- Tabela de keywords → categoria
CREATE TABLE IF NOT EXISTS category_keywords (
  keyword TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  priority INT DEFAULT 0  -- quanto maior, mais forte
);

-- Popular com keywords baseadas nas categorias existentes
INSERT INTO category_keywords (keyword, category, priority) VALUES
  -- Horticolas
  ('alface', 'Horticolas', 10),
  ('tomate', 'Horticolas', 10),
  ('cebola', 'Horticolas', 10),
  ('cenoura', 'Horticolas', 10),
  ('batata', 'Horticolas', 10),
  ('courgette', 'Horticolas', 10),
  ('beringela', 'Horticolas', 10),
  ('pimento', 'Horticolas', 10),
  ('pepino', 'Horticolas', 10),
  ('cogumelo', 'Horticolas', 10),
  ('endivia', 'Horticolas', 10),
  ('lombardo', 'Horticolas', 10),
  ('couves', 'Horticolas', 10),
  ('brocolo', 'Horticolas', 10),
  ('espinafre', 'Horticolas', 10),
  -- Frutas
  ('banana', 'Frutas', 10),
  ('maca', 'Frutas', 10),
  ('maçã', 'Frutas', 10),
  ('laranja', 'Frutas', 10),
  ('limao', 'Frutas', 10),
  ('limão', 'Frutas', 10),
  ('lima', 'Frutas', 10),
  ('pera', 'Frutas', 10),
  ('melao', 'Frutas', 10),
  ('melão', 'Frutas', 10),
  ('melancia', 'Frutas', 10),
  ('meloa', 'Frutas', 10),
  ('mamao', 'Frutas', 10),
  ('mamão', 'Frutas', 10),
  ('abacaxi', 'Frutas', 10),
  ('kiwi', 'Frutas', 10),
  ('manga', 'Frutas', 10),
  ('morango', 'Frutas', 10),
  ('framboesa', 'Frutas', 10),
  ('mirtilo', 'Frutas', 10),
  ('ameixa', 'Frutas', 10),
  ('cereja', 'Frutas', 10),
  ('damasco', 'Frutas', 10),
  ('pessego', 'Frutas', 10),
  ('nectarina', 'Frutas', 10),
  ('uva', 'Frutas', 10),
  -- Ervas Aromaticas
  ('salsa', 'Ervas Aromaticas', 10),
  ('coentro', 'Ervas Aromaticas', 10),
  ('cebolinho', 'Ervas Aromaticas', 10),
  ('hortela', 'Ervas Aromaticas', 10),
  ('hortelã', 'Ervas Aromaticas', 10),
  ('manjericao', 'Ervas Aromaticas', 10),
  ('alecrim', 'Ervas Aromaticas', 10),
  ('tomilho', 'Ervas Aromaticas', 10),
  ('oregaos', 'Ervas Aromaticas', 10),
  -- Frutas Secas
  ('amendoa', 'Frutas Secas', 10),
  ('amêndoa', 'Frutas Secas', 10),
  ('avelã', 'Frutas Secas', 10),
  ('avela', 'Frutas Secas', 10),
  ('noz', 'Frutas Secas', 10),
  ('pinha', 'Frutas Secas', 10),
  ('coco', 'Frutas Secas', 10),
  ('damasco seco', 'Frutas Secas', 10),
  ('passa', 'Frutas Secas', 10),
  -- Mercearia
  ('arroz', 'Mercearia', 10),
  ('massa', 'Mercearia', 10),
  ('esparguete', 'Mercearia', 10),
  ('espaguete', 'Mercearia', 10),
  ('feijao', 'Mercearia', 10),
  ('feijão', 'Mercearia', 10),
  ('lentilha', 'Mercearia', 10),
  ('grao', 'Mercearia', 10),
  ('grão', 'Mercearia', 10),
  ('acucar', 'Mercearia', 10),
  ('açucar', 'Mercearia', 10),
  ('acúç', 'Mercearia', 10),
  ('sal ', 'Mercearia', 8),
  ('azeite', 'Mercearia', 10),
  ('oleo', 'Mercearia', 10),
  ('óleo', 'Mercearia', 10),
  ('vinagre', 'Mercearia', 10),
  ('farinha', 'Mercearia', 10),
  ('cha ', 'Mercearia', 8),
  ('chá', 'Mercearia', 10),
  ('cafe', 'Mercearia', 10),
  ('café', 'Mercearia', 10),
  -- Lacticinios
  ('leite', 'Lacticinios', 10),
  ('queijo', 'Lacticinios', 10),
  ('iogurte', 'Lacticinios', 10),
  ('manteiga', 'Lacticinios', 10),
  ('nata', 'Lacticinios', 10),
  ('requeijao', 'Lacticinios', 10),
  ('requeijão', 'Lacticinios', 10),
  -- Congelados
  ('congelado', 'Congelados', 10),
  ('gelado', 'Congelados', 8),
  ('sorvete', 'Congelados', 10),
  -- Padaria
  ('pao', 'Padaria', 10),
  ('pão', 'Padaria', 10),
  ('broa', 'Padaria', 10),
  ('croissant', 'Padaria', 10),
  ('pastelaria', 'Padaria', 10),
  ('bolo', 'Padaria', 10),
  -- Charcutaria
  ('presunto', 'Charcutaria', 10),
  ('fiambre', 'Charcutaria', 10),
  ('chourico', 'Charcutaria', 10),
  ('chouriço', 'Charcutaria', 10),
  ('salchicha', 'Charcutaria', 10),
  ('salsicha', 'Charcutaria', 10),
  ('mortadela', 'Charcutaria', 10),
  ('paio', 'Charcutaria', 10),
  -- Talho (carne)
  ('vaca', 'Talho', 10),
  ('porco', 'Talho', 10),
  ('frango', 'Talho', 10),
  ('novilho', 'Talho', 10),
  ('vitela', 'Talho', 10),
  ('borrego', 'Talho', 10),
  ('lombo', 'Talho', 10),
  -- Peixaria
  ('bacalhau', 'Peixaria', 10),
  ('atum', 'Peixaria', 10),
  ('salmão', 'Peixaria', 10),
  ('salmao', 'Peixaria', 10),
  ('pescada', 'Peixaria', 10),
  ('robalo', 'Peixaria', 10),
  ('lulas', 'Peixaria', 10),
  ('camarao', 'Peixaria', 10),
  ('camarão', 'Peixaria', 10),
  -- Bebidas
  ('agua', 'Bebidas', 10),
  ('água', 'Bebidas', 10),
  ('refrigerante', 'Bebidas', 10),
  ('coca-cola', 'Bebidas', 10),
  ('sumol', 'Bebidas', 10),
  ('compal', 'Bebidas', 10),
  ('vinho', 'Bebidas', 10),
  ('cerveja', 'Bebidas', 10),
  ('espumante', 'Bebidas', 10)
ON CONFLICT (keyword) DO UPDATE SET category = EXCLUDED.category, priority = EXCLUDED.priority;

-- Função: sugere categoria baseado no nome
CREATE OR REPLACE FUNCTION suggest_category(p_name TEXT)
RETURNS TABLE(suggested_category TEXT, confidence NUMERIC, matched_keyword TEXT) AS $$
DECLARE
  v_name_lower TEXT;
  v_best_category TEXT;
  v_best_priority INT := -1;
  v_best_keyword TEXT;
  v_total_keywords INT;
BEGIN
  v_name_lower := lower(p_name);
  
  FOR v_best_category, v_best_priority, v_best_keyword IN
    SELECT ck.category, ck.priority, ck.keyword
    FROM category_keywords ck
    WHERE v_name_lower LIKE '%' || ck.keyword || '%'
    ORDER BY ck.priority DESC, length(ck.keyword) DESC
    LIMIT 1
  LOOP
    -- Calcular confiança baseada no tamanho do keyword vs nome
    RETURN QUERY SELECT 
      v_best_category,
      LEAST(1.0, length(v_best_keyword)::numeric / GREATEST(length(v_name_lower), 1) + (v_best_priority::numeric / 20.0)),
      v_best_keyword;
    RETURN;
  END LOOP;
  
  -- Nenhum match
  RETURN QUERY SELECT NULL::TEXT, 0::NUMERIC, NULL::TEXT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função para criar produto com auto-categoria
CREATE OR REPLACE FUNCTION create_product_with_category(
  p_master_name TEXT,
  p_brand TEXT DEFAULT NULL,
  p_unit TEXT DEFAULT 'un',
  p_category_override TEXT DEFAULT NULL,
  p_tax_id NUMERIC DEFAULT 23
)
RETURNS TABLE(product_id UUID, master_name TEXT, category TEXT, suggested_category TEXT, confidence NUMERIC) AS $$
DECLARE
  v_id UUID;
  v_suggested TEXT;
  v_conf NUMERIC;
  v_final_category TEXT;
BEGIN
  -- Buscar sugestão
  SELECT sc.suggested_category, sc.confidence INTO v_suggested, v_conf
  FROM suggest_category(p_master_name) sc;
  
  v_final_category := COALESCE(p_category_override, v_suggested, 'Outros');
  
  -- Inserir produto
  INSERT INTO products (master_name, brand, category, unit, is_active, status)
  VALUES (p_master_name, p_brand, v_final_category, p_unit, true, 'active')
  RETURNING id INTO v_id;
  
  RETURN QUERY SELECT v_id, p_master_name, v_final_category, v_suggested, v_conf;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE category_keywords ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ck_all ON category_keywords;
CREATE POLICY ck_all ON category_keywords FOR ALL TO authenticated USING (true) WITH CHECK (true);

COMMIT;
