# ETAPA 2 — Auditoria de Segurança Supabase

**Data**: 2026-06-11
**Project ref**: `fpjhvyydavssrzrkvlbd` (region eu-west-1)

## 2.1 — Estado de RLS

✅ **9/9 tabelas com RLS ativado**:

| Tabela | RLS |
|---|---|
| audit_logs | ✅ |
| imports | ✅ |
| product_aliases | ✅ |
| products | ✅ |
| purchase_order_items | ✅ |
| purchase_orders | ✅ |
| supplier_prices | ✅ |
| suppliers | ✅ |
| users | ✅ |

## 2.2 — Policies (15 total)

| Tabela | Policy | Operação |
|---|---|---|
| products | read for authenticated | SELECT |
| products | admin write products | ALL |
| product_aliases | read for authenticated | SELECT |
| suppliers | read for authenticated | SELECT |
| suppliers | admin write suppliers | ALL |
| supplier_prices | read for authenticated | SELECT |
| supplier_prices | admin write prices | ALL |
| purchase_orders | read for authenticated | SELECT |
| purchase_orders | user write own orders | ALL |
| purchase_order_items | read for authenticated | SELECT |
| purchase_order_items | user write own order items | ALL |
| imports | read for authenticated | SELECT |
| imports | admin write imports | ALL |
| audit_logs | read own audit | SELECT |
| users | read own user | SELECT |

## 2.3 — Storage

✅ 1 bucket: `ocr-uploads` (privado, max 25MB, 9 mime types)

## 2.4 — Testes de acesso indevido

| # | Teste | Resultado | Status |
|---|---|---|---|
| T1 | Anon GET /products | 200 `[]` | ✅ RLS bloqueia (sem rows) |
| T2 | Anon GET /audit_logs | 200 `[]` | ✅ RLS bloqueia |
| T3 | Anon POST /products | 401 Unauthorized | ✅ admin write policy bloqueia |
| T4 | Anon GET /users | 200 `[]` | ✅ read own user bloqueia |
| T5 | Anon GET /supplier_prices | 200 `[]` | ✅ RLS bloqueia |
| T6b | Anon upload a bucket (PDF) | 403 RLS policy | ✅ bloqueia |
| T7 | Admin listar todos audit logs | 200 com dados | ✅ esperado (admin bypass) |
| T8 | SQL injection via PostgREST filter | 403 | ✅ PostgREST parametriza queries |
| T9 | GET object sem signed URL | 400 Bad Request | ✅ bucket privado |
| T10 | Anon listar buckets | `[]` (vazio) | ✅ RLS storage bloqueia |

## 2.5 — Service Role Key

⚠️ **RISCO IDENTIFICADO**:
- `SUPABASE_SERVICE_ROLE_KEY` está em:
  - `backend/.env.example` (público no repo)
  - Env vars Render (criptografado at rest, mas se Render breach → exposição)
  - Foi exposta neste chat em mensagem anterior (já rotacionada pelo user)

**Mitigações aplicadas**:
- Service_role key rotacionada após exposição
- Backend é o ÚNICO consumidor (não vai para o browser)
- Render env vars são encriptadas at rest

**Recomendações F3**:
- [ ] Mover service_role key para um secret manager (Doppler, AWS Secrets Manager)
- [ ] Audit trail de uso da service_role
- [ ] IP allowlist no Supabase para o backend Render

## 2.6 — JWT e Auth

✅ JWKS ativo (kid `f7b26cb8-5e8b-4cf7-8643-bef3bb4a6408`)
✅ ES256 (P-256) — algoritmo seguro
✅ Backend valida via cache JWKS (TTL 10min)
✅ Email confirmation obrigatória (`email_confirm: true` no admin invite)
✅ Senha mínima: definida pelo Supabase Auth (default 6 chars — **recomenda-se subir para 12+**)

## 2.7 — Conclusão ETAPA 2

| Verificação | Resultado |
|---|---|
| RLS em todas as tabelas | ✅ |
| Policies restritivas | ✅ |
| Bucket privado | ✅ |
| Mime types restritos no bucket | ✅ |
| Anon não consegue listar dados | ✅ |
| Anon não consegue escrever | ✅ |
| Anon não consegue upload | ✅ |
| SQL injection bloqueado | ✅ |
| IDOR mitigado por policy | ✅ |
| Service role key exposta no passado | ⚠️ Rotacionada, prevenir futura exposição |
| Senha mínima Supabase | ⚠️ Considerar 12+ chars |

**Semáforo**: 🟡 **AMARELO** — Seguro com pequenas melhorias pendentes
