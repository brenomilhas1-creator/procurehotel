'use client';

import { useEffect, useState } from 'react';
import { Activity, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDataHealth } from '@/lib/supabase-data';

interface HealthCheck {
  name: string;
  status: 'ok' | 'warning' | 'error' | 'checking';
  detail: string;
  latency?: number;
}

export default function StatusPage() {
  const [checks, setChecks] = useState<HealthCheck[]>([
    { name: 'Frontend (Vercel)', status: 'checking', detail: 'A verificar...' },
    { name: 'Supabase Auth', status: 'checking', detail: 'A verificar...' },
    { name: 'Supabase Database', status: 'checking', detail: 'A verificar...' },
    { name: 'Supabase Storage', status: 'checking', detail: 'A verificar...' },
    { name: 'Edge Functions', status: 'checking', detail: 'A verificar...' },
  ]);
  const [dbHealth, setDbHealth] = useState<any>(null);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  async function runChecks() {
    setLastCheck(new Date());

    // Frontend (this page loaded = OK)
    setChecks((c) => c.map((x) => x.name === 'Frontend (Vercel)' ? { ...x, status: 'ok', detail: 'Online · 200 OK', latency: 0 } : x));

    // Supabase Auth check (REST root endpoint)
    try {
      const t0 = performance.now();
      const r = await fetch('https://fpjhvyydavssrzrkvlbd.supabase.co/rest/v1/', {
        cache: 'no-store',
        headers: { 'apikey': 'sb_publishable_sY6wLl6b0Ba5hbb_ezMPQA_MmzVkUBV' },
      });
      const t1 = performance.now();
      setChecks((c) => c.map((x) => x.name === 'Supabase Auth' ? {
        ...x,
        status: r.status === 200 ? 'ok' : 'warning',
        detail: r.status === 200 ? 'Online (REST root responde)' : `HTTP ${r.status}`,
        latency: Math.round(t1 - t0),
      } : x));
    } catch (e: any) {
      setChecks((c) => c.map((x) => x.name === 'Supabase Auth' ? { ...x, status: 'error', detail: e.message } : x));
    }

    // DB check
    try {
      const t0 = performance.now();
      const sb = (await import('@/lib/supabase')).getSupabase();
      const { error } = await sb!.from('products').select('id', { count: 'exact', head: true });
      const t1 = performance.now();
      setChecks((c) => c.map((x) => x.name === 'Supabase Database' ? {
        ...x,
        status: error ? 'error' : 'ok',
        detail: error ? error.message : 'Online',
        latency: Math.round(t1 - t0),
      } : x));
    } catch (e: any) {
      setChecks((c) => c.map((x) => x.name === 'Supabase Database' ? { ...x, status: 'error', detail: e.message } : x));
    }

    // Storage check
    try {
      const t0 = performance.now();
      const sb = (await import('@/lib/supabase')).getSupabase();
      const { data, error } = await sb!.storage.from('ocr-uploads').list('', { limit: 1 });
      const t1 = performance.now();
      setChecks((c) => c.map((x) => x.name === 'Supabase Storage' ? {
        ...x,
        status: error ? 'warning' : 'ok',
        detail: error ? error.message : 'Online',
        latency: Math.round(t1 - t0),
      } : x));
    } catch (e: any) {
      setChecks((c) => c.map((x) => x.name === 'Supabase Storage' ? { ...x, status: 'warning', detail: e.message } : x));
    }

    // Edge Function check
    try {
      const t0 = performance.now();
      const r = await fetch('https://fpjhvyydavssrzrkvlbd.supabase.co/functions/v1/admin-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test' }),  // sem auth, vai dar 401
      });
      const t1 = performance.now();
      setChecks((c) => c.map((x) => x.name === 'Edge Functions' ? {
        ...x,
        status: r.status === 401 || r.status === 400 ? 'ok' : 'error',
        detail: `${r.status} (esperado 401/400 sem auth)`,
        latency: Math.round(t1 - t0),
      } : x));
    } catch (e: any) {
      setChecks((c) => c.map((x) => x.name === 'Edge Functions' ? { ...x, status: 'error', detail: e.message } : x));
    }
  }

  useEffect(() => {
    runChecks();
    getDataHealth().then(setDbHealth).catch(() => null);
    const interval = setInterval(runChecks, 30_000);
    return () => clearInterval(interval);
  }, []);

  const allOk = checks.every((c) => c.status === 'ok');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Estado do Sistema</h1>
          <p className="text-sm text-muted-foreground">Verificação em tempo real</p>
        </div>
        <Badge variant={allOk ? 'success' : 'destructive'} className="text-base px-3 py-1">
          {allOk ? '✓ Tudo OK' : '⚠ Com issues'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {checks.map((c) => (
          <Card key={c.name}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {c.status === 'ok' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                {c.status === 'warning' && <AlertCircle className="h-5 w-5 text-amber-500" />}
                {c.status === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
                {c.status === 'checking' && <Clock className="h-5 w-5 text-muted-foreground animate-pulse" />}
                <div>
                  <div className="font-medium text-sm">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.detail}</div>
                </div>
              </div>
              {c.latency !== undefined && (
                <Badge variant="secondary" className="font-mono text-xs">{c.latency}ms</Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {dbHealth && (
        <Card>
          <CardHeader>
            <CardTitle>Saúde da Base de Dados</CardTitle>
            <CardDescription>Indicadores de qualidade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <Stat label="Score" value={`${dbHealth.score}%`} />
              <Stat label="Produtos ativos" value={dbHealth.active_products} />
              <Stat label="Fornecedores" value={dbHealth.active_suppliers} />
              <Stat label="Aliases" value={dbHealth.total_aliases} />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4" /> Última verificação
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {lastCheck.toLocaleString('pt-PT')} · Auto-refresh a cada 30 segundos
          <button onClick={runChecks} className="ml-3 underline hover:text-foreground">reverificar agora</button>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
