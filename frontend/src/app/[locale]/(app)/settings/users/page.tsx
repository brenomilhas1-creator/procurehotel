'use client';

import { useEffect, useState } from 'react';
import { Users, Shield, ShieldCheck, ShoppingCart, Eye, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getMyCompany, listCompanyMembers, listUsers, updateCompanyMember, removeCompanyMember, addCompanyMember, type CompanyMember, type Company } from '@/lib/supabase-data';

const ROLES = [
  { value: 'owner', label: 'Owner', desc: 'Acesso total, billing, branding', icon: ShieldCheck, color: 'destructive' as const },
  { value: 'admin', label: 'Admin', desc: 'Gestão de utilizadores + tudo exceto billing', icon: Shield, color: 'destructive' as const },
  { value: 'comprador', label: 'Comprador', desc: 'Pode fazer pedidos, ver catálogo', icon: ShoppingCart, color: 'default' as const },
  { value: 'visualizador', label: 'Visualizador', desc: 'Read-only em tudo', icon: Eye, color: 'secondary' as const },
];

export default function UsersSettingsPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [availableUsers, setAvailableUsers] = useState<{ id: string; email: string; full_name: string; role: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [pickUser, setPickUser] = useState('');
  const [pickRole, setPickRole] = useState('comprador');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  async function refresh() {
    const c = await getMyCompany();
    setCompany(c);
    if (c) {
      const [m, all] = await Promise.all([listCompanyMembers(c.id), listUsers()]);
      setMembers(m);
      setAvailableUsers(all);
    }
    setLoading(false);
  }
  useEffect(() => { refresh().catch(() => null); }, []);

  async function add() {
    if (!company || !pickUser) { setMsg({ kind: 'err', text: 'Escolhe um utilizador' }); return; }
    setBusy(true); setMsg(null);
    const r = await addCompanyMember(company.id, pickUser, pickRole);
    setBusy(false);
    if (r.ok) {
      setMsg({ kind: 'ok', text: 'Membro adicionado' });
      setAdding(false); setPickUser(''); setPickRole('comprador');
      await refresh();
    } else {
      setMsg({ kind: 'err', text: r.error || 'Erro' });
    }
  }

  async function changeRole(memberId: string, newRole: string) {
    setBusy(true);
    await updateCompanyMember(memberId, { role: newRole });
    setBusy(false);
    await refresh();
  }

  async function toggle(memberId: string, isActive: boolean) {
    setBusy(true);
    await updateCompanyMember(memberId, { is_active: isActive });
    setBusy(false);
    await refresh();
  }

  async function del(memberId: string) {
    if (!confirm('Remover este membro da empresa?')) return;
    setBusy(true);
    await removeCompanyMember(memberId);
    setBusy(false);
    await refresh();
  }

  if (loading) return <p className="text-sm text-muted-foreground text-center py-12">A carregar membros...</p>;

  if (!company) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-sm font-medium">Sem empresa associada</p>
        </CardContent>
      </Card>
    );
  }

  const memberIds = new Set(members.map((m) => m.user_id));
  const candidates = availableUsers.filter((u) => !memberIds.has(u.id));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Membros da Empresa</h1>
          <p className="text-sm text-muted-foreground">{members.length} membros em {company.name}</p>
        </div>
        <Button onClick={() => setAdding(!adding)}>
          <Users className="h-4 w-4" /> Adicionar membro
        </Button>
      </div>

      {/* Roles explicativos */}
      <Card>
        <CardHeader>
          <CardTitle>Roles disponíveis</CardTitle>
          <CardDescription>Cada role tem permissões diferentes</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {ROLES.map((r) => {
            const Icon = r.icon;
            return (
              <div key={r.value} className="rounded-md border p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4" />
                  <span className="font-medium text-sm">{r.label}</span>
                </div>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Adicionar */}
      {adding && (
        <Card>
          <CardHeader>
            <CardTitle>Adicionar novo membro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="text-sm sm:col-span-2">
                <span className="block mb-1 text-muted-foreground">Utilizador</span>
                <select className="w-full h-10 rounded-md border bg-background px-3" value={pickUser} onChange={(e) => setPickUser(e.target.value)}>
                  <option value="">— Escolhe um utilizador —</option>
                  {candidates.map((u) => (
                    <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="block mb-1 text-muted-foreground">Role</span>
                <select className="w-full h-10 rounded-md border bg-background px-3" value={pickRole} onChange={(e) => setPickRole(e.target.value)}>
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </label>
            </div>
            <p className="text-xs text-muted-foreground">Apenas {candidates.length} utilizadores disponíveis (não são membros desta empresa).</p>
            {msg && (
              <div className={`text-sm rounded-md px-3 py-2 ${msg.kind === 'ok' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-red-500/10 text-red-700'}`}>
                {msg.kind === 'ok' ? <CheckCircle2 className="inline h-4 w-4 mr-1" /> : <AlertCircle className="inline h-4 w-4 mr-1" />}
                {msg.text}
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={add} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                Adicionar
              </Button>
              <Button variant="outline" onClick={() => setAdding(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista */}
      <Card>
        <CardContent className="p-0">
          <ul className="divide-y">
            {members.map((m) => {
              const role = ROLES.find((r) => r.value === m.role);
              const Icon = role?.icon || Users;
              return (
                <li key={m.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{m.user?.full_name || m.user?.email || '—'}</div>
                      <div className="text-xs text-muted-foreground">{m.user?.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="h-8 text-xs rounded-md border bg-background px-2"
                      value={m.role}
                      onChange={(e) => changeRole(m.id, e.target.value)}
                      disabled={busy}
                    >
                      {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    <Badge variant={m.is_active ? 'success' : 'secondary'}>
                      {m.is_active ? 'ativo' : 'inativo'}
                    </Badge>
                    <Button size="sm" variant="ghost" onClick={() => toggle(m.id, !m.is_active)} disabled={busy || m.role === 'owner'}>
                      {m.is_active ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => del(m.id)} disabled={busy || m.role === 'owner'} title={m.role === 'owner' ? 'Não podes remover o owner' : 'Remover'}>
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </li>
              );
            })}
            {!members.length && (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">Sem membros</li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// Adicionar via import local
// (já importado acima)
