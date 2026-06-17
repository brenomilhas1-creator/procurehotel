# Compra Facil Hoteis — Auditoria de Arquitetura (ETAPA 1)

> Versão: 0.3.0 · Data: 2026-06-11 · Stack: Next.js 15 + FastAPI + Supabase

## 1. Diagrama de alto-nível

```
┌─────────────────────────────────────────────────────────────────────┐
│                        UTILIZADOR (Browser)                          │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Next.js 15 (Vercel · procurement / Edge Network)            │   │
│  │  - App Router + RSC + shadcn/ui + Tailwind                   │   │
│  │  - Zustand (auth/theme), next-intl (PT/EN)                    │   │
│  │  - @supabase/supabase-js + @supabase/ssr                     │   │
│  └────┬──────────────────────────────────────────┬───────────────┘   │
└───────┼──────────────────────────────────────────┼───────────────────┘
        │ HTTPS (Supabase access_token JWT)      │ HTTPS (Backend API)
        ▼                                          ▼
┌──────────────────────────┐         ┌────────────────────────────────┐
│  Supabase (eu-west-1)    │         │  FastAPI (Render Frankfurt)    │
│  ┌──────────────────┐    │         │  - Python 3.11 + Uvicorn        │
│  │  Auth (JWKS)     │◀───┼─────────┼──- JWKS verify Supabase token  │
│  │  Postgres +pgvec │    │         │  - SQLAlchemy 2 async          │
│  │  Storage bucket  │◀───┼─────────┼──- OCR (Tesseract/Docling)     │
│  │  RLS policies    │    │         │  - AI normalizer (OpenAI)      │
│  └──────────────────┘    │         │  - Order optimizer             │
└──────────────────────────┘         │  - Audit logs                  │
                                      └────────────────────────────────┘
```

## 2. Fluxo de Autenticação

```
┌────────┐  1. POST /auth/v1/token  ┌────────────┐  2. verify email+password  ┌──────────┐
│ Browser├────────────────────────▶│  Supabase  │─────────────────────────────▶│ Postgres │
└────┬───┘  (grant_type=password)   │  Auth      │                             │ auth.users│
     │                             └─────┬──────┘                             └──────────┘
     │  3. access_token (JWT ES256)      │
     │◀──────────────────────────────────┘
     │  4. GET /api/v1/auth/me  Authorization: Bearer <jwt>
     ▼
┌──────────┐  5. fetch JWKS (cached 10m)  ┌──────────┐
│ FastAPI  │────────────────────────────▶│  Supabase │
│ /auth/me │                             │  JWKS     │
└────┬─────┘                             └──────────┘
     │  6. Verify ES256 + sub + exp
     │  7. SELECT * FROM users WHERE supabase_user_id = sub
     │  8. Se não existir: INSERT (primeiro = ADMIN)
     ▼
   UserOut
```

**Risco**: se o `user_sync` falhar e o user for inativo no Supabase, login falha. OK.

## 3. Fluxo de Upload + OCR

```
User → Browser (multipart) → FastAPI /imports
                                 │
                                 ├─ require_admin (verifica role)
                                 ├─ MAX_UPLOAD_MB check
                                 ├─ upload_file() → Supabase Storage (ocr-uploads/imports/{uuid}_name)
                                 ├─ download_to_local() → /tmp/...
                                 ├─ ocr_service.extract_rows() → list of {raw_text, cells}
                                 ├─ ai_normalizer.normalize_ocr_rows() → NormalizedRow[]
                                 ├─ INSERT imports (status=normalized, extracted_rows=JSONB, normalized_rows=JSONB)
                                 └─ return ImportOut com 142 linhas
User → vê tabela com confiança por linha
User → clica "Aprovar" → /imports/{id}/review
       ├─ decisions[] com approve/ignore/edit
       ├─ Por linha: criar/atualizar product, criar alias, marcar preços anteriores !is_current, criar supplier_price
       └─ UPDATE imports SET status=approved, rows_approved=N
```

**Risco**: OCR em PDFs grandes é lento (timeout). Storage local /tmp pode encher. ✅ Tem limite MAX_UPLOAD_MB.

## 4. Fluxo IA (parsing livre)

```
User escreve texto livre
   "10 caixas coca cola\n5kg queijo flamengo"
   │
   ▼
POST /orders/parse {text}
   │
   ├─ Se OPENAI_API_KEY set: OpenAI gpt-5.5 (response_format=json_object)
   │   └─ System prompt: extrair {quantity, unit, product_name, brand, confidence}
   │
   └─ Fallback: regex parser (`^(\d+(?:[.,]\d+)?)\s*(\w+)?\s+(.+)$`)
   │
   ▼
FreeTextParseResponse {items: FreeTextItem[], ambiguous: []}
```

## 5. Fluxo de Geração de Pedidos

```
User: "Interpretar pedido" → vê lista de items
User: "Otimizar preços"
   │
   ▼
POST /orders/optimize {items: FreeTextItem[]}
   │
   ├─ Para cada item:
   │   ├─ match_product(): alias exacto → master_name → fuzzy trigram → alias trigram
   │   ├─ check unit compatibility (cx/kg/L etc)
   │   ├─ choose_best_price(): SELECT supplier_prices WHERE is_current AND supplier active
   │   │                        ORDER BY unit_price ASC LIMIT 1
   │   ├─ find_substitute() se produto hidden/blocked
   │   └─ OptimizedLine com supplier_id + line_total
   │
   └─ group_by_supplier() → OptimizedSupplierGroup[]

User: "Marcar como realizado"
   │
   ▼
POST /orders/commit {groups, raw_input}
   │
   ├─ Por grupo: PurchaseOrder com code (PO-YYYYMMDD-XXXX)
   ├─ Por item: PurchaseOrderItem com quantity, unit_price, line_total
   ├─ audit_log(ORDER_PLACED)
   └─ return [PurchaseOrder]
```

## 5. Fluxo Admin (gestão de utilizadores)

```
ADMIN: POST /api/v1/auth/admin/invite
   body: {email, full_name, role}
   │
   ├─ supabase.auth.admin.create_user({email, email_confirm: true, user_metadata: {full_name, role}})
   ├─ fetch_supabase_user_meta() para obter novo ID
   ├─ get_or_create_local_user() — INSERT users com supabase_user_id + role
   └─ audit_log(CREATE User)
```

## 6. Pontos de Gargalo / Risco

| # | Gargalo | Risco | Mitigação atual | Próxima |
|---|---|---|---|---|
| 1 | `pnpm/npm install` no Render | Free tier 512MB RAM → Docling pesado | `OCR_ENGINE=tesseract` (mais leve) | OK |
| 2 | OpenAI rate limits | Sem fallback robusto | Regex fallback presente | ✅ |
| 3 | Build de imagens (OCR scans) | Sem fila assíncrona | Síncrono, pode demorar 30s+ | Adicionar Arq/Celery em F3 |
| 4 | JWKS cache invalidation | Se Supabase rotação chaves, tokens antigos inválidos | TTL 10min | OK |
| 5 | JSONB sem schema | `normalized_rows` cresce indefinidamente | Sem limpeza | Adicionar job de limpeza F3 |
| 6 | Sem paginação em algumas queries | `/products?size=1000` pode ser lento | `size` max 100 | OK |
| 7 | Render free hiberna após 15min | 1ª request demora 30-60s | Sem cron | UptimeRobot ou upgrade |
| 8 | `service_role_key` em env vars Render | Se Render breach → chave exposta | N/A | Rotação automática F3 |

## 7. Componentes Externos

| Componente | Vendor | Crítico? | SLO pessoal |
|---|---|---|---|
| Vercel | Vercel Inc | Sim | 99.99% (vendor) |
| Render | Render Inc | Sim | 99.95% (plano pago) / variável free |
| Supabase | Supabase Inc | Sim | 99.9% (free) |
| GitHub | GitHub Inc | Não (CI/CD) | 99.9% |
| OpenAI | OpenAI | Não (IA degrada para regex) | 99.9% |

**Dependências críticas**: Supabase + Render. Sem nenhum dos dois, sistema não funciona.

## 8. Conclusão da ETAPA 1

- **Arquitetura**: clara, modular, sem acoplamentos desnecessários ✅
- **Gargalos**: 8 identificados, 4 já mitigados ✅
- **Riscos**:主要集中在 1) hibernação Render e 2) service_role key exposta
- **Próximo passo**: ETAPA 2 (Supabase RLS audit)
