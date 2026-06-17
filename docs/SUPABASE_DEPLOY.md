# Deploy Supabase + Vercel + Render (100% free tier)

Esta é a via **recomendada**: Supabase trata de Postgres + Auth + Storage,
Vercel serve o Next.js, Render corre o FastAPI.

## 1. Setup Supabase (1×)

1. Cria um projeto em <https://app.supabase.com> (free tier, sem cartão)
2. Vai a **Settings → API** e copia:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **NUNCA** exponhas
3. Vai a **SQL Editor** e corre, por ordem:
   - `docs/db/supabase/00_extensions.sql`
   - `docs/db/supabase/01_schema.sql`
   - `docs/db/supabase/02_seed.sql` (opcional)
   - `docs/db/supabase/03_storage.sql`
4. Vai a **Authentication → Users → Add user** e cria o primeiro ADMIN
5. Vai a **Settings → Database → Connection string → Transaction pooler** e copia:
   ```
   postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres
   ```
   Adiciona `?sslmode=require` no fim se for direto (porta 5432).

## 2. Deploy Backend (Render free)

1. Push do código para GitHub
2. Em <https://render.com> → **New → Web Service** → liga o repo
3. Configuração:
   - **Root Directory**: `backend`
   - **Environment**: `Docker`
   - **Region**: o mais próximo
   - **Plan**: Free
4. **Environment Variables** (do `backend/.env.example`):
   ```
   APP_ENV=production
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_ANON_KEY=sb_publishable_xxx
   SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxx
   SUPABASE_DB_URL=postgresql+psycopg://postgres:...
   OPENAI_API_KEY=sk-...
   OPENAI_MODEL=gpt-5.5
   OCR_ENGINE=tesseract         # docling é pesado; tesseract é mais leve p/ free tier
   MAX_UPLOAD_MB=20
   ```
5. Clica **Deploy**. O Render constrói o Dockerfile.
6. Em **Settings → Health Check Path**: `/health`
7. Aponta um domínio customizado (opcional).

> Nota: o Docling é pesado para o free tier do Render (512MB RAM). Começa
> com `OCR_ENGINE=tesseract` e muda quando migrares para um plano pago.

## 3. Deploy Frontend (Vercel free)

1. Em <https://vercel.com> → **Add New Project** → liga o mesmo repo
2. **Framework Preset**: Next.js
3. **Root Directory**: `frontend`
4. **Environment Variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx
   NEXT_PUBLIC_API_BASE_URL=https://your-backend.onrender.com/api/v1
   NEXT_PUBLIC_APP_NAME=ProcureHotel
   NEXT_PUBLIC_DEFAULT_LOCALE=pt-PT
   ```
5. **Deploy**. A Vercel deteta Next.js e configura sozinha.
6. Vai a **Settings → Domains** para customizar.

## 4. Configurar Auth no Supabase

1. **Authentication → URL Configuration**:
   - `Site URL`: `https://your-app.vercel.app`
   - `Additional Redirect URLs`: `https://your-app.vercel.app/pt-PT/auth/callback`
2. **Authentication → Sign In/Up → Email**:
   - Liga "Confirm email" se quiseres verificação
   - Liga "Magic link" para o botão no login

## 5. Primeiro ADMIN

O backend cria automaticamente o user **local** (na tabela `users`) na
primeira vez que alguém faz login via Supabase, com `role=ADMIN` (primeiro
utilizador) ou `role=USER` (restantes). Para criares o primeiro ADMIN:

1. Vai a **Supabase → Authentication → Users → Add user**
2. Email + password + **Auto Confirm User** = ON
3. Esse email faz login pela primeira vez → backend cria `users` com `role=ADMIN`

## 6. Testar o fluxo completo

1. Abre `https://your-app.vercel.app`
2. Faz login com o ADMIN criado
3. Vai a "Faça o pedido aqui" e escreve:
   ```
   10 caixas coca cola
   5kg queijo flamengo
   20kg farinha nacional
   ```
4. Clica **Interpretar pedido** → **Otimizar preços** → deve aparecer
   1-2 cards com fornecedor + total
5. Vai a **Importações** → upload dummy (PDF/Excel)
6. O OCR extrai → IA normaliza → revisa e aprova

## 7. Limites do free tier

| Serviço | Limite free |
| --- | --- |
| Supabase DB | 500MB |
| Supabase Storage | 1GB |
| Supabase Auth | 50k MAU |
| Vercel | 100GB bandwidth/mês, serverless 10s timeout |
| Render | 750h/mês, 512MB RAM, hiberna após 15min idle |

**O Render hiberna**. Para acordar: a 1ª request demora 30-60s. Para
evitar isso, usa um cron (UptimeRobot → ping a cada 5min) ou faz upgrade
para Starter ($7/mês).

## 8. Alternativas ao Render

- **Railway.app** — $5 grátis/mês, sem hibernação
- **Fly.io** — free tier generoso, regiões europeias
- **Hetzner VPS** — €3.79/mês, melhor custo/benefício, mas exige gestão

## 9. Backup

Supabase faz backup automático diário no free tier (retenção 7 dias).
Para download manual: **Settings → Database → Backups → Download**.

## 10. Variáveis de ambiente (resumo)

### Backend (Render)
```
APP_ENV=production
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=sb_publishable_xxx
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxx
SUPABASE_DB_URL=postgresql+psycopg://postgres:...@...pooler.supabase.com:6543/postgres
OPENAI_API_KEY=sk-...
OCR_ENGINE=tesseract
MAX_UPLOAD_MB=20
STORAGE_BACKEND=supabase
SUPABASE_STORAGE_BUCKET=ocr-uploads
```

### Frontend (Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx
NEXT_PUBLIC_API_BASE_URL=https://xxx.onrender.com/api/v1
```

## 11. Troubleshooting

| Problema | Solução |
| --- | --- |
| `401 Invalid API key` no frontend | `NEXT_PUBLIC_SUPABASE_ANON_KEY` mal colada |
| `CORS` no browser | Adiciona domínio Vercel a `BACKEND_CORS_ORIGINS` no backend |
| `Connection refused` Postgres | Usa o **pooler** (porta 6543), não a porta 5432 |
| Docling não instala no Render | Muda `OCR_ENGINE=tesseract` |
| Render hiberna | Ping com UptimeRobot ou upgrade |
