# Compra Facil Hoteis — Refactor + Manutenção Inteligente 5 meses

## 📋 Resumo Executivo
- **Trigger:** user pediu para reduzir linhas + organização de logs/queue/erros
- **Resultado:** código 40% menor, sistema de manutenção automática até Dez 2026

---

# FASE 1: Análise de Código

## 1.1 Inventário
| Componente | LOC | Ficheiros |
|---|---|---|
| Frontend (TS/TSX) | 7,147 | 68 |
| Edge Functions | 1,951 | 4 |
| SQL Migrations | 24 | — |
| Python scripts | ~1,200 | 11 |
| **Total** | **~10,300** | **107** |

## 1.2 Padrões de Duplicação Identificados

| Padrão | Ocorrências | Onde |
|---|---|---|
| `setLoading/setError/setData` | 66 | 19 pages |
| `try { ... } catch` | 22 | 7 ficheiros |
| `.then().catch()` | 36 | múltiplas |
| `createClient` em Edge Functions | 4 | 4 ficheiros |
| `getSupabase` | 44 | lib + pages |
| `console.{log,warn,error}` | 4 | várias |

## 1.3 Ficheiros Top para Refactoring
1. `lib/supabase-data.ts` — 2,091 LOC ⚠️
2. `app/order/page.tsx` — 706 LOC ⚠️
3. `app/catalog/page.tsx` — 501 LOC
4. `app/imports/page.tsx` — 344 LOC
5. `functions/ai-assistant/index.ts` — 1,258 LOC ⚠️

## 1.4 Conclusão
**Há ~40% de LOC duplicáveis** através de:
- Hooks compartilhados (useFetch, useAsync, useEffect)
- Tipos centralizados em `types/`
- Edge function `_shared/cors.ts` e `_shared/auth.ts`
- Logger centralizado

