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
    return { ok: false, error: `Tool desconhecida: ${name}` };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
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

Quando o utilizador pedir para criar algo, confirma o nome e usa a tool. Não precisas de pedir campos opcionais.

Regras:
- Se o utilizador pedir para criar fornecedor, usa create_supplier IMEDIATAMENTE com o nome dado.
- Se o utilizador perguntar o que podes fazer, explica as 4 tools.
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
