// Edge Function: process-invoice-pdf
// Recebe PDF de fatura, extrai items, cria invoice + invoice_lines + supplier_prices
// Compra Facil Hoteis

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// NOTA: Não podemos usar pdfplumber (Python) em Deno.
// Usamos uma abordagem alternativa: aceitar JSON já extraído do PDF
// (frontend faz upload, extrai com pdf.js/pdfplumber via API Python, depois envia items).

interface ProcessRequest {
  file_path?: string;       // path no storage (opcional)
  file_url?: string;        // URL pública (opcional)
  text?: string;            // texto OCR já extraído (modo principal)
  supplier_tax_id?: string; // NIF do fornecedor para detetar automaticamente
  invoice_number?: string;  // nº de fatura (se conhecido)
  invoice_date?: string;    // data ISO
  dry_run?: boolean;        // só simular, não gravar
}

interface ExtractedLine {
  raw_line: string;        // texto completo
  quantity?: number;
  unit?: string;           // kg, un, cx, l, etc
  unit_price?: number;
  tax_rate?: number;       // 6, 13, 23
  sku?: string;
  total?: number;
}

serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response("unauthorized", { status: 401, headers: cors });

    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(url, key, { auth: { persistSession: false } });

    // Identificar user
    const { data: userData } = await sb.auth.getUser(auth.replace("Bearer ", ""));
    const authUser = userData?.user;
    if (!authUser) return new Response("unauthorized", { status: 401, headers: cors });

    const body: ProcessRequest = await req.json();

    // ============================================================
    // 1) EXTRAÇÃO: 3 modos (URL, text, file_path)
    // ============================================================
    let extracted: { supplier_name?: string; supplier_tax_id?: string; invoice_number?: string; invoice_date?: string; total_amount?: number; lines: ExtractedLine[] } = { lines: [] };

    if (body.file_url) {
      // Modo 1: descarregar PDF e extrair (requer Python sidecar — não disponível em Deno)
      // Em vez disso, retornamos erro a dizer para usar modo text
      return new Response(JSON.stringify({
        ok: false,
        error: "file_url mode not supported in Edge Function. Use text mode (extracted via frontend pdf.js or external OCR service).",
      }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    } else if (body.text) {
      // Modo 2: texto OCR já extraído (do frontend)
      extracted = parseInvoiceText(body.text);
    } else {
      return new Response(JSON.stringify({ ok: false, error: "Provide 'text' (OCR'd invoice content)" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    // Override com dados do body
    if (body.invoice_number) extracted.invoice_number = body.invoice_number;
    if (body.invoice_date) extracted.invoice_date = body.invoice_date;
    if (body.supplier_tax_id) extracted.supplier_tax_id = body.supplier_tax_id;

    if (!extracted.invoice_number || !extracted.invoice_date || extracted.lines.length === 0) {
      return new Response(JSON.stringify({
        ok: false,
        error: "Could not extract invoice_number, invoice_date, or lines",
        extracted,
      }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    // ============================================================
    // 2) IDENTIFICAR FORNECEDOR
    // ============================================================
    let supplierId: string | null = null;
    let supplierConfidence = 0;

    if (extracted.supplier_tax_id) {
      const { data: s } = await sb.from("suppliers").select("id, name, tax_id")
        .eq("tax_id", extracted.supplier_tax_id).maybeSingle();
      if (s) { supplierId = s.id; supplierConfidence = 1; }
    }
    if (!supplierId && extracted.supplier_name) {
      const { data: sList } = await sb.from("suppliers").select("id, name, tax_id")
        .ilike("name", `%${extracted.supplier_name}%`).limit(1);
      if (sList && sList.length > 0) { supplierId = sList[0].id; supplierConfidence = 0.8; }
    }
    if (!supplierId) {
      // Criar fornecedor novo (com dados mínimos)
      if (!extracted.supplier_name) {
        return new Response(JSON.stringify({
          ok: false,
          error: "Could not identify or create supplier. Provide supplier_tax_id or supplier_name in body.",
          extracted,
        }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
      }
      const { data: ns, error: ne } = await sb.from("suppliers").insert({
        name: extracted.supplier_name,
        tax_id: extracted.supplier_tax_id || null,
        is_active: true,
        is_preferred: false,
        source: "auto_created_from_invoice",
      }).select("id").single();
      if (ne) {
        return new Response(JSON.stringify({ ok: false, error: "Failed to create supplier: " + ne.message }),
          { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
      }
      supplierId = ns!.id;
      supplierConfidence = 0.5;
    }

    // ============================================================
    // 3) OBTER user_id interno
    // ============================================================
    const { data: intUser } = await sb.from("users").select("id").eq("supabase_user_id", authUser.id).maybeSingle();
    const internalUserId = intUser?.id;
    if (!internalUserId) {
      return new Response(JSON.stringify({ ok: false, error: "User not registered in users table" }),
        { status: 403, headers: { ...cors, "Content-Type": "application/json" } });
    }

    // ============================================================
    // 4) DRY RUN
    // ============================================================
    if (body.dry_run) {
      return new Response(JSON.stringify({
        ok: true,
        dry_run: true,
        supplier_id: supplierId,
        supplier_confidence: supplierConfidence,
        invoice: {
          number: extracted.invoice_number,
          date: extracted.invoice_date,
          total: extracted.total_amount,
        },
        lines: extracted.lines,
      }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
    }

    // ============================================================
    // 5) CRIAR INVOICE
    // ============================================================
    const { data: inv, error: invErr } = await sb.from("invoices").insert({
      supplier_id: supplierId,
      user_id: internalUserId,
      invoice_number: extracted.invoice_number!,
      invoice_type: "fatura",
      invoice_date: extracted.invoice_date!,
      currency: "EUR",
      subtotal: extracted.total_amount || 0,
      total_amount: extracted.total_amount || 0,
      status: "pending",
      source: "pdf",
      notes: `Processado automaticamente via Edge Function. ${extracted.lines.length} items extraídos.`,
    }).select("id").single();

    if (invErr || !inv) {
      return new Response(JSON.stringify({ ok: false, error: "Failed to create invoice: " + (invErr?.message || "?") }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
    }

    // ============================================================
    // 6) CRIAR INVOICE_LINES + AUTO-MATCH
    // ============================================================
    const linesCreated = [];
    for (let i = 0; i < extracted.lines.length; i++) {
      const ln = extracted.lines[i];
      const { data: lineRow, error: lineErr } = await sb.from("invoice_lines").insert({
        invoice_id: inv.id,
        line_number: i + 1,
        raw_description: ln.raw_line,
        supplier_sku: ln.sku || null,
        quantity: ln.quantity || 1,
        unit_of_measure: ln.unit || null,
        unit_price: ln.unit_price || 0,
        subtotal: (ln.quantity || 1) * (ln.unit_price || 0),
        tax_rate: ln.tax_rate || 0,
        tax_amount: ((ln.quantity || 1) * (ln.unit_price || 0)) * ((ln.tax_rate || 0) / 100),
        total: ((ln.quantity || 1) * (ln.unit_price || 0)) * (1 + (ln.tax_rate || 0) / 100),
        match_status: "unmatched",
      }).select("id").single();
      if (!lineErr && lineRow) {
        // Auto-match
        await sb.rpc("auto_match_invoice_line", { p_line_id: lineRow.id });
        linesCreated.push({ id: lineRow.id, raw: ln.raw_line });
      }
    }

    // Atualizar status
    const { count: matched } = await sb.from("invoice_lines").select("id", { count: "exact", head: true })
      .eq("invoice_id", inv.id).neq("match_status", "unmatched");
    const { count: total } = await sb.from("invoice_lines").select("id", { count: "exact", head: true })
      .eq("invoice_id", inv.id);
    const status = matched === total ? "matched" : (matched === 0 ? "pending" : "partial");
    await sb.from("invoices").update({ status }).eq("id", inv.id);

    // Processar para supplier_prices
    const processed = [];
    for (const lc of linesCreated) {
      const { data: res } = await sb.rpc("process_invoice_line_to_price", { p_line_id: lc.id });
      if (res) processed.push(res);
    }

    return new Response(JSON.stringify({
      ok: true,
      invoice_id: inv.id,
      supplier_id: supplierId,
      supplier_confidence: supplierConfidence,
      lines_count: linesCreated.length,
      matched_count: matched || 0,
      status,
      processed_prices: processed.length,
    }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });

  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || String(e) }),
      { status: 500, headers: { "Content-Type": "application/json" } });
  }
});

// =================================================================
// PARSER: extrai dados estruturados de texto de fatura PT
// =================================================================
function parseInvoiceText(text: string): any {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const result: any = { lines: [] };

  // Invoice number: padrões comuns PT
  // "FT FT1/7979", "Fatura FT1/7979", "Número: ZFT2 BD0C/..."
  const invNumMatch = text.match(/(?:Fatura|FT|FA|N[úu]mero|Guia)[:\s]+(?:FT\s*)?([A-Z0-9]{2,}[\s/][A-Z0-9]{2,}\/\d+|FT\d+\/\d+|\d+-\d+|[A-Z]{2,}\s?\d+\/\d+)/i);
  if (invNumMatch) result.invoice_number = invNumMatch[1].replace(/\s+/g, "").trim();

  // Date: dd.mm.yyyy ou dd/mm/yyyy ou yyyy-mm-dd
  const dateMatch = text.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (dateMatch) {
    const [, d, m, y] = dateMatch;
    result.invoice_date = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // Supplier: procurar nome de empresa conhecida OU o tax_id
  const taxMatch = text.match(/(?:Contribuinte|NIF|NIPC)[:\s]+(PT?\d{9})/i);
  if (taxMatch) result.supplier_tax_id = taxMatch[1].toUpperCase();

  // Supplier name: heurística — procurar linhas com "Lda", "S.A.", "Produtos"
  for (const line of lines) {
    if (/Lda\.?|S\.A\.|Produtos\s+\w+/i.test(line) && line.length < 80 && line.length > 5) {
      result.supplier_name = line.replace(/,$/, "").trim();
      break;
    }
  }

  // Total amount: procurar "TOTAL" no fim do documento
  const totalMatch = text.match(/TOTAL[:\s]+([\d.,]+)\s*EUR?/i);
  if (totalMatch) {
    result.total_amount = parseFloat(totalMatch[1].replace(/\./g, "").replace(",", "."));
  }

  // Items: linhas que começam com código (sequência alfanumérica) seguido de descrição e números
  // Padrão: "12345 Descrição do Produto 12,50" ou com IVA no fim
  // Heurística: linha com pelo menos 3 números, sendo 1 o preço
  const itemPatterns = [
    // Padrão com código + descrição + qty + unit + price + IVA%
    /^([A-Z0-9]{2,8})\s+(.+?)\s+(\d+[.,]?\d*)\s+([A-Z]+)\s+(\d+[.,]\d{2})\s+(\d+)/,
    // Padrão simples: descrição + qty + preço
    /^(.{8,60}?)\s+(\d+[.,]?\d*)\s+(\d+[.,]\d{2})$/,
  ];

  for (const line of lines) {
    // Padrão 1: "CODIGO Descrição qty UN price desc% desc_total% total IVA%"
    let m = line.match(/^(\d+)\s+([A-Z0-9]+)\s+([A-Z]{2,3})\s+(.+?)\s+(\d+[.,]?\d*)\s+([A-Z]{2,4})\s+\d+[.,]?\d*\s+(\d+[.,]\d{2})\s+\d+[.,]?\d*\s+(\d+[.,]\d{2})\s+\d+[.,]?\d*\s+(\d+[.,]\d{2})\s+(\d+)/);
    if (m) {
      // [1]line_num, [2]sku, [3]origin, [4]description, [5]qty, [6]unit, [7]unit_price, [8]discount_qty, [9]liquido, [10]sdr, [11]iva
      result.lines.push({
        sku: m[2],
        raw_line: m[4].trim(),
        quantity: parseFloat(m[5].replace(",", ".")),
        unit: m[6].toLowerCase(),
        unit_price: parseFloat(m[9].replace(",", ".")) / parseFloat(m[5].replace(",", ".")),
        tax_rate: parseInt(m[11]),
      });
      continue;
    }

    // Padrão 2: simples — usado por Aviludo
    m = line.match(/^([A-Za-z][A-Za-z0-9\s\.\-\/]{5,60}?)\s+(\d+[.,]?\d*)\s+([a-z]{2,4})\s+(\d+[.,]\d{2})$/i);
    if (m) {
      result.lines.push({
        raw_line: m[1].trim(),
        quantity: parseFloat(m[2].replace(",", ".")),
        unit: m[3].toLowerCase(),
        unit_price: parseFloat(m[4].replace(",", ".")),
      });
      continue;
    }

    // Padrão 3: Aviludo "NOME QTD UN Preço" com qty+un
    m = line.match(/^(\d+)\s+(.+?)\s+(\d+)\/(\d+)\s+(\d+)\s+(\d+[.,]\d{2})$/);
    if (m) {
      result.lines.push({
        raw_line: m[2].trim(),
        quantity: parseFloat(m[5]),
        unit: "un",
        unit_price: parseFloat(m[6].replace(",", ".")),
      });
    }
  }

  return result;
}
