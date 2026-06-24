'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  listOrders,
  getOrderItems,
  updateOrderStatus,
  formatOrderAsWhatsApp,
  type Page,
  type PurchaseOrder,
  type PurchaseOrderItem,
} from '@/lib/supabase-data';
import { formatCurrency } from '@/lib/utils';
import { RefreshCw, Eye, X, Copy, Check, Loader2 } from 'lucide-react';

export default function OrdersPage() {
  const t = useTranslations('orders');
  const [data, setData] = useState<Page<PurchaseOrder> | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, PurchaseOrderItem[]>>({});
  const [copyState, setCopyState] = useState<Record<string, 'idle' | 'copied'>>({});
  const [updating, setUpdating] = useState<string | null>(null);

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
    const payload = items.map((i: any) => ({
      product_id: i.product_id,
      product_name: i.products?.master_name || i.raw_line,
      quantity: Number(i.quantity),
      unit_price: Number(i.unit_price),
    }));
    sessionStorage.setItem('cf.preorder', JSON.stringify(payload));
    window.location.href = '/order?from_order=' + id;
  }

  async function copyOrderToClipboard(order: PurchaseOrder) {
    const id = order.id;
    let items = orderItems[id];
    if (!items) {
      items = await getOrderItems(id);
      setOrderItems({ ...orderItems, [id]: items });
    }
    const text = formatOrderAsWhatsApp(order, items);
    try {
      await navigator.clipboard.writeText(text);
      setCopyState({ ...copyState, [id]: 'copied' });
      setTimeout(() => {
        setCopyState((prev) => ({ ...prev, [id]: 'idle' }));
      }, 2000);
    } catch (err) {
      // Fallback: abrir prompt com texto
      window.prompt('Copie o texto:', text);
    }
  }

  async function togglePlaced(order: PurchaseOrder) {
    const newStatus = order.status === 'placed' ? 'pending' : 'placed';
    setUpdating(order.id);
    const result = await updateOrderStatus(order.id, newStatus);
    setUpdating(null);
    if (result.ok && data) {
      // Atualizar localmente sem refazer fetch
      setData({
        ...data,
        items: data.items.map((o: PurchaseOrder) =>
          o.id === order.id
            ? { ...o, status: newStatus, placed_at: newStatus === 'placed' ? new Date().toISOString() : null }
            : o
        ),
      });
    } else if (!result.ok) {
      alert('Erro a atualizar: ' + result.error);
    }
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
                <TH className="w-12">Já pedi?</TH>
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
              {data?.items.map((o: PurchaseOrder) => {
                const isPlaced = o.status === 'placed';
                const isCopied = copyState[o.id] === 'copied';
                const isUpdating = updating === o.id;
                return (
                  <>
                    <TR key={o.id}>
                      <TD>
                        <label className="flex items-center justify-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isPlaced}
                            onChange={() => togglePlaced(o)}
                            disabled={isUpdating}
                            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
                            title={isPlaced ? 'Desmarcar como pedido realizado' : 'Marcar como pedido realizado'}
                          />
                          {isUpdating && <Loader2 className="h-3 w-3 ml-1 animate-spin text-muted-foreground" />}
                        </label>
                      </TD>
                      <TD className="w-8">
                        <button onClick={() => toggleOrder(o.id)} className="text-muted-foreground">
                          {expanded === o.id ? <X className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </TD>
                      <TD className="font-mono text-xs">{o.code}</TD>
                      <TD>{o.supplier?.name || '—'}</TD>
                      <TD>
                        <Badge variant={isPlaced ? 'success' : 'default'}>
                          {isPlaced ? 'Pedido feito ✓' : 'Pendente'}
                        </Badge>
                      </TD>
                      <TD className="text-right font-medium">{formatCurrency(o.total_amount)}</TD>
                      <TD className="text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleString('pt-PT')}
                        {isPlaced && o.placed_at && (
                          <div className="text-emerald-600 text-[10px] mt-0.5">
                            Marcado em {new Date(o.placed_at).toLocaleDateString('pt-PT')}
                          </div>
                        )}
                      </TD>
                      <TD className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyOrderToClipboard(o)}
                            title="Copiar pedido para enviar ao vendedor (WhatsApp)"
                            disabled={isCopied}
                          >
                            {isCopied ? (
                              <>
                                <Check className="h-4 w-4 text-emerald-600" />
                                <span className="text-emerald-600">Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4" />
                                Copiar
                              </>
                            )}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => repeatOrder(o.id)}>
                            <RefreshCw className="h-4 w-4" />
                            Repetir
                          </Button>
                        </div>
                      </TD>
                    </TR>
                    {expanded === o.id && (
                      <TR>
                        <TD colSpan={8} className="bg-muted/30 p-4">
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
                );
              })}
              {!data?.items.length && (
                <TR>
                  <TD colSpan={8} className="text-center text-muted-foreground py-8">
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
