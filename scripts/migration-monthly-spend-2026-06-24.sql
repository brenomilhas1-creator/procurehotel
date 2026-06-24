-- Migration: monthly spend view + supplier breakdown (2026-06-24)
-- View materializada (refresh on demand) com gastos mensais + por fornecedor

BEGIN;

-- View: gastos mensais a partir de invoices tipo 'fatura'
CREATE OR REPLACE VIEW monthly_spend AS
SELECT
  date_trunc('month', invoice_date)::date AS month,
  COUNT(*) AS invoice_count,
  SUM(total_amount) AS total_spend,
  SUM(tax_amount) AS total_tax,
  AVG(total_amount) AS avg_invoice
FROM invoices
WHERE invoice_type = 'fatura'
  AND invoice_date IS NOT NULL
  AND status = 'matched'
GROUP BY date_trunc('month', invoice_date)
ORDER BY month DESC;

ALTER VIEW monthly_spend SET (security_invoker = true);

-- View: top fornecedores por gasto
CREATE OR REPLACE VIEW top_suppliers_by_spend AS
SELECT
  s.id AS supplier_id,
  s.name AS supplier_name,
  s.is_preferred,
  COUNT(i.id) AS invoice_count,
  SUM(i.total_amount) AS total_spend,
  MAX(i.invoice_date) AS last_invoice_date
FROM suppliers s
LEFT JOIN invoices i ON i.supplier_id = s.id AND i.invoice_type = 'fatura' AND i.status = 'matched'
WHERE s.is_active = true
GROUP BY s.id, s.name, s.is_preferred
ORDER BY total_spend DESC NULLS LAST;

ALTER VIEW top_suppliers_by_spend SET (security_invoker = true);

-- View: top produtos por gasto (via invoice_lines)
CREATE OR REPLACE VIEW top_products_by_spend AS
SELECT
  p.id AS product_id,
  p.master_name,
  p.category,
  COUNT(il.id) AS line_count,
  SUM(il.total) AS total_spend,
  SUM(il.quantity) AS total_quantity
FROM products p
JOIN invoice_lines il ON il.product_id = p.id
JOIN invoices i ON i.id = il.invoice_id
WHERE i.invoice_type = 'fatura'
  AND i.status = 'matched'
  AND p.is_active = true
GROUP BY p.id, p.master_name, p.category
ORDER BY total_spend DESC
LIMIT 100;

ALTER VIEW top_products_by_spend SET (security_invoker = true);

COMMIT;
