# Fase 3 — Operação Real

**Data**: 2026-06-11
**Foco**: Utilidade diária. Sem SaaS, sem expansão, sem features futuristas.

---

## Os 10 Módulos Entregues

| # | Módulo | Página | O que faz |
|---|---|---|---|
| 1 | **Catálogo Mestre** | `/pt-PT/catalog` | Lista de produtos com aliases, fornecedores e última atualização de preço |
| 2 | **Revisão de Preços** | `/pt-PT/prices` | Painel com 3 cards (crítico/aviso/sem preço) + lista filtrada |
| 3 | **Saúde da Base** | `/pt-PT/health` | Score 0-100% + issues priorizados + estatísticas |
| 4 | **Pedido Inteligente** | `/pt-PT/order` | **Autocomplete ERP** ao pesquisar (estilo SAP) + modo texto livre |
| 5 | **Favoritos** | `/pt-PT/favorites` | Pedidos rápidos 1-clique. Lista predefinida reutilizável |
| 6 | **Histórico Real** | `/pt-PT/orders` | Lista de ordens com expand para ver items + botão Repetir |
| 7 | **Economia Real** | `/pt-PT/roi` | **3 números** (Comprado / Melhor Preço / Economia) + seletor de período |
| 8 | **Compras Repetidas** | Dashboard + `/favorites` | Items mais comprados + botão "Repetir" |
| 9 | **OCR** | `/pt-PT/imports` | Upload para Storage + status pendente visível em Exceções |
| 10 | **Centro de Exceções** | `/pt-PT/exceptions` | Painel agregado com 5 tabs (stale / sem preço / sem cat / OCR / aprovação) |

---

## Decisões de Design

- **Tudo client-side + Supabase** (sem backend)
- **OCR completo** (revisão linha a linha com confiança) fica para **F4** — por agora upload + fila + visibilidade em Exceções
- **Sem LLM** para parse de texto — heurística com aliases é suficiente
- **3 números no ROI** em vez de 50 gráficos
- **Sidebar reorganizado** por ordem de uso operacional (Pedido Rápido primeiro)

---

## Schema Adicionado

```sql
CREATE TABLE public.favorites (
  id uuid PRIMARY KEY,
  user_id uuid,
  name text,
  description text,
  items jsonb,  -- array de {product_id, product_name, quantity, unit_price}
  use_count int,
  last_used_at timestamptz,
  created_at timestamptz
);
```

RLS: user vê/edita os seus; admin vê todos.

---

## Como Usar (fluxo diário)

1. **Entrar** → https://compra-facil-hoteis.vercel.app
2. **Pedido Rápido** → pesquisa "coca" → escolhe → ajusta quantidade → repete
3. Ou **Favoritos** → 1-clique num conjunto (ex: "Pequeno Almoço")
4. **Confirmar** → grava ordem
5. **Histórico** → ver ordens + clicar "Repetir" se quiser pedir igual
6. **Preços** → ver o que precisa de atualizar (>30/90 dias)
7. **Exceções** → resolver o que está pendente
8. **Saúde** → ver o score da base
9. **Economia** → ver quanto poupou no mês

---

## Dados atuais (estado operacional)

- Produtos: 0 (pronto para injetar)
- Fornecedores: 0
- Aliases: 0
- Preços: 0
- Ordens: 0
- Users: 3 (admin + 2 teste)

**Sistema 100% limpo para dados reais.**
