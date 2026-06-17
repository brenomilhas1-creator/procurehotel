#!/bin/bash
# Bug Hunter — Auditoria completa de dados
# Uso: ./audit-data-quality.sh

set -e
DBURL="postgresql://postgres.fpjhvyydavssrzrkvlbd:%23Foguete1000@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"
export PGPASSWORD='#Foguete1000'

echo "🔍 AUDITORIA DE QUALIDADE DE DADOS"
echo "=================================="
echo

echo "1. Schema integrity"
psql "$DBURL" -c "
SELECT 'tabelas sem RLS' AS check_, count(*) AS n
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r' AND n.nspname = 'public' AND NOT c.relrowsecurity;
"

echo "2. Produtos sem preço (deveriam estar em pending_quotes)"
psql "$DBURL" -c "
SELECT p.master_name, p.category
FROM products p
WHERE p.is_active = true
  AND NOT EXISTS (SELECT 1 FROM supplier_prices sp WHERE sp.product_id = p.id AND sp.is_current = true)
LIMIT 20;
"

echo "3. Cálculos PO"
psql "$DBURL" -c "
SELECT po.code, po.total_amount, SUM(poi.line_total) AS items_total, 
       po.total_amount - SUM(poi.line_total) AS diff
FROM purchase_orders po
JOIN purchase_order_items poi ON poi.order_id = po.id
GROUP BY po.id, po.code, po.total_amount
HAVING ABS(po.total_amount - SUM(poi.line_total)) > 0.01
LIMIT 10;
"

echo "4. Cálculos Invoice"
psql "$DBURL" -c "
SELECT i.invoice_number, i.total_amount, SUM(il.total) AS lines_total,
       i.total_amount - SUM(il.total) AS diff
FROM invoices i
JOIN invoice_lines il ON il.invoice_id = i.id
GROUP BY i.id, i.invoice_number, i.total_amount
HAVING ABS(i.total_amount - SUM(il.total)) > 0.01
LIMIT 10;
"

echo "5. Fornecedores sem NIF"
psql "$DBURL" -c "
SELECT name FROM suppliers WHERE is_active = true AND tax_id IS NULL;
"

echo "6. Aliases duplicados"
psql "$DBURL" -c "
SELECT LOWER(alias) AS alias, COUNT(*) AS n, 
       STRING_AGG(p.master_name, ', ') AS products
FROM product_aliases pa
JOIN products p ON p.id = pa.product_id
GROUP BY LOWER(alias) HAVING COUNT(*) > 1
ORDER BY n DESC LIMIT 10;
"

echo "7. Pendentes antigos (>30 dias)"
psql "$DBURL" -c "
SELECT raw_line, created_at::date
FROM pending_quotes
WHERE status = 'pending' AND created_at < now() - interval '30 days'
LIMIT 10;
"

echo "8. supplier_prices com valid_until no passado (deviam ser is_current=false)"
psql "$DBURL" -c "
SELECT count(*) AS n FROM supplier_prices
WHERE is_current = true AND valid_until IS NOT NULL AND valid_until < current_date;
"

echo "✅ Auditoria concluída"
