'use client';

import { useEffect, useState } from 'react';
import { Activity, Package, Truck, Tag, AlertCircle, AlertTriangle, Info, TrendingUp, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { getDataHealth, type DataHealth } from '@/lib/supabase-data';

export default function HealthPage() {
  const [h, setH] = useState<DataHealth | null>(null);

  useEffect(() => {
    getDataHealth().then(setH);
  }, []);

  if (!h) {
    return <p className="text-sm text-muted-foreground text-center py-12">A calcular saúde da base...</p>;
  }

  const scoreColor = h.score >= 90 ? 'text-emerald-600' : h.score >= 70 ? 'text-amber-600' : 'text-red-600';
  const scoreBg = h.score >= 90 ? 'bg-emerald-500/10' : h.score >= 70 ? 'bg-amber-500/10' : 'bg-red-500/10';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Saúde da Base</h1>
        <p className="text-sm text-muted-foreground">Qualidade dos dados e pontos a corrigir</p>
      </div>

      {/* Score */}
      <Card className={scoreBg}>
        <CardContent className="p-8 text-center">
          <div className="text-sm text-muted-foreground mb-2">Score geral</div>
          <div className={`text-6xl font-semibold ${scoreColor}`}>{h.score}%</div>
          <Progress value={h.score} className="mt-4 max-w-md mx-auto" />
          <p className="text-xs text-muted-foreground mt-3">
            {h.score >= 90 && 'Excelente — base pronta para operar'}
            {h.score >= 70 && h.score < 90 && 'Bom — alguns ajustes recomendados'}
            {h.score < 70 && 'Atenção — resolver issues antes de usar em produção'}
          </p>
        </CardContent>
      </Card>

      {/* Métricas principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs"><Package className="h-4 w-4" /> Produtos</div>
            <div className="mt-2 text-2xl font-semibold">{h.active_products}</div>
            <div className="text-xs text-muted-foreground">ativos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs"><Truck className="h-4 w-4" /> Fornecedores</div>
            <div className="mt-2 text-2xl font-semibold">{h.active_suppliers}</div>
            <div className="text-xs text-muted-foreground">ativos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs"><Tag className="h-4 w-4" /> Aliases</div>
            <div className="mt-2 text-2xl font-semibold">{h.total_aliases}</div>
            <div className="text-xs text-muted-foreground">mapeados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs"><BarChart3 className="h-4 w-4" /> Ordens</div>
            <div className="mt-2 text-2xl font-semibold">{h.total_orders}</div>
            <div className="text-xs text-muted-foreground">no total</div>
          </CardContent>
        </Card>
      </div>

      {/* Issues */}
      {h.issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Issues a resolver</CardTitle>
            <CardDescription>Ordenadas por severidade</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {h.issues.sort((a, b) => {
                const order = { critical: 0, warning: 1, info: 2 };
                return order[a.severity] - order[b.severity];
              }).map((issue, i) => (
                <li key={i} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {issue.severity === 'critical' && <AlertCircle className="h-5 w-5 text-red-500" />}
                    {issue.severity === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-500" />}
                    {issue.severity === 'info' && <Info className="h-5 w-5 text-blue-500" />}
                    <div>
                      <div className="text-sm font-medium">{issue.message}</div>
                      <div className="text-xs text-muted-foreground">
                        {issue.severity === 'critical' && 'Crítico — bloqueia operações'}
                        {issue.severity === 'warning' && 'Recomendado corrigir em breve'}
                        {issue.severity === 'info' && 'Sugestão de melhoria'}
                      </div>
                    </div>
                  </div>
                  <Badge variant={issue.severity === 'critical' ? 'destructive' : issue.severity === 'warning' ? 'default' : 'secondary'}>
                    {issue.count}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Stats detalhadas */}
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Stat label="Produtos totais" value={h.total_products} />
            <Stat label="Produtos ativos" value={h.active_products} />
            <Stat label="Produtos sem preço" value={h.without_price} variant={h.without_price > 0 ? 'warning' : 'ok'} />
            <Stat label="Produtos sem categoria" value={h.without_category} variant={h.without_category > 0 ? 'warning' : 'ok'} />
            <Stat label="Preços > 90 dias" value={h.stale_prices} variant={h.stale_prices > 0 ? 'warning' : 'ok'} />
            <Stat label="Possíveis duplicados" value={h.duplicate_candidates} variant={h.duplicate_candidates > 0 ? 'info' : 'ok'} />
            <Stat label="Items de ordens" value={h.total_purchase_items} />
            <Stat label="Última importação" value={h.last_import_at ? new Date(h.last_import_at).toLocaleDateString('pt-PT') : '—'} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, variant }: { label: string; value: any; variant?: 'ok' | 'warning' | 'info' }) {
  const color = variant === 'warning' ? 'text-amber-600' : variant === 'info' ? 'text-blue-600' : '';
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}
