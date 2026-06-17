# Arquitetura — ProcureHotel

> Sistema Inteligente de Compras para Hotelaria — visão técnica

## Visão geral

Monorepo com **backend FastAPI** (Python 3.11) e **frontend Next.js 15** (App Router, RSC, TypeScript). PostgreSQL 16 com pgvector + pg_trgm para pesquisa fuzzy em aliases. Redis para cache/fila. Auth via JWT (HS256) + bcrypt.

```
┌────────────────────┐    HTTPS     ┌─────────────────────┐
│   Next.js 15 (FE)  │ ───────────▶ │  FastAPI (BE)       │
│   - App Router     │   JWT        │  - SQLAlchemy 2.x   │
│   - shadcn/ui      │              │  - Pydantic v2      │
│   - next-intl      │              │  - OpenAI / Docling │
│   - zustand        │              │  - Alembic          │
└────────────────────┘              └──────────┬──────────┘
                                              │
                          ┌───────────────────┼─────────────────────┐
                          ▼                   ▼                     ▼
                   ┌────────────┐      ┌─────────────┐      ┌──────────────┐
                   │ PostgreSQL │      │   Redis     │      │  OpenAI API  │
                   │ +pgvector  │      │  (cache)    │      │  GPT-5.5     │
                   │ +pg_trgm   │      │             │      │  (parsing)   │
                   └────────────┘      └─────────────┘      └──────────────┘
```

## Módulos

### Backend (`backend/app`)

- **`core/`** — `config.py` (Pydantic Settings), `database.py` (async SQLAlchemy), `security.py` (bcrypt + JWT), `redis.py`, `logging.py` (Loguru JSON em prod).
- **`models/`** — ORM com UUID PK, soft-delete, mixins de timestamp. Ver `models/base.py`.
- **`schemas/`** — DTOs Pydantic v2.
- **`api/v1/`** — routers REST. Cada recurso num ficheiro:
  - `auth.py` — login (email/password), refresh, `/me`, registo (apenas se não existir ADMIN).
  - `users.py` — CRUD de utilizadores (ADMIN only).
  - `products.py` — CRUD + `search` (fuzzy trigram em master_name + aliases).
  - `suppliers.py` — CRUD.
  - `prices.py` — preços + `compare/{product_id}`.
  - `orders.py` — `parse` (IA), `optimize` (motor de menor custo), `commit` (persiste + divide por fornecedor).
  - `imports.py` — upload, OCR, normalização IA, revisão com approve/ignore/edit.
  - `analytics.py` — KPIs para o dashboard.
- **`services/`**:
  - `ai_normalizer.py` — wrapper OpenAI + fallback determinístico (regex). Lida com PT/EN, sinónimos, marcas.
  - `ocr_service.py` — Docling (preferido) → pypdf → Tesseract fallback. Lê PDF, Excel, Word, CSV, imagens.
  - `order_optimizer.py` — match produto → escolha melhor preço → agrupar por fornecedor → substituições.
  - `analytics.py` — agregações SQL (monthly_spend, top_products, top_suppliers, price_variation, savings).

### Frontend (`frontend/src`)

- **App Router** com `app/[locale]/(app)/...` para área autenticada e `app/[locale]/login`.
- **`stores/`** — `auth` (zustand + persist) para tokens, `theme` para dark/light.
- **`i18n.ts` + `locales/{pt-PT,en}.json`** — PT/EN com `next-intl`.
- **shadcn/ui** primitives: `Button`, `Input`, `Textarea`, `Card`, `Table`, `Badge`.
- **Páginas**:
  - `dashboard` — KPIs + top produtos/fornecedores.
  - `order` — input livre → IA → divide por fornecedor → "Copiar pedido" + "Marcar como realizado".
  - `products` — listagem e pesquisa fuzzy.
  - `suppliers` — listagem.
  - `imports` — upload + revisão IA linha-a-linha.
  - `orders` — histórico.
  - `analytics` — gráficos (Recharts).
  - `users` — admin.

## Fluxo principal — Fazer pedido

```
1. Utilizador escreve texto livre
2. POST /orders/parse → IA devolve ParsedItem[] (quantidade, unidade, produto)
3. POST /orders/optimize → match com catálogo → escolhe melhor preço → agrupa por fornecedor
4. UI mostra cards por fornecedor + botão "Copiar pedido" + "Marcar como realizado"
5. POST /orders/commit → cria 1 PurchaseOrder por fornecedor + itens + auditoria
```

## Fluxo principal — Importar preços

```
1. ADMIN faz upload (PDF/Excel/CSV/imagem)
2. OCR extrai linhas (Docling/Tesseract/pandas)
3. IA normaliza linhas → suggested_name, brand, qty, unit, price, confidence
4. UI mostra tabela: linha original / produto sugerido / confiança / ação (approve|edit|ignore)
5. POST /imports/{id}/review → cria/atualiza produtos + SupplierPrice, marca anteriores como !is_current
6. Tudo auditado em audit_logs
```

## Modelo de dados (resumo)

| Tabela | Propósito |
| --- | --- |
| `users` | Auth + role (admin/user) + tenant_id (Fase 3) |
| `products` | Catálogo mestre (master_name, brand, category, unit, status) |
| `product_aliases` | Sinónimos para matching ("coca", "cc 33" → Coca Cola 33cl) |
| `suppliers` | Fornecedores (NIF, contacto, payment_terms, lead time) |
| `supplier_prices` | Preço por produto+fornecedor com `is_current`, `unit_price` (€/unidade base) |
| `purchase_orders` | Cabeçalho do pedido (gerado por fornecedor) |
| `purchase_order_items` | Linhas do pedido |
| `imports` | Registo de upload + JSONB com `extracted_rows` e `normalized_rows` |
| `audit_logs` | Auditoria com action, entity_type, entity_id, payload (JSONB), IP, user_agent |

## Segurança

- **JWT** HS256 com access (60 min) + refresh (7 dias) tokens.
- **bcrypt** rounds=12 para passwords.
- **CORS** configurado via `BACKEND_CORS_ORIGINS`.
- **Rate limiting** — colocar em proxy (nginx) ou `slowapi` (Fase 2).
- **Audit log** em todas as mutações sensíveis.
- **Soft delete** em products e suppliers (`is_active=False`).
- **tenant_id** em users/suppliers preparado para multi-hotel (Fase 3).

## Performance

- **3 utilizadores simultâneos** suportados na Fase 1.
- **Postgres pool** size=10, max_overflow=20.
- **Redis** para cache de queries frequentes (ex: catálogo).
- **Async I/O** em todo o backend (SQLAlchemy 2.0 async + httpx + openai async).
- **Recharts** no frontend, renderiza apenas após fetch.
- **Debounce** em pesquisas (300ms) — adicionar em Fase 1.5.

## Roadmap

| Fase | Conteúdo |
| --- | --- |
| **1 (MVP — 4-6 sem)** | Login, catálogo, importação, normalização IA, comparação, geração de pedidos, dark mode, i18n |
| **2 (Inteligência)** | Substituições, histórico, KPIs avançados, alertas, otimização logística |
| **3 (Produto)** | Multiempresa, permissões avançadas, billing, ERP, API pública |
