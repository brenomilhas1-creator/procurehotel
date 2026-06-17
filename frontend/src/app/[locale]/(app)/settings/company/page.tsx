'use client';

import { useEffect, useState } from 'react';
import { Building2, Upload, Save, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getMyCompany, updateCompany, type Company } from '@/lib/supabase-data';
import { useCompanyStore } from '@/stores/company';

const PRESET_COLORS = [
  { name: 'Emerald', value: '#10b981' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Slate', value: '#475569' },
];

export default function CompanySettingsPage() {
  const { company, setCompany } = useCompanyStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [form, setForm] = useState<Partial<Company>>({});

  useEffect(() => {
    getMyCompany().then((c) => {
      setCompany(c);
      if (c) setForm(c);
      setLoading(false);
    });
  }, [setCompany]);

  async function save() {
    if (!company) return;
    setSaving(true); setMsg(null);
    const r = await updateCompany(company.id, form);
    setSaving(false);
    if (r.ok) {
      setMsg({ kind: 'ok', text: 'Definições guardadas' });
      setCompany({ ...company, ...form } as Company);
    } else {
      setMsg({ kind: 'err', text: r.error || 'Erro' });
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground text-center py-12">A carregar definições...</p>;
  }

  if (!company) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium">Sem empresa associada</p>
          <p className="text-xs text-muted-foreground">A tua conta não está associada a nenhuma empresa.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Definições da Empresa</h1>
        <p className="text-sm text-muted-foreground">Personaliza o aspeto e dados da tua empresa</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Identidade</CardTitle>
          <CardDescription>Nome, slug, dados fiscais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="block mb-1 text-muted-foreground">Nome</span>
              <Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label className="text-sm">
              <span className="block mb-1 text-muted-foreground">Slug (URL)</span>
              <Input value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} />
            </label>
            <label className="text-sm">
              <span className="block mb-1 text-muted-foreground">Nome legal</span>
              <Input value={form.legal_name || ''} onChange={(e) => setForm({ ...form, legal_name: e.target.value })} placeholder="Empresa, Lda" />
            </label>
            <label className="text-sm">
              <span className="block mb-1 text-muted-foreground">NIF</span>
              <Input value={form.tax_id || ''} onChange={(e) => setForm({ ...form, tax_id: e.target.value })} placeholder="500000000" />
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="h-4 w-4" /> Marca</CardTitle>
          <CardDescription>Logo e favicon que aparecem em todo o lado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="block mb-1 text-muted-foreground">URL do Logo</span>
              <Input
                value={form.logo_url || ''}
                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                placeholder="https://..."
              />
            </label>
            <label className="text-sm">
              <span className="block mb-1 text-muted-foreground">URL do Favicon</span>
              <Input
                value={form.favicon_url || ''}
                onChange={(e) => setForm({ ...form, favicon_url: e.target.value })}
                placeholder="https://..."
              />
            </label>
          </div>
          {form.logo_url && (
            <div className="mt-3 flex items-center gap-3 rounded-md border p-3">
              <img src={form.logo_url} alt="logo preview" className="h-12 w-12 rounded object-contain" />
              <span className="text-xs text-muted-foreground">Pré-visualização do logo</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cores</CardTitle>
          <CardDescription>Cor primária (botões, links) e cor de destaque</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm mb-2 text-muted-foreground">Cor primária</div>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setForm({ ...form, primary_color: c.value })}
                  className={`h-8 w-8 rounded-md border-2 ${form.primary_color === c.value ? 'border-foreground' : 'border-transparent'}`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
              <input
                type="color"
                value={form.primary_color || '#10b981'}
                onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                className="h-8 w-8 rounded cursor-pointer"
              />
              <code className="text-xs px-2 py-1 bg-muted rounded self-center">{form.primary_color}</code>
            </div>
          </div>
          <div>
            <div className="text-sm mb-2 text-muted-foreground">Cor de destaque</div>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setForm({ ...form, accent_color: c.value })}
                  className={`h-8 w-8 rounded-md border-2 ${form.accent_color === c.value ? 'border-foreground' : 'border-transparent'}`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
              <input
                type="color"
                value={form.accent_color || '#3b82f6'}
                onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
                className="h-8 w-8 rounded cursor-pointer"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contacto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="block mb-1 text-muted-foreground">Email</span>
              <Input value={form.contact_email || ''} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
            </label>
            <label className="text-sm">
              <span className="block mb-1 text-muted-foreground">Telefone</span>
              <Input value={form.contact_phone || ''} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
            </label>
          </div>
          <label className="text-sm block">
            <span className="block mb-1 text-muted-foreground">Morada</span>
            <Input value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </label>
        </CardContent>
      </Card>

      <div className="flex gap-2 items-center">
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'A guardar...' : 'Guardar alterações'}
        </Button>
        <Badge variant="secondary">slug: {company.slug}</Badge>
        <Badge variant="secondary">status: {company.status}</Badge>
        {msg && (
          <div className={`text-sm ml-3 ${msg.kind === 'ok' ? 'text-emerald-600' : 'text-red-500'}`}>
            {msg.kind === 'ok' ? <Check className="inline h-4 w-4 mr-1" /> : <AlertCircle className="inline h-4 w-4 mr-1" />}
            {msg.text}
          </div>
        )}
      </div>
    </div>
  );
}
