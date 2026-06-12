'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Search, X, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { listSuppliers, type Supplier, type Page } from '@/lib/supabase-data';
import { getSupabase } from '@/lib/supabase';

export default function SuppliersPage() {
  const t = useTranslations('suppliers');
  const tCommon = useTranslations('common');
  const [data, setData] = useState<Page<Supplier> | null>(null);
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function refresh() {
    const r = await listSuppliers({ q, limit: 50 }).catch(() => null);
    if (r) setData(r);
  }

  useEffect(() => {
    const debounce = setTimeout(refresh, 300);
    return () => clearTimeout(debounce);
  }, [q]);

  async function onCreate() {
    if (!name.trim()) { setErr('Nome é obrigatório'); return; }
    setSaving(true); setErr(null);
    const sb = getSupabase();
    if (!sb) { setErr('Supabase indisponível'); setSaving(false); return; }
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setErr('Sessão expirou'); setSaving(false); return; }
    const { data, error } = await sb.from('suppliers').insert({
      name: name.trim(),
      tax_id: taxId.trim() || null,
      contact_email: email.trim() || null,
      contact_phone: phone.trim() || null,
      is_active: true,
      is_preferred: false,
    }).select().single();
    if (error) { setErr(error.message); setSaving(false); return; }
    setAdding(false); setName(''); setTaxId(''); setEmail(''); setPhone(''); setSaving(false);
    await refresh();
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{data?.total ?? 0} fornecedores</p>
        </div>
        <Button onClick={() => setAdding((v) => !v)}>
          {adding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {adding ? 'Cancelar' : t('add')}
        </Button>
      </div>

      {adding && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Novo fornecedor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input placeholder="Nome *" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="NIF" value={taxId} onChange={(e) => setTaxId(e.target.value)} />
              <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
              <Input placeholder="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <div className="flex gap-2">
              <Button onClick={onCreate} disabled={saving}>
                {saving ? 'A guardar...' : 'Guardar'}
              </Button>
              <Button variant="ghost" onClick={() => { setAdding(false); setErr(null); }}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('search')}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>{t('name')}</TH>
                <TH>NIF</TH>
                <TH>{t('email')}</TH>
                <TH>{t('phone')}</TH>
                <TH>Prazo (h)</TH>
                <TH>Preferido</TH>
              </TR>
            </THead>
            <TBody>
              {data?.items.map((s) => (
                <TR key={s.id}>
                  <TD className="font-medium">{s.name}</TD>
                  <TD className="font-mono text-xs">{s.tax_id ?? '—'}</TD>
                  <TD className="text-xs">{s.contact_email ?? '—'}</TD>
                  <TD className="text-xs">{s.contact_phone ?? '—'}</TD>
                  <TD>{s.delivery_lead_time_hours ?? '—'}</TD>
                  <TD>{s.is_preferred ? <Badge variant="success">★</Badge> : '—'}</TD>
                </TR>
              ))}
              {!data?.items.length && (
                <TR>
                  <TD colSpan={6} className="text-center text-muted-foreground py-8">
                    {tCommon('noData')}
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
