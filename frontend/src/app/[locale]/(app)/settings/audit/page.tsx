'use client';

import { useEffect, useState } from 'react';
import { Activity, Filter, Search, User, Building2, FileText, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { getAuditLog } from '@/lib/supabase-data';

export default function AuditPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuditLog(100).then((d) => { setEvents(d); setLoading(false); });
  }, []);

  const filtered = events.filter((e) => {
    if (!filter) return true;
    const s = filter.toLowerCase();
    return (e.action || '').toLowerCase().includes(s) || (e.entity_type || '').toLowerCase().includes(s);
  });

  // Stats
  const stats = {
    total: events.length,
    unique_users: new Set(events.map((e) => e.user_id).filter(Boolean)).size,
    create: events.filter((e) => e.action === 'create').length,
    update: events.filter((e) => e.action === 'update').length,
    delete: events.filter((e) => e.action === 'delete').length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Activity className="h-5 w-5" /> Auditoria
        </h1>
        <p className="text-sm text-muted-foreground">Histórico de todas as ações no sistema</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Eventos totais" value={stats.total} />
        <Stat label="Utilizadores únicos" value={stats.unique_users} />
        <Stat label="Criações" value={stats.create} color="emerald" />
        <Stat label="Atualizações" value={stats.update} color="blue" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Eventos</span>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtrar por ação ou entidade..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">A carregar eventos...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">Sem eventos para mostrar</p>
              <p className="text-xs text-muted-foreground mt-1">Os eventos aparecerão aqui quando houver atividade no sistema</p>
            </div>
          ) : (
            <ul className="divide-y">
              {filtered.map((e) => (
                <li key={e.id} className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      {actionIcon(e.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium flex items-center gap-2">
                        <span>{e.action || 'evento'}</span>
                        {e.entity_type && (
                          <Badge variant="outline" className="text-xs">{e.entity_type}</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                        {e.user_id && <span>user: {e.user_id.slice(0, 8)}...</span>}
                        {e.ip_address && <span>· IP: {e.ip_address}</span>}
                        {e.payload && typeof e.payload === 'object' && Object.keys(e.payload).length > 0 && (
                          <span>· {Object.keys(e.payload).join(', ')}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(e.created_at).toLocaleString('pt-PT')}
                    </div>
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

function actionIcon(action: string) {
  if (action?.includes('create')) return <FileText className="h-4 w-4 text-emerald-600" />;
  if (action?.includes('update')) return <FileText className="h-4 w-4 text-blue-600" />;
  if (action?.includes('delete')) return <FileText className="h-4 w-4 text-red-600" />;
  if (action?.includes('order')) return <ShoppingCart className="h-4 w-4 text-amber-600" />;
  return <FileText className="h-4 w-4 text-muted-foreground" />;
}

function Stat({ label, value, color }: { label: string; value: any; color?: 'emerald' | 'blue' }) {
  const c = color === 'emerald' ? 'text-emerald-600' : color === 'blue' ? 'text-blue-600' : '';
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-2xl font-semibold ${c}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
