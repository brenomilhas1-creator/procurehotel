# ETAPA 3 — Auditoria de Segurança Frontend

**Data**: 2026-06-11
**App**: <https://procurehotel.vercel.app>

## 3.1 — Variáveis NEXT_PUBLIC_ expostas ao browser

Estas variáveis são **por design** públicas (visíveis ao browser):

| Variável | Tipo | Risco |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL pública | ✅ Aceitável (mesmo anon vê) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública (anon role) | ✅ Por design (RLS protege dados) |
| `NEXT_PUBLIC_API_BASE_URL` | URL pública | ✅ OK |
| `NEXT_PUBLIC_APP_NAME` | String | ✅ OK |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | String | ✅ OK |

**Verificações automáticas**: nenhuma chave `sb_secret_*` ou `service_role` aparece no bundle do frontend ✅

## 3.2 — Tokens no localStorage

**Implementação atual**:
- `accessToken` + `refreshToken` guardados em `localStorage` via `zustand/persist`
- Key: `procurehotel.auth`

**Análise**:
- ⚠️ localStorage é acessível a JavaScript no mesmo origin → vulnerável a XSS
- ✅ Mitigação: tokens são JWTs curtos (60min) + refresh tokens (7 dias)
- ✅ AuthGuard no client-side impede acesso a páginas internas
- 🟡 **F3**: considerar mover para httpOnly cookies (imune a XSS)

## 3.3 — Service Role Key

- ✅ Não está no frontend (grep confirmou)
- ✅ Está apenas no backend (env vars Render, encriptadas at rest)
- ✅ Service role rotacionada após exposição anterior

## 3.4 — Endpoints administrativos

| Endpoint | Auth requerida | Status |
|---|---|---|
| `POST /api/v1/users` | `AdminUser` (require_admin) | ✅ Protegido |
| `PATCH /api/v1/users/{id}` | `AdminUser` | ✅ Protegido |
| `DELETE /api/v1/users/{id}` | `AdminUser` | ✅ Protegido |
| `POST /api/v1/auth/admin/invite` | `AdminUser` | ✅ Protegido |
| `POST /api/v1/imports` | `AdminUser` | ✅ Protegido |
| `POST /api/v1/imports/{id}/review` | `AdminUser` | ✅ Protegido |
| `POST /api/v1/imports/{id}/normalize` | `AdminUser` | ✅ Protegido |

**Implementação**: `app/api/deps.py::require_admin` valida `user.role == UserRole.ADMIN`. O role é atribuído no user_sync (primeiro user = ADMIN) ou via admin/invite.

## 3.5 — CORS

Configurado em `app/main.py`:
```python
allow_origins=settings.backend_cors_origins  # lista
allow_credentials=True
allow_methods=["*"]
allow_headers=["*"]
```

⚠️ `allow_methods=["*"]` é permissivo mas padrão para API. F3: restringir a `["GET", "POST", "PATCH", "DELETE", "OPTIONS"]`.

## 3.6 — Headers de Segurança

| Header | Vercel (frontend) | Render (backend) |
|---|---|---|
| `Strict-Transport-Security` | ✅ `max-age=63072000` | ❌ Não visto |
| `X-Frame-Options` | (Vercel default DENY) | ❌ |
| `X-Content-Type-Options` | (Vercel default nosniff) | ❌ |
| `Content-Security-Policy` | ❌ | ❌ |
| `Referrer-Policy` | (Vercel default) | ❌ |

🟡 **F3 (ETAPA 13)**: adicionar CSP, X-Frame-Options, X-Content-Type-Options no backend.

## 3.7 — Logs / Informação sensível em responses

- Erros 401/403/500 não revelam info do servidor
- Tokens JWT não aparecem em logs (não são logados)
- ✅ Stack traces suprimidos em prod (FastAPI default)

## 3.8 — Conclusão ETAPA 3

| Verificação | Resultado |
|---|---|
| Service role key fora do browser | ✅ |
| Apenas anon key (público) no bundle | ✅ |
| Tokens não aparecem em HTML/RSC | ✅ |
| Endpoints admin com require_admin | ✅ |
| localStorage com tokens (vuln a XSS) | 🟡 migrar para cookies httpOnly em F3 |
| CSP / X-Frame-Options backend | ❌ Faltam (F3) |
| CORS restritivo | 🟡 permitir apenas métodos necessários (F3) |

**Semáforo**: 🟡 **AMARELO** — seguro mas melhorias em F3
