'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Calendar, Upload, Package, Tag, ChevronRight, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getExceptions, type Exceptions, type StalePrice } from '@/lib/supabase-data';
import { formatCurrency } from '@/lib/utils';

type Tab = 'stale' | 'no_price' | 'no_category' | 'pending_ocr' | 'pending_imports';

export default function ExceptionsPage() {
  const [data, setData] = useState<Exceptions | null>(null);
  const [tab, setTab] = useState<Tab>('stale');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getExceptions().then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading || !data) {
    return <p className="text-sm text-muted-foreground text-center py-12">A carregar exceções...</p>;
  }

  const tabs: { id: Tab; label: string; icon: any; count: number; severity: 'critical' | 'warning' | 'info' }[] = [
    { id: 'stale', label: 'Preços antigos', icon: Calendar, count: data.stale_prices.count, severity: data.stale_prices.count > 0 ? 'warning' : 'info' },
    { id: 'no_price', label: 'Sem preço', icon: Package, count: data.no_price.count, severity: data.no_price.count > 0 ? 'critical' : 'info' },
    { id: 'no_category', label: 'Sem categoria', icon: Tag, count: data.no_category.count, severity: data.no_category.count > 0 ? 'warning' : 'info' },
    { id: 'pending_ocr', label: 'OCR pendente', icon: Upload, count: data.pending_ocr.count, severity: 'warning' },
    { id: 'pending_imports', label: 'Aprovação pendente', icon: Filter, count: data.pending_imports.count, severity: 'info' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Centro de Exceções</h1>
          <p className="text-sm text-muted-foreground">Tudo o que precisa de atenção, num só lugar</p>
        </div>
        <Badge variant={data.total > 0 ? 'destructive' : 'success'} className="text-base px-3 py-1">
          {data.total} {data.total === 1 ? 'issue' : 'issues'}
        </Badge>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm whitespace-nowrap transition-colors ${
                tab === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              <Badge variant={t.severity === 'critical' ? 'destructive' : 'secondary'} className="ml-1">{t.count}</Badge>
            </button>
          );
        })}
      </div>

      {/* Conteúdo */}
      <Card>
        <CardContent className="p-0">
          {tab === 'stale' && <StaleList items={data.stale_prices.items} />}
          {tab === 'no_price' && <SimpleList items={data.no_price.items} empty="Todos os produtos têm preço" />}
          {tab === 'no_category' && <SimpleList items={data.no_category.items} empty="Todos os produtos têm categoria" />}
          {tab === 'pending_ocr' && <ImportsList items={data.pending_ocr.items} status="ocr pendente" />}
          {tab === 'pending_imports' && <ImportsList items={data.pending_imports.items} status="aguarda aprovação" />}
        </CardContent>
      </Card>
    </div>
  );
}

function StaleList({ items }: { items: StalePrice[] }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-emerald-600 font-medium">✓ Sem preços antigos</p>
        <p className="text-xs text-muted-foreground">Todos os preços estão atualizados</p>
      </div>
    );
  }
  return (
    <ul className="divide-y">
      {items.map((p) => (
        <li key={p.product_id} className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm">{p.product_name}</div>
            <div className="text-xs text-muted-foreground">{p.brand} · {p.current_supplier} · {p.days_since_update}d sem atualização</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">{formatCurrency(p.current_price || 0)}/{p.unit}</div>
            <a href="/imports"><Button size="sm" variant="outline">Atualizar</Button></a>
          </div>
        </li>
      ))}
    </ul>
  );
}

function SimpleList({ items, empty }: { items: any[]; empty: string }) {
  if (items.length === 0) {
    return <div className="text-center py-12 text-sm text-muted-foreground">{empty}</div>;
  }
  return (
    <ul className="divide-y">
      {items.map((p) => (
        <li key={p.id} className="px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <div className="font-medium text-sm">{p.master_name}</div>
            <div className="text-xs text-muted-foreground">{p.brand || 'sem marca'}</div>
          </div>
          <a href="/catalog"><Button size="sm" variant="outline">Resolver</Button></a>
        </li>
      ))}
    </ul>
  );
}

function ImportsList({ items, status }: { items: any[]; status: string }) {
  if (items.length === 0) {
    return <div className="text-center py-12 text-sm text-muted-foreground">Sem items em {status}</div>;
  }
  return (
    <ul className="divide-y">
      {items.map((i) => (
        <li key={i.id} className="px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <div className="font-medium text-sm">{i.original_filename}</div>
            <div className="text-xs text-muted-foreground">
              {i.rows_total} linhas · {i.rows_approved} aprovadas · {i.rows_rejected} rejeitadas · {new Date(i.created_at).toLocaleString('pt-PT')}
            </div>
          </div>
          <a href="/imports"><Button size="sm" variant="outline">Ver</Button></a>
        </li>
      ))}
    </ul>
  );
}
