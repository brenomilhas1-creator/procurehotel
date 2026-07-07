# 🐛 Diagnóstico: Pedido Rápido com Itens Errados

**Data:** 2026-07-06
**Sintomas reportados:** "sistema está acrescentando itens que eu não pedi" + "dificuldade de entender o que pedi"

Investigação feita em `lib/supabase-data.ts:413-470` (parseOrderText) e `app/order/page.tsx` (uso).

---

## 🔴 Bug #1 — Match ambíguo por substring (CRÍTICO)

**Local:** `lib/supabase-data.ts:456`
```ts
for (const [alias, info] of aliasMap.entries()) {
  if (norm.includes(alias) || alias.includes(norm)) {  // ← BUG
    match = info; matchedAlias = alias; break;
  }
}
```

**Problema:** Match puro por substring SEM word boundary + SEM scoring.

**Cenários concretos onde dá match errado:**

| User escreve | Alias existente | Match? | Esperado |
|---|---|---|---|
| `leite` | `leite condensado`, `leite meio gordo` | ❌ match no PRIMEIRO do Map | Devia pedir clarificação |
| `cebola` | `cebola`, `cebola roxa` | ⚠️ matcha qualquer um | Devia dar match ao mais longo |
| `amendoim` | `manteiga de amendoim` (alias) | ❌ match errado | Devia ignorar |
| `açafrão` | `açafrão moido`, `açafrão inteiro` | ⚠️ aleatório | Devia scoring por comprimento |

**Porquê acontece:** `Map.has(alias)` + `for-of` itera por insertion order do JS Set, que vem da ordem do PostgreSQL. Para `aliases` é imprevisível. Para `products`, pode vir ordenado por `master_name` mas a query no DB não força isso.

**Fix:** Implementar scoring:
1. Exigir match de palavra INTEIRA (`\bword\b` regex)
2. Penalizar matches com overlap < 80% do input
3. Escolher o match com MAIOR overlap, não o primeiro

---

## 🟠 Bug #2 — `doParse()` SUBSTITUI tudo (não merge)

**Local:** `app/order/page.tsx:256-264`
```ts
async function doParse() {
  try {
    const r = await parseOrderText(text);
    setItems(r.items);  // ← SUBSTITUI 100% dos items
  }
}
```

**Problema:** Quando user:
1. Adiciona 5 items manualmente (autocomplete ou catálogo)
2. Clica "Adicionar mais" e escreve o 6º no textarea
3. Clica "Parse" para confirmar

→ **Os 5 anteriores SOMEM.** Não há merge com o que já estava em `items`.

**Fix:** O `doParse` deve fazer merge com items existentes em vez de substituir. Outro caminho: `doParse` só opera sobre o que está em `text`, e após parse, faz union por `product_id`.

---

## 🟠 Bug #3 — Regex não isola unidades (kg/l/cl/ml)

**Local:** `lib/supabase-data.ts:441`
```ts
const re = /^([0-9]+(?:[.,][0-9]+)?)\s*(?:x|un|kg|l|cl|ml)?\s*\.?\s*(.+)$/i;
```

**Problema:** O grupo de unidade `(?:x|un|kg|l|cl|ml)?` é OPCIONAL e vem **antes** do produto. Quando user escreve `"1kg carne"`:
- Grupo 1 captura `"1"` (qty)
- `(?:x|un|kg|l|cl|ml)?` **NÃO captura** porque `\s*` consome o espaço antes
- Resto captura `"kg carne"` como produto

**Resultado:** produto vira `"kg carne"` em vez de `"carne"` com unidade `kg`.

**Outro caso:** `"5kg batata"` vira `qty=5, produto="kg batata"`.

**Fix:** Regex deve capturar unidades explicitamente:
```ts
const re = /^([0-9]+(?:[.,][0-9]+)?)\s*(kg|g|l|lt|cl|ml|un|unidades?|x)\s+(.+)$/i
```

---

## 🟡 Bug #4 — Cart pode duplicar quando item existe

**Local:** `frontend/src/stores/cart.ts` (addItem)
```ts
addItem: (item) => {
  const existing = get().items.find((i) => i.product_id === item.product_id);
  if (existing) {
    set({ items: get().items.map((i) => i.product_id === item.product_id
      ? { ...i, quantity: i.quantity + item.quantity }
      : i) });
  } else {
    set({ items: [...get().items, { ...item, added_at: Date.now() }] });
  }
}
```

**Problema:** Se o user adiciona um produto que JÁ estava no carrinho mas com quantity diferente, o logic de soma funciona. MAS se user adiciona o MESMO item vindo de lugares DIFERENTES (autocomplete vs catálogo vs favorits), o match por `product_id` é OK.

**Mas há um caso edge:** se `product_id = ""` (string vazia) vindo de algum fallback (item manual sem match), TODOS os items sem match agrupam como o "mesmo".

**Fix:** Validar `product_id` antes de fazer o find. Se vazio, não agrupar.

---

## 🟡 Bug #5 — useEffect `[cartItems.length === 0]` é frgil

**Local:** `app/order/page.tsx:67`
```ts
useEffect(() => {
  if (cartItems.length > 0 && items.length === 0 && text === '') {
    /* popula items do cart */
  }
}, [cartItems.length === 0]);  // ← dependência é BOOLEAN
```

**Problema:** A dependência é o **booleano**, não o número:
- `cartItems.length` vai 0 → 1 → 0 → 1
- Boolean vai: `true → false → true → false`

Na renderização 4 (length=1 depois de um cycle), o boolean já é `false` (mesma que render 2). React **não** dispara useEffect porque a dependência não mudou.

Resultado: items não repopulam se user limpa tudo e re-adiciona.

**Fix:** Mudar dependência para `cartItems.length` (number), não o boolean. Ou usar `cartItems` direto.

---

## 🟡 Bug #6 — empty match faz `needs_review: true` mas continua na lista

**Local:** `lib/supabase-data.ts:464`
```ts
items.push({
  ...
  product_id: match?.product_id || null,  // ← null se no match
  needs_review: !match,                   // ← true se no match
});
```

**Problema:** Items sem match vão para a lista final, mas a UI pode colocá-los no carrinho. User vê "item X" mas o carrinho tem "item X" como raw_line sem preço. Resultado: aparece como fantasma.

**Fix:** Separar UI — items sem match ficam em "Revisão necessária" e NÃO contam como produto do carrinho até serem confirmados pelo user.

---

## 📊 Resumo

| # | Severidade | Local | Efeito no user |
|---|---|---|---|
| 1 | 🔴 Crítico | `parseOrderText` linha 456 | Match errado (leite→leite condensado) |
| 2 | 🟠 Alto | `doParse` linha 260 | Items somem após clique "Parse" |
| 3 | 🟠 Alto | regex linha 441 | "1kg carne" vira produto "kg carne" |
| 4 | 🟡 Médio | `cart.addItem` | Possível duplicação |
| 5 | 🟡 Médio | useEffect dep | Items somem após refresh+add |
| 6 | 🟡 Médio | needs_review | Items fantasmas sem match |

---

## 🎯 Plano de correção

**Ordem correta de implementação:**

1. **Bug #1 (match scoring)** — corrigir `parseOrderText` com regex de word boundary + algoritmo de scoring
2. **Bug #3 (regex unidades)** — corrigir regex para separar unidades
3. **Bug #2 (doParse merge)** — alterar para fazer merge com items existentes
4. **Bug #5 (useEffect)** — mudar dependência
5. **Bug #6 (needs_review)** — separar UI items sem match
6. **Bug #4 (cart dedupe)** — validar product_id antes

Após fixes:
- Testar com cenários reais (leite, cebola, kg, etc.)
- Sinal verde
- ENTRAR faturas → parser melhor → adicionar novos items → testes

---

**Pronto para implementar. Aguardando:**
1. Aprovação para iniciar os fixes (ou ajustes de prioridade)
2. Envio das faturas para processar (incluir novos items no catálogo)
