'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Users, UserPlus, Key, Trash2, Loader2, AlertCircle, CheckCircle2, Shield, ShieldOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { getAdminDashboard, getAuditLog, getPriceAlerts, listUsers, listImports, createLogin, changeUserRole, setUserActive, deleteUserLogin, changeMyPassword } from '@/lib/supabase-data';
import { useAuthStore } from '@/stores/auth';
import { getSupabase } from '@/lib/supabase';

export default function AdminPage() {
  const t = useTranslations('admin');
  const { user: currentUser } = useAuthStore();
  const [dash, setDash] = useState<any>(null);
  const [audit, setAudit] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [imports, setImports] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    getAdminDashboard().then(setDash).catch(() => null);
    getAuditLog(20).then(setAudit).catch(() => null);
    getPriceAlerts(5).then(setAlerts).catch(() => null);
    listImports(10).then((d) => setImports(d.items)).catch(() => null);
    listUsers().then(setUsers).catch(() => null);
  }, [refresh]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">Painel administrativo</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={<Users className="h-4 w-4" />} label="Utilizadores" value={dash?.users_total ?? '—'} />
        <Kpi icon={<Users className="h-4 w-4" />} label="Produtos" value={dash?.total_products ?? '—'} />
        <Kpi icon={<Users className="h-4 w-4" />} label="Fornecedores" value={dash?.total_suppliers ?? '—'} />
        <Kpi icon={<Users className="h-4 w-4" />} label="Ordens (total)" value={dash?.orders_total ?? '—'} />
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users"><Users className="h-4 w-4 mr-1" /> Utilizadores</TabsTrigger>
          <TabsTrigger value="newlogin"><UserPlus className="h-4 w-4 mr-1" /> Novo Login</TabsTrigger>
          <TabsTrigger value="password"><Key className="h-4 w-4 mr-1" /> Alterar Senha</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Utilizadores ({users.length})</CardTitle>
              <CardDescription>Gestão de logins do sistema</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y">
                {users.map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    isMe={u.id === currentUser?.id || u.email === currentUser?.email}
                    onChange={() => setRefresh((r) => r + 1)}
                  />
                ))}
                {!users.length && (
                  <li className="px-4 py-8 text-center text-sm text-muted-foreground">Sem utilizadores</li>
                )}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="newlogin">
          <NewLoginForm onCreated={() => setRefresh((r) => r + 1)} />
        </TabsContent>

        <TabsContent value="password">
          <ChangePasswordForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: any }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-muted-foreground text-xs">{icon} {label}</div>
        <div className="mt-2 text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function UserRow({ user: u, isMe, onChange }: { user: any; isMe: boolean; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  async function toggleRole() {
    setBusy(true);
    await changeUserRole(u.id, u.role === 'admin' ? 'user' : 'admin');
    setBusy(false);
    onChange();
  }
  async function toggleActive() {
    setBusy(true);
    await setUserActive(u.id, !u.is_active);
    setBusy(false);
    onChange();
  }
  async function del() {
    if (!confirm(`Apagar o utilizador ${u.email}? Esta ação não pode ser revertida.`)) return;
    setBusy(true);
    await deleteUserLogin(u.id);
    setBusy(false);
    onChange();
  }
  return (
    <li className="px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium flex items-center gap-2">
          {u.full_name || u.email}
          {isMe && <Badge variant="outline" className="text-xs">tu</Badge>}
        </div>
        <div className="text-xs text-muted-foreground">{u.email}</div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={u.role === 'admin' ? 'destructive' : 'secondary'}>{u.role}</Badge>
        <Badge variant={u.is_active !== false ? 'success' : 'secondary'}>
          {u.is_active !== false ? 'ativo' : 'inativo'}
        </Badge>
        <Button size="sm" variant="ghost" onClick={toggleRole} disabled={busy} title={u.role === 'admin' ? 'Rebaixar a user' : 'Promover a admin'}>
          {u.role === 'admin' ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
        </Button>
        <Button size="sm" variant="ghost" onClick={del} disabled={busy || isMe} title={isMe ? 'Não podes apagar o teu próprio login' : 'Apagar'}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </li>
  );
}

function NewLoginForm({ onCreated }: { onCreated: () => void }) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { setMsg({ kind: 'err', text: 'Password deve ter pelo menos 6 caracteres' }); return; }
    setBusy(true); setMsg(null);
    const r = await createLogin({ email, password, full_name: fullName, role });
    setBusy(false);
    if (r.ok) {
      setMsg({ kind: 'ok', text: `Login ${email} criado com sucesso! O utilizador pode fazer login imediatamente.` });
      setEmail(''); setFullName(''); setPassword(''); setRole('user');
      onCreated();
    } else {
      setMsg({ kind: 'err', text: r.error || 'Erro desconhecido' });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><UserPlus className="h-4 w-4" /> Criar novo login</CardTitle>
        <CardDescription>Adicionar um novo utilizador ao sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-3 max-w-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="block mb-1 text-muted-foreground">Nome completo</span>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ex: João Silva" required />
            </label>
            <label className="text-sm">
              <span className="block mb-1 text-muted-foreground">Email</span>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="joao@empresa.pt" required />
            </label>
            <label className="text-sm">
              <span className="block mb-1 text-muted-foreground">Password (mín 6 chars)</span>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
            </label>
            <label className="text-sm">
              <span className="block mb-1 text-muted-foreground">Role</span>
              <select className="w-full h-10 rounded-md border bg-background px-3" value={role} onChange={(e) => setRole(e.target.value as any)}>
                <option value="user">Utilizador</option>
                <option value="admin">Administrador</option>
              </select>
            </label>
          </div>
          {msg && (
            <div className={`text-sm rounded-md px-3 py-2 ${msg.kind === 'ok' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-red-500/10 text-red-700 dark:text-red-300'}`}>
              {msg.kind === 'ok' ? <CheckCircle2 className="inline h-4 w-4 mr-1" /> : <AlertCircle className="inline h-4 w-4 mr-1" />}
              {msg.text}
            </div>
          )}
          <Button type="submit" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            {busy ? 'A criar...' : 'Criar login'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ChangePasswordForm() {
  const [current, setCurrent] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (newPwd.length < 6) { setMsg({ kind: 'err', text: 'A nova password deve ter pelo menos 6 caracteres' }); return; }
    if (newPwd !== confirm) { setMsg({ kind: 'err', text: 'As passwords não coincidem' }); return; }

    setBusy(true); setMsg(null);
    const r = await changeMyPassword(current, newPwd);
    setBusy(false);
    if (r.ok) {
      setMsg({ kind: 'ok', text: 'Password alterada com sucesso! A tua próxima sessão já usa a nova password.' });
      setCurrent(''); setNewPwd(''); setConfirm('');
    } else {
      setMsg({ kind: 'err', text: r.error || 'Erro desconhecido' });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Key className="h-4 w-4" /> Alterar a minha password</CardTitle>
        <CardDescription>Precisas de saber a password atual</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-3 max-w-lg">
          <label className="text-sm block">
            <span className="block mb-1 text-muted-foreground">Password atual</span>
            <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
          </label>
          <label className="text-sm block">
            <span className="block mb-1 text-muted-foreground">Nova password (mín 6 chars)</span>
            <Input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} minLength={6} required />
          </label>
          <label className="text-sm block">
            <span className="block mb-1 text-muted-foreground">Confirmar nova password</span>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={6} required />
          </label>
          {msg && (
            <div className={`text-sm rounded-md px-3 py-2 ${msg.kind === 'ok' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-red-500/10 text-red-700 dark:text-red-300'}`}>
              {msg.kind === 'ok' ? <CheckCircle2 className="inline h-4 w-4 mr-1" /> : <AlertCircle className="inline h-4 w-4 mr-1" />}
              {msg.text}
            </div>
          )}
          <Button type="submit" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
            {busy ? 'A alterar...' : 'Alterar password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
