'use client';

import { useEffect, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Search, X, Check, Eye, EyeOff, GripVertical, Save, Pencil, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { listSuppliers, type Supplier, type Page } from '@/lib/supabase-data';
import { getSupabase } from '@/lib/supabase';

type SortableSupplier = Supplier & { sort_order?: number; is_hidden?: boolean };

export default function SuppliersPage() {
  const t = useTranslations('suppliers');
  const tCommon = useTranslations('common');
  const [data, setData] = useState<Page<SortableSupplier> | null>(null);
  const [q, setQ] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [savingReorder, setSavingReorder] = useState(false);

  async function refresh() {
    const sb = getSupabase();
    if (!sb) return;
    // Ordernar por sort_order manualmente porque o backend é simples
    let qb = sb.from('suppliers').select('*').order('name');
    if (!showHidden) qb = qb.eq('is_hidden', false);
    if (q) qb = qb.ilike('name', `%${q}%`);
    const { data: rows, error } = await qb.limit(50);
    if (error) { setErr(error.message); return; }
    // Ordenar manualmente por sort_order, depois por nome
    const sorted = (rows || []).sort((a: any, b: any) => {
      if ((a.sort_order || 0) !== (b.sort_order || 0)) return (a.sort_order || 0) - (b.sort_order || 0);
      return (a.name || '').localeCompare(b.name || '');
    });
    setData({ items: sorted as SortableSupplier[], total: sorted.length, page: 1, size: 50 });
  }

  useEffect(() => { refresh(); }, [q, showHidden]);

  async function onCreate() {
    if (!name.trim()) { setErr('Nome é obrigatório'); return; }
    setSaving(true); setErr(null);
    const sb = getSupabase();
    if (!sb) { setErr('Supabase indisponível'); setSaving(false); return; }
    // Próximo sort_order
    const { data: lastRow } = await sb.from('suppliers').select('sort_order').order('sort_order', { ascending: false }).limit(1).maybeSingle();
    const nextOrder = (lastRow?.sort_order || 0) + 1;
    const { error } = await sb.from('suppliers').insert({
      name: name.trim(),
      tax_id: taxId.trim() || null,
      contact_email: email.trim() || null,
      contact_phone: phone.trim() || null,
      is_active: true,
      is_preferred: false,
      is_hidden: false,
      sort_order: nextOrder,
    }).select().single();
    if (error) { setErr(error.message); setSaving(false); return; }
    setAdding(false); setName(''); setTaxId(''); setEmail(''); setPhone(''); setSaving(false);
    await refresh();
  }

  async function onToggleHidden(s: SortableSupplier) {
    const sb = getSupabase();
    if (!sb) return;
    await sb.from('suppliers').update({ is_hidden: !s.is_hidden }).eq('id', s.id);
    await refresh();
  }

  async function onSaveEdit(s: SortableSupplier) {
    const sb = getSupabase();
    if (!sb) return;
    const { error } = await sb.from('suppliers').update({
      name: editName.trim() || s.name,
      contact_email: editEmail.trim() || null,
    }).eq('id', s.id);
    if (error) setErr(error.message);
    setEditingId(null);
    await refresh();
  }

  // Drag & drop reorder
  function onDragStart(id: string) { setDragId(id); }
  function onDragOver(e: React.DragEvent) { e.preventDefault(); }
  async function onDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    setDragId(null);
    const sb = getSupabase();
    if (!sb) return;
    const items = data?.items || [];
    const fromIdx = items.findIndex(i => i.id === dragId);
    const toIdx = items.findIndex(i => i.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    const reordered = [...items];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    setData({ ...data!, items: reordered });
    setSavingReorder(true);
    // Persistir
    for (let i = 0; i < reordered.length; i++) {
      await sb.from('suppliers').update({ sort_order: i + 1 }).eq('id', reordered[i].id);
    }
    setSavingReorder(false);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{data?.total ?? 0} fornecedores {showHidden ? '(visíveis + ocultos)' : '(visíveis)'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowHidden(!showHidden)}>
            {showHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {showHidden ? 'Ocultos' : 'Ocultos'}
          </Button>
          <Button onClick={() => setAdding((v) => !v)}>
            {adding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {adding ? 'Cancelar' : t('add')}
          </Button>
        </div>
      </div>

      {savingReorder && (
        <div className="text-xs text-muted-foreground">A guardar nova ordem...</div>
      )}

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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="w-8"></th>
                <th className="text-left p-3">Nome</th>
                <th className="text-left p-3">NIF</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Telefone</th>
                <th className="text-left p-3">Preferido</th>
                <th className="text-right p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((s) => (
                <tr
                  key={s.id}
                  draggable
                  onDragStart={() => onDragStart(s.id)}
                  onDragOver={onDragOver}
                  onDrop={() => onDrop(s.id)}
                  className={`border-b hover:bg-muted/30 cursor-grab ${dragId === s.id ? 'opacity-40' : ''} ${s.is_hidden ? 'opacity-50' : ''}`}
                >
                  <td className="p-3 text-muted-foreground"><GripVertical className="h-4 w-4" /></td>
                  <td className="p-3 font-medium">
                    {editingId === s.id ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        autoFocus
                        className="h-7"
                      />
                    ) : (
                      <span>
                        {s.name}
                        {s.is_hidden && <Badge variant="secondary" className="ml-2 text-xs">oculto</Badge>}
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-mono text-xs">{s.tax_id ?? '—'}</td>
                  <td className="p-3 text-xs">
                    {editingId === s.id ? (
                      <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="h-7" />
                    ) : (
                      s.contact_email ?? '—'
                    )}
                  </td>
                  <td className="p-3 text-xs">{s.contact_phone ?? '—'}</td>
                  <td className="p-3">{s.is_preferred ? <Badge variant="success">★</Badge> : '—'}</td>
                  <td className="p-3 text-right">
                    <div className="flex gap-1 justify-end">
                      {editingId === s.id ? (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => onSaveEdit(s)}>
                            <Save className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => { setEditingId(s.id); setEditName(s.name); setEditEmail(s.contact_email || ''); }} title="Editar">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => onToggleHidden(s)} title={s.is_hidden ? 'Mostrar' : 'Ocultar'}>
                            {s.is_hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!data?.items.length && (
                <tr>
                  <td colSpan={7} className="text-center text-muted-foreground py-8">{tCommon('noData')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
