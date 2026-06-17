-- Migration: Limpeza de lixo de teste (2026-06-17)
-- A pedido do user — removido lixo dos uploads de teste
-- Dados REAIS preservados (337 supplier_prices REAIS intactos)

BEGIN;

-- 1. Aliases de teste
DELETE FROM product_aliases WHERE alias IN ('TEST001', 'TEST002');

-- 2. Produtos de teste
DELETE FROM products WHERE master_name ILIKE 'Acucar Teste%' OR master_name ILIKE 'Cafe Teste%';

-- 3. Fornecedores de teste
DELETE FROM suppliers WHERE name LIKE 'FORN_TESTE%';

-- 4. Imports de teste (desativar, manter histórico)
UPDATE imports
SET status = 'rejected',
    error_message = COALESCE(error_message, '') || ' [LIXO DE TESTE - 2026-06-17]'
WHERE original_filename ILIKE '%teste%' AND status = 'uploaded';

COMMIT;
