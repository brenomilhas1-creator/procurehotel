# PONYTAIL DEBT LEDGER

> Shortcuts marked with `ponytail:` comments during refactor massivo 2026-06-29.
> Per skill: `ponytail: <ceiling>, <upgrade path>`

| File | Line | Shortcut | Ceiling | Upgrade trigger |
|---|---|---|---|---|
| `frontend/src/hooks/useAsync.ts` | retry | retries=2 fixed | linear backoff | "if many transient failures" — add exponential+jitter |
| `frontend/src/lib/logger.ts` | maxBuffer=100 | in-memory only, session-scoped | "loses logs on refresh" | upgrade to IndexedDB for cross-session search |
| `frontend/src/lib/queue.ts` | retry_base_ms=5000 | linear backoff, single-user | "concurrent users >10" | add exponential+jitter + per-user queue |
| `frontend/src/lib/mini-rag.ts` | TF-IDF | lexical, not semantic | "vocabulary mismatch (synonyms)" | upgrade to OpenAI embeddings + pgvector when hit-rate < 70% |

Total: 4 markers, 0 with no-trigger. All have explicit upgrade paths.
