-- =====================================================
-- Fix: invoice_lines.total não incluía IVA
-- Detectado por bug-hunter skill em 2026-06-16
-- =====================================================
-- BUG: O seed original calculou total = subtotal (errado)
--      CORRETO: total = subtotal + tax_amount = subtotal * (1 + tax_rate/100)
--
-- Também recalcula cabeçalhos de invoices para refletir a soma
-- real das linhas (não o valor do PDF que pode ter vasilhame/SDR).
-- =====================================================

BEGIN;

-- 1) Corrigir total em cada linha: total = subtotal + tax_amount
UPDATE invoice_lines
SET total = ROUND((subtotal + tax_amount)::numeric, 2)
WHERE ABS(total - (subtotal + tax_amount)) > 0.01;

-- 2) Recalcular cabeçalhos das invoices baseado nas linhas
--    (não usar valor do PDF porque pode ter items extra como vasilhame/SDR)
UPDATE invoices i
SET
  subtotal = COALESCE((SELECT ROUND(SUM(subtotal)::numeric, 4) FROM invoice_lines WHERE invoice_id = i.id), 0),
  tax_amount = COALESCE((SELECT ROUND(SUM(tax_amount)::numeric, 4) FROM invoice_lines WHERE invoice_id = i.id), 0),
  total_amount = COALESCE((SELECT ROUND(SUM(total)::numeric, 2) FROM invoice_lines WHERE invoice_id = i.id), 0)
;

-- 3) Verificação
SELECT
  i.invoice_number,
  i.subtotal,
  SUM(il.subtotal) AS sum_subtotal,
  i.tax_amount,
  SUM(il.tax_amount) AS sum_tax,
  i.total_amount,
  SUM(il.total) AS sum_total,
  i.subtotal - SUM(il.subtotal) AS diff_subtotal,
  i.total_amount - SUM(il.total) AS diff_total
FROM invoices i
JOIN invoice_lines il ON il.invoice_id = i.id
GROUP BY i.id, i.invoice_number, i.subtotal, i.tax_amount, i.total_amount
ORDER BY i.invoice_number;

COMMIT;
