'use client';

import { useState } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { log } from '@/lib/logger';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { listPendingQuotes, updatePendingQuote, deletePendingQuote, type PendingQuote } from '@/lib/supabase-data';
import { formatCurrency } from '@/lib/utils';
import { Clock, Download, Trash2, X, Check, Mail, Phone, FileText } from 'lucide-react';
import Link from 'next/link';

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' }> = {
  pending:   { label: 'Aguarda cotação', variant: 'warning' },
  quoted:    { label: 'Cotado',         variant: 'default' },
  ordered:   { label: 'Encomendado',    variant: 'success' },
  rejected:  { label: 'Rejeitado',      variant: 'destructive' },
  cancelled: { label: 'Cancelado',      variant: 'secondary' },
};

export default function PendingPage() {
  const t = useTranslations('pending');
  const [filter, setFilter] = useState<'all' | 'pending' | 'quoted' | 'ordered' | 'rejected' | 'cancelled'>('pending');
  const [expandedSuppliers, setExpandedSuppliers] = useState<Record<string, boolean>>({});
  const quotesA = useAsync(
    () => filter === 'all' ? listPendingQuotes({ limit: 500 }) : listPendingQuotes({ status: filter, limit: 500 }),
    { scope: 'pending', deps: [filter], retry: false }
  );
  const data = quotesA.data ?? [];
  const loading = quotesA.loading;
  const reload = quotesA.refetch;

  async function markStatus(id: string, status: 'quoted' | 'ordered' | 'rejected' | 'cancelled') {
    const r = await updatePendingQuote(id, { status });
    r.ok ? log.info('pending', 'status_updated', { id, status }) : log.error('pending', 'update_failed', { error: r.error });
    await reload();
  }

  async function removeItem(id: string) {
    if (!confirm('Apagar este item?')) return;
    await deletePendingQuote(id);
    await reload();
  }

  // Agrupar por fornecedor
  const bySupplier = data.reduce<Record<string, PendingQuote[]>>((acc, item) => {
    const key = item.supplier_id || 'sem-fornecedor';
    (acc[key] = acc[key] || []).push(item);
    return acc;
  }, {});

  const supplierEntries = Object.entries(bySupplier).map(([key, items]) => {
    const first = items[0];
    return {
      key,
      name: first.suppliers?.name || 'Sem fornecedor',
      email: first.suppliers?.contact_email || null,
      phone: first.suppliers?.contact_phone || null,
      items,
    };
  }).sort((a, b) => b.items.length - a.items.length);

  const totalCount = data.length;
  const pendingCount = data.filter(i => i.status === 'pending').length;
  const quotedCount = data.filter(i => i.status === 'quoted').length;

  function exportCSV(supplierKey?: string) {
    const items = supplierKey ? bySupplier[supplierKey] || [] : data;
    const headers = ['Fornecedor', 'Produto', 'Texto original', 'Quantidade', 'Unidade', 'Status', 'Preço cotado', 'Referência', 'Criado em'];
    const rows = items.map(i => [
      i.suppliers?.name || 'Sem fornecedor',
      i.products?.master_name || '',
      i.raw_line,
      i.requested_quantity || '',
      i.unit_of_measure || '',
      STATUS_LABELS[i.status]?.label || i.status,
      i.quoted_price || '',
      i.quote_reference || '',
      new Date(i.created_at).toLocaleString('pt-PT'),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pendentes-cotacao-${new Date().toISOString().slice(0, 10)}${supplierKey ? '-' + supplierKey.slice(0, 8) : ''}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Clock className="h-6 w-6" />
            {t('title') || 'Pendentes de Cotação'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Itens que <strong>não têm preço</strong> registado para um fornecedor. Envie a lista ao fornecedor para obter cotação.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportCSV()}>
            <Download className="h-4 w-4 mr-1" /> Exportar tudo (CSV)
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Aguardam cotação</div>
            <div className="text-2xl font-semibold mt-1 text-amber-600 dark:text-amber-400">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Cotados</div>
            <div className="text-2xl font-semibold mt-1 text-blue-600 dark:text-blue-400">{quotedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Total na lista</div>
            <div className="text-2xl font-semibold mt-1">{totalCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { v: 'pending' as const,   label: `Aguarda cotação (${pendingCount})` },
          { v: 'quoted' as const,    label: 'Cotados' },
          { v: 'ordered' as const,   label: 'Encomendados' },
          { v: 'rejected' as const,  label: 'Rejeitados' },
          { v: 'all' as const,       label: 'Todos' },
        ].map(f => (
          <Button
            key={f.v}
            size="sm"
            variant={filter === f.v ? 'default' : 'outline'}
            onClick={() => setFilter(f.v)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Lista agrupada por fornecedor */}
      {loading ? (
        <div className="text-sm text-muted-foreground p-8 text-center">A carregar…</div>
      ) : supplierEntries.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            {filter === 'pending'
              ? <>🎉 Nenhum item pendente de cotação. <Link href="/order" className="underline">Criar um pedido →</Link></>
              : 'Nenhum item neste estado.'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {supplierEntries.map(({ key, name, email, phone, items }) => {
            const isExpanded = expandedSuppliers[key] ?? true;
            const pendentes = items.filter(i => i.status === 'pending').length;
            return (
              <Card key={key}>
                <CardHeader className="cursor-pointer" onClick={() => setExpandedSuppliers({ ...expandedSuppliers, [key]: !isExpanded })}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {isExpanded ? <X className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                        {name}
                        {pendentes > 0 && (
                          <Badge variant="warning">{pendentes} pendente{pendentes !== 1 ? 's' : ''}</Badge>
                        )}
                        <Badge variant="secondary">{items.length} total</Badge>
                      </CardTitle>
                      <CardDescription className="mt-2 flex items-center gap-4 flex-wrap">
                        {email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {email}</span>}
                        {phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {phone}</span>}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                      <Button size="sm" variant="outline" onClick={() => exportCSV(key)}>
                        <Download className="h-4 w-4 mr-1" /> CSV deste fornecedor
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent className="p-0">
                    <Table>
                      <THead>
                        <TR>
                          <TH>Produto / Texto</TH>
                          <TH>Quantidade</TH>
                          <TH>Status</TH>
                          <TH>Preço cotado</TH>
                          <TH>Ref.</TH>
                          <TH>Criado</TH>
                          <TH className="text-right">Ações</TH>
                        </TR>
                      </THead>
                      <TBody>
                        {items.map(i => {
                          const statusInfo = STATUS_LABELS[i.status] || STATUS_LABELS.pending;
                          return (
                            <TR key={i.id}>
                              <TD>
                                <div className="font-medium">{i.products?.master_name || i.raw_line}</div>
                                {i.products && i.raw_line !== i.products.master_name && (
                                  <div className="text-xs text-muted-foreground mt-0.5">Original: {i.raw_line}</div>
                                )}
                              </TD>
                              <TD>
                                {i.requested_quantity ? (
                                  <span>{Number(i.requested_quantity)} {i.unit_of_measure || ''}</span>
                                ) : <span className="text-muted-foreground">—</span>}
                              </TD>
                              <TD><Badge variant={statusInfo.variant}>{statusInfo.label}</Badge></TD>
                              <TD>{i.quoted_price ? formatCurrency(Number(i.quoted_price)) : <span className="text-muted-foreground">—</span>}</TD>
                              <TD className="text-xs text-muted-foreground">{i.quote_reference || '—'}</TD>
                              <TD className="text-xs text-muted-foreground">{new Date(i.created_at).toLocaleDateString('pt-PT')}</TD>
                              <TD className="text-right">
                                <div className="flex justify-end gap-1">
                                  {i.status === 'pending' && (
                                    <>
                                      <Button size="sm" variant="outline" onClick={() => markStatus(i.id, 'quoted')} title="Marcar como cotado">
                                        <Check className="h-3 w-3" />
                                      </Button>
                                      <Button size="sm" variant="outline" onClick={() => markStatus(i.id, 'rejected')} title="Rejeitar">
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </>
                                  )}
                                  {i.status === 'quoted' && (
                                    <Button size="sm" variant="outline" onClick={() => markStatus(i.id, 'ordered')} title="Marcar como encomendado">
                                      <Check className="h-3 w-3" /> OK
                                    </Button>
                                  )}
                                  <Button size="sm" variant="ghost" onClick={() => removeItem(i.id)} title="Apagar">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TD>
                            </TR>
                          );
                        })}
                      </TBody>
                    </Table>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
        <CardContent className="p-4 text-sm">
          <h3 className="font-semibold flex items-center gap-2 mb-2">
            💡 Como usar esta página
          </h3>
          <ol className="space-y-1 text-muted-foreground list-decimal pl-5">
            <li>Quando um item não tem preço no catálogo, ele aparece aqui automaticamente</li>
            <li>Use o botão <strong>"CSV deste fornecedor"</strong> para gerar a lista e enviar por email ao fornecedor</li>
            <li>Quando o fornecedor responder, marque como <strong>"Cotado"</strong> e insira o preço</li>
            <li>Quando estiver pronto para encomendar, mude para <strong>"Encomendado"</strong></li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
