# Análise: Como Recebes Preços dos Fornecedores?

Para decidir **se vale a pena investir em OCR**, preciso de saber como realmente recebes as atualizações de preço.

## Questionário

Marca as opções que se aplicam ao teu fluxo:

### 1. **Como é que os fornecedores te enviam preços?**

- [ ] **Email com PDF** (fatura digital, catálogo, tabela)
- [ ] **Email com Excel/CSV** (ficheiro editável)
- [ ] **WhatsApp com foto do papel** (recibo, lista escrita à mão)
- [ ] **Portal do fornecedor** (login no site deles, download manual)
- [ ] **Vendedor entrega em papel** (visita, papel físico)
- [ ] **Ligar para o fornecedor** (telefone, anoto os preços)
- [ ] **API do fornecedor** (sistema deles envia para o nosso)
- [ ] **Nenhuma atualização frequente** (preços são estáveis)

### 2. **Com que frequência recebes atualizações?**

- [ ] Diariamente
- [ ] Semanalmente
- [ ] Mensalmente
- [ ] Trimestralmente
- [ ] Raramente (1-2x/ano)

### 3. **Quantos fornecedores diferentes usas?**

- [ ] 1-3
- [ ] 4-10
- [ ] 11-30
- [ ] 30+

### 4. **Quanto tempo dedicas atualmente a inserir/atualizar preços?**

- [ ] Menos de 30 min/semana
- [ ] 30 min - 2h/semana
- [ ] 2-5h/semana
- [ ] Mais de 5h/semana
- [ ] É um inferno

### 5. **Os preços mudam muito?**

- [ ] Sim, muito (semanais ou diárias)
- [ ] Sim, moderadamente (mensais)
- [ ] Raramente (estáveis)
- [ ] Depende do produto (bebidas sim, limpeza não)

### 6. **Se pudesses digitalizar isto automaticamente, o que farias com o tempo poupado?**

- [ ] Procurar outros fornecedores com melhores preços
- [ ] Fazer mais reuniões com clientes
- [ ] Operacional (limpar, organizar)
- [ ] Outra: _______

---

## Árvore de Decisão

```
Chegam-te preços em papel/PDF/foto com frequência?
├─ SIM, +5h por semana a transcrever → 🔴 OCR vale MUITO a pena
│   └─ ROI: 5h × €20/h × 4 semanas = €400/mês
│       OCR custa €5-10/mês (Google Vision) ou 0€ (Tesseract.js)
│       Payback: 1-2 meses
│
├─ SIM, mas 1-2h por semana → 🟡 OCR vale a pena
│   └─ ROI: 1.5h × €20/h × 4 = €120/mês
│       Payback: 3-6 meses
│
├─ SIM, mas raramente (mensal/trimestral) → 🟢 OCR é nice-to-have
│   └─ Transcrição manual de 30min/mês = €20/mês
│       Payback: 1+ ano
│
└─ NÃO, recebo em digital editável → 🟢 OCR NÃO vale a pena
    └─ Já tens Excel/CSV, basta drag-and-drop
```

## Resposta por defeito (mercado PT hotelaria)

| Canal | % estimado |
|---|---|
| Email com PDF | 40% |
| Email com Excel/CSV | 20% |
| Portal do fornecedor (download) | 15% |
| Vendedor (papel/foto) | 15% |
| WhatsApp | 5% |
| API | 5% |

Para um **hotel médio** (5-15 fornecedores, atualizações mensais): **40-60% dos preços chegam em formatos não-editáveis (PDF/foto)**. OCR faz sentido.

## Como preencher

Copia este questionário, responde, e manda-me. Vou:

1. **Calcular ROI** real com base nas tuas respostas
2. **Recomendar** o tipo de OCR (Tesseract.js grátis vs Google Vision pago)
3. **Priorizar** a implementação
