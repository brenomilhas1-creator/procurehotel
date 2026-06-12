'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { Sparkles, Send, ShoppingCart, AlertCircle, Trash2, Plus, Search, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { listSuppliers, parseOrderText, optimizeOrder, createOrder, searchProductsAutocomplete, trackEvent, type FreeTextItem, type Page, type Supplier } from '@/lib/supabase-data';
import { formatCurrency } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';

function OrderPageInner() {
  const sp = useSearchParams();
  const [text, setText] = useState('');
  const [items, setItems] = useState<FreeTextItem[]>([]);
  const [suppliers, setSuppliers] = useState<Page<Supplier> | null>(null);
  const [supplierId, setSupplierId] = useState<string>('');
  const [step, setStep] = useState<'input' | 'parsed' | 'optimized' | 'done'>('input');
  const [busy, setBusy] = useState(false);
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Autocomplete state
  const [autoQ, setAutoQ] = useState('');
  const [autoResults, setAutoResults] = useState<{ id: string; name: string; brand: string | null; alias: string; unit_price?: number }[]>([]);
  const [autoList, setAutoList] = useState<{ id: string; name: string; alias: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load suppliers + autocomplete
  useEffect(() => {
    listSuppliers({ limit: 50 }).then((d) => {
      setSuppliers(d);
      if (d.items[0]) setSupplierId(d.items[0].id);
    }).catch(() => null);

    // Verificar se há preorder (de Favoritos ou Repetir)
    const pre = localStorage.getItem('procurehotel.preorder');
    if (pre) {
      try {
        const arr = JSON.parse(pre);
        const fakeText = (arr as any[]).map((i: any) => `${i.quantity || 1} ${i.product_name || i.alias}`).join('\n');
        setText(fakeText);
        setItems(arr.map((i: any) => ({
          raw_line: `${i.quantity} ${i.product_name}`,
          product_id: i.product_id,
          product_name: i.product_name || i.alias,
          quantity: i.quantity || 1,
          unit_price: i.unit_price || 0,
          line_total: (i.quantity || 1) * (i.unit_price || 0),
          needs_review: false,
        })));
        if (arr[0]?.unit_price) setStep('optimized');
        else setStep('parsed');
        localStorage.removeItem('procurehotel.preorder');
        if (arr[0]?.supplier_id) setSupplierId(arr[0].supplier_id);
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

  function addFromAutocomplete(r: { id: string; name: string; alias: string; unit_price?: number }) {
    setAutoList([...autoList, { id: r.id, name: r.name, alias: r.alias }]);
    setItems([...items, {
      raw_line: `${r.alias}`,
      product_id: r.id,
      product_name: r.name,
      quantity: 1,
      unit_price: r.unit_price || 0,
      line_total: r.unit_price || 0,
      needs_review: false,
    }]);
    setStep('optimized');
    setAutoQ('');
    setAutoResults([]);
    inputRef.current?.focus();
  }

  function removeFromAutolist(idx: number) {
    setAutoList(autoList.filter((_, i) => i !== idx));
    setItems(items.filter((_, i) => i !== idx));
  }

  async function doParse() {
    setBusy(true); setErr(null);
    try {
      const r = await parseOrderText(text);
      setItems(r.items);
      setStep('parsed');
    } catch (e: any) { setErr(e.message); }
    setBusy(false);
  }

  async function doOptimize() {
    setBusy(true); setErr(null);
    try {
      const r = await optimizeOrder(items);
      setItems(r.items);
      setStep('optimized');
    } catch (e: any) { setErr(e.message); }
    setBusy(false);
  }

  async function doCommit() {
    if (!supplierId) { setErr('Selecione um fornecedor'); return; }
    setBusy(true); setErr(null);
    const t0 = Date.now();
    try {
      const validItems = items.filter((i) => i.product_id && i.unit_price > 0);
      const o = await createOrder({
        supplier_id: supplierId,
        raw_input: text,
        items: validItems.map((i) => ({ product_id: i.product_id!, quantity: i.quantity, unit_price: i.unit_price, raw_line: i.raw_line })),
      });
      setOrderCode(o.code);
      // Métrica operacional
      trackEvent({
        event_type: 'order_created',
        entity_type: 'purchase_order',
        entity_id: o.id,
        duration_ms: t0 ? Date.now() - t0 : undefined,
        payload: {
          supplier_id: supplierId,
          items_count: validItems.length,
          total_eur: o.total_amount,
          source: text ? 'free_text' : 'autocomplete',
        },
      });
      setStep('done');
    } catch (e: any) { setErr(e.message); }
    setBusy(false);
  }

  const total = items.reduce((s, i) => s + i.line_total, 0);
  const reviewCount = items.filter((i) => i.needs_review).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pedido Rápido</h1>
        <p className="text-sm text-muted-foreground">Pesquisa produto ou escreve o pedido em texto livre</p>
      </div>

      {err && (
        <div className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {err}
        </div>
      )}

      {step === 'done' ? (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 mx-auto flex items-center justify-center text-emerald-600">
              <Send className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold">Pedido criado!</h2>
            <p className="text-muted-foreground">Código: <span className="font-mono font-medium">{orderCode}</span></p>
            <p className="text-sm text-muted-foreground">Total: <span className="font-medium text-emerald-600">{formatCurrency(total)}</span></p>
            <div className="flex justify-center gap-2 pt-2">
              <Button onClick={() => { setStep('input'); setItems([]); setAutoList([]); setOrderCode(null); setText(''); }}>
                <Plus className="h-4 w-4" /> Novo pedido
              </Button>
              <a href="/orders"><Button variant="outline">Ver histórico</Button></a>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Autocomplete (ERP-style) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-4 w-4" /> Adicionar produto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Input
                  ref={inputRef}
                  placeholder="Pesquisa por nome ou alias (ex: coca, leite, arroz)..."
                  value={autoQ}
                  onChange={(e) => setAutoQ(e.target.value)}
                  autoFocus
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
                          {r.brand && <span className="text-xs text-muted-foreground">{r.brand}</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Items adicionados */}
          {autoList.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" /> Itens no carrinho ({autoList.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y">
                  {items.map((it, i) => (
                    <li key={i} className="px-4 py-3 flex items-center gap-3">
                      <span className="flex-1 text-sm font-medium">{it.product_name}</span>
                      <Input
                        type="number"
                        min="1"
                        value={it.quantity}
                        onChange={(e) => {
                          const q = parseInt(e.target.value) || 1;
                          const updated = [...items];
                          updated[i] = { ...it, quantity: q, line_total: q * (it.unit_price || 0) };
                          setItems(updated);
                        }}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground w-24 text-right">
                        {it.unit_price > 0 ? formatCurrency(it.line_total) : '—'}
                      </span>
                      <button onClick={() => removeFromAutolist(i)} className="text-red-500"><X className="h-4 w-4" /></button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Modo texto livre (opcional) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Ou escreve em texto livre</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                className="w-full min-h-[100px] rounded-md border bg-background p-3 text-sm font-mono"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Cole aqui o seu pedido, ex:&#10;10 coca cola&#10;5 leite 1L&#10;2kg arroz"
              />
              <Button onClick={doParse} disabled={busy} variant="outline">
                <Sparkles className="h-4 w-4" /> Interpretar texto
              </Button>
            </CardContent>
          </Card>

          {/* Items do texto livre (após parse) */}
          {step !== 'input' && items.some((i) => !i.product_id) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> Items do texto
                  {reviewCount > 0 && <Badge variant="destructive" className="ml-2">{reviewCount} para rever</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y">
                  {items.filter((i) => !i.product_id || i.needs_review).map((it, i) => (
                    <li key={i} className="px-4 py-2.5 text-sm">
                      <div className="font-medium">{it.raw_line}</div>
                      {it.product_name ? (
                        <div className="text-xs text-emerald-600">→ {it.product_name} {it.matched_alias && `via "${it.matched_alias}"`}</div>
                      ) : (
                        <div className="text-xs text-red-500">⚠️ Sem correspondência — procura acima</div>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Finalizar */}
          {items.some((i) => i.product_id) && (
            <Card>
              <CardHeader>
                <CardTitle>Finalizar pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <label className="block text-sm">
                  <span className="block mb-1 text-muted-foreground">Fornecedor</span>
                  <select className="w-full h-10 rounded-md border bg-background px-3" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                    {suppliers?.items.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </label>
                <div className="rounded-md bg-muted p-3 text-sm flex justify-between">
                  <span>Total estimado:</span>
                  <span className="font-semibold text-emerald-600">{formatCurrency(total)}</span>
                </div>
                <Button onClick={doCommit} disabled={busy} size="lg" className="w-full">
                  <Send className="h-4 w-4" />
                  {busy ? 'A gravar...' : 'Confirmar e gravar pedido'}
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}


export default function OrderPage() {
  return <Suspense fallback={null}><OrderPageInner /></Suspense>;
}
