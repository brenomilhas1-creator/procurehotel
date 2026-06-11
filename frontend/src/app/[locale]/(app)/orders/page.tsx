'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { listOrders, getOrderItems, type Page, type PurchaseOrder } from '@/lib/supabase-data';
import { formatCurrency } from '@/lib/utils';
import { RefreshCw, Eye, X } from 'lucide-react';

export default function OrdersPage() {
  const t = useTranslations('orders');
  const [data, setData] = useState<Page<PurchaseOrder> | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, any[]>>({});

  useEffect(() => {
    listOrders(50).then(setData).catch(() => null);
  }, []);

  async function toggleOrder(id: string) {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!orderItems[id]) {
      const items = await getOrderItems(id);
      setOrderItems({ ...orderItems, [id]: items });
    }
  }

  function repeatOrder(id: string) {
    const items = orderItems[id] || [];
    // Prepara items para o /order
    const payload = items.map((i: any) => ({
      product_id: i.product_id,
      product_name: i.products?.master_name || i.raw_line,
      quantity: Number(i.quantity),
      unit_price: Number(i.unit_price),
    }));
    localStorage.setItem('procurehotel.preorder', JSON.stringify(payload));
    window.location.href = '/order?from_order=' + id;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{data?.total ?? 0} ordens</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH></TH>
                <TH>Código</TH>
                <TH>Fornecedor</TH>
                <TH>Status</TH>
                <TH className="text-right">Total</TH>
                <TH>Data</TH>
                <TH className="text-right">Ações</TH>
              </TR>
            </THead>
            <TBody>
              {data?.items.map((o) => (
                <>
                  <TR key={o.id}>
                    <TD className="w-8">
                      <button onClick={() => toggleOrder(o.id)} className="text-muted-foreground">
                        {expanded === o.id ? <X className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </TD>
                    <TD className="font-mono text-xs">{o.code}</TD>
                    <TD>{o.supplier?.name || '—'}</TD>
                    <TD>
                      <Badge variant={o.status === 'placed' ? 'success' : o.status === 'pending' ? 'default' : 'secondary'}>
                        {o.status}
                      </Badge>
                    </TD>
                    <TD className="text-right font-medium">{formatCurrency(o.total_amount)}</TD>
                    <TD className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString('pt-PT')}</TD>
                    <TD className="text-right">
                      <Button size="sm" variant="outline" onClick={() => repeatOrder(o.id)}>
                        <RefreshCw className="h-4 w-4" /> Repetir
                      </Button>
                    </TD>
                  </TR>
                  {expanded === o.id && (
                    <TR>
                      <TD colSpan={7} className="bg-muted/30 p-4">
                        <div className="text-xs font-medium text-muted-foreground mb-2">Items do pedido:</div>
                        <ul className="space-y-1">
                          {(orderItems[o.id] || []).map((i: any) => (
                            <li key={i.id} className="text-sm flex justify-between">
                              <span>{i.products?.master_name || i.raw_line || '?'}</span>
                              <span className="text-muted-foreground">×{Number(i.quantity)} = {formatCurrency(Number(i.line_total))}</span>
                            </li>
                          ))}
                        </ul>
                      </TD>
                    </TR>
                  )}
                </>
              ))}
              {!data?.items.length && (
                <TR>
                  <TD colSpan={7} className="text-center text-muted-foreground py-8">
                    Sem ordens. <a href="/order" className="underline">Criar a primeira →</a>
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
