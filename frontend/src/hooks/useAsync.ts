'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { log } from '@/lib/logger';
import { classifyError, formatError, withRetry, ErrorKind } from '@/lib/errors';

interface AsyncState<T> {
  data: T | null;
  error: Error | null;
  error_kind: ErrorKind | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

interface AsyncOptions {
  /** Se true, faz retry com backoff em caso de erro. Default: true */
  retry?: boolean;
  /** Se true, executa a função no mount. Default: true */
  immediate?: boolean;
  /** Logger scope */
  scope?: string;
  /** Dependencies — refetch quando muda */
  deps?: any[];
}

/**
 * Hook universal para async operations.
 *
 * @example
 *   const { data, loading, error, refetch } = useAsync(
 *     () => fetchCatalog({ q: query }),
 *     { scope: 'catalog', deps: [query] }
 *   );
 *
 * Reduz ~10 LOC por fetch para 1 LOC.
 */
export function useAsync<T>(fn: () => Promise<T>, opts: AsyncOptions = {}): AsyncState<T> {
  const { retry = true, immediate = true, scope = 'async', deps = [] } = opts;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(immediate);
  const mountedRef = useRef(true);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = retry
        ? await withRetry(fn, { retries: 2, base: 800 })
        : await fn();
      if (mountedRef.current) {
        setData(result);
      }
    } catch (e: any) {
      log.error(scope, 'useAsync_failed', { error: e?.message });
      if (mountedRef.current) {
        setError(e);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    if (immediate) execute();
    return () => { mountedRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute]);

  return {
    data,
    error,
    error_kind: error ? classifyError(error) : null,
    loading,
    refetch: execute,
  };
}
