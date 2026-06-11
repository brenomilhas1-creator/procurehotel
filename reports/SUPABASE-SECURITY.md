# Supabase Security Audit — Compra Facil Hoteis

**Data**: 2026-06-11
**Project**: fpjhvyydavssrzrkvlbd
**Region**: eu-west-1
**Status**: ACTIVE_HEALTHY

---

## Sumario

| Categoria | Resultado |
|---|---|
| Tabelas com RLS | **9/9** ON |
| Policies ativas | **15** |
| Funcoes SECURITY DEFINER | **3** |
| Triggers de auditoria | **0** |
| Service role key rotacionada | Sim (em uso: 3a vez) |
| HTTPS enforced | Sim (Cloudflare + Supabase) |

## Tabelas (9)

| Tabela | RLS | Rows |
|---|---|---|
| `audit_logs` | ON | 6 |
| `imports` | ON | 1 |
| `product_aliases` | ON | 10 |
| `products` | ON | 10 |
| `purchase_order_items` | ON | 12 |
| `purchase_orders` | ON | 3 |
| `supplier_prices` | ON | 32 |
| `suppliers` | ON | 2 |
| `users` | ON | 1 |

## Policies (15)

| Tabela | Policy | Cmd | Roles |
|---|---|---|---|
| `audit_logs` | `read own audit` | SELECT | authenticated |
| `imports` | `admin write imports` | ALL | authenticated |
| `imports` | `read for authenticated` | SELECT | authenticated |
| `product_aliases` | `read for authenticated` | SELECT | authenticated |
| `products` | `admin write products` | ALL | authenticated |
| `products` | `read for authenticated` | SELECT | authenticated |
| `purchase_order_items` | `read for authenticated` | SELECT | authenticated |
| `purchase_order_items` | `user write own order items` | ALL | authenticated |
| `purchase_orders` | `read for authenticated` | SELECT | authenticated |
| `purchase_orders` | `user write own orders` | ALL | authenticated |
| `supplier_prices` | `admin write prices` | ALL | authenticated |
| `supplier_prices` | `read for authenticated` | SELECT | authenticated |
| `suppliers` | `admin write suppliers` | ALL | authenticated |
| `suppliers` | `read for authenticated` | SELECT | authenticated |
| `users` | `read own user` | SELECT | authenticated |

## Funcoes SECURITY DEFINER (3)

| Funcao | Definer |
|---|---|
| `ensure_user_profile` | True |
| `handle_new_user` | True |
| `rls_auto_enable` | True |

## Storage

- **Bucket**: `ocr-uploads` (privado)
- **RLS**: 4 policies (SELECT/INSERT/UPDATE/DELETE para authenticated)
- **Max size**: 50MB por upload
- **MIME types permitidos**: image/*, application/pdf, .csv, .xlsx

## Triggers

- `on_auth_user_created` em `auth.users` (cria profile em public.users)

## Autenticacao

- **Provider**: Supabase Auth (email/password)
- **JWT**: ES256 com JWKS cache (10 min TTL)
- **Access token expiry**: 60 minutos
- **Refresh token expiry**: 7 dias
- **MFA**: nao configurado (recomendado para F3)
- **Password policy**: min 6 chars (Supabase default - F3: aumentar para 12+)

## Recomendacoes (F3)

1. **Password policy** - aumentar minimo para 12 chars + complexidade
2. **MFA** - ativar TOTP para utilizadores admin
3. **Rate limiting** - ja ativo no frontend (10/min auth)
4. **Backups automaticos** - ja configurado (7d retention no plano Pro, free tem 1d)
5. **Audit log** - ja populado com 6 eventos de demonstracao
6. **PITR** (Point in Time Recovery) - upgrade para Pro ($25/mo) ou documentar alternativa
