'use client';

import { useCallback } from 'react';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import { useAsync } from '@/hooks/useAsync';
import { log } from '@/lib/logger';
import { useTranslations } from 'next-intl';
import { ShoppingCart, Package, Truck, TrendingDown, Euro, AlertCircle, Star, Heart, BarChart3, Activity, FileText, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAnalyticsSummary, getDataHealth, getExceptions, getFrequentItems, getStaleSummary, getMonthlySpend, getTopSuppliersBySpend, getTopProductsBySpend, type KpiSummary, type DataHealth, type Exceptions, type FrequentItem, type StaleSummary, type MonthlySpend, type SupplierSpend, type ProductSpend } from '@/lib/supabase-data';
import { formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  // useAsync substitui o padrão useState + useEffect + .then().catch()
  const kpiA = useAsync(getAnalyticsSummary, { scope: 'kpi' });
  const healthA = useAsync(getDataHealth, { scope: 'health' });
  const excA = useAsync(getExceptions, { scope: 'exceptions' });
  const frequentA = useAsync(() => getFrequentItems(5), { scope: 'frequent' });
  const alertsA = useAsync(() => fetch('/api/invoices/alerts').then(r => r.ok ? r.json() : null), { scope: 'alerts' });
  const staleA = useAsync(getStaleSummary, { scope: 'stale' });
  const monthlyA = useAsync(() => getMonthlySpend(12), { scope: 'monthly' });
  const topSuppliersA = useAsync(() => getTopSuppliersBySpend(5), { scope: 'top-suppliers' });
  const topProductsA = useAsync(() => getTopProductsBySpend(10), { scope: 'top-products' });
  // Aliases para manter compatibilidade com JSX existente
  const kpi = kpiA.data as KpiSummary | null;
  const health = healthA.data as DataHealth | null;
  const exc = excA.data as Exceptions | null;
  const frequent = (frequentA.data as FrequentItem[]) || [];
  const invoiceAlerts = alertsA.data as { unmatched: number; pending: number; total: number; recent_total: number } | null;
  const stale = staleA.data as StaleSummary | null;
  const monthly = (monthlyA.data as MonthlySpend[]) || [];
  const topSuppliers = (topSuppliersA.data as SupplierSpend[]) || [];
  const topProducts = (topProductsA.data as ProductSpend[]) || [];

  const refetch = useCallback(() => {
    kpiA.refetch(); healthA.refetch(); excA.refetch();
    frequentA.refetch(); alertsA.refetch(); staleA.refetch();
    monthlyA.refetch(); topSuppliersA.refetch(); topProductsA.refetch();
    log.debug('dashboard', 'refetch_all');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh quando há mudanças em invoices/POs/preços
  useRealtimeRefresh({
    tables: ['invoices', 'invoice_lines', 'supplier_prices', 'purchase_orders'],
    onChange: refetch,
    debounceMs: 2000,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Olá 👋</h1>
        <p className="text-sm text-muted-foreground">Aqui tens um resumo rápido do que precisa de ti</p>
      </div>

      {/* Saúde + Issues em destaque */}
      {health && (
        <Card className={health.score < 70 ? 'border-amber-500/30' : ''}>
          <CardContent className="p-5 flex items-center justify-between gap-4 flex-wrap">
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
            <div className="flex items-center gap-4 text-sm flex-wrap">
              {invoiceAlerts && invoiceAlerts.unmatched > 0 && (
                <a href="/invoices" className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 hover:underline">
                  <FileText className="h-4 w-4" />
                  {invoiceAlerts.unmatched} item{invoiceAlerts.unmatched !== 1 ? 's' : ''} de fatura por casar
                </a>
              )}
              {invoiceAlerts && invoiceAlerts.pending > 0 && (
                <a href="/invoices" className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline">
                  <Clock className="h-4 w-4" />
                  {invoiceAlerts.pending} fatura{invoiceAlerts.pending !== 1 ? 's' : ''} pendente{invoiceAlerts.pending !== 1 ? 's' : ''}
                </a>
              )}
              {exc && exc.total > 0 && (
                <a href="/exceptions" className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 hover:underline">
                  <AlertCircle className="h-4 w-4" />
                  {exc.total} {exc.total === 1 ? 'issue' : 'issues'} para resolver →
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerta de Preços Críticos (se houver) */}
      {stale && (stale.critical_count > 0 || stale.no_price_count > 0) && (
        <Card className="border-red-500/40 bg-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-red-700 dark:text-red-400">⚠️ Preços críticos</span>
                  {stale.critical_count > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {stale.critical_count} com preço &gt; 90 dias
                    </Badge>
                  )}
                  {stale.no_price_count > 0 && (
                    <Badge variant="outline" className="text-xs border-amber-500 text-amber-700">
                      {stale.no_price_count} sem preço
                    </Badge>
                  )}
                </div>
                {stale.top_critical.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {stale.top_critical.map((p) => (
                      <li key={p.product_id} className="flex items-center gap-2">
                        <span className="flex-1 truncate">• {p.product_name}</span>
                        <span className="text-red-600 font-medium">{p.days_since_update}d</span>
                        <a href="/prices" className="text-primary hover:underline">rever →</a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
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

      {/* Análise Mensal (M11) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gráfico de compras mensais */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Compras mensais
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthly.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Sem dados de faturas processadas.</p>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const max = Math.max(...monthly.map((m) => Number(m.total_spend)));
                  return monthly.slice(0, 6).reverse().map((m) => {
                    const pct = max > 0 ? (Number(m.total_spend) / max) * 100 : 0;
                    const monthLabel = new Date(m.month).toLocaleDateString('pt-PT', { month: 'short', year: '2-digit' });
                    return (
                      <div key={m.month} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium capitalize">{monthLabel}</span>
                          <span className="tabular-nums">{formatCurrency(Number(m.total_spend))} <span className="text-muted-foreground">({m.invoice_count})</span></span>
                        </div>
                        <div className="h-6 bg-muted rounded-md overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-md transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top fornecedores por gasto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Truck className="h-4 w-4" /> Top fornecedores
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {topSuppliers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Sem dados.</p>
            ) : (
              <ul className="divide-y">
                {topSuppliers.filter((s) => Number(s.total_spend) > 0).slice(0, 5).map((s) => (
                  <li key={s.supplier_id} className="px-4 py-2.5 flex items-center justify-between text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate flex items-center gap-1">
                        {s.is_preferred && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                        {s.supplier_name}
                      </div>
                      <div className="text-xs text-muted-foreground">{s.invoice_count} fatura{s.invoice_count !== 1 ? 's' : ''}</div>
                    </div>
                    <div className="font-semibold tabular-nums">{formatCurrency(Number(s.total_spend))}</div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top produtos por gasto */}
      {topProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-4 w-4" /> Top produtos por gasto
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {topProducts.slice(0, 10).map((p) => (
                <li key={p.product_id} className="px-4 py-2.5 flex items-center justify-between text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{p.master_name}</div>
                    <div className="text-xs text-muted-foreground">{p.category || '—'} · {Number(p.total_quantity).toFixed(1)} un · {p.line_count} linha{p.line_count !== 1 ? 's' : ''}</div>
                  </div>
                  <div className="font-semibold tabular-nums">{formatCurrency(Number(p.total_spend))}</div>
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
