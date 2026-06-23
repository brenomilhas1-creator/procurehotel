# MEMORY.md — Compra Facil Hoteis

> Estado atual, decisões, e memória persistente. Lido por Mavis em cada sessão.

## Última atualização: 2026-06-23 (sistema entregue para uso diário)

---

## 1. Estado atual (snapshot)

### Frontend (Vercel)
- **URL:** <https://compra-facil-hoteis.vercel.app>
- **Status:** 🟢 Online, deploy ID ativo
- **Versão:** 1.0.0 (release candidate para uso diário)
- **Stack:** Next.js 15.5.19 + TypeScript + TailwindCSS
- **Última verificação status:** ✓ Tudo OK em 2026-06-23

### Backend (Supabase)
- **Project ref:** `fpjhvyydavssrzrkvlbd` (eu-west-1)
- **DB password:** `#Foguete1000` (cofre)
- **Service role:** `<SERVICE_ROLE_KEY_NO_COFRE>` (cofre)
- **Anon key:** `sb_publishable_sY6wLl6b0Ba5hbb_ezMPQA_MmzVkUBV`

### Database (snapshot 2026-06-23)
- **587 produtos ativos** (todos com nome real, sem "Artigo XXXXX")
- **7 fornecedores ativos**: Avoneto ⭐, Gergran ⭐, Makro ⭐, Sumol+Compal ⭐, Alpha Food, Aviludo, Lusigel
- **648 preços atuais** (Avoneto 51, Gergran 230, Makro 183, etc.)
- **496 registos em supplier_price_history** (com trigger automático)
- **353 aliases** (sem TEST001/002)
- **3 invoices tipo fatura** (€4.242,77 total): 5 antigas + Avoneto FT1/8112 €1.129,57
- **22 tabelas** no schema public

### Crons (auto-monitorização)
- ✅ **bug-hunter-daily** (`0 4 * * *` Europe/Paris) — última execução: success
- ✅ **security-auditor-weekly** (`0 5 * * 0` Europe/Paris) — última execução: success
- ✅ **cinematic-skills-tier-c-build** (`0 2 * * *` Europe/Paris) — outra skill pool

### Últimos commits
- `337794e` feat(invoice): processar fatura Avoneto FT1/8112 (€1.129,57, 34 lines)
- `c17a4c8` feat(import): processar tabela Gergran 2026 (199 produtos novos + 21 atualizações)
- `5f58c67` chore(audit): bug-hunter full audit 2026-06-21 — clean
- `ab712ae` feat(dashboard): alerta de preços críticos + REPORT.md (relatório geral)
- `c6a9810` fix(cleanup): renomear 95 produtos Artigo XXXXX + consolidar 62 duplicados

---

## 2. Credenciais e acessos (REFERÊNCIA, valores reais no cofre)

### Web
- **URL produção:** <https://compra-facil-hoteis.vercel.app>
- **Status page:** <https://compra-facil-hoteis.vercel.app/pt-PT/status>
- **Login admin:** `admin@fourpoint.pt` / `#Four1010`
- **Login gerente:** `gerente@fourpoint.pt` / `#Gerente1010`

### Tokens (placeholders no repo, reais no cofre)
- `SERVICE_ROLE_KEY_NO_COFRE` = `sb_secret_M3o3GU_...`
- `SUPABASE_PAT_NO_COFRE` = `sbp_b067bdbf...`
- `VERCEL_TOKEN_NO_COFRE` = `vcp_8lshst8...`
- `MINIMAX_API` (público em env, exposto em 2026-06-12)

### GitHub
- **Repo:** <https://github.com/brenomilhas1-creator/procurehotel>
- **CI:** GitHub Actions (lint + build + e2e)

### DB connection
- `postgresql://postgres.fpjhvyydavssrzrkvlbd:%23Foguete1000@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`

---

## 3. Decisões arquiteturais (não voltar atrás)

| Decisão | Porquê |
|---|---|
| Migração Opção B (client-side + Supabase direto) | Velocidade, menos código, sem servidor intermediário |
| Modo operacional 30 dias | Foco em estabilidade vs expansão |
| Trigger `resolve_user_id()` com self-healing | auth.uid() → users.id confiável |
| `partialize` no Zustand | Persiste só dados não-sensíveis |
| AI Assistant v2 com 16 tools + fallback inteligente | LLM alucinava, fallback constrói resposta dos tool_results |
| `temperature: 0.1` para MiniMax | Era 0.3, ainda alucinava |
| 3-way match tolerance ±5% | Margem realista para erros de arredondamento |
| Auto-match 4 estratégias (SKU/nome/alias/token) | Funciona bem, ver Pontuação |
| REGRA: PREÇOS SEMPRE REAIS | `source='invoice'` ou `'import'` ou `'manual'`, nunca fictício |
| UPSERT em supplier_prices preserva histórico | Trigger em `supplier_price_history` (RECRIADO em 2026-06-23) |
| `security_invoker = true` em views | Força RLS nas views |
| `public.current_user_role()` helper | Mais seguro que `auth.jwt()->user_metadata` |
| Subagentes via SKILL.md + crontab | bug-hunter 4h/dia, security-auditor dom 5h |
| **NÃO apagar fornecedores sem confirmação** | Lesson learned: user revoltou-se em 2026-06 |
| Always recalculate invoice totals from lines | Consistência |
| 3 fornecedores preferidos: Makro, Avoneto, Gergran | + Sumol+Compal |
| WhatsApp SEM preços (só items) | Pedido do user em 2026-06 |
| Vercel deploy via CLI direto | `--force` + `--token` + re-assign domain alias via API |
| Push protection: substituir tokens por placeholders | `<SERVICE_ROLE_KEY_NO_COFRE>` etc. antes de commit |
| Auto-match aceita letras minúsculas (MelFruoo8) | Caso real fatura Avoneto |
| LOTE partido em 2 linhas: juntar antes de parsear | Padrão em faturas PT |
| `IVA%` regex: `(\d{1,2})\s*%` (boundary) | Evita apanhar "91,26" como "9" + desc + "26" |
| `unit_of_measure` enum: `un`/`kg`/`cx` | Mapear antes de inserir |
| `invoice_status` enum: só `matched` funciona | Erro em runtime, ver 2026-06-23 |

---

## 4. Lições aprendidas (NUNCA repetir)

1. **Push protection bypass**: SEMPRE substituir tokens por placeholders ANTES de git add
2. **Não apagar fornecedores**: o user revoltou-se em 2026-06 quando apaguei Alpha Food/Aviludo sem perguntar
3. **PREÇOS SEMPRE REAIS**: NUNCA inventar preços, sempre de fatura/catálogo
4. **Sempre recalcular totais de invoice**: subtotal+IVA ≠ valor que o user lembra
5. **PDFs de fatura quebram linhas**: LOTE partido, QTD partido, juntar antes de parsear
6. **IVA% é boundary**: `(\d{1,2})\s*%` evita apanhar "91,26" como "9" + "1" + "26"
7. **`unit_of_measure` enum em PostgreSQL**: validar valores (`un`/`kg`/`cx`)
8. **`invoice_status` enum restrito**: descobrir via tentativa-erro ou documentation
9. **Trigger pode faltar**: verificar com `information_schema.triggers` antes de confiar
10. **User cansado = delegar tudo**: priorizar "uso diário" > "features novas"
11. **Subagentes = SKILL.md + crontab**: simples, sem state, retomam de qualquer erro

---

## 5. Backlog (não urgente, uso diário já funciona)

### Próximas 2 semanas
- [ ] Módulo de stock (atual + mínimo + ponto de encomeda)
- [ ] CRON que processa uploads de faturas automaticamente
- [ ] Acompanhar bug-hunter cron (próxima: 2026-06-24 04:00)
- [ ] Acompanhar security-auditor cron (próximo: 2026-06-28 05:00)

### Próximo mês
- [ ] Adicionar 6 produtos hortícolas sem preço (Meloa, Tomate Steak, Lombardo, Pimentos V/V, Maçã)
- [ ] Re-implementar parser XLSX server-side (Edge Function)
- [ ] Relatórios de poupança (price trend analysis)

### NÃO fazer (white label, billing, multi-tenant)
- User pediu foco em estabilidade 30 dias
- Não introduzir features de expansão
- Não substituir tecnologias aprovadas

---

## 6. Ficheiros críticos (não tocar sem avisar)

- `supabase/migrations/` — schema e triggers
- `supabase/functions/ai-assistant/index.ts` — AI v2 (16 tools, fallback)
- `frontend/src/app/[locale]/(app)/order/page.tsx` — Pedido Rápido v2
- `frontend/src/lib/supabase-data.ts` — queries e types
- `frontend/src/app/[locale]/(app)/assistant/page.tsx` — AI Assistant UI
- `frontend/src/app/[locale]/(app)/dashboard/page.tsx` — dashboard com alerta preços críticos
- `.mavis/plans/`, `SOUL.md`, `MEMORY.md`, `REPORT.md`

---

## 7. Como retomar o trabalho

```bash
# 1. Ativar ambiente
cd /workspace
source .venv/bin/activate  # se existir

# 2. Verificar saúde
curl -sL https://compra-facil-hoteis.vercel.app/pt-PT/status | grep -o 'Tudo OK\|A verificar\|Erro'
mavis cron list  # ver crons ativos

# 3. Conectar à DB
psql "postgresql://postgres.fpjhvyydavssrzrkvlbd:%23Foguete1000@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"

# 4. Verificar logs
gh run list --limit 5  # CI
```

---

**TL;DR para Mavis:** Sistema pronto para uso diário. Health 98%. Crons ativos. Fatura Avoneto processada. Documentação atualizada. Próxima ação do user: começar a usar no dia-a-dia (ver GUIA_USO_DIARIO.md).
