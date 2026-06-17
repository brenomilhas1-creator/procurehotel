---
name: security-auditor
description: |
  Auditor de segurança especializado no Compra Facil Hoteis (Supabase +
  Next.js + Edge Functions). Procura activamente vetores de invasão:
  RLS bypass, SQL injection, XSS, CSRF, secrets expostos, auth flow
  bypass, privilege escalation, IDOR, broken access control, rate
  limiting, OWASP Top 10, e Supabase-specific issues. Use quando o
  utilizador disser "segurança", "audit", "pen test", "invasão",
  "vulnerabilidade", "risco", ou "supabase advisor". Não usar para
  corrigir bugs gerais (usar bug-hunter) ou criar features.
---

# Security Auditor — Compra Facil Hoteis

## Inputs to collect
- Credenciais Supabase com service_role (acesso completo)
- URL frontend: `https://compra-facil-hoteis.vercel.app`
- Acesso ao GitHub: `brenomilhas1-creator/procurehotel`
- Env vars do Vercel: usar `vercel env ls` (com token)

## Procedure

### 1) Supabase RLS Audit (CRITICAL)
```sql
-- Tabelas SEM RLS
SELECT c.relname FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r' AND n.nspname = 'public'
  AND NOT c.relrowsecurity;

-- Policies que usam user_metadata (editável)
SELECT tablename, policyname FROM pg_policies
WHERE qual::text ILIKE '%user_metadata%'
   OR with_check::text ILIKE '%user_metadata%';

-- Policies permissivas (USING true)
SELECT tablename, policyname FROM pg_policies WHERE qual::text = 'true';

-- Policies com USING null (sem verificação)
SELECT tablename, policyname FROM pg_policies WHERE qual IS NULL;
```

### 2) SQL Injection Vectors
```sql
-- Funções com SECURITY DEFINER (executam como owner)
SELECT proname FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE prosecdef AND n.nspname = 'public'
  AND prosrc ~* 'EXECUTE|SELECT|UPDATE|DELETE|INSERT';

-- Funções com dynamic SQL
SELECT proname FROM pg_proc WHERE prosrc ~* 'EXECUTE\s+[\''"]';

-- Funções sem SET search_path
SELECT proname FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE prosecdef AND n.nspname = 'public'
  AND proconfig IS NULL;
```

### 3) Auth Flow
- Verificar password requirements (min length, complexity)
- Detectar tokens JWT com prazo muito longo (>24h)
- Conferir se passwords são hashed (bcrypt, argon2) — não plaintext
- Verificar refresh token rotation
- Detectar endpoints que aceitam user_id no body (IDOR)

### 4) Edge Functions Audit
```bash
# Procurar secrets hardcoded
grep -r "sb_secret\|sb_publishable\|password\|api_key\|token" /workspace/supabase/functions/

# Verificar validação de input
grep -L "zod\|valibot\|joi" /workspace/supabase/functions/*/index.ts

# Verificar CORS permissivo
grep 'Access-Control-Allow-Origin.*\*' /workspace/supabase/functions/*/index.ts

# Verificar auth check
grep -L "auth.uid\|Authorization" /workspace/supabase/functions/*/index.ts
```

### 5) Frontend XSS/CSRF
- Procurar `dangerouslySetInnerHTML` (risco XSS)
- Verificar CSP headers em `next.config.js`
- Verificar CSRF tokens em forms de mutação
- Verificar cookies: HttpOnly, Secure, SameSite
- Verificar que `localStorage` não tem tokens (apenas dados não-sensíveis)

### 6) Secrets Management
```bash
# Procurar secrets em código
grep -rE "(sk-|pk-|api[_-]?key|secret|password)\s*=\s*['\"]" /workspace/frontend/src /workspace/supabase/functions 2>/dev/null | grep -v ".test\|.spec\|.example"

# Verificar env vars commitadas acidentalmente
git log --all --full-history --source --remotes --oneline -- "*.env*" 2>/dev/null

# Verificar git history para secrets leakados
git log -p --all -S "sb_secret\|MINIMAX_API_KEY" -- "*.ts" 2>/dev/null | head -50
```

### 7) OWASP Top 10 Checklist
- [ ] A01 Broken Access Control: RLS em todas as tabelas
- [ ] A02 Cryptographic Failures: HTTPS, password hash
- [ ] A03 Injection: parameterized queries, RLS
- [ ] A04 Insecure Design: rate limiting, throttling
- [ ] A05 Security Misconfig: CORS, headers, defaults
- [ ] A06 Vulnerable Components: npm audit, dependabot
- [ ] A07 Auth Failures: brute force protection, MFA ready
- [ ] A08 Data Integrity: signed URLs, webhooks
- [ ] A09 Logging Failures: audit_logs table
- [ ] A10 SSRF: validate URLs em Edge Functions

### 8) Supabase-Specific
- [ ] Service role key NUNCA em código client-side
- [ ] Anon key só tem permissões de SELECT (não INSERT/UPDATE em tabelas sensíveis)
- [ ] Storage policies tão restritivas quanto RLS
- [ ] Realtime subscriptions com auth check
- [ ] Edge Functions com verify_jwt=true

### 9) Rate Limiting
- Edge Functions chamadas sem rate limit → DoS risk
- Login endpoint sem throttle → brute force
- Search endpoints sem debounce → scraping

### 10) Audit Logs
```sql
-- Verificar se há registo de eventos sensíveis
SELECT event_type, COUNT(*) FROM usage_events
WHERE created_at > now() - interval '7 days'
GROUP BY 1;

-- Ações perigosas registadas?
SELECT * FROM audit_logs
WHERE action IN ('delete', 'role_change', 'permission_grant')
ORDER BY created_at DESC LIMIT 20;
```

## Output contract

### Relatório de auditoria:
```
🔒 Security Audit — Compra Facil Hoteis
========================================
Data: 2026-06-16 12:00:00
Auditor: security-auditor

📊 SCORE: 95/100
- RLS: ✅ 14/14 tabelas
- Secrets: ✅ 0 leaks
- Auth: ✅ bcrypt + 7d cookies
- XSS: ✅ 0 dangerouslySetInnerHTML
- CSRF: ✅ SameSite=lax
- SQL Injection: ✅ 0 dynamic SQL

🔴 CRITICAL (0)
🟠 HIGH (0)
🟡 MEDIUM (1)
- [MEDIUM] Edge Function ai-assistant: falta rate limit
  → Add Upstash Redis or similar
  → Patch: scripts/security/fix-rate-limit.sql

🟢 LOW (2)
- [LOW] Falta CSP header em next.config.js
- [LOW] audit_logs não captura logins falhados

PRÓXIMOS PASSOS:
1. [ ] Aplicar fix de rate limit
2. [ ] Adicionar CSP headers
3. [ ] Implementar tracking de failed logins
```

## Failure handling

- **Secrets leakados em git**: rotacionar IMEDIATAMENTE (não só apagar do código)
- **SQL injection**: parar o serviço, patch urgente, post-mortem
- **RLS bypass**: aplicar fix em < 1h, notificar stakeholders
- **Auth bypass**: invalidar todas as sessões, forçar re-login
- **Bug de logging**: garantir que está registado ANTES de fix

## Examples

### Input: "security-auditor, corre uma auditoria completa"

```bash
# Step 1: RLS
psql ... -c "
SELECT 'tabelas sem RLS' AS check_, string_agg(relname, ', ') AS tables
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r' AND n.nspname = 'public' AND NOT c.relrowsecurity;
"

# Step 2: Secrets
cd /workspace
grep -rE "sk-|sb_secret|api_key" frontend/src/ supabase/functions/ --include="*.ts" --include="*.tsx" | grep -v node_modules
```

### Output esperado
```
🔒 Security Audit — 2026-06-16
Score: 97/100
✅ RLS: 14/14 tabelas protegidas
✅ Secrets: 0 leaks detectados
✅ Auth: bcrypt + cookies HttpOnly+Secure+SameSite=Lax
✅ XSS: 0 dangerouslySetInnerHTML
✅ SQL Injection: 0 dynamic SQL
🟡 MEDIUM (1)
- Edge Function ai-assistant sem rate limit
🟢 LOW (1)
- audit_logs não captura failed logins
```

## Cron recomendado
```yaml
# Auditoria diária leve
schedule: "0 4 * * *"
prompt: "Executar security-auditor em modo auditoria diária (RLS + secrets + XSS)"

# Auditoria semanal profunda
schedule: "0 5 * * 0"  # Domingos 5h
prompt: "Executar security-auditor em modo completo (OWASP Top 10)"
```

## Severity scale
- **CRITICAL**: explorável agora, perda de dados iminente
- **HIGH**: explorável com conhecimento, RLS bypass, auth bypass
- **MEDIUM**: defense in depth, falta rate limit, headers
- **LOW**: hardening, melhorias, observability
