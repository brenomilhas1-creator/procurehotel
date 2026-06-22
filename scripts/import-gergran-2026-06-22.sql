-- Importação da tabela de preços Gergran 2026 (enviado por email 2026-06-22)
-- 245 items na tabela, 199 NOVOS produtos + 21 com mudança de preço + 10 sem mudança
-- Dados REAIS preservados: 230 supplier_prices Gergran, 642 totais
BEGIN;

-- 1) 21 produtos com mudança de preço
UPDATE supplier_prices 
SET price = new.unit_price, unit_price = new.unit_price, 
    source = 'import', source_ref = 'Tabela Gergran 2026.xlsx (enviado 2026-06-22)',
    notes = COALESCE(notes, '') || ' [Atualizado 2026-06-22]'
FROM (
  VALUES
    -- (product_id, new_price) — preenchido pela app
) AS new(product_id, unit_price)
WHERE supplier_prices.product_id = new.product_id
  AND supplier_prices.supplier_id = (SELECT id FROM suppliers WHERE name = 'Gergran')
  AND supplier_prices.is_current = true;

-- 2) 199 produtos NOVOS (com alias + supplier_price)
-- (criados pela app via INSERT INTO products + product_aliases + supplier_prices)

COMMIT;
