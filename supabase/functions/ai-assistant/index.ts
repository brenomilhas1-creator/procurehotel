// Edge Function: ai-assistant
// Proxy para APIs compatíveis com OpenAI com function calling.
//
// Suporta providers:
//   - minimax  (default, usa MINIMAX_API_KEY env var)
//   - openai   (BYOK)
//   - ollama   (local)
//
// Tools: create_supplier, list_suppliers, list_products, get_data_health

// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MINIMAX_API_KEY = Deno.env.get("MINIMAX_API_KEY") || "";
const MINIMAX_GROUP_ID = Deno.env.get("MINIMAX_GROUP_ID") || "";
const MINIMAX_BASE = "https://api.minimaxi.chat/v1";

// ===== Tools (function calling) =====
const TOOLS = [
  {
    type: "function",
    function: {
      name: "create_supplier",
      description: "Cria um novo fornecedor. Use quando o utilizador pedir para adicionar/criar um fornecedor.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nome do fornecedor" },
          tax_id: { type: "string", description: "NIF (opcional)" },
          contact_email: { type: "string", description: "Email de contacto (opcional)" },
          contact_phone: { type: "string", description: "Telefone (opcional)" },
          notes: { type: "string", description: "Notas adicionais (opcional)" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_suppliers",
      description: "Lista os fornecedores existentes. Use quando o utilizador perguntar quais fornecedores existem.",
      parameters: { type: "object", properties: { q: { type: "string", description: "Filtro de pesquisa" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "list_products",
      description: "Lista os produtos do catálogo. Use quando o utilizador perguntar sobre produtos.",
      parameters: {
        type: "object",
        properties: { q: { type: "string", description: "Filtro de pesquisa" }, limit: { type: "number" } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_data_health",
      description: "Retorna a saúde da base de dados (score, issues). Use para perguntas sobre qualidade dos dados.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "list_pending_imports",
      description: "Lista imports ainda não processados (status='uploaded'). Use quando o utilizador perguntar sobre uploads pendentes ou quiser processar uploads.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "process_pending_imports",
      description: "Processa TODOS os imports pendentes (status='uploaded') que tenham ficheiro Excel/CSV no storage. Para cada um, extrai produtos e preços e cria/atualiza no catálogo. Use quando o utilizador disser 'processa os uploads', 'analisa os ficheiros', 'importa o que está na fila', etc.",
      parameters: {
        type: "object",
        properties: {
          supplier_id: { type: "string", description: "ID do fornecedor a usar (opcional, se null tenta detectar pelo filename)" },
        },
      },
    },
  },
];

// ===== Tool execution =====
async function executeTool(
  name: string,
  args: any,
  userId: string,
  supabase: any
): Promise<{ ok: boolean; data?: any; error?: string }> {
  try {
    if (name === "create_supplier") {
      const { data, error } = await supabase
        .from("suppliers")
        .insert({
          name: args.name,
          tax_id: args.tax_id || null,
          contact_email: args.contact_email || null,
          contact_phone: args.contact_phone || null,
          notes: args.notes || null,
          is_active: true,
        })
        .select()
        .single();
      if (error) return { ok: false, error: error.message };
      return { ok: true, data: { id: data.id, name: data.name } };
    }
    if (name === "list_suppliers") {
      let q = supabase.from("suppliers").select("id, name, tax_id, is_active").eq("is_active", true).order("name");
      if (args.q) q = q.ilike("name", `%${args.q}%`);
      const { data, error } = await q.limit(20);
      if (error) return { ok: false, error: error.message };
      return { ok: true, data };
    }
    if (name === "list_products") {
      let q = supabase.from("products").select("id, master_name, category, unit").eq("is_active", true).order("master_name");
      if (args.q) q = q.ilike("master_name", `%${args.q}%`);
      const { data, error } = await q.limit(args.limit || 20);
      if (error) return { ok: false, error: error.message };
      return { ok: true, data };
    }
    if (name === "get_data_health") {
      const { data: products } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true);
      const { data: suppliers } = await supabase.from("suppliers").select("id", { count: "exact", head: true }).eq("is_active", true);
      return {
        ok: true,
        data: {
          active_products: products?.length || 0,
          active_suppliers: suppliers?.length || 0,
        },
      };
    }
    if (name === "list_pending_imports") {
      const { data, error } = await supabase
        .from("imports")
        .select("id, original_filename, stored_path, size_bytes, status, created_at, supplier_id")
        .eq("status", "uploaded")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) return { ok: false, error: error.message };
      return { ok: true, data };
    }
    if (name === "process_pending_imports") {
      return await processPendingImports(supabase, args.supplier_id);
    }
    return { ok: false, error: `Tool desconhecida: ${name}` };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}

// ===== Process pending imports (download file from storage + parse client-side equivalent) =====
async function processPendingImports(supabase: any, supplierIdArg?: string) {
  const { data: pending, error } = await supabase
    .from("imports")
    .select("id, original_filename, stored_path, size_bytes, supplier_id, mime_type")
    .eq("status", "uploaded")
    .order("created_at", { ascending: false });
  if (error) return { ok: false, error: error.message };
  if (!pending || pending.length === 0) {
    return { ok: true, data: { processed: 0, message: "Nenhum import pendente" } };
  }

  // Filtrar apenas CSV/XLSX (os outros precisam OCR — fora do scope)
  const structured = pending.filter((p: any) => /\.(csv|xlsx|xls)$/i.test(p.original_filename || ""));
  if (structured.length === 0) {
    return {
      ok: true,
      data: { processed: 0, message: `Nenhum import CSV/XLSX pendente (${pending.length} outros tipos, precisam OCR)` },
    };
  }

  const results: any[] = [];
  for (const imp of structured) {
    try {
      // Download do Storage
      const { data: fileData, error: dlErr } = await supabase.storage
        .from("ocr-uploads")
        .download(imp.stored_path);
      if (dlErr || !fileData) {
        results.push({ id: imp.id, filename: imp.original_filename, error: dlErr?.message || "Download falhou" });
        continue;
      }

      const buf = new Uint8Array(await fileData.arrayBuffer());
      const ext = (imp.original_filename || "").split(".").pop()?.toLowerCase();
      let rows: string[][] = [];
      if (ext === "csv") {
        const text = new TextDecoder("utf-8").decode(buf);
        rows = parseCsvText(text);
      } else {
        // xlsx — usar SheetJS
        const { read, utils } = await import("https://esm.sh/xlsx@0.18.5");
        const wb = read(buf, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        rows = utils.sheet_to_json(ws, { header: 1, defval: "" }) as string[][];
      }

      if (rows.length === 0) {
        results.push({ id: imp.id, filename: imp.original_filename, error: "Ficheiro vazio" });
        continue;
      }

      const mapping = detectColumns(rows[0]);
      if (mapping.name < 0) {
        results.push({ id: imp.id, filename: imp.original_filename, error: "Sem coluna de nome/produto" });
        continue;
      }

      const supplierId = supplierIdArg || imp.supplier_id;
      let created = 0;
      let updated = 0;

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const name = String(row[mapping.name] || "").trim();
        if (!name || name.length < 2) continue;
        const price = mapping.price >= 0 ? parseNumVal(row[mapping.price]) : null;
        const unit = mapping.unit >= 0 ? String(row[mapping.unit] || "").trim() : null;
        const code = mapping.code >= 0 ? String(row[mapping.code] || "").trim() : null;

        // Upsert product
        const { data: existing } = await supabase
          .from("products")
          .select("id")
          .ilike("master_name", name)
          .limit(1)
          .maybeSingle();

        let productId: string;
        if (existing) {
          productId = existing.id;
        } else {
          const unitNorm = unit ? (unit.toLowerCase().slice(0, 2)) : "un";
          const validUnits = ["un", "kg", "g", "l", "ml", "cx", "pc", "gf", "lt", "sc", "dz"];
          const finalUnit = validUnits.includes(unitNorm) ? unitNorm : "un";
          const { data: np, error: npErr } = await supabase.from("products").insert({
            master_name: name,
            category: "importado",
            unit: finalUnit,
            is_active: true,
          }).select("id").single();
          if (npErr || !np) continue;
          productId = np.id;
          created++;
        }

        if (code) {
          await supabase.from("product_aliases").upsert({
            product_id: productId,
            alias: code,
            locale: "pt-PT",
            hit_count: 0,
          }, { onConflict: "product_id,alias,locale" });
        }

        if (supplierId && price && price > 0) {
          await supabase.from("supplier_prices").upsert({
            product_id: productId,
            supplier_id: supplierId,
            unit_price: price,
            price: price,
            currency: "EUR",
            package_qty: 1,
            min_order_qty: 1,
            source: "import",
            is_current: true,
            updated_at: new Date().toISOString(),
          }, { onConflict: "product_id,supplier_id" });
          updated++;
        }
      }

      // Marcar como processado
      await supabase.from("imports").update({
        status: "approved",
        rows_total: rows.length - 1,
        rows_approved: created + updated,
        approved_at: new Date().toISOString(),
      }).eq("id", imp.id);

      results.push({
        id: imp.id,
        filename: imp.original_filename,
        created,
        updated,
        rows: rows.length - 1,
      });
    } catch (e: any) {
      results.push({ id: imp.id, filename: imp.original_filename, error: e?.message || String(e) });
    }
  }

  return {
    ok: true,
    data: {
      processed: results.filter((r) => !r.error).length,
      failed: results.filter((r) => r.error).length,
      results,
    },
  };
}

function parseCsvText(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  return lines.map((line) => {
    const cells: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"' && !inQ) { inQ = true; continue; }
      if (c === '"' && inQ) {
        if (line[i + 1] === '"') { cur += '"'; i++; continue; }
        inQ = false; continue;
      }
      if (c === "," && !inQ) { cells.push(cur); cur = ""; continue; }
      cur += c;
    }
    cells.push(cur);
    return cells;
  });
}

function detectColumns(header: string[]): { name: number; price: number; unit: number; code: number } {
  const m = { name: -1, price: -1, unit: -1, code: -1 };
  const lower = header.map((h) => String(h || "").toLowerCase().trim());
  for (let i = 0; i < lower.length; i++) {
    const c = lower[i];
    if (m.name < 0 && /^(nome|produto|descri[çc][ãa]o|artigo|item|description|product|name)/i.test(c)) m.name = i;
    else if (m.price < 0 && /(pre[çc]o|price|valor|custo|pvp|€|eur)/i.test(c) && !/custo[ea]/i.test(c)) m.price = i;
    else if (m.unit < 0 && /(unidade|unit|un\.|embalagem|pack)/i.test(c)) m.unit = i;
    else if (m.code < 0 && /(c[óo]digo|code|ref|sku|ean|refer[êe]ncia)/i.test(c)) m.code = i;
  }
  if (m.name < 0 && header.length > 0) m.name = 0;
  return m;
}

function parseNumVal(v: any): number | null {
  if (typeof v === "number") return v;
  if (!v) return null;
  const s = String(v).replace(/[^\d,.-]/g, "").replace(",", ".");
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

// ===== Provider adapters =====
async function callProvider(
  provider: string,
  apiKey: string,
  baseUrl: string,
  model: string,
  systemPrompt: string,
  userMessages: any[]
): Promise<any> {
  const messages = [
    { role: "system", content: systemPrompt },
    ...userMessages,
  ];

  if (provider === "minimax") {
    // MiniMax usa formato próprio, mas expõe /v1/text/chatcompletion_v2
    // O parâmetro tools é igual ao OpenAI
    const url = `${MINIMAX_BASE}/text/chatcompletion_v2`;
    const body = {
      model: model || "MiniMax-Text-01",
      messages,
      tools: TOOLS,
      tool_choice: "auto",
    };
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        ...(MINIMAX_GROUP_ID ? { "X-Group-Id": MINIMAX_GROUP_ID } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const errText = await r.text();
      throw new Error(`MiniMax ${r.status}: ${errText.slice(0, 200)}`);
    }
    return await r.json();
  }

  // OpenAI-compatible (OpenAI, Ollama, Groq, etc)
  const url = `${baseUrl}/chat/completions`;
  const body = {
    model,
    messages,
    tools: TOOLS,
    tool_choice: "auto",
  };
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const errText = await r.text();
    throw new Error(`${provider} ${r.status}: ${errText.slice(0, 200)}`);
  }
  return await r.json();
}

// ===== Main handler =====
Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type, x-client-info",
      },
    });
  }

  try {
    // Auth
    const auth = req.headers.get("authorization");
    if (!auth) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user }, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Body
    const body = await req.json();
    const { messages = [], provider = "minimax", apiKey = "", baseUrl = "", model = "" } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages inválido" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validar role (apenas admin ou user podem usar)
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Resolver key
    let resolvedKey = apiKey;
    let resolvedBase = baseUrl;
    let resolvedModel = model;
    if (provider === "minimax") {
      resolvedKey = MINIMAX_API_KEY;
      resolvedBase = MINIMAX_BASE;
      resolvedModel = model || "MiniMax-Text-01";
    } else if (provider === "ollama") {
      resolvedKey = "ollama";
      resolvedBase = baseUrl || "http://localhost:11434/v1";
      resolvedModel = model || "llama3.2";
    } else if (provider === "openai") {
      resolvedBase = baseUrl || "https://api.openai.com/v1";
      resolvedModel = model || "gpt-4o-mini";
    }

    if (!resolvedKey) {
      return new Response(JSON.stringify({ error: `API key não configurada para ${provider}` }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // System prompt
    const systemPrompt = `Tu és o assistente IA do sistema "Compra Facil Hoteis" (gestão de compras para hotelaria).
Estás a falar com ${user.email}.
Podes falar em português ou inglês. Sê conciso e prático.

Tens acesso a ferramentas (tools) que te permitem:
- create_supplier: criar fornecedor
- list_suppliers: listar fornecedores
- list_products: listar produtos
- get_data_health: ver estado da base de dados
- list_pending_imports: listar uploads pendentes
- process_pending_imports: PROCESSAR todos os uploads CSV/XLSX pendentes — extrai produtos/preços e cria no catálogo. Use quando o utilizador disser "processa os uploads", "analisa os ficheiros", "importa o que está na fila", "tens X uploads pendentes, processa-os", etc.

Quando o utilizador pedir para criar algo, confirma o nome e usa a tool. Não precisas de pedir campos opcionais.

Regras:
- Se o utilizador pedir para criar fornecedor, usa create_supplier IMEDIATAMENTE com o nome dado.
- Se o utilizador disser para processar uploads, usa process_pending_imports e depois resume os resultados.
- Se o utilizador perguntar o que podes fazer, explica as 6 tools.
- Se não souberes, diz que não tens essa capacidade.
- Respostas curtas e diretas.`;

    // Loop: function calling pode ter múltiplas voltas
    let allMessages = [...messages];
    const toolResults: any[] = [];
    let lastAssistant: any = null;

    for (let i = 0; i < 5; i++) {
      const resp = await callProvider(
        provider,
        resolvedKey,
        resolvedBase,
        resolvedModel,
        systemPrompt,
        allMessages
      );

      // Extrair resposta (varia por provider)
      let choice: any;
      if (provider === "minimax") {
        // MiniMax pode devolver choices[] OU base_resp
        choice = resp.choices?.[0] || resp;
      } else {
        choice = resp.choices?.[0];
      }
      if (!choice) {
        return new Response(JSON.stringify({ error: "Sem resposta do provider", raw: resp }), {
          status: 502,
          headers: { "Content-Type": "application/json" },
        });
      }

      const msg = choice.message || choice;
      lastAssistant = msg;

      // Append assistant message
      allMessages.push(msg);

      // Se tem tool_calls, executar
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        for (const tc of msg.tool_calls) {
          const fnName = tc.function?.name || tc.name;
          const fnArgsRaw = tc.function?.arguments || tc.arguments || "{}";
          let fnArgs: any = {};
          try {
            fnArgs = typeof fnArgsRaw === "string" ? JSON.parse(fnArgsRaw) : fnArgsRaw;
          } catch {
            fnArgs = {};
          }

          const result = await executeTool(fnName, fnArgs, user.id, supabaseAdmin);
          toolResults.push({ tool: fnName, args: fnArgs, result });

          // Append tool result
          allMessages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify(result),
          });
        }
        // Continuar loop
        continue;
      }

      // Sem tool_calls → resposta final
      break;
    }

    const reply = lastAssistant?.content || lastAssistant?.text || lastAssistant?.message || "(sem resposta)";

    return new Response(
      JSON.stringify({
        reply,
        messages: allMessages,
        tool_results: toolResults,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
