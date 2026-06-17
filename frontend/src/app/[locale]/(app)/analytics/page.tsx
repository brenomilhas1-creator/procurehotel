'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAnalyticsSummary, getSavingsBySupplier, listOrders, type KpiSummary } from '@/lib/supabase-data';
import { formatCurrency } from '@/lib/utils';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AnalyticsPage() {
  const [kpi, setKpi] = useState<KpiSummary | null>(null);
  const [bySup, setBySup] = useState<any[]>([]);
  const [monthly, setMonthly] = useState<any[]>([]);

  useEffect(() => {
    getAnalyticsSummary().then(setKpi).catch(() => null);
    getSavingsBySupplier(90).then((d) => setBySup(d.suppliers || [])).catch(() => null);
    listOrders(200).then((d) => {
      // agrupa por mês
      const map = new Map<string, number>();
      for (const o of d.items) {
        const d2 = new Date(o.created_at);
        const k = `${d2.getFullYear()}-${String(d2.getMonth() + 1).padStart(2, '0')}`;
        map.set(k, (map.get(k) || 0) + Number(o.total_amount));
      }
      const arr = [...map.entries()].sort().slice(-6).map(([m, v]) => ({ month: m, total: Number(v.toFixed(2)) }));
      setMonthly(arr);
    }).catch(() => null);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Visão geral dos últimos 30 dias</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label="Fornecedores" value={kpi?.total_suppliers ?? '—'} />
        <Kpi label="Produtos" value={kpi?.total_products ?? '—'} />
        <Kpi label="Pedidos (30d)" value={kpi?.total_orders_30d ?? '—'} />
        <Kpi label="Gasto (30d)" value={kpi ? formatCurrency(kpi.total_spend_30d) : '—'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Evolução mensal</CardTitle>
          </CardHeader>
          <CardContent>
            {monthly.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Sem dados — crie ordens para popular</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                  <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Por fornecedor (90d)</CardTitle>
          </CardHeader>
          <CardContent>
            {bySup.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Sem dados</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={bySup} dataKey="total_eur" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {bySup.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: any }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-2 text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}
