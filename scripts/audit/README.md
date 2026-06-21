# Audit scripts

Run via:
```bash
# Install pg once
cd /tmp && npm install pg --silent

# Run full audit
NODE_PATH=/tmp/node_modules node /workspace/scripts/audit/run.js all

# Run a subset
NODE_PATH=/tmp/node_modules node /workspace/scripts/audit/run.js '01-tables-no-rls,02-fks-no-cascade'
```

The script connects directly to Supabase Postgres via the pooled connection.
Connection string is hardcoded at the top of `run.js` — replace if rotating secrets.

Sections:
- `01-05`: schema (RLS, FKs, enums, table sizes)
- `10-19`: data quality (produtos sem preço, NIF, aliases, pendentes, FORN_TESTE)
- `20-24`: calculations (PO totals, invoice totals, supplier_prices, line totals)
- `30-33`: security (RLS policies, SECURITY DEFINER, policies with qual=true, user_metadata)
- `40-43`: operational (usage_events, audit_logs, email validation)
- `50`: migrations (supabase_migrations.schema_migrations)

See `../fixes/2026-06-21-audit-report.md` for the latest findings.
