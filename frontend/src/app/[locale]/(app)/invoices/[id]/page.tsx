'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, FileText, CheckCircle2, AlertCircle, Link2, Package, Truck } from 'lucide-react';

interface InvoiceLine {
  id?: string;
  invoice_line_id?: string;
  line_number?: number;
  raw_description: string;
  product_id?: string | null;
  product_name: string | null;
  quantity?: number;
  invoice_qty?: number;
  unit_of_measure?: string | null;
  unit_price?: number;
  invoice_price?: number;
  subtotal?: number;
  tax_rate?: number;
  tax_amount?: number;
  total?: number;
  match_status: string;
  match_confidence: number;
  po_line_id: string | null;
  po_qty: number | null;
  po_price: number | null;
  three_way_status: 'perfect' | 'qty_mismatch' | 'price_mismatch' | 'unmatched';
}

interface InvoiceDetail {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  supplier_name: string;
  supplier_tax_id: string;
  total_amount: number;
  subtotal: number;
  tax_amount: number;
  status: string;
  notes: string | null;
  source: string;
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [inv, setInv] = useState<InvoiceDetail | null>(null);
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      // Carregar invoice
      const invRes = await fetch(`/api/invoices/${id}`);
      if (invRes.ok) setInv(await invRes.json());
      // Carregar lines
      const linesRes = await fetch(`/api/invoices/${id}/lines`);
      if (linesRes.ok) setLines(await linesRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function runMatch(lineId: string) {
    const r = await fetch(`/api/invoices/lines/${lineId}/match-po`, { method: 'POST' });
    if (r.ok) await loadData();
  }

  async function matchAll() {
    setLoading(true);
    for (const l of lines) {
      if (l.product_id && !l.po_line_id && l.id) {
        await runMatch(l.id);
      }
    }
    await loadData();
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">A carregar…</div>;
  }

  if (!inv) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push('/invoices')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Fatura não encontrada.
          </CardContent>
        </Card>
      </div>
    );
  }

  const matched = lines.filter(l => l.match_status && l.match_status !== 'unmatched').length;
  const poMatched = lines.filter(l => l.po_line_id !== null).length;
  const perfect = lines.filter(l => l.three_way_status === 'perfect').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Button variant="ghost" onClick={() => router.push('/invoices')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar às faturas
        </Button>
        <Button onClick={matchAll} disabled={poMatched === lines.length}>
          <Link2 className="h-4 w-4 mr-1" /> Correr 3-way match
        </Button>
      </div>

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2 font-mono text-lg">
                {inv.invoice_number}
                <Badge variant={inv.status === 'matched' ? 'success' : 'warning'}>{inv.status}</Badge>
              </CardTitle>
              <CardDescription className="mt-2 flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> {inv.supplier_name}</span>
                <span className="text-xs text-muted-foreground">NIF: {inv.supplier_tax_id || '—'}</span>
                <span>• {new Date(inv.invoice_date).toLocaleDateString('pt-PT')}</span>
                {inv.due_date && <span>• Vence: {new Date(inv.due_date).toLocaleDateString('pt-PT')}</span>}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-semibold">{formatCurrency(inv.total_amount)}</div>
              <div className="text-xs text-muted-foreground">c/ IVA</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <div className="text-xs text-muted-foreground">Subtotal</div>
            <div className="text-lg font-medium">{formatCurrency(inv.subtotal)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">IVA</div>
            <div className="text-lg font-medium">{formatCurrency(inv.tax_amount)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Itens casados (catálogo)</div>
            <div className="text-lg font-medium text-emerald-600">{matched}/{lines.length}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">3-way match (PO ↔ ↔ Invoice)</div>
            <div className="text-lg font-medium text-blue-600">{poMatched}/{lines.length} <span className="text-xs text-muted-foreground">({perfect} perfeitos)</span></div>
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Items da fatura ({lines.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs">
              <tr>
                <th className="text-left p-2">#</th>
                <th className="text-left p-2">Descrição / Produto</th>
                <th className="text-right p-2">Qtd</th>
                <th className="text-right p-2">Preço un</th>
                <th className="text-right p-2">IVA</th>
                <th className="text-right p-2">Total</th>
                <th className="text-left p-2">Match</th>
                <th className="text-left p-2">3-way</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, idx) => {
                const lineKey = l.invoice_line_id || l.id || String(idx);
                const qty = l.quantity ?? l.invoice_qty ?? 0;
                const price = l.unit_price ?? l.invoice_price ?? 0;
                const subtotal = l.subtotal ?? qty * price;
                const tax = l.tax_amount ?? subtotal * ((l.tax_rate || 0) / 100);
                const total = l.total ?? subtotal + tax;
                return (
                <tr key={lineKey} className="border-t">
                  <td className="p-2 text-muted-foreground">{l.line_number ?? idx + 1}</td>
                  <td className="p-2">
                    <div className="font-medium">{l.product_name || l.raw_description}</div>
                    {l.product_name && l.raw_description !== l.product_name && (
                      <div className="text-xs text-muted-foreground">da fatura: {l.raw_description}</div>
                    )}
                    {l.match_confidence > 0 && l.match_status !== 'unmatched' && (
                      <div className="text-xs text-muted-foreground">confiança: {Math.round(l.match_confidence * 100)}%</div>
                    )}
                  </td>
                  <td className="p-2 text-right">
                    {qty} {l.unit_of_measure || ''}
                  </td>
                  <td className="p-2 text-right">{formatCurrency(price)}</td>
                  <td className="p-2 text-right text-xs text-muted-foreground">{l.tax_rate || 0}%</td>
                  <td className="p-2 text-right font-medium">{formatCurrency(total)}</td>
                  <td className="p-2">
                    {l.match_status === 'unmatched' ? (
                      <Badge variant="destructive" className="text-xs"><AlertCircle className="h-3 w-3 mr-1" /> Unmatched</Badge>
                    ) : l.match_status === 'auto_matched' ? (
                      <Badge variant="success" className="text-xs"><CheckCircle2 className="h-3 w-3 mr-1" /> Auto</Badge>
                    ) : (
                      <Badge variant="default" className="text-xs"><CheckCircle2 className="h-3 w-3 mr-1" /> Manual</Badge>
                    )}
                  </td>
                  <td className="p-2">
                    {l.three_way_status === 'perfect' ? (
                      <Badge variant="success" className="text-xs">✓ Perfeito</Badge>
                    ) : l.three_way_status === 'qty_mismatch' ? (
                      <Badge variant="warning" className="text-xs">Qtd ≠</Badge>
                    ) : l.three_way_status === 'price_mismatch' ? (
                      <Badge variant="warning" className="text-xs">Preço ≠</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {inv.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{inv.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
