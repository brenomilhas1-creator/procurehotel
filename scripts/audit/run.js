const { Client } = require('pg');
const url = 'postgresql://postgres.fpjhvyydavssrzrkvlbd:%23Foguete1000@aws-0-eu-west-1.pooler.supabase.com:6543/postgres';

const sections = process.argv[2] || 'all';

const queries = {
  // ============================ SCHEMA ============================
  '01-tables-no-rls': `
    SELECT c.relname AS table_name,
           CASE WHEN c.relrowsecurity THEN 'enabled' ELSE 'DISABLED' END AS rls
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'r' AND n.nspname = 'public'
    ORDER BY c.relrowsecurity, c.relname;
  `,
  '02-fks-no-cascade': `
    SELECT conname AS constraint_name,
           conrelid::regclass AS table_name,
           confdeltype, confupdtype,
           pg_get_constraintdef(oid) AS definition
    FROM pg_constraint
    WHERE contype = 'f' AND confdeltype = 'a'  -- 'a' = no action (default, may block)
      AND connamespace = 'public'::regnamespace
    ORDER BY table_name;
  `,
  '03-fk-orphans': `
    -- Generic orphan check: list all FKs and check if any referenced row is missing
    SELECT 'purchase_order_items.product_id' AS fk, COUNT(*) AS orphans
    FROM purchase_order_items poi
    WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.id = poi.product_id)
    UNION ALL
    SELECT 'purchase_order_items.order_id', COUNT(*)
    FROM purchase_order_items poi
    WHERE NOT EXISTS (SELECT 1 FROM purchase_orders po WHERE po.id = poi.order_id)
    UNION ALL
    SELECT 'invoice_lines.invoice_id', COUNT(*)
    FROM invoice_lines il
    WHERE NOT EXISTS (SELECT 1 FROM invoices i WHERE i.id = il.invoice_id)
    UNION ALL
    SELECT 'invoice_lines.product_id', COUNT(*)
    FROM invoice_lines il
    WHERE il.product_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM products p WHERE p.id = il.product_id)
    UNION ALL
    SELECT 'supplier_prices.product_id', COUNT(*)
    FROM supplier_prices sp
    WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.id = sp.product_id)
    UNION ALL
    SELECT 'supplier_prices.supplier_id', COUNT(*)
    FROM supplier_prices sp
    WHERE NOT EXISTS (SELECT 1 FROM suppliers s WHERE s.id = sp.supplier_id)
    UNION ALL
    SELECT 'product_aliases.product_id', COUNT(*)
    FROM product_aliases pa
    WHERE NOT EXISTS (SELECT 1 FROM products p WHERE p.id = pa.product_id)
    UNION ALL
    SELECT 'pending_quotes.* (sem FK)', COUNT(*) FROM pending_quotes
    WHERE product_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM products p WHERE p.id = pending_quotes.product_id);
  `,
  '04-enums-defined': `
    SELECT t.typname AS enum_name, array_agg(e.enumlabel ORDER BY e.enumsortorder) AS values
    FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    GROUP BY t.typname ORDER BY t.typname;
  `,
  '05-table-list': `
    SELECT c.relname AS table,
           pg_size_pretty(pg_total_relation_size(c.oid)) AS size,
           (SELECT count(*) FROM pg_class WHERE relname = c.relname) AS _dummy
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'r' AND n.nspname = 'public'
    ORDER BY c.relname;
  `,

  // ============================ DATA QUALITY ============================
  '10-products-no-price': `
    SELECT p.master_name, p.category, p.is_active
    FROM products p
    WHERE p.is_active = true
      AND NOT EXISTS (SELECT 1 FROM supplier_prices sp WHERE sp.product_id = p.id AND sp.is_current = true)
    ORDER BY p.master_name;
  `,
  '11-products-no-category': `
    SELECT master_name FROM products WHERE is_active = true AND category IS NULL ORDER BY master_name;
  `,
  '12-suppliers-no-nif': `
    SELECT name, email, phone FROM suppliers WHERE is_active = true AND (tax_id IS NULL OR tax_id = '')
    ORDER BY name;
  `,
  '13-aliases-duplicated': `
    SELECT LOWER(alias) AS alias, COUNT(*) AS n,
           STRING_AGG(p.master_name, ', ') AS products
    FROM product_aliases pa
    JOIN products p ON p.id = pa.product_id
    GROUP BY LOWER(alias) HAVING COUNT(*) > 1
    ORDER BY n DESC;
  `,
  '14-pending-old': `
    SELECT id, raw_line, created_at::date AS created,
           age(now(), created_at) AS age
    FROM pending_quotes
    WHERE status = 'pending' AND created_at < now() - interval '30 days'
    ORDER BY created_at;
  `,
  '15-pending-counts': `
    SELECT status, COUNT(*) FROM pending_quotes GROUP BY status ORDER BY status;
  `,
  '16-invoice-line-incoherent': `
    SELECT il.id, il.match_status, il.product_id, i.invoice_number
    FROM invoice_lines il
    JOIN invoices i ON i.id = il.invoice_id
    WHERE il.product_id IS NULL AND il.match_status <> 'unmatched';
  `,
  '17-supplier-prices-duplicates': `
    SELECT product_id, supplier_id, COUNT(*) FILTER (WHERE is_current) AS currents,
           COUNT(*) AS total
    FROM supplier_prices
    GROUP BY product_id, supplier_id HAVING COUNT(*) FILTER (WHERE is_current) > 1;
  `,
  '18-forn-teste': `
    SELECT id, name, email, tax_id, phone, is_active, created_at::date
    FROM suppliers
    WHERE LOWER(name) LIKE '%test%' OR LOWER(name) LIKE '%for%test%'
       OR tax_id = 'TESTE' OR tax_id ILIKE 'TEST%'
       OR name ILIKE 'FORN_TESTE%' OR name ILIKE 'Forn Teste%'
    ORDER BY name;
  `,
  '19-suppliers-all': `
    SELECT id, name, email, tax_id, is_active FROM suppliers ORDER BY name;
  `,

  // ============================ CALCULATION ============================
  '20-po-totals-mismatch': `
    SELECT po.code, po.total_amount,
           SUM(poi.line_total) AS items_total,
           po.total_amount - SUM(poi.line_total) AS diff
    FROM purchase_orders po
    JOIN purchase_order_items poi ON poi.order_id = po.id
    GROUP BY po.id, po.code, po.total_amount
    HAVING ABS(po.total_amount - SUM(poi.line_total)) > 0.01;
  `,
  '21-invoice-totals-mismatch': `
    SELECT i.invoice_number, i.total_amount, i.subtotal,
           SUM(il.total) AS lines_total,
           SUM(il.subtotal) AS lines_subtotal,
           i.total_amount - SUM(il.total) AS diff_total
    FROM invoices i
    JOIN invoice_lines il ON il.invoice_id = i.id
    GROUP BY i.id, i.invoice_number, i.total_amount, i.subtotal
    HAVING ABS(i.total_amount - SUM(il.total)) > 0.01
        OR ABS(COALESCE(i.subtotal,0) - SUM(il.subtotal)) > 0.01;
  `,
  '22-supplier-prices-stale': `
    SELECT count(*) AS stale_is_current
    FROM supplier_prices
    WHERE is_current = true AND valid_until IS NOT NULL AND valid_until < current_date;
  `,
  '23-sp-price-vs-unit': `
    -- Se houver colunas price e unit_price divergentes
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'supplier_prices' AND table_schema = 'public'
    ORDER BY ordinal_position;
  `,
  '24-po-line-calc': `
    SELECT id, order_id, quantity, unit_price, line_total,
           quantity * unit_price AS expected
    FROM purchase_order_items
    WHERE ABS(line_total - (quantity * unit_price)) > 0.01
    LIMIT 20;
  `,

  // ============================ SECURITY / RLS ============================
  '30-rls-policies': `
    SELECT schemaname, tablename, policyname, cmd, qual, with_check
    FROM pg_policies WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `,
  '31-sec-definer-fns': `
    SELECT n.nspname AS schema, p.proname AS function,
           pg_get_functiondef(p.oid) LIKE '%SECURITY DEFINER%' AS is_definer,
       CASE WHEN p.prosecdef AND p.proconfig IS NULL THEN 'NO search_path SET' ELSE 'ok' END AS warning
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND pg_get_functiondef(p.oid) LIKE '%SECURITY DEFINER%';
  `,
  '32-policies-true': `
    SELECT tablename, policyname, cmd, qual
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (qual::text = 'true' OR with_check::text = 'true')
    ORDER BY tablename;
  `,
  '33-user-meta-policies': `
    SELECT tablename, policyname, cmd, qual
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (qual::text ILIKE '%user_metadata%' OR with_check::text ILIKE '%user_metadata%');
  `,

  // ============================ OPERATIONAL ============================
  '40-usage-events-no-user': `
    SELECT count(*) AS n FROM usage_events WHERE user_id IS NULL;
  `,
  '41-usage-events-recent': `
    SELECT event_type, COUNT(*) FROM usage_events
    WHERE created_at > now() - interval '7 days'
    GROUP BY event_type ORDER BY count DESC;
  `,
  '42-recent-audit-logs': `
    SELECT action, COUNT(*) FROM audit_logs
    WHERE created_at > now() - interval '30 days'
    GROUP BY action ORDER BY count DESC;
  `,
  '43-suppliers-bad-email': `
    SELECT id, name, email FROM suppliers
    WHERE is_active = true AND email IS NOT NULL
      AND email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$';
  `,

  // ============================ MIGRATIONS ============================
  '50-supabase-migrations': `
    SELECT version, name, executed_at::date
    FROM supabase_migrations.schema_migrations
    ORDER BY version DESC LIMIT 10;
  `,
};

(async () => {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const want = sections === 'all'
    ? Object.keys(queries)
    : sections.split(',').map(s => s.trim());

  for (const k of want) {
    if (!queries[k]) { console.log(`⚠️  Unknown: ${k}`); continue; }
    console.log(`\n=== ${k} ===`);
    try {
      const r = await c.query(queries[k]);
      if (r.rows.length === 0) {
        console.log('  (empty)');
      } else {
        console.table(r.rows);
      }
    } catch (e) {
      console.log('❌', e.message);
    }
  }

  await c.end();
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
