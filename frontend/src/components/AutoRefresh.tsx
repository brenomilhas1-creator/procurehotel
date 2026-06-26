'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { toast } from 'sonner';

/**
 * Componente invisível que faz auto-refresh da página
 * quando há mudanças em tabelas relevantes.
 *
 * Aparece um toast discreto para o user saber.
 */
export function AutoRefresh({
  tables,
  label = 'Dados atualizados',
  enabled = true,
}: {
  tables: ('invoices' | 'invoice_lines' | 'supplier_prices' | 'supplier_price_history' | 'purchase_orders' | 'products' | 'imports')[];
  label?: string;
  enabled?: boolean;
}) {
  const router = useRouter();

  useRealtimeRefresh({
    tables,
    onChange: () => {
      router.refresh();
      // Pequeno toast para informar (só se for a primeira vez)
      if (!sessionStorage.getItem('cf.last-realtime')) {
        toast.success(label, { duration: 2000 });
        sessionStorage.setItem('cf.last-realtime', Date.now().toString());
      } else {
        // Reset a cada 5 min
        const last = parseInt(sessionStorage.getItem('cf.last-realtime') || '0');
        if (Date.now() - last > 300000) {
          sessionStorage.setItem('cf.last-realtime', Date.now().toString());
          toast.success(label, { duration: 2000 });
        }
      }
    },
    enabled,
  });

  return null;
}
