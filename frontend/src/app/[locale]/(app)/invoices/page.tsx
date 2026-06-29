'use client';

import { useState } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { FileText, ExternalLink, CheckCircle2, AlertCircle, Clock, Download, ChevronRight } from 'lucide-react';

interface Invoice {
  invoice_id: string;
  invoice_number: string;
  invoice_date: string;
  supplier_name: string;
  total_amount: number;
  invoice_status: string;
  total_lines: number;
  auto_matched: number;
  manual_matched: number;
  unmatched: number;
  disputed: number;
  match_pct: number;
}

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' }> = {
  pending:   { label: 'Pendente',  variant: 'warning' },
  matched:   { label: 'Matched',   variant: 'success' },
  partial:   { label: 'Parcial',   variant: 'warning' },
  disputed:  { label: 'Em disputa', variant: 'destructive' },
  cancelled: { label: 'Cancelada',  variant: 'secondary' },
  paid:      { label: 'Paga',       variant: 'default' },
};

export default function InvoicesPage() {
  const t = useTranslations('invoices');
  const router = useRouter();
  const summaryA = useAsync(
    () => fetch('/api/invoices/summary').then(r => r.ok ? r.json() : []),
    { scope: 'invoices-summary', retry: false }
  );
  const data: Invoice[] = (summaryA.data as Invoice[]) ?? [];
  const loading = summaryA.loading;

  const totalInvoices = data.length;
  const matchedInvoices = data.filter(i => i.invoice_status === 'matched').length;
  const totalAmount = data.reduce((s, i) => s + Number(i.total_amount || 0), 0);
  const totalLines = data.reduce((s, i) => s + Number(i.total_lines || 0), 0);
  const totalMatched = data.reduce((s, i) => s + Number(i.auto_matched + i.manual_matched || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6" />
            {t('title') || 'Faturas Recebidas'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Faturas processadas dos fornecedores. Cada item é <strong>triangulado</strong> com o catálogo
            e gera um <code className="text-xs bg-muted px-1 rounded">supplier_price</code> real.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Faturas</div>
            <div className="text-2xl font-semibold mt-1">{totalInvoices}</div>
            <div className="text-xs text-muted-foreground mt-1">{matchedInvoices} matched</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Valor total</div>
            <div className="text-2xl font-semibold mt-1">{formatCurrency(totalAmount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Linhas processadas</div>
            <div className="text-2xl font-semibold mt-1">{totalLines}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Taxa de match</div>
            <div className="text-2xl font-semibold mt-1 text-emerald-600">
              {totalLines ? Math.round(100 * totalMatched / totalLines) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de faturas */}
      {loading ? (
        <div className="text-sm text-muted-foreground p-8 text-center">A carregar…</div>
      ) : data.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
            Nenhuma fatura processada. Envie PDFs para o chat e eu processo.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.map(inv => {
            const statusInfo = STATUS_LABELS[inv.invoice_status] || STATUS_LABELS.pending;
            return (
              <Card
                key={inv.invoice_id}
                className="cursor-pointer hover:bg-accent/30 transition-colors"
                onClick={() => router.push(`/invoices/${inv.invoice_id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-semibold">{inv.invoice_number}</span>
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        {Number(inv.match_pct) >= 100 || inv.unmatched === 0
                          ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          : <AlertCircle className="h-4 w-4 text-amber-600" />
                        }
                      </div>
                      <div className="text-sm mt-1">
                        <span className="font-medium">{inv.supplier_name}</span>
                        <span className="text-muted-foreground ml-2">
                          • {new Date(inv.invoice_date).toLocaleDateString('pt-PT')}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2 flex items-center gap-3 flex-wrap">
                        <span><strong>{inv.total_lines}</strong> items</span>
                        <span className="text-emerald-600"><strong>{inv.auto_matched}</strong> auto-matched</span>
                        {inv.manual_matched > 0 && <span><strong>{inv.manual_matched}</strong> manual</span>}
                        {inv.unmatched > 0 && <span className="text-red-600"><strong>{inv.unmatched}</strong> por casar</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xl font-semibold">{formatCurrency(inv.total_amount)}</div>
                        <div className="text-xs text-muted-foreground">{inv.match_pct}% match</div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
        <CardContent className="p-4 text-sm">
          <h3 className="font-semibold flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4" /> Como funciona a triangulação
          </h3>
          <ol className="space-y-1 text-muted-foreground list-decimal pl-5">
            <li>Recebe-se a fatura (PDF) e extrai-se cada item (descrição, quantidade, preço, IVA)</li>
            <li>Para cada item, faz-se <strong>auto-match</strong> com o catálogo:
              <ul className="list-disc pl-5 mt-1">
                <li>1º tenta match por SKU do fornecedor</li>
                <li>2º tenta match exato por nome</li>
                <li>3º tenta match por alias conhecido</li>
                <li>4º tenta match por token-chave</li>
              </ul>
            </li>
            <li>Para cada item casado, <strong>cria/atualiza</strong> um <code className="text-xs bg-muted px-1 rounded">supplier_price</code> com:
              <ul className="list-disc pl-5 mt-1">
                <li><code>source='invoice'</code> (nunca fictício)</li>
                <li><code>source_ref=nº da fatura</code> (rastreabilidade)</li>
                <li><code>valid_from=data da fatura</code></li>
                <li><code>notes=IVA%</code></li>
              </ul>
            </li>
            <li>Items que não casam ficam <strong>unmatched</strong> para revisão manual</li>
            <li>Implementa <strong>3-way match</strong>: PO ↔ GR ↔ Invoice (quando POs estão registadas)</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
