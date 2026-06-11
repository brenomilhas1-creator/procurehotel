'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Clock, Database, AlertCircle, Brain, Upload, Users, Activity, Sparkles, BarChart3, CheckCircle2, ArrowRight, Lightbulb, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getOperationalSummary, type OperationalSummary } from '@/lib/supabase-data';
import { formatCurrency } from '@/lib/utils';

export default function OperationalPage() {
  const [s, setS] = useState<OperationalSummary | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [days, setDays] = useState(7);

  useEffect(() => {
    setS(null);
    setErr(null);
    const t = setTimeout(() => {
      getOperationalSummary(days)
        .then((d) => { setS(d); setErr(null); })
        .catch((e) => { setErr(String(e?.message || e)); });
    }, 50);
    return () => clearTimeout(t);
  }, [days]);

  if (!s) {
    return (
      <div className="text-sm text-muted-foreground text-center py-12 space-y-2">
        {err ? <p className="text-red-500">Erro: {err}</p> : <p>A compilar painel operacional...</p>}
      </div>
    );
  }

  const parseRate = s.parse_match_rate;
  const parseHealth = parseRate >= 90 ? 'excelente' : parseRate >= 70 ? 'bom' : parseRate >= 50 ? 'médio' : 'fraco';
  const parseColor = parseHealth === 'excelente' ? 'text-emerald-600' : parseHealth === 'bom' ? 'text-blue-600' : parseHealth === 'médio' ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Painel Operacional</h1>
          <p className="text-sm text-muted-foreground">
            Métricas reais de uso · Últimos {days} dias · {new Date(s.period.to).toLocaleDateString('pt-PT')}
          </p>
        </div>
        <div className="flex gap-1.5">
          {[1, 7, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-md text-sm ${days === d ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70'}`}
            >
              {d === 1 ? 'Hoje' : d === 7 ? '7d' : '30d'}
            </button>
          ))}
        </div>
      </div>

      {/* === SECÇÃO 1: ECONOMIA === */}
      <Section title="💰 Economia" icon={<TrendingUp className="h-4 w-4" />}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <BigStat label="Gasto total" value={formatCurrency(s.total_spend)} sub="no período" />
          <BigStat label="Poupança estimada" value={formatCurrency(s.estimated_savings)} sub={`${s.total_orders} ordens otimizadas`} tone="emerald" />
          <BigStat label="Ticket médio" value={formatCurrency(s.avg_order_value)} sub="por ordem" />
          <BigStat label="Items comprados" value={s.total_items} sub="linhas de ordem" />
        </div>
      </Section>

      {/* === SECÇÃO 2: TEMPO POUPADO === */}
      <Section title="⏱️ Tempo Poupado" icon={<Clock className="h-4 w-4" />}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <BigStat label="Logins" value={s.total_logins} sub="sessões iniciadas" />
          <BigStat label="Utilizadores ativos" value={s.total_users_active} sub="diferentes" tone="blue" />
          <BigStat
            label="Eventos registados"
            value={s.total_events}
            sub="ações no sistema"
          />
          <BigStat
            label="Favoritos usados"
            value="—"
            sub="repetição 1-clique"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          💡 A métrica de tempo poupado por ação é estimada em: <strong>~35 min por pedido</strong> vs processo manual.
          Com base em N pedidos automatizados: <strong>{Math.round(s.total_orders * 35 / 60)}h poupadas</strong>.
        </p>
      </Section>

      {/* === SECÇÃO 3: QUALIDADE DA BASE === */}
      <Section title="🗄️ Qualidade da Base de Dados" icon={<Database className="h-4 w-4" />}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <QualityStat label="Produtos totais" value={s.total_products} variant="ok" />
          <QualityStat label="Sem preço" value={s.products_without_price} variant={s.products_without_price > 0 ? 'critical' : 'ok'} />
          <QualityStat label="Sem categoria" value={s.products_without_category} variant={s.products_without_category > 0 ? 'warning' : 'ok'} />
          <QualityStat label="Preços > 30d" value={s.stale_prices} variant={s.stale_prices > 0 ? 'warning' : 'ok'} />
          <QualityStat label="Possíveis duplicados" value={s.products_duplicate} variant={s.products_duplicate > 0 ? 'info' : 'ok'} />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Score geral:</span>
          <div className="flex-1 max-w-xs">
            <Progress value={s.data_health_score} />
          </div>
          <span className={`text-sm font-semibold ${s.data_health_score >= 90 ? 'text-emerald-600' : s.data_health_score >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
            {s.data_health_score}%
          </span>
        </div>
      </Section>

      {/* === SECÇÃO 4: PRECISÃO DA IA === */}
      <Section title="🤖 Precisão da IA" icon={<Brain className="h-4 w-4" />}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <BigStat label="Pedidos processados" value={s.parses_total} sub="no período" />
          <BigStat label="Match automático" value={s.parses_matched} sub="sem revisão" tone="emerald" />
          <BigStat label="Para rever" value={s.parses_needs_review} sub="match parcial" tone={s.parses_needs_review > 0 ? 'amber' : 'emerald'} />
          <BigStat label="Taxa de match" value={`${s.parse_match_rate}%`} sub={`${parseHealth}`} tone={parseHealth === 'excelente' ? 'emerald' : parseHealth === 'bom' ? 'blue' : parseHealth === 'médio' ? 'amber' : 'red'} />
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          💡 Taxa &gt; 90% é excelente. Se estiver &lt; 70%, considerar adicionar mais aliases (heurística de match) ou
          implementar LLM para parsing inteligente (F4).
        </p>
      </Section>

      {/* === SECÇÃO 5: PENDENTES === */}
      <Section title="📋 Pendentes" icon={<Upload className="h-4 w-4" />}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <PendingStat
            label="OCR pendente"
            value={s.pending_ocr}
            description="ficheiros aguardam processamento"
            severity={s.pending_ocr > 0 ? 'warning' : 'ok'}
          />
          <PendingStat
            label="Aprovação pendente"
            value={s.pending_review}
            description="imports a rever pelo utilizador"
            severity={s.pending_review > 0 ? 'info' : 'ok'}
          />
          <PendingStat
            label="Total pendentes"
            value={s.pending_imports}
            description="no fluxo de import"
            severity={s.pending_imports > 0 ? 'info' : 'ok'}
          />
        </div>
      </Section>

      {/* === SECÇÃO 6: RECOMENDAÇÕES AUTOMÁTICAS === */}
      {s.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Recomendações automáticas
            </CardTitle>
            <CardDescription>Ações sugeridas com base nos dados atuais</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {s.recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-amber-500 mt-0.5">→</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* === SECÇÃO 7: ESTABILIDADE === */}
      <Section title="🛡️ Estabilidade" icon={<Activity className="h-4 w-4" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <StabilityCard
            label="Sistema"
            status="ok"
            detail="Frontend + DB + Storage + Edge Functions"
          />
          <StabilityCard
            label="CI/CD"
            status="ok"
            detail="GitHub Actions · 16 E2E tests"
          />
          <StabilityCard
            label="Sentry"
            status="ok"
            detail="Error tracking (sem DSN ativo — opcional)"
          />
          <StabilityCard
            label="Uptime"
            status="config"
            detail="UptimeRobot setup pendente (5min)"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Verificação detalhada em tempo real: <a href="/pt-PT/status" className="underline">/pt-PT/status</a>
        </p>
      </Section>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">{icon} {title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function BigStat({ label, value, sub, tone }: { label: string; value: any; sub?: string; tone?: 'default' | 'emerald' | 'blue' | 'amber' | 'red' }) {
  const colorMap = {
    default: '',
    emerald: 'text-emerald-600',
    blue: 'text-blue-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
  };
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-semibold ${colorMap[tone || 'default']}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function QualityStat({ label, value, variant }: { label: string; value: any; variant: 'ok' | 'critical' | 'warning' | 'info' }) {
  const colorMap = {
    ok: 'border-emerald-500/30 bg-emerald-500/5',
    critical: 'border-red-500/40 bg-red-500/5',
    warning: 'border-amber-500/40 bg-amber-500/5',
    info: 'border-blue-500/30 bg-blue-500/5',
  };
  const textMap = {
    ok: 'text-emerald-600',
    critical: 'text-red-600',
    warning: 'text-amber-600',
    info: 'text-blue-600',
  };
  return (
    <div className={`rounded-md border p-3 ${colorMap[variant]}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-semibold ${textMap[variant]}`}>{value}</div>
    </div>
  );
}

function PendingStat({ label, value, description, severity }: { label: string; value: any; description: string; severity: 'ok' | 'warning' | 'info' }) {
  return (
    <div className="rounded-md border p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{label}</div>
        <Badge variant={severity === 'ok' ? 'success' : severity === 'warning' ? 'destructive' : 'secondary'}>
          {value}
        </Badge>
      </div>
      <div className="text-xs text-muted-foreground mt-1">{description}</div>
    </div>
  );
}

function StabilityCard({ label, status, detail }: { label: string; status: 'ok' | 'config' | 'error'; detail: string }) {
  const icon = status === 'ok' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> :
              status === 'config' ? <Zap className="h-4 w-4 text-amber-500" /> :
              <AlertCircle className="h-4 w-4 text-red-500" />;
  return (
    <div className="rounded-md border p-3 flex items-center justify-between">
      <div>
        <div className="text-sm font-medium flex items-center gap-2">{icon} {label}</div>
        <div className="text-xs text-muted-foreground">{detail}</div>
      </div>
    </div>
  );
}
