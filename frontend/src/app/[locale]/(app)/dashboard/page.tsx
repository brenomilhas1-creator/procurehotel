'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ShoppingCart, Package, Truck, TrendingDown, Euro, AlertCircle, Star, Heart, BarChart3, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAnalyticsSummary, getDataHealth, getExceptions, getFrequentItems, type KpiSummary, type DataHealth, type Exceptions, type FrequentItem } from '@/lib/supabase-data';
import { formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const [kpi, setKpi] = useState<KpiSummary | null>(null);
  const [health, setHealth] = useState<DataHealth | null>(null);
  const [exc, setExc] = useState<Exceptions | null>(null);
  const [frequent, setFrequent] = useState<FrequentItem[]>([]);

  useEffect(() => {
    getAnalyticsSummary().then(setKpi).catch(() => null);
    getDataHealth().then(setHealth).catch(() => null);
    getExceptions().then(setExc).catch(() => null);
    getFrequentItems(5).then(setFrequent).catch(() => null);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Olá 👋</h1>
        <p className="text-sm text-muted-foreground">Aqui tens um resumo rápido do que precisa de ti</p>
      </div>

      {/* Saúde + Issues em destaque */}
      {health && (
        <Card className={health.score < 70 ? 'border-amber-500/30' : ''}>
          <CardContent className="p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center text-sm font-semibold ${
                health.score >= 90 ? 'bg-emerald-500/10 text-emerald-600' :
                health.score >= 70 ? 'bg-amber-500/10 text-amber-600' :
                'bg-red-500/10 text-red-600'
              }`}>
                {health.score}%
              </div>
              <div>
                <div className="text-sm font-medium">Saúde da base</div>
                <div className="text-xs text-muted-foreground">
                  {health.active_products} produtos · {health.active_suppliers} fornecedores
                </div>
              </div>
            </div>
            {exc && exc.total > 0 && (
              <a href="/exceptions" className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 hover:underline">
                <AlertCircle className="h-4 w-4" />
                {exc.total} {exc.total === 1 ? 'issue' : 'issues'} para resolver →
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {/* Atalhos rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <a href="/order">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardContent className="p-4 text-center">
              <ShoppingCart className="h-6 w-6 mx-auto mb-1 text-emerald-600" />
              <div className="text-sm font-medium">Pedido Rápido</div>
              <div className="text-xs text-muted-foreground">1-clique</div>
            </CardContent>
          </Card>
        </a>
        <a href="/favorites">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardContent className="p-4 text-center">
              <Star className="h-6 w-6 mx-auto mb-1 text-amber-500" />
              <div className="text-sm font-medium">Favoritos</div>
              <div className="text-xs text-muted-foreground">reutilizar</div>
            </CardContent>
          </Card>
        </a>
        <a href="/prices">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardContent className="p-4 text-center">
              <Activity className="h-6 w-6 mx-auto mb-1 text-amber-500" />
              <div className="text-sm font-medium">Preços</div>
              <div className="text-xs text-muted-foreground">rever antigos</div>
            </CardContent>
          </Card>
        </a>
        <a href="/exceptions">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardContent className="p-4 text-center">
              <AlertCircle className="h-6 w-6 mx-auto mb-1 text-red-500" />
              <div className="text-sm font-medium">Exceções</div>
              <div className="text-xs text-muted-foreground">{exc?.total ?? 0} pendentes</div>
            </CardContent>
          </Card>
        </a>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={<Package className="h-5 w-5" />} label="Produtos" value={kpi?.total_products ?? '—'} sub="em catálogo" />
        <Kpi icon={<Truck className="h-5 w-5" />} label="Fornecedores" value={kpi?.total_suppliers ?? '—'} sub="ativos" />
        <Kpi icon={<ShoppingCart className="h-5 w-5" />} label="Pedidos (30d)" value={kpi?.total_orders_30d ?? '—'} sub={`${kpi?.pending_orders ?? 0} pendentes`} />
        <Kpi icon={<Euro className="h-5 w-5" />} label="Gasto (30d)" value={kpi ? formatCurrency(kpi.total_spend_30d) : '—'} sub="EUR" />
      </div>

      {/* Compras repetidas (M8) */}
      {frequent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-rose-500" /> Mais comprados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {frequent.map((f) => (
                <li key={f.product_id} className="px-4 py-2.5 flex items-center justify-between text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{f.product_name}</div>
                    <div className="text-xs text-muted-foreground">{f.preferred_supplier_name} · {f.times_ordered}x · {formatCurrency(f.avg_unit_price)}/{f.unit}</div>
                  </div>
                  <a href={`/order?product=${f.product_id}`}>
                    <Badge variant="secondary" className="cursor-pointer">Repetir</Badge>
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Kpi({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: any; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-muted-foreground text-xs">{icon} {label}</div>
        <div className="mt-2 text-2xl font-semibold">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}
