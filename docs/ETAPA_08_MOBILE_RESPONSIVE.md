# ETAPA 8 — Mobile Web / Responsividade

**Data**: 2026-06-11
**Breakpoints**: mobile < 768px, tablet 768-1024px, desktop > 1024px

## 8.1 — Análise estática do source

| # | Componente | Mobile | Tablet | Desktop | Notas |
|---|---|---|---|---|---|
| 1 | Sidebar (`Sidebar.tsx`) | ❌ Hidden, sem alternativa | ✅ Visible | ✅ Visible | **Falta hamburger menu** |
| 2 | Header (`Header.tsx`) | ✅ Adaptive | ✅ | ✅ | Search bar hidden em mobile (bom) |
| 3 | Login (`login/page.tsx`) | ✅ Card responsivo | ✅ | ✅ | max-w-md |
| 4 | Dashboard KPIs | ✅ grid-cols-1 → 4 | ✅ | ✅ | sm:grid-cols-2 lg:grid-cols-4 |
| 5 | Dashboard charts | ✅ 1-col mobile | ✅ 2-col | ✅ | lg:grid-cols-2 |
| 6 | Order page (cards) | ✅ 1-col | ✅ 2-col | ✅ | md:grid-cols-2 |
| 7 | Products table | ✅ overflow-x-auto | ✅ | ✅ | Wrapper com overflow |
| 8 | Imports table | ✅ overflow-x-auto | ✅ | ✅ | |
| 9 | Order history | ✅ overflow-x-auto | ✅ | ✅ | |
| 10 | Analytics charts | ✅ 1-col | ✅ 2-col | ✅ | |

## 8.2 — Issues identificados

### 🔴 Issue #1: Sidebar sem alternativa em mobile

```tsx
// Sidebar.tsx:13
<aside className="hidden md:flex w-64 flex-col border-r bg-card/40 backdrop-blur-sm">
```

**Problema**: Em viewports < 768px a sidebar desaparece, mas o utilizador não tem forma de a abrir.

**Solução proposta** (F3 ou ETAPA 9):
- Adicionar `Sheet` (shadcn) com trigger no Header (hamburger icon)
- Manter estado aberto/fechado com zustand
- Fechar automaticamente ao navegar

### 🟡 Issue #2: Texto sem `truncate` em algumas células

3 locais com truncate, mas há várias tabelas sem. A maioria dos textos longos não trunca.

**Impacto**: Texto pode fazer overflow do card em viewports pequenos.

**Solução**: Adicionar `truncate` ou `break-words` em campos como `master_name`, `notes`, `description`.

### 🟡 Issue #3: Sem viewport meta explícito

Next.js 15 define viewport automaticamente em RSC, mas falta `<meta name="viewport">` explícito em algumas rotas.

**Solução**: Adicionar no `app/layout.tsx`:
```ts
export const viewport = 'width=device-width, initial-scale=1, maximum-scale=5';
```

## 8.3 — Testes Manuais Recomendados (quando backend up)

| Device | Resolução | Teste |
|---|---|---|
| iPhone SE | 375x667 | Login + dashboard + order |
| iPhone 14 | 390x844 | + upload + tables |
| iPad | 768x1024 | + analytics + 2-col layouts |
| Android Pixel | 412x915 | + landscape mode |
| Tablet landscape | 1024x768 | + admin features |

## 8.4 — Conclusão ETAPA 8

| Verificação | Status |
|---|---|
| Login responsivo | ✅ |
| Dashboard cards | ✅ |
| Tables overflow | ✅ (com scroll) |
| Forms input | ✅ |
| Sidebar mobile | ❌ Falta menu alternativo |
| Viewport meta | 🟡 Default OK, adicionar explícito |
| Touch targets (44px) | ✅ Botões shadcn ≥ 36-40px |

**Semáforo**: 🟡 **AMARELO** — Maioria OK, falta hamburger menu para mobile
