-- Import: Fatura Avoneto Hortefruti FT1/8112 (2026-06-22)
-- Total: €1.129,57 | 34 lines | 2 páginas
-- Source: PDF enviado pelo user em 2026-06-23
-- Parsed via: pdftotext + parser custom multi-estratégia

BEGIN;

-- 6 produtos novos criados (não existiam na DB):
-- Ameixa Preta, Cebolinho 100g, Cogumelo Pleurotos Caixa, 
-- Maçã Gala 70/75, Nectarina 70/75, Caixa Fruta (vasilhame)

-- (Produtos já foram criados via POST; este script serve como referência)

-- A fatura já foi criada: invoice_id = 'abb16ead-3d33-4edc-ad70-f9a1d6c521e0'
-- As 34 invoice_lines já foram inseridas
-- Os 34 supplier_prices (Avoneto, source='invoice') já foram criados
-- O trigger de histórico (trg_log_supplier_price_change) foi RECRIADO

-- Verificação:
-- SELECT i.invoice_number, i.total_amount, COUNT(il.id) as lines
-- FROM invoices i
-- JOIN invoice_lines il ON il.invoice_id = i.id
-- WHERE i.invoice_number = '8112' AND i.series = 'FT1'
-- GROUP BY i.id;

COMMIT;
