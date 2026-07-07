---
name: fable5-review
description: Code review usando Claude Fable 5 (Anthropic Mythos-class). Para auditoria profunda de código, especialmente em projetos grandes/long-running. Usar quando o user pedir "review profundo", "auditoria Mythos", "revisão com Fable 5", ou "code review rigoroso".
---

# Fable 5 Review

Usa Claude Fable 5 (Anthropic Mythos-class) para fazer code review profundo via Claude Code CLI.

## Quando usar
- Auditar parsers/algoritmos com lógica complexa
- Caçar bugs subtis em 100+ linhas
- Validar arquitetura antes de merge
- Procurar race conditions, off-by-one, edge cases

## Comando base
```bash
claude --model claude-fable-5 "<prompt de review>"
```

## Prompts pré-feitos

### Para Pedido Rápido (parseOrderText)
```bash
claude --model claude-fable-5 "
  Audita lib/supabase-data.ts:413-470 (parseOrderText).
  
  Foco em:
  1. Match loop: usa norm.includes(alias) — quebra no PRIMEIRO match do Map.
     Isto causa falsos positivos quando há 'leite' e 'leite condensado'.
     Recomendar word boundary ou scoring por overlap.
  2. Regex /^\d+... não captura unidades (kg/l/cl/ml) separadamente.
     '1kg carne' vira produto='kg carne'.
  3. doParse() chama setItems(r.items) substituindo tudo.
     Recomendar merge com items existentes por product_id.
  
  Devolve findings com file:line, severity, fix concreto.
"
```

### Para Race Conditions em Cart
```bash
claude --model claude-fable-5 "
  Audita frontend/src/stores/cart.ts e o useEffect em app/order/page.tsx:51-67.
  
  Procurar:
  1. addItem() agrupa por product_id — mas se product_id='' agrupa TODOS sem match
  2. useEffect depende de [cartItems.length === 0] (boolean) — ciclos true/false
     podem não disparar re-render quando esperado
  3. Zustand persist com versão — se schema mudar, items antigos persistidos
  
  Devolve findings com fix mínimo (ponytail-friendly).
"
```

## Custos (importante)
- $10/M input · $50/M output
- ~10k LOC review = ~$0.50-2.00
- **HOJE 7 julho** = 50% incluído em Pro/Max
- Após 7 julho = usage credits necessários

## Quando NÃO usar
- Review de 1 linha ou 1 ficheiro <50 LOC — Sonnet/Opus é suficiente
- Tasks triviais (YAGNI = o próprio Fable 5 dir-te-ia para usar modelo mais barato)
