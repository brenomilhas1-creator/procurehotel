# AGENTS.md — Guia para AI Agents (Claude Code, Codex, etc.)

> Este arquivo é o **guia principal** para qualquer AI Agent que trabalhe neste repositório.
> Foi criado em 2026-06-29 após refactor massivo.

## 🎯 Visão Geral

**Compra Facil Hoteis** — Sistema de procurement intelligence para hotéis (Portugal).
- Frontend: Next.js 14 (App Router, RSC, client components)
- DB: Supabase Postgres (22 tabelas)
- Edge Functions: 4 (Deno runtime)
- Multi-tenant via `company_id`
- i18n: PT (default) + EN (paridade 100%)

## 🏗️ Estrutura

```
.
├── frontend/
│   ├── src/
│   │   ├── app/[locale]/(app)/ — páginas (rota dinâmica)
│   │   ├── components/         — UI + ErrorBoundary
│   │   ├── hooks/              — useAsync, useRealtimeRefresh
│   │   ├── lib/                — CORE (logger, errors, queue, mini-rag, supabase-data)
│   │   └── stores/cart.ts      — Zustand persist
│   └── public/
├── supabase/
│   ├── functions/_shared/      — logger, helpers (DENO)
│   ├── functions/<name>/       — Edge Functions
│   └── migrations/             — Schema SQL
├── scripts/                     — Python (parsers, migrations, audits)
└── .github/workflows/           — CI/CD + maintenance.yml

## 📚 Core Libraries (lib/)

| Ficheiro | Função | LOC | Substitui |
|----------|--------|-----|-----------|
| `lib/logger.ts` | Logger central | 143 | console.*  |
| `lib/errors.ts` | Error handling (safe/withRetry) | 113 | try-catch  |
| `lib/queue.ts` | Fila assíncrona com retry | 223 | fetch chains |
| `lib/mini-rag.ts` | RAG local (TF-IDF) | 273 | embeddings de API |
| `lib/supabase.ts` | Cliente SB | — | createClient |
| `lib/supabase-data.ts` | Queries tipadas | 2091 | sb.from().select() |

## ⚡ Padrões de Código

### 1. Async — SEMPRE usar useAsync + safe()
```ts
// ❌ Antes (15 LOC)
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
useEffect(() => {
  setLoading(true);
  fetchData(id).then(d => { setData(d); setLoading(false); }).catch(e => { setError(e); setLoading(false); });
}, [id]);

// ✅ Agora (3 LOC)
const { data, loading, error, refetch } = useAsync(() => fetchData(id), { scope: 'fetch', deps: [id] });
```

### 2. Error handling — SEMPRE safe() + formatError()
```ts
// ❌ try-catch manual
try { ... } catch (e) { console.error(e); toast.error('Erro'); }

// ✅ Centralizado
const { ok, error } = await safe(() => riskyOp());
if (!ok) toast.error(formatError(error));
```

### 3. Logging — SEMPRE log.* (NUNCA console.log)
```ts
// ❌ console.log('fetched', data);
log.info('catalog', 'fetched', { count: data.length });

// Async medido
const data = await log.time('catalog.fetch', () => fetch(url));
```

### 4. UI — SEMPRE ErrorBoundary nos providers
```tsx
<ErrorBoundary scope="dashboard">
  <DashboardContent />
</ErrorBoundary>
```

### 5. Real-time — SEMPRE useRealtimeRefresh
```ts
useRealtimeRefresh({
  tables: ['invoices', 'purchase_orders'],
  onChange: refetch,
  debounceMs: 2000,
});
```

## 🗄️ Database — Migrations

Todas as migrations em `scripts/*.sql` (não há `supabase/migrations/`).
**NUNCA** escrever migration sem testar primeiro localmente:
```bash
psql "$DATABASE_URL" -f scripts/fix-xxx.sql
```

Padrão de nome: `fix-<scope>-<YYYY-MM-DD>.sql`

## 🔐 Segurança

- **NUNCA** logar: passwords, tokens, NIFs, preços, emails (logger sanitiza)
- **SEMPRE** `SET search_path = public, pg_temp` em funções SECURITY DEFINER
- **SEMPRE** `await sb.auth.getUser()` em Edge Functions ANTES de criar supabaseAdmin
- Row-Level Security ativa em todas as tabelas multi-tenant

## 🌐 i18n

- Mensagens em `frontend/messages/pt-PT.json` e `en.json`
- **SEMPRE** adicionar chaves em ambos os ficheiros (paridade 100%)
- Hook: `useTranslations('namespace')`

## 🚀 Deploy

- Auto-deploy GitHub Actions: PARADO desde 2026-06-18
- Workaround: `npx vercel deploy --prod --token=$VERCEL_TOKEN`
- Aliases: `compra-facil-hoteis.vercel.app`

## 🛠️ GitHub Actions

- `ci.yml` — lint + type + build
- `e2e.yml` — Playwright (28 testes)
- **`maintenance.yml` (novo!)** — mensal dia 1 às 06:00 UTC

## 📖 Skills Disponíveis (este repo)

- `/workspace/.skills/bug-hunter/` — auditoria de dados + RLS
- `/workspace/.skills/security-auditor/` — OWASP Top 10 + Supabase
- `/workspace/.skills/cinematic-site/` — referência para sites comerciais
- `/workspace/.skills/skill-creator/` — para criar novas skills

## 🎯 Princípios de Manutenção

1. **DRY** — qualquer padrão repetido 3+ vezes vira hook/lib
2. **Logs estruturados** — JSON em Edge Functions, objetos em frontend
3. **Errors first-class** — sempre tratados, sempre classificados
4. **Backward compat** — NUNCA quebrar migrations existentes
5. **Types are truth** — TypeScript strict-mode em tudo
6. **Tests pass** — `npm run build` antes de commit

## 🚨 Red Flags (anti-padrões)

❌ `console.log` direto  
❌ `try { ... } catch { /* empty */ }`  
❌ `fetch().then().catch()` sem classificação  
❌ `await sb.from(...)` sem tipagem  
❌ Migration sem testar local primeiro  
❌ Commit sem `npm run build`  
❌ Hard-coded secrets em código  

## 📞 Contacto

- Repo: github.com/brenomilhas1-creator/procurehotel
- Frontend: https://compra-facil-hoteis.vercel.app
- Supabase: fpjhvyydavssrzrkvlbd.supabase.co
- Admin: admin@fourpoint.pt
