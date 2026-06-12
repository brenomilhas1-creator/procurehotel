'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { UploadCloud, Check, X, Loader2, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { listImports, listSuppliers, trackEvent, type Page, type ImportRow, type Supplier } from '@/lib/supabase-data';
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

    trackEvent({
      event_type: 'import_uploaded',
      entity_type: 'import',
      payload: { filename: file.name, size_bytes: file.size, supplier_id: supplierId || null, type: importType },
    });

    // Para CSV/XLSX, tentar extrair e gravar produtos/preços automaticamente
    const isStructured = /\.(csv|xlsx|xls)$/i.test(file.name);
    if (isStructured) {
      setMsg({ kind: 'ok', text: `A processar "${file.name}"...` });
      try {
        const result = await processStructuredFile(file, supplierId, importType);
        if (result.created + result.updated > 0) {
          setMsg({
            kind: 'ok',
            text: `Ficheiro "${file.name}" processado: ${result.created} produtos criados, ${result.updated} preços atualizados.`,
          });
        } else if (result.errors.length > 0) {
          setMsg({
            kind: 'err',
            text: `Não foi possível extrair produtos de "${file.name}". Verifica o formato (colunas: nome/produto, preço).`,
          });
        } else {
          setMsg({ kind: 'ok', text: `Ficheiro "${file.name}" enviado (sem linhas válidas).` });
        }
      } catch (err: any) {
        setMsg({ kind: 'err', text: `Erro a processar: ${err?.message || err}` });
      }
    } else {
      setMsg({ kind: 'ok', text: `Ficheiro "${file.name}" enviado. Processamento em fila.` });
    }

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

// ============= PROCESSAMENTO DE CSV/XLSX =============

interface ProcessResult {
  created: number;
  updated: number;
  errors: string[];
}

async function processStructuredFile(
  file: File,
  supplierId: string,
  importType: string
): Promise<ProcessResult> {
  const result: ProcessResult = { created: 0, updated: 0, errors: [] };
  const sb = getSupabase();
  if (!sb) throw new Error('Supabase indisponível');

  // 1. Parse do ficheiro
  const rows = await parseFile(file);
  if (rows.length === 0) {
    result.errors.push('Ficheiro vazio ou sem linhas válidas');
    return result;
  }

  // 2. Detectar mapeamento de colunas (header row)
  const mapping = detectColumns(rows[0]);
  if (mapping.name < 0) {
    result.errors.push('Não foi possível encontrar coluna de nome/produto');
    return result;
  }

  // 3. Para cada linha, criar/atualizar produto e preço
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const name = String(row[mapping.name] || '').trim();
    if (!name || name.length < 2) continue;
    const price = mapping.price >= 0 ? parseNumber(row[mapping.price]) : null;
    const unit = mapping.unit >= 0 ? String(row[mapping.unit] || '').trim() : null;
    const code = mapping.code >= 0 ? String(row[mapping.code] || '').trim() : null;

    try {
      // Upsert product
      const { data: existing } = await sb.from('products')
        .select('id')
        .ilike('master_name', name)
        .limit(1)
        .maybeSingle();

      let productId: string;
      if (existing) {
        productId = existing.id;
      } else {
        const { data: np, error: npErr } = await sb.from('products').insert({
          master_name: name,
          brand: null,
          category: importType === 'invoice' ? 'fatura' : 'importado',
          unit: unit || 'UN',
          is_active: true,
        }).select('id').single();
        if (npErr || !np) { result.errors.push(`Linha ${i}: ${npErr?.message}`); continue; }
        productId = np.id;
        result.created++;
      }

      // Adicionar alias se tiver código
      if (code) {
        await sb.from('product_aliases').upsert({
          product_id: productId,
          alias: code,
          locale: 'pt-PT',
          hit_count: 0,
        }, { onConflict: 'product_id,alias,locale' }).select();
      }

      // Adicionar preço se tiver fornecedor + preço
      if (supplierId && price && price > 0) {
        await sb.from('supplier_prices').upsert({
          product_id: productId,
          supplier_id: supplierId,
          unit_price: price,
          price: price,
          currency: 'EUR',
          package_qty: 1,
          min_order_qty: 1,
          source: 'manual',
          is_current: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'product_id,supplier_id' }).select();
        result.updated++;
      }
    } catch (err: any) {
      result.errors.push(`Linha ${i}: ${err?.message || err}`);
    }
  }
  return result;
}

async function parseFile(file: File): Promise<string[][]> {
  const buf = await file.arrayBuffer();
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'csv') {
    // CSV: parse simples
    const text = new TextDecoder('utf-8').decode(buf);
    return parseCSV(text);
  } else if (ext === 'xlsx' || ext === 'xls') {
    // XLSX: usar SheetJS
    const XLSX = await import('xlsx');
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as string[][];
  }
  return [];
}

function parseCSV(text: string): string[][] {
  // Parser CSV simples (lida com aspas e vírgulas)
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  return lines.map((line) => {
    const cells: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"' && !inQuotes) { inQuotes = true; continue; }
      if (c === '"' && inQuotes) {
        if (line[i + 1] === '"') { cur += '"'; i++; continue; }
        inQuotes = false; continue;
      }
      if (c === ',' && !inQuotes) { cells.push(cur); cur = ''; continue; }
      cur += c;
    }
    cells.push(cur);
    return cells;
  });
}

interface ColumnMapping { name: number; price: number; unit: number; code: number; }

function detectColumns(header: string[]): ColumnMapping {
  const m: ColumnMapping = { name: -1, price: -1, unit: -1, code: -1 };
  const lower = header.map((h) => String(h || '').toLowerCase().trim());
  for (let i = 0; i < lower.length; i++) {
    const c = lower[i];
    if (m.name < 0 && /^(nome|produto|descri[çc][ãa]o|artigo|item|description|product|name)/i.test(c)) m.name = i;
    else if (m.price < 0 && /(pre[çc]o|price|valor|custo|pvp|€|eur)/i.test(c) && !/custo[ea]/i.test(c)) m.price = i;
    else if (m.unit < 0 && /(unidade|unit|un\.|embalagem|pack)/i.test(c)) m.unit = i;
    else if (m.code < 0 && /(c[óo]digo|code|ref|sku|ean|refer[êe]ncia)/i.test(c)) m.code = i;
  }
  // Fallback: se não encontrou nome, usar primeira coluna
  if (m.name < 0 && header.length > 0) m.name = 0;
  return m;
}

function parseNumber(v: any): number | null {
  if (typeof v === 'number') return v;
  if (!v) return null;
  const s = String(v).replace(/[^\d,.-]/g, '').replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}
