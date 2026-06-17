# ProcureHotel — Sistema Inteligente de Compras para Hotelaria

Plataforma web de procurement inteligente para hotelaria e restauração, com IA para interpretar pedidos livres, importar tabelas de preços e faturas, normalizar produtos, comparar preços entre fornecedores e gerar pedidos otimizados automaticamente.

## Stack

| Camada         | Tecnologia                                  |
| -------------- | ------------------------------------------- |
| Frontend       | Next.js 15 + TypeScript + Tailwind + shadcn/ui |
| Backend        | FastAPI (Python 3.11+)                      |
| Base de dados  | Supabase Postgres 16 + pgvector              |
| Autenticação   | Supabase Auth (JWKS ES256) + @supabase/supabase-js |
| OCR / Extração | Docling + Tesseract + pandas/openpyxl       |
| IA             | GPT-5.5 (parsing + normalização)            |
| Armazenamento  | Supabase Storage (bucket `ocr-uploads`)     |
| Deploy         | Vercel (FE) + Render (BE) + Supabase (free) |

## Estrutura do monorepo

```
.
├── backend/                 # FastAPI + SQLAlchemy + Alembic
│   ├── app/
│   │   ├── core/            # config, security, db, logging
│   │   ├── models/          # SQLAlchemy
│   │   ├── schemas/         # Pydantic
│   │   ├── api/v1/          # routers REST
│   │   ├── services/        # IA, OCR, otimização
│   │   └── utils/
│   ├── alembic/             # migrations
│   └── tests/
├── frontend/                # Next.js 15
│   └── src/
│       ├── app/             # App Router (PT/EN)
│       ├── components/      # shadcn/ui + domínio
│       ├── lib/             # api, auth, utils
│       ├── stores/          # zustand
│       ├── hooks/
│       └── locales/         # i18n
├── docker-compose.yml
├── .env.example
└── docs/                    # ARCHITECTURE, API, SETUP
```

## Quick start

### Via Supabase (recomendado, grátis)

Ver [`docs/SUPABASE_DEPLOY.md`](docs/SUPABASE_DEPLOY.md) — setup completo em 10 min.

### Via Docker (self-hosted)

```bash
cp .env.example .env
# editar .env (OPENAI_API_KEY, JWT_SECRET)
docker compose up -d
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.scripts.seed
```

Acesso:
- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:8000/api/v1>
- Swagger: <http://localhost:8000/docs>

## Roadmap

- **Fase 1 (MVP — 4 a 6 semanas):** Login, catálogo, importação Excel/PDF, normalização IA, comparação de preços, pedidos por fornecedor, dark mode, i18n.
- **Fase 2 (Inteligência operacional):** Substituições inteligentes, histórico, KPIs, alertas, otimização logística.
- **Fase 3 (Produto comercializável):** Multiempresa, permissões avançadas, billing, integrações ERP, API pública.

## Documentação

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — visão geral da arquitetura
- [`docs/API.md`](docs/API.md) — referência da API REST
- [`docs/SETUP.md`](docs/SETUP.md) — setup detalhado e deployment

## Licença

Proprietário © ProcureHotel. Todos os direitos reservados.
