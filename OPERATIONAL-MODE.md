# Modo Operacional · 30 dias

**Data de início**: 2026-06-11  
**Versão**: 0.7.0  
**Foco**: Uso real, métricas, bugs, melhorias de UX

---

## 🎯 Objetivos dos próximos 30 dias

1. **Usar o sistema diariamente** em compras reais (1-2 hotéis piloto)
2. **Recolher métricas** reais de utilização
3. **Identificar gargalos** operacionais
4. **Corrigir bugs** rapidamente (mesmo dia)
5. **Reduzir cliques e tempo** em cada interação

## ⏸️ SUSPENSO

| Tema | Estado |
|---|---|
| White Label | ❌ Não desenvolver |
| Multi-tenant | ❌ Não desenvolver |
| Billing | ❌ Não desenvolver |
| Expansão comercial | ❌ Não desenvolver |
| Funcionalidades futuras | ❌ Só após decisão de 30 dias |

## ✅ PRONTOS (verificados 2026-06-11)

| Item | Onde |
|---|---|
| **CI/CD GitHub Actions** | `.github/workflows/ci.yml` + `e2e.yml` — verde |
| **17 testes E2E Playwright** | `frontend/tests/e2e/` — verde |
| **Sentry setup** | `sentry.client.config.ts` + `sentry.server.config.ts` + `instrumentation.ts` — DSN opcional |
| **Uptime Monitoring** | `UPTIME-MONITORING.md` (guia) + `/api/health` (endpoint público) |
| **Status em tempo real** | `/pt-PT/status` (5 health checks, auto-refresh 30s) |
| **Health endpoint público** | `/api/health` (sem auth, para UptimeRobot) |
| **Painel Operacional** | `/pt-PT/operational` (métricas agregadas) |
| **Recolha de eventos** | `usage_events` table + `trackEvent()` helper (instrumentado) |

## 📊 O que está a ser medido

Através de `trackEvent()` em pontos críticos:

| Evento | Onde | Porquê |
|---|---|---|
| `login` | `login/page.tsx` | Saber frequência de uso |
| `order_created` | `order/page.tsx` (doCommit) | Contar ordens + tempo |
| `favorite_used` | `favorites/page.tsx` | Saber se o 1-clique está a ser usado |
| `favorite_created` | `favorites/page.tsx` (save) | Quantos conjuntos definem |
| `import_uploaded` | `imports/page.tsx` | Frequência de updates |
| `error` | login + outros | Taxa de erro |

## 📈 Painel Operacional (`/pt-PT/operational`)

Consolida em 7 secções:

1. **💰 Economia** — gasto, poupança, ticket médio, items
2. **⏱️ Tempo Poupado** — logins, eventos, utilizadores ativos
3. **🗄️ Qualidade da Base** — sem preço, sem categoria, stale, duplicados, score
4. **🤖 Precisão da IA** — match automático, para rever, taxa
5. **📋 Pendentes** — OCR, aprovações, total
6. **🚦 Recomendações** — geradas automaticamente com base em dados
7. **🛡️ Estabilidade** — sistema, CI/CD, Sentry, Uptime

## 📏 Métricas de Sucesso

| KPI | Como medir | Meta |
|---|---|---|
| **Tempo poupado** | `usage_events` (35 min/ordem × ordens criadas) | > 5h/semana |
| **Dinheiro poupado** | `getRealEconomy` (diferença vs melhor preço) | > 5% gasto |
| **Trabalho manual reduzido** | Uploads via /imports vs transcrição manual | < 30 min/semana |
| **Estabilidade** | Sentry + UptimeRobot | 99.5% uptime |

## 🔄 Cadência

| Frequência | O quê |
|---|---|
| **Diário** | Usar o sistema em compras reais. Anotar bugs/melhorias no chat |
| **A cada 2-3 dias** | Eu (MiniMax) revejo os `usage_events` e ajusto |
| **Semanal** | Resumo rápido: "X ordens, Y minutos poupados, Z bugs corrigidos" |
| **Aos 30 dias** | Relatório final com ROI, precisão IA, problemas, melhorias |

## 📋 Template — Report Semanal

```markdown
# Semana N — Relatório Operacional

## Métricas (7 dias)
- Ordens criadas: X
- Favoritos usados: Y
- Uploads: Z
- Logins: W
- Eventos totais: V

## Economia
- Gasto: €X
- Poupança estimada: €Y (X%)

## Bugs encontrados (resolvidos / pendentes)
- [Resolvido] /order: qty input não atualizava — corrigido 2026-06-15
- [Pendente] /imports: PDF grande (>5MB) demora — em F4

## Melhorias aplicadas
- /catalog: pesquisa agora match em alias, não só master_name
- /favorites: atalho "K" cria novo favorito

## Próxima semana
- Focar em: [área prioritária]
```

## 🎯 Próximas acções (sem features novas)

| # | Acção | Trigger |
|---|---|---|
| 1 | Corrigir bug X | Quando user reportar |
| 2 | Melhorar UX em Y | Quando user pedir |
| 3 | Adicionar atalho Z | Quando user pedir |
| 4 | Instrumentar evento W | Quando user pedir |

## ❌ NÃO fazer (próximos 30 dias)

- ❌ OCR completo (só se análise de fluxo de fornecedores justificar)
- ❌ White label
- ❌ Multi-tenant
- ❌ Billing
- ❌ Mobile app
- ❌ Integrações ERP
- ❌ Webhooks
- ❌ API pública
- ❌ SSO (Google/Microsoft)

## 📈 Decisão sobre F4 (OCR) — só no fim dos 30 dias

| Se a maioria dos preços vier em... | Decisão |
|---|---|
| PDF / foto | Implementar OCR (~14h) |
| Excel / CSV | Não implementar |
| Misto | Implementação híbrida (CSV automático, PDF com revisão) |

## 📋 Compromissos

- **Eu (MiniMax)**: reporto bugs em < 24h, melhoramentos incrementais, sem features novas
- **Tu**: usas o sistema diariamente, anotas problemas no chat, priorizas o que importa
- **Ambos**: ao fim de 30 dias, decidimos juntos o que entra em F4 com base em dados reais
