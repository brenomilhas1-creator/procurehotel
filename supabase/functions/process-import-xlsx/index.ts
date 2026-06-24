// Edge Function: process-import-xlsx
// Recebe XLSX/CSV (base64 ou texto), extrai items, devolve estrutura para review
// Suporta: .xlsx, .xls, .csv

// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info",
  "Content-Type": "application/json",
};

interface ExtractedItem {
  row_number: number;
  code?: string;
  name: string;
  category?: string;
  brand?: string;
  unit?: string;
  package_size?: string;
  ean?: string;
  quantity?: number;
  unit_price?: number;
  tax_rate?: number;
  raw_row: string;
}

/**
 * Parse CSV (suporta ; ou , como delimiter)
 */
function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  return lines.map((line) => {
    // Detectar delimiter
    const delim = line.includes(";") ? ";" : ",";
    // Split simples (sem aspas escapadas — bom o suficiente para tabelas de preços)
    return line.split(delim).map((c) => c.trim().replace(/^"|"$/g, ""));
  });
}

/**
 * Detetar cabeçalho (primeira linha com nomes de campos)
 * Heurística: linha com palavras-chave conhecidas
 */
function detectHeader(rows: string[][]): { headerIdx: number; columnMap: Record<string, number> } | null {
  const KEYWORDS = {
    name: ["nome", "designação", "designacao", "produto", "artigo", "descrição", "descricao", "description"],
    price: ["preço", "preco", "price", "pvp", "valor"],
    code: ["código", "codigo", "code", "ref", "referência", "referencia", "sku", "ean"],
    quantity: ["quantidade", "qtd", "qty", "quantity"],
    unit: ["unidade", "unit", "un", "uni"],
    category: ["categoria", "category", "departamento", "família", "familia"],
    brand: ["marca", "brand"],
    tax: ["iva", "tax", "taxa"],
  };
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const row = rows[i].map((c) => normalize(c));
    const colMap: Record<string, number> = {};
    for (const [field, kws] of Object.entries(KEYWORDS)) {
      for (let j = 0; j < row.length; j++) {
        if (kws.some((kw) => row[j].includes(kw))) {
          if (!(field in colMap)) colMap[field] = j;
          break;
        }
      }
    }
    if (colMap.name && (colMap.price || colMap.code)) {
      return { headerIdx: i, columnMap: colMap };
    }
  }
  return null;
}

/**
 * Parse do valor monetário.
 * PT: 1.234,56 EUR → 1234.56 (vírgula decimal, ponto milhar)
 * EN: 1,234.56 EUR → 1234.56 (ponto decimal, vírgula milhar)
 * Heurística: se tem vírgula E ponto, o último é o decimal.
 *            se tem só vírgula E tem 3 dígitos depois, é milhar (1,234 → 1234)
 *            senão a vírgula é decimal (1,45 → 1.45)
 */
function parsePrice(val: string | undefined): number | undefined {
  if (!val) return undefined;
  const cleaned = val.replace(/[^\d,.\-]/g, "");
  if (!cleaned) return undefined;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");

  let numStr: string;
  if (lastComma === -1 && lastDot === -1) {
    numStr = cleaned;
  } else if (lastComma > lastDot) {
    // Vírgula é decimal (PT): 1.234,56 → 1234.56
    numStr = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    // Ponto é decimal (EN): 1,234.56 → 1234.56
    numStr = cleaned.replace(/,/g, "");
  }

  const num = parseFloat(numStr);
  return isNaN(num) ? undefined : num;
}

function parseNumber(val: string | undefined): number | undefined {
  if (!val) return undefined;
  const num = parseFloat((val || "").replace(",", "."));
  return isNaN(num) ? undefined : num;
}

/**
 * Normaliza string removendo acentos + lowercase.
 * Usado para matching de cabeçalhos CSV (acentos tornavam 'preço'.includes('preco') = false).
 */
function normalize(s: string | undefined): string {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    // FIX BUG: validação de auth obrigatória (serviço usa service_role key)
    const auth = req.headers.get("authorization");
    if (!auth) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: CORS });
    }
    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user }, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), { status: 401, headers: CORS });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const body = await req.json();
    const { file_content_b64, file_text, file_name = "", supplier_id, dry_run = false } = body;

    if (!file_content_b64 && !file_text) {
      return new Response(JSON.stringify({ error: "Fornecer file_content_b64 (XLSX base64) ou file_text (CSV)" }), { status: 400, headers: CORS });
    }

    // Para já só processamos CSV. XLSX precisa de biblioteca adicional (xlsx via esm.sh).
    // Para XLSX, devolvemos erro informativo e sugerimos converter para CSV primeiro.
    const isXlsx = file_name.toLowerCase().endsWith(".xlsx") || file_name.toLowerCase().endsWith(".xls");
    if (isXlsx) {
      return new Response(JSON.stringify({
        error: "XLSX binário ainda não suportado server-side. Converte para CSV ou usa parser client-side.",
        hint: "O parser client-side em /imports continua a funcionar.",
        file_name,
      }), { status: 501, headers: CORS });
    }

    const text = file_text || "";
    if (!text) {
      return new Response(JSON.stringify({ error: "CSV vazio" }), { status: 400, headers: CORS });
    }

    const rows = parseCSV(text);
    if (rows.length < 2) {
      return new Response(JSON.stringify({ error: "CSV precisa de pelo menos 2 linhas (cabeçalho + 1 item)" }), { status: 400, headers: CORS });
    }

    const headerInfo = detectHeader(rows);
    if (!headerInfo) {
      return new Response(JSON.stringify({
        error: "Não detetei cabeçalho com colunas 'nome' e 'preço' ou 'código'",
        sample_first_row: rows[0],
      }), { status: 400, headers: CORS });
    }

    const { headerIdx, columnMap } = headerInfo;
    const items: ExtractedItem[] = [];

    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      // Ignorar linhas vazias
      if (row.every((c) => !c || c === "")) continue;

      const item: ExtractedItem = {
        row_number: i + 1,
        name: (row[columnMap.name] || "").trim(),
        raw_row: row.join(" | "),
      };
      if (columnMap.code !== undefined) item.code = (row[columnMap.code] || "").trim();
      if (columnMap.brand !== undefined) item.brand = (row[columnMap.brand] || "").trim();
      if (columnMap.category !== undefined) item.category = (row[columnMap.category] || "").trim();
      if (columnMap.unit !== undefined) item.unit = (row[columnMap.unit] || "").trim();
      if (columnMap.price !== undefined) item.unit_price = parsePrice(row[columnMap.price]);
      if (columnMap.quantity !== undefined) item.quantity = parseNumber(row[columnMap.quantity]);
      if (supabaseAdmin) {
      const { data: sugg } = await supabaseAdmin.rpc('suggest_category', { p_name: item.name });
      if (sugg && sugg[0]) {
        item.suggested_category = sugg[0].suggested_category;
        item.category_confidence = sugg[0].confidence;
      }
    }
    if (columnMap.tax !== undefined) {
        const taxStr = (row[columnMap.tax] || "").replace("%", "").trim();
        item.tax_rate = parseNumber(taxStr);
      }
      if (!item.name) continue;
      items.push(item);
    }

    // Auto-match contra produtos existentes (se supplier_id fornecido)
    let matched = 0;
    let unmatched = 0;
    if (supplier_id && items.length > 0) {
      const { data: products } = await supabaseAdmin
        .from("products")
        .select("id, master_name, sku, brand")
        .eq("is_active", true);
      const productByName = new Map<string, string>();
      const productByCode = new Map<string, string>();
      for (const p of products || []) {
        productByName.set(p.master_name.toLowerCase(), p.id);
        if (p.sku) productByCode.set(p.sku, p.id);
      }
      for (const item of items) {
        let pid: string | undefined;
        if (item.code && productByCode.has(item.code)) {
          pid = productByCode.get(item.code)!;
        } else if (productByName.has(item.name.toLowerCase())) {
          pid = productByName.get(item.name.toLowerCase())!;
        }
        if (pid) {
          (item as any).product_id = pid;
          (item as any).match_status = "matched";
          matched++;
        } else {
          (item as any).match_status = "unmatched";
          unmatched++;
        }
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      file_name,
      header_row: rows[headerIdx],
      column_map: columnMap,
      total_rows: rows.length - headerIdx - 1,
      items_extracted: items.length,
      matched,
      unmatched,
      items,
      dry_run,
    }), { status: 200, headers: CORS });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Erro desconhecido" }), { status: 500, headers: CORS });
  }
});
