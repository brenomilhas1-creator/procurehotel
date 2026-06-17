# Backend Render — Status de Deploy

**Data**: 2026-06-11
**Status**: ❌ build_failed (3 tentativas)

## Diagnóstico

- Service criado: `srv-d8l60h647okc73bfmq4g` ✅
- Env vars: 17/17 set ✅
- Health check path: `/health` ✅
- Região: Frankfurt ✅
- Plano: Free ⚠️

**Causa provável**: Free tier do Render tem:
- 15min de build timeout
- 512MB RAM
- Sem SSH/shell access
- API não retorna build logs para free tier

O `pip install` de 22 pacotes Python (alguns com C extensions) tipicamente leva 8-12min. Se alguma extensão C compilar lentamente, atinge o timeout.

## Mitigações já aplicadas

1. ✅ Removido `docling` do Dockerfile (compilação pesada de torch/transformers — não é necessário em produção porque `OCR_ENGINE=tesseract`)
2. ✅ Pin de versões para reprodutibilidade
3. ✅ `HEALTHCHECK` adicionado
4. ✅ Camadas Docker otimizadas (deps leves primeiro)
5. ✅ `bcrypt<4.1` (evita issues de compatibilidade com passlib)

## Próximos passos

### Opção A: Upgrade Render free → Starter ($7/mês)
- Sem timeout de build
- Logs completos
- Sem hibernação
- Build mais rápido (mais CPU/RAM)

### Opção B: Migração para Railway.app
- $5 grátis/mês
- Sem hibernação
- Build logs visíveis
- Setup via `render.yaml`-like `railway.json`

### Opção C: Fly.io
- Free tier mais generoso
- `fly deploy` com logs visíveis
- Sem hibernação

### Opção D: Self-host (VPS)
- Hetzner CX22 €3.79/mês (4GB RAM)
- Total controlo
- `docker compose up -d`

## Para o que serve o backend (Fase 2)

Funcionalidades que dependem do backend FastAPI:
- `/auth/me` (sync Supabase user → DB local) — pode ser feito pelo frontend via Supabase diretamente
- `/orders/parse` e `/orders/optimize` (IA + matching) — **essencial**
- `/orders/commit` (gravar PurchaseOrder) — **essencial**
- `/imports` (OCR + upload) — **essencial**
- `/prices/compare/{product_id}` — **essencial**
- `/analytics/summary` — **essencial**

Sem backend, o sistema fica com:
- ✅ Login/auth via Supabase
- ✅ Catálogo de produtos (via Supabase REST com RLS)
- ❌ Parsing IA de pedidos livres
- ❌ Otimização de preços
- ❌ Geração de ordens de compra
- ❌ OCR de uploads
- ❌ Analytics agregados

## Recomendação

Para concluir a Fase 2 com o backend operacional, **upgrade Render para Starter** ($7/mês, cancela-se a qualquer momento). É o caminho mais rápido e barato para validar tudo em produção.
