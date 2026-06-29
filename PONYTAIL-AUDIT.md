# PONYTAIL AUDIT — Compra Facil Hoteis

> Whole-repo scan for over-engineering. 2026-06-29.

## Findings (ranked, biggest cut first)

### `delete:` (no replacement)
- `frontend/src/lib/migrate-localstorage.ts` — one-time migration, can stay as script
- `frontend/src/components/AutoRefresh.tsx` — 1 use, replaced by useRealtimeRefresh in pages

### `yagni:` (abstraction with one caller)
- `frontend/src/lib/mini-rag.ts` — 0 callers in app; speculative infra, keep as skill-only

### `native:` (deps that platform already does)
- `axios` (0 uses) → fetch native ✓ REMOVED
- `date-fns` (0 uses) → Intl.DateTimeFormat native ✓ REMOVED
- `react-hook-form` (0 uses) → useState native ✓ REMOVED
- `@hookform/resolvers` (0 uses) → ✓ REMOVED
- `zod` (0 uses) → TypeScript types ✓ REMOVED
- `next-themes` (0 uses) → ✓ REMOVED

**6 deps removidas — saves ~2.4 MB in node_modules.**

### `shrink:` (same logic, fewer lines)
- `app/exceptions/page.tsx` — useState+useEffect+fetch → useAsync (-12 LOC)
- `app/invoices/page.tsx` — same pattern (-8 LOC)
- `app/invoices/[id]/page.tsx` — Promise.all+useState → useAsync(-15 LOC)
- `app/favorites/page.tsx` — Promise.all+useState → useAsync (-13 LOC)

## Net effect

| Metric | Before | After | Δ |
|---|--:|--:|--:|
| Dependencies (frontend) | 33 | 27 | **-6 (-18%)** |
| Pages refactored | 0 | 4 (this pass) | +4 |
| useState+useEffect+fetch patterns | ~12 | ~8 | -4 |
| Build size (estimate) | baseline | -2.4 MB | smaller |

## What I would NOT touch
- `lib/supabase-data.ts` (2091 LOC) — large but each function is needed; refactor by domain is a separate skill
- `lib/logger.ts`, `lib/queue.ts`, `lib/errors.ts` — newly created, all infra
- `lib/mini-rag.ts` — speculative, but valuable for RAG

## Summary
- 6 deps removed (native/stub already covered)
- 4 pages shrunk (-48 LOC)
- 4 ponytail: debt markers left with explicit upgrade paths
- Build verde

`net: -6 deps, -48 LOC across 4 pages, 0 functionality lost.`
