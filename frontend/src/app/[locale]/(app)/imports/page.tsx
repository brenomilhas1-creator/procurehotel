'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { UploadCloud, Check, X, Loader2, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { listImports, listSuppliers, type Page, type ImportRow, type Supplier } from '@/lib/supabase-data';
import { getSupabase } from '@/lib/supabase';

export default function ImportsPage() {
  const [imports, setImports] = useState<Page<ImportRow> | null>(null);
  const [suppliers, setSuppliers] = useState<Page<Supplier> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [importType, setImportType] = useState('price_list');
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    const [a, b] = await Promise.all([listImports(20), listSuppliers({ limit: 100 })]);
    setImports(a); setSuppliers(b);
  }
  useEffect(() => { refresh().catch(() => null); }, []);

  async function upload() {
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    setUploading(true); setMsg(null);
    const sb = getSupabase();
    if (!sb) { setMsg({ kind: 'err', text: 'Supabase indisponível' }); setUploading(false); return; }
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setMsg({ kind: 'err', text: 'Sessão expirou — faça login novamente' }); setUploading(false); return; }

    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await sb.storage.from('ocr-uploads').upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) { setMsg({ kind: 'err', text: `Upload falhou: ${upErr.message}` }); setUploading(false); return; }

    const { error: insErr } = await sb.from('imports').insert({
      supplier_id: supplierId || null,
      user_id: user.id,
      import_type: importType,
      original_filename: file.name,
      stored_path: path,
      mime_type: file.type || null,
      size_bytes: file.size,
      status: 'uploaded',
      rows_total: 0, rows_approved: 0, rows_rejected: 0,
    });
    if (insErr) { setMsg({ kind: 'err', text: `Registo falhou: ${insErr.message}` }); setUploading(false); return; }

    setMsg({ kind: 'ok', text: `Ficheiro "${file.name}" enviado. Processamento em fila.` });
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
    await refresh();
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Importações</h1>
        <p className="text-sm text-muted-foreground">Carregue listas de preços ou faturas (CSV, XLSX, PDF, JPG)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova importação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="block mb-1 text-muted-foreground">Tipo</span>
              <select className="w-full h-10 rounded-md border bg-background px-3" value={importType} onChange={(e) => setImportType(e.target.value)}>
                <option value="price_list">Lista de preços</option>
                <option value="invoice">Fatura</option>
                <option value="catalog">Catálogo</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="block mb-1 text-muted-foreground">Fornecedor (opcional)</span>
              <select className="w-full h-10 rounded-md border bg-background px-3" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                <option value="">— Selecionar —</option>
                {suppliers?.items.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls,.pdf,.jpg,.jpeg,.png" className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:px-4 file:py-2 file:cursor-pointer" />
            <button
              onClick={upload}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              {uploading ? 'A enviar...' : 'Enviar'}
            </button>
          </div>
          {msg && (
            <div className={`text-sm rounded-md px-3 py-2 ${msg.kind === 'ok' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-red-500/10 text-red-700 dark:text-red-300'}`}>
              {msg.kind === 'ok' ? <Check className="inline h-4 w-4 mr-1" /> : <X className="inline h-4 w-4 mr-1" />}
              {msg.text}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            ℹ️ Os ficheiros são guardados no Supabase Storage. O processamento OCR é feito em background — pode demorar alguns minutos.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y">
            {imports?.items.map((i) => (
              <li key={i.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">{i.original_filename}</div>
                    <div className="text-xs text-muted-foreground">
                      {i.supplier?.name || 'sem fornecedor'} • {i.import_type} • {new Date(i.created_at).toLocaleString('pt-PT')}
                    </div>
                  </div>
                </div>
                <Badge variant={i.status === 'uploaded' ? 'default' : i.status === 'processed' ? 'success' : i.status === 'error' ? 'destructive' : 'secondary'}>
                  {i.status}
                </Badge>
              </li>
            ))}
            {!imports?.items.length && (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">Sem importações</li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
