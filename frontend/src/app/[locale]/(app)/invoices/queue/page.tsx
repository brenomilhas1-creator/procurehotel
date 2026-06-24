'use client';

import { useEffect, useState } from 'react';
import { Clock, Play, RefreshCw, CheckCircle, XCircle, Loader2, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface QueueItem {
  id: string;
  file_name: string;
  file_path: string;
  status: 'pending' | 'processing' | 'processed' | 'failed';
  attempts: number;
  last_error: string | null;
  created_at: string;
  processed_at: string | null;
}

export default function InvoiceQueuePage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 30000); // auto-refresh 30s
    return () => clearInterval(t);
  }, []);

  async function refresh() {
    const res = await fetch('/api/invoices/queue', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      setItems(data.items || []);
    }
    setLoading(false);
  }

  async function processOne(id: string) {
    setProcessing(id);
    const res = await fetch('/api/invoices/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'process', id }),
    });
    setProcessing(null);
    if (res.ok) {
      toast.success('Processamento iniciado');
      refresh();
    } else {
      toast.error('Erro: ' + (await res.text()));
    }
  }

  async function processAll() {
    setProcessing('all');
    const res = await fetch('/api/invoices/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'process_all' }),
    });
    setProcessing(null);
    if (res.ok) {
      toast.success('Todos os pendentes serão processados');
      refresh();
    } else {
      toast.error('Erro');
    }
  }

  const pending = items.filter((i) => i.status === 'pending');
  const processing_items = items.filter((i) => i.status === 'processing');
  const processed = items.filter((i) => i.status === 'processed');
  const failed = items.filter((i) => i.status === 'failed');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Queue de Faturas</h1>
          <p className="text-sm text-muted-foreground">
            Auto-refresh a cada 30s. Cron processa a cada 15 min.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" /> Atualizar
          </Button>
          <Button onClick={processAll} size="sm" disabled={pending.length === 0 || processing === 'all'}>
            {processing === 'all' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Processar todos ({pending.length})
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Pendentes</div>
            <div className="text-3xl font-bold text-amber-600 mt-1">{pending.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">A processar</div>
            <div className="text-3xl font-bold text-blue-600 mt-1">{processing_items.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Processados</div>
            <div className="text-3xl font-bold text-emerald-600 mt-1">{processed.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Falhados</div>
            <div className="text-3xl font-bold text-red-600 mt-1">{failed.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista */}
      <Card>
        <CardHeader>
          <CardTitle>Itens</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">A carregar...</p>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Queue vazia. Faz upload de uma fatura em /imports.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-3">Ficheiro</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Tentativas</th>
                  <th className="text-left p-3">Criado</th>
                  <th className="text-left p-3">Erro</th>
                  <th className="text-right p-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item) => {
                  const STATUS_MAP = {
                    pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Pendente' },
                    processing: { icon: Loader2, color: 'text-blue-600', bg: 'bg-blue-100', label: 'A processar' },
                    processed: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Processado' },
                    failed: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Falhou' },
                  };
                  const meta = STATUS_MAP[item.status];
                  const Icon = meta.icon;
                  return (
                    <tr key={item.id} className="hover:bg-accent/30">
                      <td className="p-3">
                        <div className="font-medium">{item.file_name}</div>
                        <div className="text-xs text-muted-foreground">{item.file_path}</div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className={`${meta.bg} ${meta.color}`}>
                          <Icon className={`h-3 w-3 mr-1 ${item.status === 'processing' ? 'animate-spin' : ''}`} />
                          {meta.label}
                        </Badge>
                      </td>
                      <td className="p-3 text-right tabular-nums">{item.attempts}</td>
                      <td className="p-3 text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString('pt-PT')}</td>
                      <td className="p-3 text-xs text-red-600 max-w-[300px] truncate" title={item.last_error || ''}>{item.last_error || '—'}</td>
                      <td className="p-3 text-right">
                        {item.status === 'pending' && (
                          <Button size="sm" variant="outline" onClick={() => processOne(item.id)} disabled={processing === item.id}>
                            {processing === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                            Processar
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
