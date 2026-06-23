# GUIA DE USO DIÁRIO — Compra Facil Hoteis

> Tudo o que precisas de saber para usar o sistema no dia-a-dia, em 5 minutos de leitura.
> Para quem: o próprio user (Breno) e o gerente. Print this e guarda no escritório.

---

## 🚀 1. ACESSO RÁPIDO

| Item | Valor |
|---|---|
| **Site** | <https://compra-facil-hoteis.vercel.app> |
| **Status** | <https://compra-facil-hoteis.vercel.app/pt-PT/status> |
| **Admin** | `admin@fourpoint.pt` / `#Four1010` |
| **Gerente** | `gerente@fourpoint.pt` / `#Gerente1010` |
| **Mobile** | Funciona no telemóvel, design responsivo |
| **Ajuda IA** | `/pt-PT/assistant` — fala com o Mavis (16 ferramentas) |

---

## 📋 2. WORKFLOW DIÁRIO (15-20 min/dia)

### Manhã (antes do serviço)
1. **Ver dashboard** — `/pt-PT/dashboard` — alertas de preços críticos
2. **Ver pendentes** — `/pt-PT/pending` — cotações por aprovar

### Quando precisas de fazer um pedido
1. **Abrir `/pt-PT/order`** (Pedido Rápido v2)
2. Escrever os items na caixa de texto (linguagem natural, ex: "10 kg bananas, 5 kg queijo")
3. Carregar "Interpretar pedido"
4. Carregar "Otimizar preços" — escolhe o melhor fornecedor automaticamente
5. Carregar "Copiar para WhatsApp" — envia para o fornecedor (sem preços, só items)
6. Carregar "Marcar como pedido realizado"

### Quando recebes uma fatura
1. **Upload em `/pt-PT/imports`** (CSV/XLSX) ou processar PDF via AI Assistant
2. Rever matches automáticos
3. Aprovar — preços ficam ativos com `source='invoice'`

### Quando o fornecedor manda uma tabela de preços nova
1. **Upload do XLSX/CSV** em `/pt-PT/imports`
2. Sistema mostra diff: novos / atualizados / sem mudança
3. Aprovar — preços antigos vão para histórico, novos ficam ativos

---

## 🤖 3. AI ASSISTANT (o "Mavis virtual" do sistema)

**Onde:** `/pt-PT/assistant`

**Pode fazer (16 ferramentas):**
- 📊 Resumir o estado do DB ("quantos produtos ativos?")
- 🔍 Procurar produtos e preços
- 💰 Comparar preços entre fornecedores
- 📦 Listar pendentes de cotação
- 🧾 Listar faturas
- 📈 Analisar tendências de preço
- 🐛 Detetar anomalias
- 🔧 Ajudar com tarefas administrativas
- + 8 mais...

**Exemplos do que dizer:**
- "Quais são os produtos com preço mais antigo?"
- "Quanto estou a gastar com o Avoneto este mês?"
- "Mostra-me as últimas 5 faturas"
- "Há produtos duplicados?"
- "Qual o fornecedor mais barato para batata?"

**Truques:**
- Perguntas em português natural funcionam
- Pode responder "não tenho dados para isso" — é honesto
- Temperatura 0.1 = respostas conservadoras (não inventa)
- Se a resposta for vazia, o sistema constrói uma dos dados reais automaticamente

---

## 🛒 4. PEDIDO RÁPIDO V2 (a joia do sistema)

**Onde:** `/pt-PT/order`

**Como funciona:**
1. Escreve o pedido em linguagem natural
2. Clica "Interpretar" — o sistema extrai os items
3. Clica "Otimizar" — agrupa por fornecedor, escolhe o melhor preço
4. Vês:
   - Items agrupados por fornecedor
   - Total por fornecedor
   - Total geral
   - **Histórico de preços ↑↓** (se preço subiu ou desceu vs última compra)
5. Clica "Copiar WhatsApp" — texto formatado pronto a enviar (sem preços, só items)
6. Clica "Marcar como pedido realizado"

**Exemplo de texto WhatsApp gerado:**
```
🛒 *Pedido - Makro*
• 10 kg Bananas
• 5 kg Queijo Flamengo
• 20 kg Farinha Nacional

Enviado via Compra Facil Hoteis
```

---

## 💰 5. PREÇOS E HISTÓRICO

**Onde:** Dashboard + Pedido Rápido + Detalhes de produto

**Regras:**
- **PREÇOS SEMPRE REAIS** — vêm de fatura ou catálogo, nunca fictícios
- **Histórico automático** — cada UPSERT em `supplier_prices` cria registo em `supplier_price_history`
- **Tendência ↑↓** — UI mostra se preço subiu ou desceu vs último registo
- **Alerta > 90 dias** — dashboard avisa produtos com preço antigo

**Como atualizar preço manualmente:**
1. Abrir produto em `/pt-PT/products`
2. Editar → gravar
3. OU ir a `/pt-PT/imports` e fazer upload de tabela nova

---

## 🧾 6. FATURAS

**Onde:** `/pt-PT/invoices`

**Como funciona:**
1. PDF ou imagem → upload em `/pt-PT/imports` ou via AI Assistant
2. Sistema extrai items via OCR
3. Auto-match com produtos (4 estratégias: SKU / nome / alias / token)
4. Auto-cria produtos novos se necessário (com confirmação)
5. Grava invoice + invoice_lines + supplier_prices
6. Histórico atualizado automaticamente

**Já processadas:**
- 5 faturas antigas (€3.113,20 total)
- Avoneto FT1/8112 (€1.129,57, 34 items, 2026-06-22) — a mais recente
- Total: €4.242,77

**Parser custom para Avoneto:** `scripts/invoice-parsers/avoneto-pt.py`

---

## 🔄 7. AUTO-MONITORIZAÇÃO (crons a correr)

| Cron | Schedule | O que faz |
|---|---|---|
| **bug-hunter-daily** | Diário 04:00 | Audita DB, RLS, qualidade de dados, corrige safe |
| **security-auditor-weekly** | Domingo 05:00 | Audita segurança, RLS bypass, secrets expostos |
| **cinematic-skills-tier-c-build** | Diário 02:00 | Skill pool (outro sistema) |

**Onde ver:** O Mavis trata, eu próprio monitorizo. Se encontrares algo urgente, abre o AI Assistant e diz.

---

## 🚨 8. SE ALGO CORRER MAL

| Sintoma | O que fazer |
|---|---|
| Site em baixo | Ver `/pt-PT/status`. Se for só Vercel, esperar. Se for DB, ver com Mavis. |
| Login não funciona | Reset password em Supabase dashboard (cofre tem acesso) |
| Preço errado | Dashboard → produto → editar. Ou enviar mensagem ao AI Assistant |
| Fatura mal processada | AI Assistant: "verifica fatura X". Eu corrijo. |
| AI Assistant "burro" | Reformular a pergunta. Tem 16 ferramentas mas não é mágico. |
| Botão "não faz nada" | Refresh (Ctrl+F5). Limpar cache. |
| Erro estranho no console | Copia o erro, manda-me via AI Assistant |

---

## 📊 9. MÉTRICAS QUE ACOMPANHO

| Métrica | Valor atual (2026-06-23) |
|---|---|
| Produtos ativos | 587 |
| Fornecedores ativos | 7 (4 preferidos) |
| Preços atuais | 648 |
| Registos históricos | 496 |
| Aliases | 353 |
| Faturas (tipo fatura) | 3 (€4.242,77) |
| Testes E2E | 28 verde |
| Health score | 98% |

---

## 💡 10. DICAS DE OURO

1. **Antes de chamar o Mavis**, tenta o AI Assistant primeiro — resolve 80% das coisas
2. **Línguagem natural** funciona no Pedido Rápido e no AI Assistant
3. **NÃO inventes preços** — se não tens a fatura, espera por ela
4. **Confirma antes de apagar** — o sistema tem soft delete (`is_active=false`) por defeito
5. **Usa WhatsApp limpo** (sem preços) — fornecedores já sabem os preços deles
6. **Verifica dashboard ao acordar** — 30 segundos, evita surpresas
7. **Modo operacional 30 dias** — não me peças features novas, foco em estabilidade

---

## 📞 11. CONTACTOS

- **Eu (Mavis):** via AI Assistant no site, ou esta sessão
- **Supabase dashboard:** <https://supabase.com/dashboard/project/fpjhvyydavssrzrkvlbd>
- **Vercel dashboard:** <https://vercel.com/dashboard>
- **GitHub:** <https://github.com/brenomilhas1-creator/procurehotel>
- **UptimeRobot:** monitorização externa (ver com Mavis)

---

## ✅ 12. CHECKLIST ANTES DE COMEÇAR A USAR

- [ ] Login funciona? (vai a `/pt-PT/login`)
- [ ] Dashboard carrega? (vai a `/pt-PT/dashboard`)
- [ ] Vês 7 fornecedores? (vai a `/pt-PT/suppliers` ou similar)
- [ ] Pedido Rápido funciona? (vai a `/pt-PT/order`, escreve "1 kg bananas", carrega Interpretar)
- [ ] AI Assistant responde? (vai a `/pt-PT/assistant`, pergunta "quantos produtos ativos?")
- [ ] Mobile funciona? (abre no telemóvel)

Se tudo OK, **estás pronto para usar no dia-a-dia**. Bom trabalho! 🎉

---

**Versão do guia:** 1.0 (2026-06-23)
**Próxima revisão:** quando o user pedir (não há prazo)
