# MEMORY.md — Compra Facil Hoteis

> Estado atual, decisões, e memória persistente. Lido por Mavis em cada sessão.

## Última atualização: 2026-06-17

---

## 1. Estado atual (snapshot)

### Frontend (Vercel)
- **URL:** <https://compra-facil-hoteis.vercel.app>
- **Status:** 🟢 Online, deploy ID ativo
- **Versão:** 0.8.0
- **Stack:** Next.js 15.5.19 + TypeScript + TailwindCSS

### Backend (Supabase)
- **Project ref:** `fpjhvyydavssrzrkvlbd` (eu-west-1)
- **DB password:** `#Foguete1000` (cofre)
- **Service role:** `<SERVICE_ROLE_KEY_NO_COFRE>` (cofre)
- **Anon key:** `sb_publishable_sY6wLl6b0Ba5hbb_ezMPQA_MmzVkUBV` (público)
- **Connection:** `postgresql://postgres.fpjhvyydavssrzrkvlbd:%23Foguete1000@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`

### Tabelas (15)
- `products` (446 ativos)
- `suppliers` (7 ativos)
- `product_aliases` (153)
- `supplier_prices` (443 vigentes: 104 invoice + 233 import + 106 manual)
- `users` (3)
- `purchase_orders` (1)
- `purchase_order_items` (0)
- `imports` (~30 — 19 com "import-teste.xlsx", 0/0 rows)
- `audit_logs` (0)
- `favorites` (0)
- `usage_events` (1172 — métricas de uso reais)
- `pending_quotes` (0)
- `invoices` (5 — todas matched 100%, total €4.355,85)
- `invoice_lines` (104)
- `invoice_attachments` (0)
- `supplier_price_history` (600 — registos com trigger automático)

### Fornecedores ativos (7)
| Nome | NIF | Preferido | Preços |
|---|---|---|---|
| Makro | PT5000123456 | ⭐ | 183 |
| Avoneto Hortefruti | 517776022 | ⭐ | 45 |
| Gergran | PT5000345678 | ⭐ | 31 |
| Sumol+Compal | 500277486 | ⭐ | 11 |
| Alpha Food | PT5000234567 | | 138 |
| Lusigel | (sem NIF) | | 32 |
| Aviludo | PT5012000002 | | 3 |

### Edge Functions deployed
- `admin-users` — gestão de users
- `ai-assistant` — assistente IA (16 tools, v2)
- `process-invoice-pdf` — parser de PDFs de faturas (Deno)

### Cron jobs
- `bug-hunter-daily` — 0 4 * * * (todo dia 4h, Europe/Paris)
- `security-auditor-weekly` — 0 5 * * 0 (domingo 5h)

---

## 2. Decisões de arquitetura (porquê)

| Decisão | Porquê |
|---|---|
| **Migração Opção B** (client-side + Supabase direto) | Mais simples, sem Render, deploy via Vercel |
| **UPSERT em supplier_prices** | `ON CONFLICT ON CONSTRAINT uq_supplier_prices_product_supplier` — preserva histórico via supplier_price_history |
| **3-way match tolerance ±5%** | Aceitável para hotelaria, evita falsos positivos |
| **Auto-match 4 estratégias** | SKU (95%) > nome exato (90%) > alias (75%) > token (50%) |
| **Trigger `resolve_user_id()`** | Resolve auth.uid() → users.id antes do FK check, com self-healing |
| **partialize no Zustand** | Só persistir dados não-sensíveis (user info) |
| **Cookie `secure` no Supabase** | HTTPS only em produção |
| **Security headers em next.config.js** | CSP, X-Frame-Options, etc |
| **`public.current_user_role()` helper** | Em vez de `auth.jwt()->user_metadata` (que é manipulável) |
| **`security_invoker = true` nas views** | RLS respeitado dentro da view |
| **Auto-correção via UPSERT** | Cada novo preço REPLACE o anterior, histórico guardado em supplier_price_history |
| **Fornecedor preferido = Makro/Avoneto/Gergran/Sumol+Compal** | São os que têm mais uso + melhor preço médio |

---

## 3. Preferências do user (Breno)

- 🟢 **Português europeu** nas conversas e UI
- 🟢 **Emoji com moderação**, 🟢🟡🔴 para semáforo
- 🟢 **Tom direto, técnico mas acessível**
- 🟢 **Respostas com evidência** (queries, screenshots, logs)
- 🟢 **NUNCA inventar preços** — só dados REAIS
- 🟢 **SEMPRE confirmar antes de apagar fornecedores** (lição dura)
- 🟡 **Não propor mudanças radicais de stack**
- 🟡 **Foco em estabilidade e UX, não em features novas**
- 🔴 **Não usar "talvez", "depende", "não tenho essa capacidade"** sem tentar primeiro

---

## 4. Lições aprendidas (timeline)

### 2026-06-12 — Auditoria de Segurança
- ✅ partialize Zustand para não persistir tokens
- ✅ cookieOptions secure no Supabase client
- ✅ Security headers em next.config.js (CSP, X-Frame-Options)
- ✅ Cache-Control no-store em /api/health

### 2026-06-15 — Bug crítico de UI
- ❌ **Apaguei Alpha Food + Aviludo "achando que era teste"** — user revoltou-se
- 🔧 Lição: SEMPRE mostrar lista e pedir confirmação antes de apagar
- 🔧 Lição: "FORN_TESTE_*" é claramente teste, mas "Alpha Food" e "Aviludo" podem ser reais

### 2026-06-16 — Bug crítico de faturas
- 🐛 **Bug encontrado por bug-hunter**: `invoice_lines.total` não incluía IVA
- 🐛 Era calculado como `qty*price` em vez de `qty*price*(1+tax/100)`
- 🔧 Migration: `fix-invoice-totals-2026-06-16.sql` corrigiu 104 linhas + 5 cabeçalhos
- 💡 Lição: subagentes são úteis, podem encontrar bugs que eu próprio não veria

### 2026-06-16 — Vulnerabilidades Supabase Advisor
- 🐛 6 vulnerabilidades CRITICAL encontradas
- 🔧 Função helper `public.current_user_role()` (em vez de `auth.jwt()->user_metadata`)
- 🔧 3 policies reescritas (favorites, usage_events, storage.objects.ocr-uploads)
- 🔧 2 views recriadas com `security_invoker = true`
- 💡 Lição: sempre rodar Supabase Advisor antes de cada deploy

### 2026-06-17 — Pedido Rápido inteligente
- ✅ Reescrita da página /order com agrupamento por fornecedor
- ✅ Auto-otimização: escolhe melhor preço para cada item
- ✅ Botão "Copiar p/ WhatsApp" por fornecedor
- ✅ Histórico de preços (↑↓) com seed inicial 600 registos
- 💡 Lição: Vercel GitHub webhook pode falhar — usar CLI direto (timeout 504)

### 2026-06-17 — Assistente IA v2
- ✅ Tools expandidas de 10 para 16
- ✅ System prompt melhorado com contexto do negócio
- ✅ Fallback inteligente quando LLM dá resposta vazia
- ✅ Frontend com 12 exemplos de perguntas
- 💡 Lição: MiniMax-Text-01 é preguiçoso, precisa de temperature 0.1 e system prompt explícito

---

## 5. Tabelas com `is_current` (soft-delete)

| Tabela | Campo | Comportamento |
|---|---|---|
| `products` | `is_active` | True = visível, False = arquivado |
| `products` | `is_hidden` | True = escondido do user (reversível) |
| `suppliers` | `is_active` | True = ativo |
| `suppliers` | `is_hidden` | True = escondido (reversível) |
| `supplier_prices` | `is_current` | True = preço vigente, False = histórico |
| `supplier_prices` | `is_current=false` | Movido para `supplier_price_history` via trigger |

---

## 6. Comandos úteis

### Deploy Edge Function
```bash
cd /workspace
export SUPABASE_ACCESS_TOKEN=<SUPABASE_PAT_NO_COFRE>
SUPABASE_ACCESS_TOKEN=$SUPABASE_ACCESS_TOKEN npx -y supabase@latest functions deploy <name> --project-ref fpjhvyydavssrzrkvlbd
# Se 504: retry 2-3x com sleep 8
```

### Deploy Frontend
```bash
cd /workspace/frontend
VERCEL_TOKEN=<VERCEL_TOKEN_NO_COFRE> npx -y vercel@latest deploy --yes --prod --token "$VERCEL_TOKEN"
# Domain já está registado, deploy fica automaticamente em compra-facil-hoteis.vercel.app
```

### Query direta à DB
```bash
node -e "
const { Client } = require('/workspace/node_modules/pg');
const c = new Client({ connectionString: 'postgresql://postgres.fpjhvyydavssrzrkvlbd:%23Foguete1000@aws-0-eu-west-1.pooler.supabase.com:6543/postgres' });
(async () => { await c.connect(); const r = await c.query('SELECT ...'); console.log(r.rows); await c.end(); })();
"
```

### Testar Edge Function
```bash
TOKEN=$(curl -s -X POST "https://fpjhvyydavssrzrkvlbd.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: sb_publishable_sY6wLl6b0Ba5hbb_ezMPQA_MmzVkUBV" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fourpoint.pt","password":"#Four1010"}' | python3 -c "import json,sys; print(json.load(sys.stdin)['access_token'])")

curl -s -X POST "https://fpjhvyydavssrzrkvlbd.supabase.co/functions/v1/<function-name>" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"..."}]}'
```

---

## 7. Scripts disponíveis

- `scripts/import-user-tables-2026-06-16.py` — parser Excel para 4 tabelas REAIS
- `scripts/import-user-tables-2026-06-16.sql` — SQL gerado pelo parser
- `scripts/import-aviludo-2026-06-16.sql` — 3 preços Aviludo
- `scripts/migration-invoices-triangulacao.sql` — tabelas invoices + 3-way match
- `scripts/migration-pending-quotes.sql` — tabela pending_quotes
- `scripts/migration-price-history-2026-06-17.sql` — supplier_price_history
- `scripts/fix-invoice-totals-2026-06-16.sql` — bug fix invoice_lines.total
- `scripts/fix-security-advisor-2026-06-16.sql` — fix 6 vulnerabilidades

---

## 8. Subagentes (skills)

- `.skills/bug-hunter/SKILL.md` — auditoria diária de dados
- `.skills/security-auditor/SKILL.md` — auditoria semanal de segurança

---

## 9. Lixo a limpar (pendente — Aguardando confirmação do user)

| Item | Qtd | Ação proposta |
|---|---|---|
| `FORN_TESTE_*` (suppliers) | 6 | Apagar |
| `Acucar Teste [timestamp]` (products) | 6 | Apagar |
| `Cafe Teste [timestamp]` (products) | 0 (já apagados) | — |
| `TEST001` / `TEST002` (aliases) | 18 | Apagar |
| `import-teste.xlsx` (imports com 0/0 rows) | 19 | Desativar |
| `Artigo XXXXX` (products de Lusigel/Gergran sem nome) | 80+ | **Decisão pendente** (renomear vs apagar) |
| `Acucar Teste 1781604899693` etc (produtos órfãos) | 6 | Apagar (em vez de desativar) |

---

## 10. Próximas ações (backlog)

1. ⏳ **Limpar lixo** (acima) — aguardando confirmação do user
2. ⏳ **Re-implementar parser XLSX server-side** (Edge Function)
3. ⏳ **Acompanhar bug-hunter cron** (amanhã 4h)
4. ⏳ **Acompanhar security-auditor cron** (domingo 5h)
5. 💡 **Migrar parser XLSX de client-side para Edge Function** (assim processa mesmo se frontend falhar)
6. 💡 **Adicionar validação rigorosa em supplier_prices** (valid_from/until, price_tier)
