'use client';

import { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import {
  Sparkles, Send, ShoppingCart, AlertCircle, Plus, Search, X, Clock,
  Check, Copy, Phone, Mail, MessageCircle, Truck, ChevronDown, ChevronUp,
  ArrowRight, Tag, TrendingUp, TrendingDown, Minus, History,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  listSuppliers, parseOrderText, optimizeOrder, createOrder,
  searchProductsAutocomplete, trackEvent, createPendingQuote,
  getProductPricesWithAlternatives, getPriceTrends,
  type FreeTextItem, type Page, type Supplier, type ProductPriceOption, type PriceTrend,
} from '@/lib/supabase-data';
import { formatCurrency } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useCart, useCartRecovery } from '@/stores/cart';

function OrderPageInner() {
  const sp = useSearchParams();
  const [text, setText] = useState('');
  const [items, setItems] = useState<FreeTextItem[]>([]);
  const [suppliers, setSuppliers] = useState<Page<Supplier> | null>(null);
  const [busy, setBusy] = useState(false);
  const [orderCodes, setOrderCodes] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [copiedFor, setCopiedFor] = useState<string | null>(null);
  const [expandedSupplier, setExpandedSupplier] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, { supplier_id: string; supplier_name: string; price: number }>>({});
  const [priceTrends, setPriceTrends] = useState<Record<string, PriceTrend>>({});

  // Autocomplete state
  const [autoQ, setAutoQ] = useState('');
  const [autoResults, setAutoResults] = useState<{ id: string; name: string; brand: string | null; alias: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cart persistente (localStorage) + Recovery
  const cart = useCart();
  const cartItems = cart.items;
  const cartTotalItems = cart.totalItems();
  const cartTotalValue = cart.totalValue();
  const { recover, checkRecovery } = useCartRecovery();

  // Sincronizar: quando items mudam (qty, add, remove), persistir no cart
  // Estratégia: o cart é a fonte da verdade. Items locais são derivados do cart + texto parseado.
  useEffect(() => {
    // Inicializar items a partir do cart (se houver)
    if (cartItems.length > 0 && items.length === 0 && text === '') {
      const fakeText = cartItems.map((i) => `${i.quantity} ${i.product_name}`).join('\n');
      setText(fakeText);
      const seeded: FreeTextItem[] = cartItems.map((i) => ({
        raw_line: `${i.quantity} ${i.product_name}`,
        product_id: i.product_id,
        product_name: i.product_name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        line_total: i.quantity * i.unit_price,
        needs_review: false,
      }));
      setItems(seeded);
    }
  }, [cartItems.length === 0]);  // só na primeira vez

  // Load suppliers
  useEffect(() => {
    listSuppliers({ limit: 50 }).then((d) => setSuppliers(d)).catch(() => null);

    // Backward compat: ler do sessionStorage se existir (de fluxo antigo)
    const pre = sessionStorage.getItem('cf.preorder');
    if (pre) {
      try {
        const arr = JSON.parse(pre);
        arr.forEach((i: any) => {
          cart.addItem({
            product_id: i.product_id,
            product_name: i.product_name || i.alias || 'Item',
            unit_price: i.unit_price || 0,
            quantity: i.quantity || 1,
          });
        });
        sessionStorage.removeItem('cf.preorder');
        toast.success('Itens migrados para o carrinho persistente');
      } catch {}
    }
  }, []);

  // Autocomplete
  useEffect(() => {
    if (autoQ.length < 1) { setAutoResults([]); return; }
    const t = setTimeout(() => {
      searchProductsAutocomplete(autoQ, 8).then(setAutoResults).catch(() => null);
    }, 150);
    return () => clearTimeout(t);
  }, [autoQ]);

  /**
   * AUTO-OTIMIZAÇÃO: cada vez que items mudam (mas só com product_id),
   * buscar TODAS as opções de preço e escolher o melhor por produto.
   * Agrupa por fornecedor automaticamente.
   */
  useEffect(() => {
    const idsWithProduct = items.filter((i) => i.product_id).map((i) => i.product_id!);
    if (idsWithProduct.length === 0) return;
    // Debounce para evitar flood
    const t = setTimeout(async () => {
      try {
        const grouped = await getProductPricesWithAlternatives(Array.from(new Set(idsWithProduct)));
        const map = new Map<string, ProductPriceOption>();
        for (const g of grouped) map.set(g.product_id, g);

        setItems((curr) => curr.map((it) => {
          if (!it.product_id) return it;
          // Verificar se há override manual para este item
          const overrideKey = `${it.product_id}`;
          if (overrides[overrideKey]) {
            const ov = overrides[overrideKey];
            return {
              ...it,
              unit_price: ov.price,
              line_total: it.quantity * ov.price,
              supplier_id: ov.supplier_id,
              supplier_name: ov.supplier_name,
            };
          }
          const g = map.get(it.product_id);
          if (!g || !g.best) return it;
          return {
            ...it,
            unit_price: g.best.unit_price,
            line_total: it.quantity * g.best.unit_price,
            supplier_id: g.best.supplier_id,
            supplier_name: g.best.supplier_name,
            alternatives: g.options,
          };
        }));
      } catch {
        // silencioso
      }
    }, 200);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.filter((i) => i.product_id).map((i) => i.product_id).join(',')]);

  /**
   * HISTÓRICO DE PREÇOS: para cada produto no carrinho, busca tendência
   * (preço atual vs anterior) para mostrar seta ↑↓.
   */
  useEffect(() => {
    const ids = Array.from(new Set(items.filter((i) => i.product_id).map((i) => i.product_id!)));
    if (ids.length === 0) return;
    const t = setTimeout(async () => {
      try {
        const trends = await getPriceTrends(ids);
        setPriceTrends(trends);
      } catch {
        // silencioso
      }
    }, 300);
    return () => clearTimeout(t);
  }, [items.filter((i) => i.product_id).map((i) => i.product_id).join(',')]);

  /**
   * Agrupar items por fornecedor.
   * Items sem preço (sem product_id ou sem supplier_id) ficam em "sem_match".
   */
  const grouped = useMemo(() => {
    const groups: Record<string, { supplier: Supplier; items: FreeTextItem[]; total: number }> = {};
    const noMatch: FreeTextItem[] = [];

    for (const it of items) {
      if (!it.product_id || !it.supplier_id || it.unit_price <= 0) {
        noMatch.push(it);
        continue;
      }
      const supplier = suppliers?.items.find((s) => s.id === it.supplier_id);
      if (!supplier) continue;
      if (!groups[it.supplier_id]) groups[it.supplier_id] = { supplier, items: [], total: 0 };
      groups[it.supplier_id].items.push(it);
      groups[it.supplier_id].total += it.line_total;
    }
    return { groups, noMatch };
  }, [items, suppliers]);

  const grandTotal = Object.values(grouped.groups).reduce((s, g) => s + g.total, 0);

  function addFromAutocomplete(r: { id: string; name: string; alias: string }) {
    setItems([...items, {
      raw_line: r.alias,
      product_id: r.id,
      product_name: r.name,
      quantity: 1,
      unit_price: 0, // será preenchido pelo auto-optimize
      line_total: 0,
      needs_review: false,
      matched_alias: r.alias,
    }]);
    setAutoQ('');
    setAutoResults([]);
    inputRef.current?.focus();
  }

  function removeItem(idx: number) {
    const removed = items[idx];
    if (removed?.product_id) {
      cart.removeItem(removed.product_id);
    }
    setItems(items.filter((_, i) => i !== idx));
  }

  function updateQty(idx: number, qty: number) {
    const updated = [...items];
    const item = updated[idx];
    updated[idx] = { ...item, quantity: qty, line_total: qty * (item.unit_price || 0) };
    setItems(updated);
    // Sincronizar com cart
    if (item.product_id) {
      if (qty <= 0) {
        cart.removeItem(item.product_id);
      } else {
        cart.updateQuantity(item.product_id, qty);
      }
    }
  }

  function clearCart() {
    cart.clear();
    setItems([]);
    setText('');
    setOrderCodes([]);
    toast.success('Carrinho limpo');
  }

  function switchSupplier(itemIdx: number, newSupplierId: string, newPrice: number) {
    const item = items[itemIdx];
    if (!item.product_id) return;
    const newSupplier = suppliers?.items.find((s) => s.id === newSupplierId);
    if (!newSupplier) return;
    // Set override
    setOverrides({ ...overrides, [item.product_id]: { supplier_id: newSupplierId, supplier_name: newSupplier.name, price: newPrice } });
    const updated = [...items];
    updated[itemIdx] = {
      ...item,
      unit_price: newPrice,
      line_total: item.quantity * newPrice,
      supplier_id: newSupplierId,
      supplier_name: newSupplier.name,
    };
    setItems(updated);
  }

  async function doParse() {
    setBusy(true); setErr(null);
    try {
      const r = await parseOrderText(text);
      setItems(r.items);
      // Não precisamos de chamar optimizeOrder manualmente — o useEffect vai auto-otimizar
    } catch (e: any) { setErr(e.message); }
    setBusy(false);
  }

  function clearAll() {
    cart.clear();
    setItems([]);
    setText('');
    setOverrides({});
    setOrderCodes([]);
    toast.success('Carrinho limpo');
  }

  /**
   * Formatar mensagem WhatsApp para um grupo de items (por fornecedor).
   */
  function formatWhatsApp(supplierName: string, supplierItems: FreeTextItem[], _total: number): string {
    const lines: string[] = [];
    lines.push(`🛒 *Pedido - ${supplierName}*`);
    lines.push('');
    for (const it of supplierItems) {
      lines.push(`• ${it.quantity}× ${it.product_name || it.raw_line}`);
    }
    lines.push('');
    lines.push(`Enviado via Compra Facil Hoteis`);
    return lines.join('\n');
  }

  async function copyToClipboard(text: string, supplierKey: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedFor(supplierKey);
      setTimeout(() => setCopiedFor(null), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedFor(supplierKey);
      setTimeout(() => setCopiedFor(null), 2000);
    }
  }

  async function doCommitGroup(supplierId: string) {
    const group = grouped.groups[supplierId];
    if (!group || group.items.length === 0) return;
    setBusy(true); setErr(null);
    try {
      const validItems = group.items.filter((i) => i.product_id && i.unit_price > 0);
      const o = await createOrder({
        supplier_id: supplierId,
        raw_input: validItems.map((i) => i.raw_line).join('\n'),
        items: validItems.map((i) => ({ product_id: i.product_id!, quantity: i.quantity, unit_price: i.unit_price, raw_line: i.raw_line })),
      });
      trackEvent({
        event_type: 'order_created',
        entity_type: 'purchase_order',
        entity_id: o.id,
        payload: {
          supplier_id: supplierId,
          supplier_name: group.supplier.name,
          items_count: validItems.length,
          total_eur: o.total_amount,
          source: text ? 'free_text' : 'autocomplete',
        },
      });
      setOrderCodes([...orderCodes, o.code]);
      // Remove items deste grupo do carrinho
      setItems(items.filter((it) => it.supplier_id !== supplierId));
    } catch (e: any) { setErr(e.message); }
    setBusy(false);
  }

  const hasItems = items.length > 0;
  const hasMatchedItems = Object.keys(grouped.groups).length > 0;
  const hasNoMatch = grouped.noMatch.length > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pedido Rápido</h1>
          <p className="text-sm text-muted-foreground">
            {cartTotalItems > 0 ? (
              <>🛒 {cartTotalItems} item(s) no carrinho · {formatCurrency(cartTotalValue)} — persistente até finalizar.</>
            ) : (
              <>Escreve ou pesquisa. O sistema agrupa automaticamente pelo melhor preço por fornecedor.</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {cartTotalItems === 0 && (() => {
            const rec = checkRecovery();
            return rec.available ? (
              <Button variant="outline" size="sm" onClick={() => {
                if (recover()) {
                  toast.success(`${rec.count} items recuperados do backup!`);
                }
              }} title="Recuperar items que estavam no carrinho antes de refresh">
                <History className="h-4 w-4" /> Recuperar {rec.count} items
              </Button>
            ) : null;
          })()}
          {hasItems && (
            <Button variant="outline" size="sm" onClick={clearAll}>
              <X className="h-4 w-4" /> Limpar tudo
            </Button>
          )}
        </div>
      </div>

      {err && (
        <div className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {err}
        </div>
      )}

      {orderCodes.length > 0 && (
        <Card className="border-emerald-500 bg-emerald-500/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-700">✓ Pedido(s) gravado(s): {orderCodes.join(', ')}</p>
              <p className="text-xs text-muted-foreground">Pode continuar a adicionar mais itens para outros fornecedores.</p>
            </div>
            <a href="/orders"><Button variant="outline" size="sm">Ver histórico</Button></a>
          </CardContent>
        </Card>
      )}

      {/* INPUT: Autocomplete + texto livre */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-4 w-4" /> Adicionar produto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Input
              ref={inputRef}
              placeholder="Pesquisa por nome ou alias (ex: coca, leite, manteiga)..."
              value={autoQ}
              onChange={(e) => setAutoQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && autoResults[0]) addFromAutocomplete(autoResults[0]); }}
            />
            {autoResults.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full bg-popover border rounded-md shadow-md max-h-72 overflow-y-auto">
                {autoResults.map((r) => (
                  <li key={r.id + r.alias}>
                    <button
                      onClick={() => addFromAutocomplete(r)}
                      className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex justify-between items-center"
                    >
                      <span>
                        <span className="font-medium">{r.alias}</span>
                        {r.alias !== r.name && <span className="text-xs text-muted-foreground ml-1">→ {r.name}</span>}
                      </span>
                      <Plus className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground select-none">
              Ou escreve o pedido em texto livre (cola uma lista)
            </summary>
            <div className="mt-3 space-y-2">
              <textarea
                className="w-full min-h-[100px] rounded-md border bg-background p-3 text-sm font-mono"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={'Cole aqui o seu pedido, ex:\n10 coca cola\n5 leite 1L\n2kg arroz\n6 manteiga c/sal'}
              />
              <Button onClick={doParse} disabled={busy || !text.trim()} variant="outline" size="sm">
                <Sparkles className="h-4 w-4" /> Interpretar texto
              </Button>
            </div>
          </details>
        </CardContent>
      </Card>

      {/* CARRINHO: SEMPRE visível se há items */}
      {hasItems && (
        <>
          {/* ITENS SEM MATCH */}
          {hasNoMatch && (
            <Card className="border-amber-500/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-700">
                  <AlertCircle className="h-4 w-4" />
                  Items sem correspondência ({grouped.noMatch.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y">
                  {grouped.noMatch.map((it, i) => (
                    <li key={i} className="px-4 py-3 flex items-center gap-3">
                      <span className="flex-1 text-sm">
                        <span className="font-medium">{it.raw_line}</span>
                        {!it.product_id && <div className="text-xs text-red-500">⚠️ Não encontrado no catálogo</div>}
                        {it.product_id && (!it.unit_price || it.unit_price <= 0) && (
                          <div className="text-xs text-amber-600">⚠️ Sem preço registado</div>
                        )}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          const r = await createPendingQuote({
                            raw_line: it.raw_line,
                            supplier_id: it.supplier_id || null,
                            product_id: it.product_id || null,
                            requested_quantity: it.quantity,
                            unit_of_measure: null,
                          });
                          if (r.ok) {
                            removeItem(items.findIndex((x) => x === it));
                          }
                        }}
                      >
                        <Clock className="h-3 w-3 mr-1" /> Pendente
                      </Button>
                      <button onClick={() => removeItem(items.findIndex((x) => x === it))} className="text-red-500">
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* GRUPOS POR FORNECEDOR (com melhor preço) */}
          {hasMatchedItems && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Carrinho agrupado ({Object.keys(grouped.groups).length} fornecedor(es))
                  </span>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Total estimado</div>
                    <div className="text-lg font-semibold text-emerald-600">{formatCurrency(grandTotal)}</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {Object.entries(grouped.groups).map(([supId, grp]) => {
                  const isExpanded = expandedSupplier === supId;
                  const waText = formatWhatsApp(grp.supplier.name, grp.items, grp.total);
                  const wasCopied = copiedFor === supId;
                  return (
                    <div key={supId} className="border-b last:border-b-0">
                      {/* Header do grupo */}
                      <div
                        className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-muted/50"
                        onClick={() => setExpandedSupplier(isExpanded ? null : supId)}
                      >
                        <span className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Truck className="h-4 w-4 text-primary" />
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{grp.supplier.name}</span>
                            {grp.supplier.is_preferred && <Badge variant="secondary" className="text-xs">⭐ Preferido</Badge>}
                            <Badge variant="outline" className="text-xs">{grp.items.length} item(s)</Badge>
                            {(() => {
                              const trendsHere = grp.items.map((it) => it.product_id ? priceTrends[it.product_id] : null).filter(Boolean);
                              const up = trendsHere.filter((t) => t!.trend === 'up').length;
                              const down = trendsHere.filter((t) => t!.trend === 'down').length;
                              const flat = trendsHere.filter((t) => t!.trend === 'flat').length;
                              if (trendsHere.length === 0) return null;
                              return (
                                <span className="text-xs text-muted-foreground flex items-center gap-2 ml-1">
                                  {up > 0 && <span className="inline-flex items-center gap-0.5 text-red-700 dark:text-red-400"><TrendingUp className="h-3 w-3" />{up}</span>}
                                  {down > 0 && <span className="inline-flex items-center gap-0.5 text-emerald-700 dark:text-emerald-400"><TrendingDown className="h-3 w-3" />{down}</span>}
                                  {flat > 0 && <span className="inline-flex items-center gap-0.5 text-muted-foreground"><Minus className="h-3 w-3" />{flat}</span>}
                                </span>
                              );
                            })()}
                          </div>
                          {grp.supplier.contact_phone && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Phone className="h-3 w-3" /> {grp.supplier.contact_phone}
                            </div>
                          )}
                        </div>
                        <div className="text-right mr-3">
                          <div className="font-semibold">{formatCurrency(grp.total)}</div>
                          {isExpanded ? <ChevronUp className="h-4 w-4 inline text-muted-foreground" /> : <ChevronDown className="h-4 w-4 inline text-muted-foreground" />}
                        </div>
                      </div>

                      {/* Items do grupo (expandível) */}
                      {isExpanded && (
                        <div className="bg-muted/30 px-4 py-3 space-y-2">
                          {grp.items.map((it) => {
                            const idxInAll = items.findIndex((x) => x === it);
                            const trend = it.product_id ? priceTrends[it.product_id] : null;
                            return (
                              <div key={idxInAll} className="flex items-center gap-2 text-sm">
                                <Input
                                  type="number"
                                  min="1"
                                  value={it.quantity}
                                  onChange={(e) => updateQty(idxInAll, parseInt(e.target.value) || 1)}
                                  className="w-16 h-8"
                                />
                                <div className="flex-1 flex items-center gap-2">
                                  <span className="font-medium">{it.product_name}</span>
                                  {trend && trend.trend !== 'new' && (
                                    <span
                                      title={
                                        trend.trend === 'up'
                                          ? `Subiu ${formatCurrency(Math.abs(trend.delta_eur || 0))} (+${(trend.delta_pct || 0).toFixed(1)}%) vs última atualização`
                                          : trend.trend === 'down'
                                          ? `Desceu ${formatCurrency(Math.abs(trend.delta_eur || 0))} (${(trend.delta_pct || 0).toFixed(1)}%) vs última atualização`
                                          : 'Preço estável'
                                      }
                                      className={
                                        'inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded ' +
                                        (trend.trend === 'up'
                                          ? 'bg-red-500/10 text-red-700 dark:text-red-400'
                                          : trend.trend === 'down'
                                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                          : 'bg-muted text-muted-foreground')
                                      }
                                    >
                                      {trend.trend === 'up' && <TrendingUp className="h-3 w-3" />}
                                      {trend.trend === 'down' && <TrendingDown className="h-3 w-3" />}
                                      {trend.trend === 'flat' && <Minus className="h-3 w-3" />}
                                      <span>
                                        {trend.delta_pct !== null && Math.abs(trend.delta_pct) >= 0.5
                                          ? `${trend.delta_pct > 0 ? '+' : ''}${trend.delta_pct.toFixed(1)}%`
                                          : '0%'}
                                      </span>
                                    </span>
                                  )}
                                  {trend && trend.trend === 'new' && (
                                    <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400">
                                      <History className="h-3 w-3" />
                                      <span>novo</span>
                                    </span>
                                  )}
                                </div>
                                <span className="text-muted-foreground w-20 text-right">{formatCurrency(it.unit_price)}</span>
                                <span className="font-semibold w-20 text-right">{formatCurrency(it.line_total)}</span>
                                {it.alternatives && it.alternatives.length > 1 && (
                                  <select
                                    className="h-8 rounded-md border bg-background px-2 text-xs"
                                    value={it.supplier_id || ''}
                                    onChange={(e) => {
                                      const newSp = it.alternatives!.find((a) => a.supplier_id === e.target.value);
                                      if (newSp) switchSupplier(idxInAll, newSp.supplier_id, newSp.unit_price);
                                    }}
                                    title="Mudar fornecedor (escolhe outra opção de preço)"
                                  >
                                    {it.alternatives.map((a) => (
                                      <option key={a.supplier_id} value={a.supplier_id}>
                                        {a.supplier_name} — {formatCurrency(a.unit_price)}
                                      </option>
                                    ))}
                                  </select>
                                )}
                                <button onClick={() => removeItem(idxInAll)} className="text-red-500">
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Ações do grupo */}
                      <div className="px-4 py-2 flex items-center gap-2 bg-muted/10">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(waText, supId)}
                          className="flex-1"
                        >
                          {wasCopied ? (
                            <><Check className="h-3 w-3 mr-1 text-emerald-600" /> Copiado!</>
                          ) : (
                            <><Copy className="h-3 w-3 mr-1" /> Copiar p/ WhatsApp</>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => doCommitGroup(supId)}
                          disabled={busy}
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Gravar pedido
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Sugestão quando há items sem match */}
          {hasNoMatch && (
            <p className="text-xs text-muted-foreground text-center">
              💡 Os items sem correspondência vão para a lista de <a href="/pending" className="underline">Pendentes de Cotação</a>
            </p>
          )}
        </>
      )}

      {/* EMPTY STATE */}
      {!hasItems && (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center space-y-3">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <h3 className="font-medium">Carrinho vazio</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Pesquisa produtos acima ou escreve o teu pedido em texto livre.
              O sistema procura automaticamente o melhor preço em todos os fornecedores e agrupa por fornecedor.
            </p>
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              <Button variant="outline" size="sm" onClick={() => setAutoQ('leite')}>🥛 Leite</Button>
              <Button variant="outline" size="sm" onClick={() => setAutoQ('manteiga')}>🧈 Manteiga</Button>
              <Button variant="outline" size="sm" onClick={() => setAutoQ('coca')}>🥤 Coca</Button>
              <Button variant="outline" size="sm" onClick={() => setAutoQ('arroz')}>🍚 Arroz</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function OrderPage() {
  return <Suspense fallback={null}><OrderPageInner /></Suspense>;
}
