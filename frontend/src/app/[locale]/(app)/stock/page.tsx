'use client';

import { useEffect, useState } from 'react';
import { Package, AlertTriangle, AlertCircle, CheckCircle, Edit3, Save, X, Search, TrendingDown, RefreshCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { listStock, updateStock, getStockSummary, type StockItem } from '@/lib/supabase-data';
import { toast } from 'sonner';

const STATUS_META = {
  critical: { label: 'Crítico', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-300' },
  low: { label: 'Baixo', icon: TrendingDown, color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-300' },
  ok: { label: 'OK', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-300' },
  unknown: { label: 'Sem config', icon: Package, color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border' },
} as const;

export default function StockPage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'critical' | 'low' | 'ok'>('all');
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<StockItem>>({});
  const [summary, setSummary] = useState<{ critical: number; low: number; ok: number; unknown: number; total_tracked: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refresh();
  }, [filter]);

  async function refresh() {
    setLoading(true);
    const [list, sum] = await Promise.all([
      listStock({ status: filter, limit: 500 }),
      getStockSummary(),
    ]);
    setItems(list);
    setSummary(sum);
    setLoading(false);
  }

  async function saveEdit(productId: string) {
    const result = await updateStock(productId, {
      stock_quantity: editDraft.stock_quantity === undefined ? undefined : (editDraft.stock_quantity as any),
      stock_min: editDraft.stock_min === undefined ? undefined : (editDraft.stock_min as any),
      stock_reorder_point: editDraft.stock_reorder_point === undefined ? undefined : (editDraft.stock_reorder_point as any),
      stock_unit: editDraft.stock_unit === undefined ? undefined : editDraft.stock_unit,
      stock_location: editDraft.stock_location === undefined ? undefined : editDraft.stock_location,
    });
    if (result.ok) {
      toast.success('Stock atualizado');
      setEditing(null);
      refresh();
    } else {
      toast.error('Erro: ' + result.error);
    }
  }

  function startEdit(item: StockItem) {
    setEditing(item.product_id);
    setEditDraft({
      stock_quantity: item.stock_quantity,
      stock_min: item.stock_min,
      stock_reorder_point: item.stock_reorder_point,
      stock_unit: item.stock_unit,
      stock_location: item.stock_location,
    });
  }

  const filtered = items.filter((i) =>
    !q || i.master_name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Stock & Inventário</h1>
          <p className="text-sm text-muted-foreground">
            {summary?.total_tracked ?? 0} produtos com stock configurado
          </p>
        </div>
        <Button onClick={refresh} variant="outline" size="sm">
          <RefreshCcw className="h-4 w-4" /> Atualizar
        </Button>
      </div>

      {/* KPIs */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-red-300 bg-red-50/50">
            <CardContent className="p-4">
              <div className="text-xs text-red-700 font-medium uppercase tracking-wide">Crítico</div>
              <div className="text-3xl font-bold text-red-700 mt-1">{summary.critical}</div>
              <div className="text-xs text-red-600 mt-1">Abaixo do mínimo</div>
            </CardContent>
          </Card>
          <Card className="border-amber-300 bg-amber-50/50">
            <CardContent className="p-4">
              <div className="text-xs text-amber-700 font-medium uppercase tracking-wide">Baixo</div>
              <div className="text-3xl font-bold text-amber-700 mt-1">{summary.low}</div>
              <div className="text-xs text-amber-600 mt-1">Abaixo do ponto encomenda</div>
            </CardContent>
          </Card>
          <Card className="border-emerald-300 bg-emerald-50/50">
            <CardContent className="p-4">
              <div className="text-xs text-emerald-700 font-medium uppercase tracking-wide">OK</div>
              <div className="text-3xl font-bold text-emerald-700 mt-1">{summary.ok}</div>
              <div className="text-xs text-emerald-600 mt-1">Stock saudável</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Sem config</div>
              <div className="text-3xl font-bold text-muted-foreground mt-1">{summary.unknown}</div>
              <div className="text-xs text-muted-foreground mt-1">Definir mínimo</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pesquisa + filtros */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Pesquisar produto..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        {(['all', 'critical', 'low', 'ok'] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)}>
            {f === 'all' ? 'Todos' : STATUS_META[f].label}
          </Button>
        ))}
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">A carregar...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              Sem items. Clica no ícone ✏️ de um produto para configurar stock.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-3">Produto</th>
                  <th className="text-left p-3">Categoria</th>
                  <th className="text-right p-3">Qtd atual</th>
                  <th className="text-right p-3">Mínimo</th>
                  <th className="text-right p-3">P. encomenda</th>
                  <th className="text-left p-3">Unidade</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((item) => {
                  const meta = STATUS_META[item.stock_status];
                  const Icon = meta.icon;
                  const isEditing = editing === item.product_id;
                  return (
                    <tr key={item.product_id} className={`hover:bg-accent/30 ${item.stock_status === 'critical' ? 'bg-red-50/30' : ''}`}>
                      <td className="p-3 font-medium">{item.master_name}{item.brand && <span className="text-xs text-muted-foreground ml-1">({item.brand})</span>}</td>
                      <td className="p-3 text-xs text-muted-foreground">{item.category || '—'}</td>
                      <td className="p-3 text-right tabular-nums">
                        {isEditing ? (
                          <Input type="number" step="0.001" value={editDraft.stock_quantity ?? ''} onChange={(e) => setEditDraft({ ...editDraft, stock_quantity: e.target.value === '' ? null : parseFloat(e.target.value) })} className="h-8 w-24 text-right" />
                        ) : (
                          item.stock_quantity !== null ? item.stock_quantity : <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        {isEditing ? (
                          <Input type="number" step="0.001" value={editDraft.stock_min ?? ''} onChange={(e) => setEditDraft({ ...editDraft, stock_min: e.target.value === '' ? null : parseFloat(e.target.value) })} className="h-8 w-24 text-right" />
                        ) : (
                          item.stock_min !== null ? item.stock_min : <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        {isEditing ? (
                          <Input type="number" step="0.001" value={editDraft.stock_reorder_point ?? ''} onChange={(e) => setEditDraft({ ...editDraft, stock_reorder_point: e.target.value === '' ? null : parseFloat(e.target.value) })} className="h-8 w-24 text-right" />
                        ) : (
                          item.stock_reorder_point !== null ? item.stock_reorder_point : <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-3 text-xs">
                        {isEditing ? (
                          <Input value={editDraft.stock_unit ?? ''} onChange={(e) => setEditDraft({ ...editDraft, stock_unit: e.target.value || null })} className="h-8 w-20" placeholder="kg/un" />
                        ) : (
                          item.stock_unit || <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className={`${meta.bg} ${meta.color} ${meta.border}`}>
                          <Icon className="h-3 w-3 mr-1" /> {meta.label}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        {isEditing ? (
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="default" onClick={() => saveEdit(item.product_id)}>
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => startEdit(item)}>
                            <Edit3 className="h-3 w-3" />
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
