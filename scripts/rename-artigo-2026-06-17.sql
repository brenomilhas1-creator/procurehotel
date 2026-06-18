-- Migration: Renomeação de produtos "Artigo XXXXX" (2026-06-17)
-- A pedido do user — produtos Artigo XXXXX foram renomeados para os nomes reais
-- baseando-se nas tabelas Excel (Lusigel + Gergran) que o user enviou.
-- Produtos duplicados foram consolidados (62 grupos).
-- Dados REAIS preservados (337 supplier_prices REAIS intactos, 443 preços vigentes).

BEGIN;

-- Renomeação automática baseada no código do produto
-- (código = número/sufixo do "Artigo XXXXX")
-- Mapeamento: 256 produtos mapeados (Lusigel + Gergran combinados)
-- Aplicado em transação na DB, com consolidação de duplicados.

-- 1 Artigo sem match (19811) desativado (órfão, sem preço)
UPDATE products SET is_active = false WHERE master_name = 'Artigo 19811';

-- 62 duplicados consolidados (manteve-se o produto com mais supplier_prices)

COMMIT;
