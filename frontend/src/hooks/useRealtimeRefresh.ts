'use client';

import { useEffect, useRef } from 'react';
import { getSupabase } from '@/lib/supabase';

type TableName = 'invoices' | 'invoice_lines' | 'supplier_prices' | 'supplier_price_history' | 'purchase_orders' | 'products' | 'imports';

/**
 * Hook para auto-refresh baseado em Supabase Realtime.
 *
 * Subscreve a postgres_changes nas tabelas indicadas.
 * Quando há INSERT/UPDATE/DELETE, dispara callback (debounced).
 *
 * Uso:
 *   useRealtimeRefresh({
 *     tables: ['invoices', 'supplier_prices'],
 *     onChange: () => refetch(),
 *   });
 */
export function useRealtimeRefresh(opts: {
  tables: TableName[];
  onChange: () => void | Promise<void>;
  debounceMs?: number;
  enabled?: boolean;
}) {
  const { tables, onChange, debounceMs = 1500, enabled = true } = opts;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    const sb = getSupabase();
    if (!sb) return;

    const channel = sb
      .channel(`realtime-${tables.join('-')}`)
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public' },
        (payload: any) => {
          // Verificar se a tabela está nas que nos interessam
          const tbl = payload?.table;
          if (tbl && tables.includes(tbl)) {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
              onChange();
            }, debounceMs);
          }
        }
      )
      .subscribe();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      sb.removeChannel(channel);
    };
  }, [tables.join(','), debounceMs, enabled]);
}
