# CI/CD · Compra Facil Hoteis

Este repositório tem dois workflows de GitHub Actions:

## `ci.yml` — A cada push/PR para `main`

1. **TypeScript check** (`tsc --noEmit`)
2. **Lint** (`next lint`)
3. **Build** (`next build`)

Duração: ~3-4 min

## `e2e.yml` — Após push para `main`

1. **Playwright E2E** (15 testes no chromium, depois mobile)
2. **HTML report** fica como artifact se falhar

Duração: ~3-4 min

## Secrets necessários (GitHub repo settings)

| Secret | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://fpjhvyydavssrzrkvlbd.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_sY6wLl6b0Ba5hbb_ezMPQA_MmzVkUBV` |
| `TEST_USER_EMAIL` | `admin@fourpoint.pt` |
| `TEST_USER_PASSWORD` | `#Four1010` |

## Como rodar localmente

```bash
cd frontend
npm ci
npx playwright install --with-deps chromium
npm run test:e2e           # só chromium
npx playwright test        # todos (chromium + mobile)
npx playwright test --ui   # modo interativo
```

## Como adicionar novos testes

```bash
cd frontend
# Criar novo ficheiro de teste
touch tests/e2e/07-novo.spec.ts
# Segue o padrão dos outros
```

## Status badges (adicionar ao README principal)

```markdown
![CI](https://github.com/brenomilhas1-creator/procurehotel/workflows/CI/badge.svg)
![E2E](https://github.com/brenomilhas1-creator/procurehotel/workflows/E2E%20Tests/badge.svg)
```
