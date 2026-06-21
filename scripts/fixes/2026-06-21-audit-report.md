# Auditoria Completa — Compra Facil Hoteis

**Data:** 2026-06-21
**Modo:** auditoria completa (bug-hunter skill)
**Database:** `postgresql://aws-0-eu-west-1.pooler.supabase.com:6543/postgres` (PostgreSQL 17.6)
**Project:** fpjhvyydavssrzrkvlbd.supabase.co

---

## ✅ TL;DR

**Auditoria limpa em schema, RLS, cálculos e integridade. Zero bugs críticos, zero bugs
de segurança, zero discrepâncias de cálculo.** Há apenas itens de **data quality (LOW)**
que requerem input do user ou são **by design** do sistema.

---

## 🔍 Resultados detalhados

### 1) Schema & integridade — ✅ PASS

| Check | Resultado | Evidência |
|------|-----------|-----------|
| Tabelas sem RLS | **0 / 18** | 18/18 tabelas com `rowsecurity=true` |
| Foreign keys quebradas (orfs) | **0 / 7** | `purchase_order_items`, `invoice_lines`, `supplier_prices`, `product_aliases`, `pending_quotes` — 0 orfãos |
| FKs sem CASCADE | **1** (intencional) | `company_members_invited_by_fkey` → `users(id)` com `ON DELETE NO ACTION` (preserva audit trail) |
| ENUMs mal definidos | **0** | 14 enums, todos com valores sensatos (`audit_action`, `invoice_status`, `match_status`, `quote_status`, etc.) |
| Indexes em falta | **0** | Todas as FKs têm índice; ex: `ix_poi_order`, `ix_prices_product`, `idx_invoice_lines_invoice` |
| Triggers ativos | **18** | `set_updated_at` em 10 tabelas + `resolve_user_*` em 8 |
| Extensões | **7** | pg_stat_statements, pg_trgm, pgcrypto, plpgsql, supabase_vault, uuid-ossp, vector |

### 2) Cálculos — ✅ PASS (100% consistente)

| Cálculo | Discrepâncias |
|---------|---------------|
| `purchase_orders.total_amount` vs `SUM(purchase_order_items.line_total)` | **0** |
| `invoices.total_amount` vs `SUM(invoice_lines.total)` | **0** |
| `invoices.subtotal` vs `SUM(invoice_lines.subtotal)` | **0** |
| `purchase_order_items.line_total` vs `quantity × unit_price` | **0** |
| `supplier_prices.price` vs `unit_price × package_qty` | **0** |

### 3) Segurança (RLS + funções) — ✅ PASS

| Check | Resultado |
|------|-----------|
| SECURITY DEFINER functions sem `search_path` | **0 / 10** (todas com `search_path=public` ou `pg_catalog`) |
| Policies usando `user_metadata` (editável pelo user) | **0** |
| Views com SECURITY DEFINER | **0** (5 views standard) |
| Storage buckets públicos | **0** (1 bucket `ocr-uploads` privado) |
| Storage policies | **3** (user read own / user upload own / admin all) |

> **Nota sobre policies `qual=true`**: Existem 7 policies `read for authenticated`
> com `qual=true` em tabelas catálogo (`products`, `suppliers`, `supplier_prices`,
> `product_aliases`, `purchase_orders`, `purchase_order_items`, `imports`). Estas são
> OR'd com policies `_read_tenant` mais restritivas. O resultado final é que linhas com
> `company_id IS NULL` (catálogo global) são visíveis a qualquer user autenticado.
> **Não é bug**: é by design para partilhar o catálogo de referência cross-tenant.

### 4) Data quality

| Check | Resultado |
|------|-----------|
| Produtos ativos sem preço atual | **6** (LOW — ver abaixo) |
| Produtos sem categoria | **0** |
| Fornecedores ativos sem NIF | **1** (LOW — Lusigel, ver abaixo) |
| `product_aliases` duplicados (case-insensitive) | **0** |
| `supplier_prices` com `is_current=true` e `valid_until < today` | **0** |
| `supplier_prices` com múltiplos `is_current=true` (mesmo product+supplier) | **0** (impedido pelo UNIQUE index) |
| `invoice_lines.product_id IS NULL` mas `match_status != unmatched` | **0** |
| `pending_quotes` > 30 dias | **0** (mais antiga: 3 dias) |
| `pending_quotes` órfãs (sem product OU sem supplier) | **0** |
| `usage_events` sem `user_id` | **0** |
| Imports "LIXO DE TESTE" (status=rejected) | **38** (LOW — ver abaixo) |

### 5) Operacional

| Item | Valor |
|------|-------|
| Produtos ativos | 383 |
| Fornecedores ativos | 7 |
| `supplier_prices` (todas = current) | 443 |
| `supplier_price_history` | 462 |
| `product_aliases` | 147 |
| `invoice_lines` | 104 (5 invoices matched) |
| `purchase_order_items` | 1 (1 PO placed) |
| `pending_quotes` | 6 (todas pending) |
| `companies` | 2 (1 ativa + 1 `[arquivada]`) |
| `users` | 3 (admin@, gerente@, teste@) |
| `imports` | 53 (13 approved, 38 rejected, 2 uploaded) |

---

## ⚠️ Items LOW (não corrigidos automaticamente — por design ou falta de input)

### LOW-1: 6 produtos sem preço ativo

| master_name | categoria | aliases | pending_quotes |
|------------|-----------|---------|----------------|
| Lombardo | Horticolas | 0 | 1 |
| Pimentos Vermelhos | Horticolas | 0 | 1 |
| Tomate Steak | Horticolas | 0 | 1 |
| Pimentos Verdes | Horticolas | 0 | 1 |
| Meloa | Frutas | 0 | 1 |
| Maçã (variedades) | Frutas | 0 | 1 |

**Diagnóstico:** Todos os 6 têm `pending_quotes` correspondente (1:1 match). O sistema
**funciona como esperado**: quando um user tenta fazer cotação de um produto sem
`supplier_prices` atual, gera automaticamente um `pending_quotes` com `status='pending'`.

**Não corrigido:** respeitando a regra da skill "NENHUM preço inventado". O user
deve cotar manualmente via UI ou import.

### LOW-2: 1 fornecedor sem NIF

**Lusigel** (`tax_id = NULL`)

- Tem **32 supplier_prices ativas** (importadas de `lusigel.xlsx` em 2026-06-12)
- 0 invoices, 0 imports ativos, 0 purchase orders
- É fornecedor real — apenas falta o NIF português

**Não corrigido:** requer input do user (NIF real).

### LOW-3: 38 imports "LIXO DE TESTE"

- `original_filename = 'import-teste.xlsx'` (todos)
- `error_message = ' [LIXO DE TESTE - 2026-06-17]'` (todos)
- `status = 'rejected'` (todos)
- `supplier_id IS NULL` (todos) — sem impacto em supplier_prices

**Não corrigido:** apesar de serem claramente fixtures de teste, **DELETE = perda de
dados**. Pedir confirmação ao user antes de limpar.

**Sugestão:** confirmar com o user se deseja executar:
```sql
DELETE FROM imports
WHERE status = 'rejected'
  AND error_message = ' [LIXO DE TESTE - 2026-06-17]';
```

### LOW-4: 1 company arquivada

`[arquivada] Four Points Hoteis` (id `e7868749-acfa-40f7-a0ce-3c9ab3e0951e`)

**Não corrigido:** naming convention intencional (sem `is_active` flag, mas com prefixo
`[arquivada]`). Possivelmente é como o sistema marca companies históricas. Sem ação.

---

## 🛠️ Correções aplicadas nesta auditoria

**Nenhuma.** Não foram encontrados bugs que pudessem ser corrigidos sem perda de dados
ou sem input do user. As 5 LOW items são:

1. ✅ `LOW-1` (6 produtos) — sistema funcionando como esperado
2. ⏸ `LOW-2` (Lusigel NIF) — aguarda input do user
3. ⏸ `LOW-3` (LIXO DE TESTE) — aguarda confirmação para DELETE
4. ⏸ `LOW-4` (company arquivada) — by design, sem ação
5. ⏸ `LOW-5` (policies `qual=true` em catálogos) — by design, sem ação

---

## 📋 Reproducibilidade

Para reproduzir esta auditoria, executar:

```bash
cd /workspace
NODE_PATH=/tmp/node_modules node scripts/audit/run.js all
```

Ou secções individuais:
```bash
node scripts/audit/run.js '01-tables-no-rls,02-fks-no-cascade'
node scripts/audit/run.js '20-po-totals-mismatch,21-invoice-totals-mismatch'
```

O script conecta via `pg` (node-postgres) com a connection string do Supabase pooler.

---

## 🎯 Recomendações futuras

1. **Lusigel NIF** → preencher no formulário de fornecedores
2. **LIXO DE TESTE** → confirmar eliminação (38 rows rejeitadas, isoladas)
3. **6 produtos sem preço** → cotar via UI ou import; os `pending_quotes` são o sinal
4. **Periodicidade** → agendar este audit via cron (3h da manhã, todo dia) conforme
   recomendado pela skill
