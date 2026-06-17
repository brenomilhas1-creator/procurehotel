'use client';

import { useEffect, useState } from 'react';
import { Calendar, AlertCircle, CheckCircle2, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getStalePrices, type StalePrice } from '@/lib/supabase-data';
import { formatCurrency } from '@/lib/utils';

export default function PricesPage() {
  const [data, setData] = useState<StalePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'no_price'>('all');

  useEffect(() => {
    setLoading(true);
    getStalePrices(30).then((d) => { setData(d); setLoading(false); });
  }, []);

  const filtered = data.filter((p) => {
    if (filter === 'critical') return p.urgency === 'critical';
    if (filter === 'warning') return p.urgency === 'warning';
    if (filter === 'no_price') return p.current_price === null;
    return true;
  });

  const criticalCount = data.filter((p) => p.urgency === 'critical').length;
  const warningCount = data.filter((p) => p.urgency === 'warning').length;
  const noPriceCount = data.filter((p) => p.current_price === null).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Revisão de Preços</h1>
        <p className="text-sm text-muted-foreground">Produtos que precisam de preço atualizado para manter o sistema útil</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button onClick={() => setFilter('critical')} className="text-left">
          <Card className={`hover:bg-accent transition-colors ${filter === 'critical' ? 'ring-2 ring-red-500' : ''}`}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs">
                <AlertCircle className="h-4 w-4" /> CRÍTICO (&gt;90 dias)
              </div>
              <div className="mt-2 text-3xl font-semibold">{criticalCount}</div>
              <div className="text-xs text-muted-foreground">produtos</div>
            </CardContent>
          </Card>
        </button>
        <button onClick={() => setFilter('warning')} className="text-left">
          <Card className={`hover:bg-accent transition-colors ${filter === 'warning' ? 'ring-2 ring-amber-500' : ''}`}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs">
                <Calendar className="h-4 w-4" /> AVISO (&gt;30 dias)
              </div>
              <div className="mt-2 text-3xl font-semibold">{warningCount}</div>
              <div className="text-xs text-muted-foreground">produtos</div>
            </CardContent>
          </Card>
        </button>
        <button onClick={() => setFilter('no_price')} className="text-left">
          <Card className={`hover:bg-accent transition-colors ${filter === 'no_price' ? 'ring-2 ring-blue-500' : ''}`}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs">
                <Filter className="h-4 w-4" /> SEM PREÇO
              </div>
              <div className="mt-2 text-3xl font-semibold">{noPriceCount}</div>
              <div className="text-xs text-muted-foreground">produtos</div>
            </CardContent>
          </Card>
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Produtos a rever</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">A carregar...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 mb-2" />
              <p className="text-sm font-medium">Tudo em dia!</p>
              <p className="text-xs text-muted-foreground">Sem produtos para rever nesta categoria</p>
            </div>
          ) : (
            <ul className="divide-y">
              {filtered.map((p) => (
                <li key={p.product_id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{p.product_name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3 flex-wrap">
                      {p.brand && <span>{p.brand}</span>}
                      <span>· {p.category || 'sem categoria'}</span>
                      {p.current_supplier && <span>· {p.current_supplier}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {p.current_price !== null && (
                      <span className="text-sm">{formatCurrency(p.current_price)}/{p.unit}</span>
                    )}
                    {p.days_since_update !== null ? (
                      <Badge variant={p.urgency === 'critical' ? 'destructive' : 'default'}>
                        {p.days_since_update}d
                      </Badge>
                    ) : (
                      <Badge variant="outline">sem preço</Badge>
                    )}
                    <a href={`/imports`}>
                      <Button size="sm" variant="outline">Atualizar</Button>
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
