---
name: bug-hunter
description: |
  Procura activamente bugs e inconsistências no sistema Compra Facil Hoteis
  (Supabase DB, Next.js frontend, Edge Functions, dados) e corrige-os
  automaticamente. Executa auditorias de qualidade de dados, validações
  de schema, RLS policies, foreign keys, integridade referencial,
  cálculo de totais, e consistência entre camadas (DB ↔ frontend).
  Use quando o utilizador disser "bug", "inconsistência", "auditoria
  de dados", "validar sistema", ou similar. Não usar para criar features
  novas ou investigar problemas específicos do user (usar análise direta).
---

# Bug Hunter — Compra Facil Hoteis

## Inputs to collect
- Credenciais Supabase (disponíveis em `~/.config/mavis/secrets.json` ou env)
- URL do projeto Supabase: `https://fpjhvyydavssrzrkvlbd.supabase.co`
- Permissões de escrita (service_role key) para corrigir bugs

## Procedure

### 1) Análise de schema e integridade
- Verificar foreign keys sem CASCADE adequado
- Identificar colunas NOT NULL sem DEFAULT que podem causar erros
- Detectar indexes em falta em FKs e colunas usadas em WHERE
- Confirmar que RLS está ativo em todas as tabelas com dados sensíveis
- Detectar ENUMs sem valores comuns (ex: 'invoice', 'pending' em quote_status)

### 2) Análise de dados
- Produtos sem preço: `SELECT COUNT(*) FROM products p WHERE is_active = true AND NOT EXISTS (SELECT 1 FROM supplier_prices WHERE product_id = p.id AND is_current = true)`
- Produtos sem categoria: `SELECT master_name FROM products WHERE is_active = true AND category IS NULL`
- Fornecedores sem NIF: `SELECT name FROM suppliers WHERE is_active = true AND tax_id IS NULL`
- Aliases duplicados: `SELECT LOWER(alias), COUNT(*) FROM product_aliases GROUP BY LOWER(alias) HAVING COUNT(*) > 1`
- Pendentes "esquecidos" (status=pending há mais de 30 dias): `SELECT * FROM pending_quotes WHERE status='pending' AND created_at < now() - interval '30 days'`
- Invoice lines com product_id null mas match_status != unmatched (incoerência)
- supplier_prices duplicados (mesmo product+supplier com is_current=true)

### 3) Análise de cálculo
- purchase_order.total_amount vs SUM(items.line_total)
- invoice.total_amount vs SUM(lines.total)
- invoice.subtotal vs SUM(lines.subtotal)
- supplier_prices.price != unit_price (devem ser iguais)
- supplier_prices.is_current=true com valid_until no passado (deveria ser false)
- FKs quebradas: `SELECT * FROM purchase_order_items WHERE product_id NOT IN (SELECT id FROM products)`

### 4) Análise de RLS e segurança
- Policies com `user_metadata` (editável pelo user)
- Views com SECURITY DEFINER (ignoram RLS)
- Funções SECURITY DEFINER sem `SET search_path = public`
- Policies permissivas (true para todos)
- Storage buckets sem policies

### 5) Análise de UX/Frontend
- Páginas com NaN em valores monetários (parse error)
- Imagens quebradas (favicon, logo)
- Console errors no browser
- Testes E2E que falham (sinal de regressão)
- Performance: queries sem limit, N+1, missing useMemo

### 6) Análise de Edge Functions
- Secrets hardcoded no código
- Falta de validação de input (zod)
- Erros não logados
- CORS permissivo
- Timeouts não configurados

### 7) Análise de migrations
- Migrations sem `BEGIN/COMMIT`
- Sem `IF NOT EXISTS` em CREATE TABLE
- Sem `IF EXISTS` em DROP TABLE
- Sem down-migration (rollback)
- Sem comentário `WHY` em decisões não-óbvias

### 8) Análise de dados operacionais
- usage_events sem user_id (resolve_user_id falhou)
- Audit logs com ação perigosa (DELETE, role change)
- Sessões Supabase expiradas
- Fornecedores com email inválido

## Output contract

Quando encontrar bugs:
1. **Listar** com severidade (CRITICAL, HIGH, MEDIUM, LOW)
2. **Diagnosticar** a causa raiz (com query SQL de evidência)
3. **Corrigir** com patch SQL transacional (BEGIN/COMMIT)
4. **Documentar** em `/workspace/scripts/fixes/<data>-<bug>.sql`
5. **Commit** com mensagem descritiva

Quando **NÃO** encontrar bugs:
- Reportar "✅ Auditoria limpa, X checks passaram, 0 issues"

## Failure handling

- Se a query falhar por permissão: usar service_role key
- Se correção for destrutiva (DELETE/ALTER): pedir confirmação antes
- Se o bug estiver em código (não DB): propor patch em vez de aplicar
- Se for bug crítico de segurança: aplicar imediatamente, avisar user depois
- Logs de fixes em `/workspace/scripts/fixes/` com data e descrição

## Examples

### Input: "bug-hunter, corre auditoria"
```bash
# 1. Schema
export PGPASSWORD='#Foguete1000'
psql "postgresql://postgres.fpjhvyydavssrzrkvlbd:#Foguete1000@aws-0-eu-west-1.pooler.supabase.com:6543/postgres" -c "
SELECT conname, conrelid::regclass, confdeltype, confupdtype
FROM pg_constraint WHERE contype = 'f' AND confdeltype NOT IN ('a','c','r','n');
"

# 2. Dados
psql ... -c "
SELECT 'produtos sem preço' AS issue, count(*) FROM products p
WHERE is_active AND NOT EXISTS (SELECT 1 FROM supplier_prices WHERE product_id=p.id AND is_current);
"

# 3. Cálculo
psql ... -c "
SELECT po.code, po.total_amount, SUM(poi.line_total) AS items_total, 
       po.total_amount - SUM(poi.line_total) AS diff
FROM purchase_orders po JOIN purchase_order_items poi ON poi.order_id = po.id
GROUP BY po.id HAVING ABS(po.total_amount - SUM(poi.line_total)) > 0.01;
"
```

### Output esperado
```
🔍 Auditoria Compra Facil Hoteis — 2026-06-16
========================================
✅ Schema: 0 FKs inseguras
⚠️  Dados: 6 produtos sem preço (Lombardo, Pimentos, Tomate Steak, Meloa, Maçã)
✅ Cálculos: 0 discrepâncias
🔒 Segurança: 0 issues
✅ Operacional: 0 problemas

🛠️ Correção aplicada:
- 6 produtos adicionados a pending_quotes (status=pending)
- Nenhum dado perdido, NENHUM preço inventado
```

## Categoria de severidade
- **CRITICAL**: produção parada, dados perdidos, brecha de segurança
- **HIGH**: funcionalidade principal quebrada
- **MEDIUM**: UX degradada, dados inconsistentes
- **LOW**: cosmetic, otimização

## Cron recomendado
```yaml
schedule: "0 3 * * *"  # 3h da manhã, todo dia
prompt: "Executar bug-hunter em modo auditoria completa"
session: { mode: "new" }
```
