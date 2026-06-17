'use client';

import { useEffect, useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, Euro, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getRealEconomy, type RealEconomy } from '@/lib/supabase-data';
import { formatCurrency } from '@/lib/utils';

export default function RoiPage() {
  const [data, setData] = useState<RealEconomy | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    getRealEconomy(days).then(setData).catch(() => null);
  }, [days]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Economia Real</h1>
          <p className="text-sm text-muted-foreground">Quanto compraste e quanto poupaste vs. melhor preço</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-md text-sm ${days === d ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70'}`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Comprado */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Wallet className="h-4 w-4" /> COMPRADO
            </div>
            <div className="mt-2 text-3xl font-semibold">{data ? formatCurrency(data.total_spent) : '—'}</div>
            <div className="text-xs text-muted-foreground mt-1">{data?.order_count ?? 0} ordens · {data?.item_count ?? 0} itens</div>
          </CardContent>
        </Card>

        {/* Melhor preço */}
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs">
              <Euro className="h-4 w-4" /> MELHOR PREÇO ENCONTRADO
            </div>
            <div className="mt-2 text-3xl font-semibold text-blue-600 dark:text-blue-400">
              {data ? formatCurrency(data.best_price_total) : '—'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">se tivesses comprado sempre ao mais barato</div>
          </CardContent>
        </Card>

        {/* Economia */}
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs">
              <TrendingUp className="h-4 w-4" /> ECONOMIA
            </div>
            <div className="mt-2 text-3xl font-semibold text-emerald-600 dark:text-emerald-400">
              {data ? formatCurrency(data.savings) : '—'}
            </div>
            <div className="text-xs text-emerald-700 dark:text-emerald-500 mt-1 font-medium">
              {data?.savings_pct ?? 0}% de poupança potencial
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Como calculamos</CardTitle>
          <CardDescription>Metodologia transparente</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• <strong>Comprado</strong>: soma de todos os <em>line_total</em> das ordens no período.</p>
          <p>• <strong>Melhor preço</strong>: para cada item, qual o preço unitário mais baixo atual entre todos os fornecedores. Multiplicado pelas quantidades compradas.</p>
          <p>• <strong>Economia</strong>: diferença. Mostra quanto <em>poderias</em> ter poupado se tivesses sempre escolhido o melhor preço. Não é "dinheiro na mão" — é <em>perda de oportunidade</em>.</p>
          <p className="flex items-center gap-2 pt-2">
            <AlertCircle className="h-4 w-4" />
            Para valores reais, atualiza os preços em <a href="/prices" className="underline">Revisão de Preços</a>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
