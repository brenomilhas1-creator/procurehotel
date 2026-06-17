// Edge Function: ai-assistant v2
// Assistente IA inteligente para Compra Facil Hoteis (procurement hoteleiro)
//
// Suporta providers: minimax (default), openai, ollama, custom BYOK
//
// Tools (16 total, cobrindo leitura + escrita + análise):
//   LEITURA:  list_suppliers, list_products, search_products, get_product_prices,
//             get_price_history, get_data_health, list_pending_imports, list_pending_orders,
//             get_spend_summary, get_invoice_summary
//   ESCRITA:  create_supplier, create_product, update_price, add_alias,
//             hide_product, hide_supplier, unhide_product, unhide_supplier,
//             process_pending_imports

// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MINIMAX_API_KEY = Deno.env.get("MINIMAX_API_KEY") || "";
const MINIMAX_GROUP_ID = Deno.env.get("MINIMAX_GROUP_ID") || "";
const MINIMAX_BASE = "https://api.minimaxi.chat/v1";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info",
  "Content-Type": "application/json",
};

// ====== TOOLS (16) ======
const TOOLS = [
  // ====== LEITURA ======
  {
    type: "function",
    function: {
      name: "list_suppliers",
      description: "Lista fornecedores do sistema. Use quando o utilizador perguntar 'quais fornecedores tenho', 'mostra os fornecedores', etc.",
      parameters: {
        type: "object",
        properties: {
          q: { type: "string", description: "Filtro de pesquisa por nome (opcional)" },
          include_hidden: { type: "boolean", description: "Incluir fornecedores ocultos? Default false" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_products",
      description: "Lista produtos do catálogo. Use para 'lista os produtos', 'que produtos tenho', etc.",
      parameters: {
        type: "object",
        properties: {
          q: { type: "string", description: "Filtro de pesquisa por nome" },
          category: { type: "string", description: "Filtrar por categoria (mercearia, congelados, bebidas, etc)" },
          limit: { type: "number", description: "Máximo de produtos (default 30, max 100)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_products",
      description: "Pesquisa fuzzy por nome OU alias (mais poderoso que list_products). Use quando o utilizador digitar parte do nome, abreviações, ou sinónimos. Exemplos: 'coca', 'leite morno', 'azeite xtra virgem'.",
      parameters: {
        type: "object",
        properties: {
          q: { type: "string", description: "Termo de pesquisa" },
          limit: { type: "number", description: "Máximo de resultados (default 8)" },
        },
        required: ["q"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_product_prices",
      description: "Mostra TODAS as opções de preço para um produto (todos os fornecedores onde está disponível). Use quando o utilizador perguntar 'quanto está o X', 'qual o melhor preço para X', 'compara preços de X'.",
      parameters: {
        type: "object",
        properties: {
          product_query: { type: "string", description: "Nome ou parte do nome do produto" },
        },
        required: ["product_query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_price_history",
      description: "Mostra histórico de preços de um produto (tendência ↑↓). Use quando o utilizador perguntar 'o preço do X subiu?', 'evolução do preço de X', 'como variou o preço de X'.",
      parameters: {
        type: "object",
        properties: {
          product_query: { type: "string", description: "Nome do produto" },
        },
        required: ["product_query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_data_health",
      description: "Retorna saúde da base de dados: nº de produtos, fornecedores, preços, invoices, e issues conhecidas. Use para perguntas sobre qualidade dos dados.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "list_pending_imports",
      description: "Lista imports ainda não processados (ficheiros Excel/CSV na fila). Use quando o utilizador perguntar 'que ficheiros tens pendentes', 'o que falta importar', etc.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "process_pending_imports",
      description: "PROCESSAR todos os ficheiros CSV/XLSX pendentes no storage. Deteta colunas, cria produtos, atualiza preços. Use quando o utilizador disser 'processa os uploads', 'importa o que está na fila', 'analisa os ficheiros'.",
      parameters: {
        type: "object",
        properties: {
          supplier_id: { type: "string", description: "Forçar ID de fornecedor (opcional, senão tenta detetar do filename)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_pending_orders",
      description: "Lista as últimas ordens de compra (pedidos). Use para 'últimos pedidos', 'que ordens tenho', etc.",
      parameters: {
        type: "object",
        properties: { limit: { type: "number", description: "Quantas listar (default 10)" } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_spend_summary",
      description: "Resumo de gasto por fornecedor num período. Use quando o utilizador perguntar 'quanto gastei com X este mês', 'top fornecedores', 'total gasto em 30 dias'.",
      parameters: {
        type: "object",
        properties: {
          days: { type: "number", description: "Período em dias (default 30)" },
          supplier_query: { type: "string", description: "Filtrar por fornecedor específico (opcional)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_invoice_summary",
      description: "Resumo de faturas (invoices). Use quando perguntarem 'que faturas tenho', 'últimas faturas', 'total faturado este mês'.",
      parameters: {
        type: "object",
        properties: {
          supplier_query: { type: "string", description: "Filtrar por fornecedor (opcional)" },
          limit: { type: "number", description: "Quantas listar (default 10)" },
        },
      },
    },
  },

  // ====== ESCRITA ======
  {
    type: "function",
    function: {
      name: "create_supplier",
      description: "Cria novo fornecedor. Use quando o utilizador pedir para criar/adicionar um fornecedor.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nome do fornecedor" },
          tax_id: { type: "string", description: "NIF português (opcional)" },
          contact_email: { type: "string", description: "Email (opcional)" },
          contact_phone: { type: "string", description: "Telefone (opcional)" },
          address: { type: "string", description: "Morada (opcional)" },
          is_preferred: { type: "boolean", description: "Marcar como fornecedor preferido? Default false" },
          notes: { type: "string", description: "Notas (opcional)" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_product",
      description: "Cria novo produto no catálogo. Use quando o utilizador pedir para adicionar um produto.",
      parameters: {
        type: "object",
        properties: {
          master_name: { type: "string", description: "Nome do produto" },
          category: { type: "string", description: "Categoria (mercearia, congelados, bebidas, higiene, etc)" },
          unit: { type: "string", description: "Unidade: un, kg, l, cx, etc. Default 'un'" },
          brand: { type: "string", description: "Marca (opcional)" },
          initial_alias: { type: "string", description: "Alias / nome alternativo para pesquisa (opcional)" },
        },
        required: ["master_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_price",
      description: "Atualiza o preço de um produto para um fornecedor específico. Use quando o utilizador disser 'muda o preço de X no fornecedor Y para Z'.",
      parameters: {
        type: "object",
        properties: {
          product_query: { type: "string", description: "Nome do produto" },
          supplier_query: { type: "string", description: "Nome do fornecedor" },
          new_price: { type: "number", description: "Novo preço unitário em EUR (sem IVA)" },
          tax_rate: { type: "number", description: "IVA em % (opcional, default 6)" },
          package_qty: { type: "number", description: "Quantidade por embalagem (default 1)" },
        },
        required: ["product_query", "supplier_query", "new_price"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_alias",
      description: "Adiciona um alias (nome alternativo) a um produto. Útil quando o utilizador diz 'produto X também é conhecido como Y'.",
      parameters: {
        type: "object",
        properties: {
          product_query: { type: "string", description: "Nome do produto" },
          alias: { type: "string", description: "O alias a adicionar" },
        },
        required: ["product_query", "alias"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "hide_product",
      description: "Esconde um produto (is_hidden=true, reversível). Use quando o utilizador disser 'esconde o produto X' ou 'não quero ver mais o X'.",
      parameters: {
        type: "object",
        properties: { product_query: { type: "string", description: "Nome do produto" } },
        required: ["product_query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "hide_supplier",
      description: "Esconde um fornecedor (reversível). Use 'esconde fornecedor X'.",
      parameters: {
        type: "object",
        properties: { supplier_query: { type: "string", description: "Nome do fornecedor" } },
        required: ["supplier_query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "unhide_product",
      description: "Reverte hide de um produto. Use quando o utilizador disser 'mostra o produto X' ou 'traz de volta o X'.",
      parameters: {
        type: "object",
        properties: { product_query: { type: "string", description: "Nome do produto" } },
        required: ["product_query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "unhide_supplier",
      description: "Reverte hide de um fornecedor. Use 'mostra o fornecedor X'.",
      parameters: {
        type: "object",
        properties: { supplier_query: { type: "string", description: "Nome do fornecedor" } },
        required: ["supplier_query"],
      },
    },
  },
];

// ====== Tool execution ======
async function executeTool(name: string, args: any, userId: string, supabase: any) {
  try {
    // ---- LISTAR ----
    if (name === "list_suppliers") {
      let q = supabase.from("suppliers")
        .select("id, name, tax_id, contact_email, contact_phone, is_preferred, is_hidden")
        .order("name");
      if (!args.include_hidden) q = q.eq("is_hidden", false);
      else q = q.or("is_hidden.is.null,is_hidden.eq.false,is_hidden.eq.true");
      if (args.q) q = q.ilike("name", `%${args.q}%`);
      const { data, error } = await q.limit(50);
      if (error) return { ok: false, error: error.message };
      return { ok: true, data, total: data?.length || 0 };
    }

    if (name === "list_products") {
      let q = supabase.from("products")
        .select("id, master_name, category, brand, unit, is_hidden")
        .eq("is_hidden", false)
        .order("master_name");
      if (args.q) q = q.ilike("master_name", `%${args.q}%`);
      if (args.category) q = q.ilike("category", `%${args.category}%`);
      const limit = Math.min(args.limit || 30, 100);
      const { data, error } = await q.limit(limit);
      if (error) return { ok: false, error: error.message };
      return { ok: true, data, total: data?.length || 0 };
    }

    if (name === "search_products") {
      // Pesquisa fuzzy em produtos + aliases
      const term = String(args.q || "").trim();
      if (!term) return { ok: true, data: [], total: 0 };
      const limit = Math.min(args.limit || 8, 20);
      const { data: products } = await supabase.from("products")
        .select("id, master_name, category, brand, unit")
        .eq("is_active", true)
        .eq("is_hidden", false)
        .or(`master_name.ilike.%${term}%,brand.ilike.%${term}%`)
        .limit(limit);
      const { data: aliases } = await supabase.from("product_aliases")
        .select("alias, product_id, products!inner(id, master_name, category, brand, unit, is_active, is_hidden)")
        .ilike("alias", `%${term}%`)
        .limit(limit);
      const seen = new Set<string>();
      const results: any[] = [];
      for (const p of products || []) {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          results.push({ ...p, matched_via: "master_name" });
        }
      }
      for (const a of aliases || []) {
        if (a.products && !seen.has(a.products.id)) {
          seen.add(a.products.id);
          results.push({ ...a.products, matched_via: `alias "${a.alias}"` });
        }
      }
      return { ok: true, data: results.slice(0, limit), total: results.length };
    }

    if (name === "get_product_prices") {
      // Encontrar produto
      const term = String(args.product_query || "").trim();
      const { data: prod } = await supabase.from("products")
        .select("id, master_name, category, brand")
        .eq("is_active", true)
        .ilike("master_name", `%${term}%`)
        .limit(1)
        .maybeSingle();
      if (!prod) {
        // Tentar via alias
        const { data: aliasHit } = await supabase.from("product_aliases")
          .select("product_id, alias, products!inner(id, master_name, category, brand)")
          .ilike("alias", `%${term}%`)
          .limit(1)
          .maybeSingle();
        if (!aliasHit) return { ok: false, error: `Produto "${term}" não encontrado` };
        const p = (aliasHit as any).products;
        return await fetchPrices(supabase, p.id, p.master_name, p.category, aliasHit.alias);
      }
      return await fetchPrices(supabase, prod.id, prod.master_name, prod.category);
    }

    if (name === "get_price_history") {
      const term = String(args.product_query || "").trim();
      const { data: prod } = await supabase.from("products")
        .select("id, master_name").ilike("master_name", `%${term}%`).limit(1).maybeSingle();
      if (!prod) return { ok: false, error: `Produto "${term}" não encontrado` };
      const { data: history } = await supabase.from("supplier_price_history")
        .select("unit_price, recorded_at, supplier_id, suppliers(name)")
        .eq("product_id", prod.id)
        .order("recorded_at", { ascending: false })
        .limit(20);
      return { ok: true, data: { product: prod.master_name, history: history || [] } };
    }

    if (name === "get_data_health") {
      const [products, suppliers, prices, pricesInvoice, pricesImport, invoices, invoiceLines, aliases, pendingQuotes] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("suppliers").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("supplier_prices").select("id", { count: "exact", head: true }).eq("is_current", true),
        supabase.from("supplier_prices").select("id", { count: "exact", head: true }).eq("source", "invoice").eq("is_current", true),
        supabase.from("supplier_prices").select("id", { count: "exact", head: true }).eq("source", "import").eq("is_current", true),
        supabase.from("invoices").select("id", { count: "exact", head: true }),
        supabase.from("invoice_lines").select("id", { count: "exact", head: true }),
        supabase.from("product_aliases").select("id", { count: "exact", head: true }),
        supabase.from("pending_quotes").select("id", { count: "exact", head: true }),
      ]);
      // Produtos sem preço
      const { data: noPrice } = await supabase.rpc("products_without_price_count").then(r => r).catch(() => ({ data: 0 }));
      return {
        ok: true,
        data: {
          active_products: products.count || 0,
          active_suppliers: suppliers.count || 0,
          current_prices: prices.count || 0,
          prices_from_invoices: pricesInvoice.count || 0,
          prices_from_imports: pricesImport.count || 0,
          total_invoices: invoices.count || 0,
          total_invoice_lines: invoiceLines.count || 0,
          total_aliases: aliases.count || 0,
          pending_quotes: pendingQuotes.count || 0,
          products_without_price: noPrice || 0,
        },
      };
    }

    if (name === "list_pending_imports") {
      const { data, error } = await supabase.from("imports")
        .select("id, original_filename, stored_path, status, created_at, supplier_id")
        .in("status", ["uploaded", "pending"])
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) return { ok: false, error: error.message };
      return { ok: true, data, total: data?.length || 0 };
    }

    if (name === "list_pending_orders") {
      const limit = args.limit || 10;
      const { data, error } = await supabase.from("purchase_orders")
        .select("id, code, status, total_amount, currency, placed_at, supplier_id, suppliers(name)")
        .order("placed_at", { ascending: false })
        .limit(limit);
      if (error) return { ok: false, error: error.message };
      return { ok: true, data, total: data?.length || 0 };
    }

    if (name === "get_spend_summary") {
      const days = args.days || 30;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      // Gasto em invoices + orders no período
      let invQ = supabase.from("invoices").select("supplier_id, total_amount, suppliers!inner(name)").gte("invoice_date", since.substring(0, 10));
      let ordQ = supabase.from("purchase_orders").select("supplier_id, total_amount, suppliers!inner(name)").gte("placed_at", since);
      const [{ data: invoices }, { data: orders }] = await Promise.all([invQ, ordQ]);

      // Agregar por fornecedor
      const agg: Record<string, { supplier: string; invoices: number; orders: number; total: number }> = {};
      for (const i of invoices || []) {
        const s = (i as any).suppliers?.name || "?";
        if (!agg[s]) agg[s] = { supplier: s, invoices: 0, orders: 0, total: 0 };
        agg[s].invoices += Number(i.total_amount) || 0;
        agg[s].total += Number(i.total_amount) || 0;
      }
      for (const o of orders || []) {
        const s = (o as any).suppliers?.name || "?";
        if (!agg[s]) agg[s] = { supplier: s, invoices: 0, orders: 0, total: 0 };
        agg[s].orders += Number(o.total_amount) || 0;
        agg[s].total += Number(o.total_amount) || 0;
      }
      // Filtrar por fornecedor se pedido
      let rows = Object.values(agg);
      if (args.supplier_query) {
        rows = rows.filter((r) => r.supplier.toLowerCase().includes(String(args.supplier_query).toLowerCase()));
      }
      rows.sort((a, b) => b.total - a.total);
      const grandTotal = rows.reduce((s, r) => s + r.total, 0);
      return { ok: true, data: { period_days: days, grand_total: grandTotal, by_supplier: rows } };
    }

    if (name === "get_invoice_summary") {
      let q = supabase.from("invoice_matching_summary")
        .select("invoice_id, invoice_number, supplier_name, total_amount, invoice_date, invoice_status, match_pct, total_lines, auto_matched")
        .order("invoice_date", { ascending: false })
        .limit(args.limit || 10);
      if (args.supplier_query) q = q.ilike("supplier_name", `%${args.supplier_query}%`);
      const { data, error } = await q;
      if (error) return { ok: false, error: error.message };
      const grand = (data || []).reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0);
      return { ok: true, data: { invoices: data || [], grand_total: grand, count: data?.length || 0 } };
    }

    // ---- ESCRITA ----
    if (name === "create_supplier") {
      const validUnits = ["un", "kg", "g", "l", "ml", "cx", "pc", "gf", "lt", "sc", "dz"];
      const name = String(args.name || "").trim();
      if (!name) return { ok: false, error: "Nome do fornecedor é obrigatório" };
      // Verificar se já existe (mesmo case-insensitive)
      const { data: existing } = await supabase.from("suppliers")
        .select("id, name").ilike("name", name).limit(1).maybeSingle();
      if (existing) return { ok: false, error: `Fornecedor "${name}" já existe (id ${existing.id})` };
      const { data, error } = await supabase.from("suppliers").insert({
        name,
        tax_id: args.tax_id || null,
        contact_email: args.contact_email || null,
        contact_phone: args.contact_phone || null,
        address: args.address || null,
        is_preferred: !!args.is_preferred,
        is_active: true,
        is_hidden: false,
        notes: args.notes || null,
      }).select("id, name").single();
      if (error) return { ok: false, error: error.message };
      return { ok: true, data: { created: data.name, id: data.id } };
    }

    if (name === "create_product") {
      const validUnits = ["un", "kg", "g", "l", "ml", "cx", "pc", "gf", "lt", "sc", "dz"];
      const master_name = String(args.master_name || "").trim();
      if (!master_name) return { ok: false, error: "Nome do produto é obrigatório" };
      const unit = (args.unit || "un").toLowerCase().slice(0, 2);
      const finalUnit = validUnits.includes(unit) ? unit : "un";
      const { data: existing } = await supabase.from("products")
        .select("id, master_name").ilike("master_name", master_name).limit(1).maybeSingle();
      if (existing) return { ok: false, error: `Produto "${master_name}" já existe (id ${existing.id})` };
      const { data, error } = await supabase.from("products").insert({
        master_name,
        category: args.category || "outros",
        unit: finalUnit,
        brand: args.brand || null,
        is_active: true,
        is_hidden: false,
      }).select("id, master_name").single();
      if (error) return { ok: false, error: error.message };
      // Adicionar alias se fornecido
      if (args.initial_alias) {
        await supabase.from("product_aliases").upsert({
          product_id: data.id,
          alias: String(args.initial_alias).toLowerCase().trim(),
          locale: "pt-PT",
          hit_count: 0,
        }, { onConflict: "product_id,alias,locale" });
      }
      return { ok: true, data: { created: data.master_name, id: data.id } };
    }

    if (name === "update_price") {
      const { product, supplier } = await findProductAndSupplier(supabase, args.product_query, args.supplier_query);
      if (!product) return { ok: false, error: `Produto "${args.product_query}" não encontrado` };
      if (!supplier) return { ok: false, error: `Fornecedor "${args.supplier_query}" não encontrado` };
      const newPrice = Number(args.new_price);
      if (!newPrice || newPrice <= 0) return { ok: false, error: "Preço inválido" };
      const { data, error } = await supabase.from("supplier_prices").upsert({
        product_id: product.id,
        supplier_id: supplier.id,
        price: newPrice,
        unit_price: newPrice,
        currency: "EUR",
        package_qty: args.package_qty || 1,
        min_order_qty: 1,
        source: "ai_update",
        is_current: true,
        notes: `Atualizado via assistente IA`,
        updated_at: new Date().toISOString(),
      }, { onConflict: "product_id,supplier_id" }).select("id").single();
      if (error) return { ok: false, error: error.message };
      return { ok: true, data: { product: product.master_name, supplier: supplier.name, new_price: newPrice } };
    }

    if (name === "add_alias") {
      const { product } = await findProductAndSupplier(supabase, args.product_query);
      if (!product) return { ok: false, error: `Produto "${args.product_query}" não encontrado` };
      const alias = String(args.alias || "").toLowerCase().trim();
      if (!alias) return { ok: false, error: "Alias vazio" };
      const { error } = await supabase.from("product_aliases").upsert({
        product_id: product.id,
        alias,
        locale: "pt-PT",
        hit_count: 0,
      }, { onConflict: "product_id,alias,locale" });
      if (error) return { ok: false, error: error.message };
      return { ok: true, data: { product: product.master_name, alias } };
    }

    if (name === "hide_product" || name === "unhide_product") {
      const { product } = await findProductAndSupplier(supabase, args.product_query);
      if (!product) return { ok: false, error: `Produto "${args.product_query}" não encontrado` };
      const newVal = name === "hide_product";
      const { error } = await supabase.from("products").update({ is_hidden: newVal }).eq("id", product.id);
      if (error) return { ok: false, error: error.message };
      return { ok: true, data: { product: product.master_name, hidden: newVal } };
    }

    if (name === "hide_supplier" || name === "unhide_supplier") {
      const { supplier } = await findProductAndSupplier(supabase, null, args.supplier_query);
      if (!supplier) return { ok: false, error: `Fornecedor "${args.supplier_query}" não encontrado` };
      const newVal = name === "hide_supplier";
      const { error } = await supabase.from("suppliers").update({ is_hidden: newVal }).eq("id", supplier.id);
      if (error) return { ok: false, error: error.message };
      return { ok: true, data: { supplier: supplier.name, hidden: newVal } };
    }

    if (name === "process_pending_imports") {
      return await processPendingImports(supabase, args.supplier_id);
    }

    return { ok: false, error: `Tool desconhecida: ${name}` };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}

// Helper: buscar produto e/ou fornecedor por query fuzzy
async function findProductAndSupplier(supabase: any, productQuery?: string, supplierQuery?: string) {
  let product: any = null;
  let supplier: any = null;
  if (productQuery) {
    const term = String(productQuery).trim();
    // Primeiro tenta match exato (case insensitive)
    const { data: exact } = await supabase.from("products")
      .select("id, master_name").eq("is_active", true).ilike("master_name", term).limit(1).maybeSingle();
    if (exact) {
      product = exact;
    } else {
      // Tenta via alias
      const { data: aliasHit } = await supabase.from("product_aliases")
        .select("alias, product_id, products!inner(id, master_name, is_active)")
        .ilike("alias", `%${term}%`).limit(1).maybeSingle();
      if (aliasHit && (aliasHit as any).products?.is_active) {
        product = (aliasHit as any).products;
      } else {
        // Tenta partial match
        const { data: partial } = await supabase.from("products")
          .select("id, master_name").eq("is_active", true).ilike("master_name", `%${term}%`).limit(1).maybeSingle();
        if (partial) product = partial;
      }
    }
  }
  if (supplierQuery) {
    const term = String(supplierQuery).trim();
    const { data: exact } = await supabase.from("suppliers")
      .select("id, name, is_preferred").ilike("name", term).limit(1).maybeSingle();
    if (exact) {
      supplier = exact;
    } else {
      const { data: partial } = await supabase.from("suppliers")
        .select("id, name, is_preferred").ilike("name", `%${term}%`).limit(1).maybeSingle();
      if (partial) supplier = partial;
    }
  }
  return { product, supplier };
}

// Helper: buscar todas as opções de preço para um produto
async function fetchPrices(supabase: any, productId: string, productName: string, category: string, alias?: string) {
  const { data: prices } = await supabase.from("supplier_prices")
    .select("id, supplier_id, price, unit_price, currency, source, source_ref, valid_from, suppliers(name, is_preferred)")
    .eq("product_id", productId)
    .eq("is_current", true)
    .order("unit_price", { ascending: true });
  if (!prices || prices.length === 0) {
    return { ok: true, data: { product: productName, category, matched_alias: alias, prices: [], best: null, message: "Sem preços registados" } };
  }
  const best = prices[0];
  return {
    ok: true,
    data: {
      product: productName,
      category,
      matched_alias: alias,
      prices: prices.map((p: any) => ({
        supplier: p.suppliers?.name,
        is_preferred: p.suppliers?.is_preferred,
        price: Number(p.unit_price),
        currency: p.currency,
        source: p.source,
        source_ref: p.source_ref,
        valid_from: p.valid_from,
      })),
      best: { supplier: (best as any).suppliers?.name, price: Number(best.unit_price) },
    },
  };
}

// Helper: processar imports pendentes
async function processPendingImports(supabase: any, supplierIdArg?: string) {
  const { data: pending, error } = await supabase.from("imports")
    .select("id, original_filename, stored_path, size_bytes, supplier_id, mime_type")
    .in("status", ["uploaded", "pending"])
    .order("created_at", { ascending: false });
  if (error) return { ok: false, error: error.message };
  if (!pending || pending.length === 0) return { ok: true, data: { processed: 0, message: "Nenhum import pendente" } };

  const structured = pending.filter((p: any) => /\.(csv|xlsx|xls)$/i.test(p.original_filename || ""));
  if (structured.length === 0) {
    return { ok: true, data: { processed: 0, message: `${pending.length} ficheiros (precisam OCR, fora do scope)` } };
  }

  const results: any[] = [];
  for (const imp of structured) {
    try {
      const { data: fileData, error: dlErr } = await supabase.storage.from("ocr-uploads").download(imp.stored_path);
      if (dlErr || !fileData) {
        results.push({ id: imp.id, filename: imp.original_filename, error: dlErr?.message || "Download falhou" });
        continue;
      }
      const buf = new Uint8Array(await fileData.arrayBuffer());
      const ext = (imp.original_filename || "").split(".").pop()?.toLowerCase();
      let rows: string[][] = [];
      if (ext === "csv") {
        rows = parseCsvText(new TextDecoder("utf-8").decode(buf));
      } else {
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

        const { data: existing } = await supabase.from("products")
          .select("id").ilike("master_name", name).limit(1).maybeSingle();
        let productId: string;
        if (existing) {
          productId = existing.id;
        } else {
          const unitNorm = unit ? unit.toLowerCase().slice(0, 2) : "un";
          const validUnits = ["un", "kg", "g", "l", "ml", "cx", "pc", "gf", "lt", "sc", "dz"];
          const finalUnit = validUnits.includes(unitNorm) ? unitNorm : "un";
          const { data: np, error: npErr } = await supabase.from("products").insert({
            master_name: name, category: "importado", unit: finalUnit, is_active: true,
          }).select("id").single();
          if (npErr || !np) continue;
          productId = np.id;
          created++;
        }
        if (code) {
          await supabase.from("product_aliases").upsert({
            product_id: productId, alias: code, locale: "pt-PT", hit_count: 0,
          }, { onConflict: "product_id,alias,locale" });
        }
        if (supplierId && price && price > 0) {
          await supabase.from("supplier_prices").upsert({
            product_id: productId, supplier_id: supplierId,
            unit_price: price, price: price, currency: "EUR",
            package_qty: 1, min_order_qty: 1, source: "import",
            is_current: true, updated_at: new Date().toISOString(),
          }, { onConflict: "product_id,supplier_id" });
          updated++;
        }
      }
      await supabase.from("imports").update({
        status: "approved",
        rows_total: rows.length - 1,
        rows_approved: created + updated,
        approved_at: new Date().toISOString(),
      }).eq("id", imp.id);
      results.push({ id: imp.id, filename: imp.original_filename, created, updated, rows: rows.length - 1 });
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

// ====== Fallback: construir resposta a partir de tool_results ======
function buildFallbackFromTools(toolResults: any[]): string | null {
  const lines: string[] = [];

  for (const tr of toolResults) {
    const name = tr.tool;
    const result = tr.result;
    if (!result || !result.ok) continue;
    const data = result.data;

    if (name === "get_product_prices" && data) {
      const prices = data.prices || [];
      if (prices.length === 0) {
        lines.push(`Não encontrei preços registados para **${data.product}**.`);
      } else {
        lines.push(`**${data.product}** (${data.category || ''})`);
        for (const p of prices) {
          const star = p.is_preferred ? " ⭐" : "";
          lines.push(`• ${p.supplier}${star}: €${p.price.toFixed(2)} (${p.source})`);
        }
        if (data.best) {
          lines.push(`\n💰 **Melhor preço**: ${data.best.supplier} a €${data.best.price.toFixed(2)}`);
        }
      }
      return lines.join("\n");
    }

    if (name === "get_price_history" && data) {
      const h = data.history || [];
      if (h.length === 0) {
        lines.push(`Sem histórico de preços para **${data.product}**.`);
      } else {
        lines.push(`**${data.product}** — ${h.length} registos`);
        const latest = h[0];
        lines.push(`Último preço: €${Number(latest.unit_price).toFixed(2)} (${new Date(latest.recorded_at).toLocaleDateString('pt-PT')})`);
        if (h.length >= 2) {
          const prev = h[h.length - 1];
          const delta = Number(latest.unit_price) - Number(prev.unit_price);
          const pct = ((delta / Number(prev.unit_price)) * 100).toFixed(1);
          if (Math.abs(Number(pct)) >= 0.5) {
            const arrow = delta > 0 ? "↗" : "↘";
            const sign = delta > 0 ? "+" : "";
            lines.push(`${arrow} ${sign}${pct}% vs há ${h.length} registos (€${Number(prev.unit_price).toFixed(2)})`);
          } else {
            lines.push(`≈ estável`);
          }
        }
      }
      return lines.join("\n");
    }

    if (name === "list_suppliers" && Array.isArray(data)) {
      if (data.length === 0) {
        lines.push("Nenhum fornecedor ativo.");
      } else {
        lines.push(`**${data.length} fornecedor(es)** ativo(s):`);
        for (const s of data.slice(0, 15)) {
          const star = s.is_preferred ? " ⭐" : "";
          const tax = s.tax_id ? ` [${s.tax_id}]` : "";
          lines.push(`• ${s.name}${star}${tax}`);
        }
        if (data.length > 15) lines.push(`... +${data.length - 15} mais`);
      }
      return lines.join("\n");
    }

    if (name === "list_products" && Array.isArray(data)) {
      if (data.length === 0) {
        lines.push("Nenhum produto encontrado.");
      } else {
        lines.push(`**${data.length} produto(s)**:`);
        for (const p of data.slice(0, 20)) {
          lines.push(`• ${p.master_name} (${p.category || '—'})`);
        }
        if (data.length > 20) lines.push(`... +${data.length - 20} mais`);
      }
      return lines.join("\n");
    }

    if (name === "search_products" && Array.isArray(data)) {
      if (data.length === 0) {
        lines.push("Nenhum produto corresponde à pesquisa.");
      } else {
        lines.push(`**${data.length} resultado(s):**`);
        for (const p of data) {
          lines.push(`• ${p.master_name} (${p.category || '—'}) ${p.matched_via ? ` via ${p.matched_via}` : ""}`);
        }
      }
      return lines.join("\n");
    }

    if (name === "get_data_health" && data) {
      lines.push(`**Saúde da base de dados:**`);
      lines.push(`• ${data.active_products} produtos ativos`);
      lines.push(`• ${data.active_suppliers} fornecedores`);
      lines.push(`• ${data.current_prices} preços vigentes (${data.prices_from_invoices} de faturas, ${data.prices_from_imports} de tabelas Excel)`);
      lines.push(`• ${data.total_invoices} faturas processadas (${data.total_invoice_lines} linhas)`);
      lines.push(`• ${data.total_aliases} aliases`);
      if (data.products_without_price > 0) {
        lines.push(`⚠️ ${data.products_without_price} produtos sem preço registado`);
      }
      return lines.join("\n");
    }

    if (name === "get_invoice_summary" && data) {
      if (!data.invoices || data.invoices.length === 0) {
        lines.push("Sem faturas registadas.");
      } else {
        lines.push(`**${data.count} fatura(s)** — Total: €${Number(data.grand_total).toFixed(2)}`);
        for (const i of data.invoices.slice(0, 10)) {
          const match = i.match_pct ? ` (${i.match_pct}% match)` : "";
          lines.push(`• ${i.invoice_number} | ${i.supplier_name} | €${Number(i.total_amount).toFixed(2)}${match}`);
        }
      }
      return lines.join("\n");
    }

    if (name === "get_spend_summary" && data) {
      if (!data.by_supplier || data.by_supplier.length === 0) {
        lines.push("Sem gastos registados neste período.");
      } else {
        lines.push(`**Gasto últimos ${data.period_days} dias: €${Number(data.grand_total).toFixed(2)}**`);
        for (const r of data.by_supplier.slice(0, 10)) {
          lines.push(`• ${r.supplier}: €${Number(r.total).toFixed(2)} (${r.invoices ? 'faturas' : ''} ${r.orders ? 'pedidos' : ''})`);
        }
      }
      return lines.join("\n");
    }

    if (name === "create_supplier" && data) {
      lines.push(`✓ Fornecedor **${data.created}** criado.`);
      return lines.join("\n");
    }
    if (name === "create_product" && data) {
      lines.push(`✓ Produto **${data.created}** criado.`);
      return lines.join("\n");
    }
    if (name === "update_price" && data) {
      lines.push(`✓ Preço de **${data.product}** (${data.supplier}) atualizado para €${Number(data.new_price).toFixed(2)}.`);
      return lines.join("\n");
    }
    if (name === "hide_product" && data) {
      lines.push(`✓ Produto **${data.product}** ${data.hidden ? 'escondido' : 'trazido de volta'}.`);
      return lines.join("\n");
    }
    if (name === "hide_supplier" && data) {
      lines.push(`✓ Fornecedor **${data.supplier}** ${data.hidden ? 'escondido' : 'trazido de volta'}.`);
      return lines.join("\n");
    }
    if (name === "add_alias" && data) {
      lines.push(`✓ Alias "${data.alias}" adicionado a **${data.product}**.`);
      return lines.join("\n");
    }
    if (name === "process_pending_imports" && data) {
      lines.push(`✓ **${data.processed} ficheiro(s) processado(s)**, ${data.failed} falhado(s).`);
      if (data.results) {
        for (const r of data.results.slice(0, 5)) {
          if (r.error) lines.push(`• ${r.filename}: ❌ ${r.error}`);
          else lines.push(`• ${r.filename}: ${r.created} criados, ${r.updated} atualizados (${r.rows} linhas)`);
        }
      }
      return lines.join("\n");
    }
  }

  return lines.length > 0 ? lines.join("\n") : null;
}

// ====== Provider adapter ======
async function callProvider(provider: string, apiKey: string, baseUrl: string, model: string, systemPrompt: string, userMessages: any[]) {
  const messages = [{ role: "system", content: systemPrompt }, ...userMessages];

  if (provider === "minimax") {
    const url = `${MINIMAX_BASE}/text/chatcompletion_v2`;
    const body = {
      model: model || "MiniMax-Text-01",
      messages,
      tools: TOOLS,
      tool_choice: "auto",
      temperature: 0.1,
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

  const url = `${baseUrl}/chat/completions`;
  const body = { model, messages, tools: TOOLS, tool_choice: "auto", temperature: 0.1 };
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const errText = await r.text();
    throw new Error(`${provider} ${r.status}: ${errText.slice(0, 200)}`);
  }
  return await r.json();
}

// ====== Main handler ======
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const auth = req.headers.get("authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: CORS });

    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user }, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !user) return new Response(JSON.stringify({ error: "Token inválido" }), { status: 401, headers: CORS });

    const body = await req.json();
    const { messages = [], provider = "minimax", apiKey = "", baseUrl = "", model = "" } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages inválido" }), { status: 400, headers: CORS });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    let resolvedKey = apiKey, resolvedBase = baseUrl, resolvedModel = model;
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
      return new Response(JSON.stringify({ error: `API key não configurada para ${provider}` }), { status: 400, headers: CORS });
    }

    // System prompt MELHORADO
    const systemPrompt = `Tu és o assistente IA do sistema "Compra Facil Hoteis" — uma plataforma de procurement para a hotelaria Four Points by Sheraton Sesimbra (cliente: Oceansesimbra, Lda, NIF PT514443880).

Estás a falar com o utilizador ${user.email}.

PERSONA: Sê conciso, prático e direto. Usa português europeu. Quando listares números, USA OS DADOS DAS TOOLS — NUNCA inventes números. Se a tool diz "452 produtos", escreve "452 produtos".

TEM 16 FERRAMENTAS DISPONÍVEIS:

📊 LEITURA:
• list_suppliers — lista fornecedores (parâmetro q para filtrar por nome)
• list_products — lista produtos do catálogo (q, category, limit)
• search_products — pesquisa fuzzy por nome OU alias (a melhor para encontrar um produto)
• get_product_prices — TODAS as opções de preço de um produto (qual é o mais barato)
• get_price_history — histórico de preços de um produto (subiu/desceu/novo)
• get_data_health — saúde da base de dados (totais, issues)
• list_pending_imports — ficheiros Excel/CSV pendentes no storage
• list_pending_orders — últimos pedidos
• get_spend_summary — gasto por fornecedor num período (parâmetro days)
• get_invoice_summary — resumo de faturas (parâmetro supplier_query para filtrar)

✏️ ESCRITA:
• create_supplier — criar fornecedor (nome, NIF, email, telefone, etc)
• create_product — criar produto (com alias opcional)
• update_price — atualizar preço de produto para fornecedor
• add_alias — adicionar alias (nome alternativo) a um produto
• hide_product / unhide_product — esconder/mostrar produtos (reversível)
• hide_supplier / unhide_supplier — esconder/mostrar fornecedores (reversível)
• process_pending_imports — processar ficheiros CSV/XLSX na fila

REGRAS FUNDAMENTAIS:

1. TOOL CALLS MÚLTIPLOS: Quando o utilizador listar MÚLTIPLOS nomes (ex: "cria Alpha, Gergran e Makro"), faz UMA tool call por NOME em voltas separadas. O sistema continua o loop até executar todas. EXEMPLO: "cria 3 fornecedores: A, B, C" → 3 calls a create_supplier.

2. OCULTAR ≠ APAGAR: Quando o utilizador disser "esconde", "não quero ver", "remove", usa hide_*. Apagar é destrutivo; ocultar é reversível.

3. PREÇOS REAIS: Os preços são REAIS (de faturas ou catálogos Excel). Quando o utilizador perguntar valores, mostra o que a tool retornou. NUNCA inventes números.

4. PESQUISA INTELIGENTE: Se o utilizador disser "manteiga" e houver 20 manteigas, usa search_products para encontrar a melhor correspondência. Apresenta no máximo 5 opções relevantes.

5. COMPARAÇÃO: Quando pedirem "qual o melhor preço para X", usa get_product_prices e mostra a tabela ordenada (mais barato primeiro, marca com ⭐ os preferidos).

6. CONFIRMAÇÃO PARA ESCRITA: Para ferramentas destrutivas (criar/apagar/ocultar), mostra primeiro o que vais fazer e pede confirmação. Mas se o utilizador disser claramente "cria", "atualiza", "esconde" → executa.

7. RESPOSTAS CURTAS: 2-4 frases por resposta. Usa listas/tabelas só quando houver muitos items. NUNCA respostas vagas tipo "não tenho essa capacidade" — verifica sempre se alguma tool pode ajudar.

8. IDIOMA: Português preferencial, mas responde no idioma que o utilizador usar.

9. RESPOSTAS BASEADAS EM DADOS: Quando uma tool retornar dados, MOSTRA-OS ao utilizador. NUNCA digas "Se precisar de mais informações" sem mostrar primeiro os dados que recebeste. Exemplos:
   • get_product_prices retornou {prices: [...], best: {...}}: mostra uma mini-tabela com fornecedor | preço, marca ⭐ nos preferidos e indica o best.
   • list_suppliers retornou 5 nomes: lista-os com NIF/telefone se relevante.
   • get_data_health retornou {active_products: 452}: "Tens 452 produtos ativos".
   NUNCA devolvas resposta vazia depois de uma tool call bem sucedida. Se os dados vieram, usa-os.

EXEMPLOS DE PERGUNTAS BOAS:
• "Quanto está o leite meio gordo na Avoneto?"
• "Mostra os 5 fornecedores que mais vendi este mês"
• "Cria o fornecedor Padaria São João com NIF 123456789"
• "Esconde o produto Açúcar Mascavado"
• "Atualiza o preço da Manteiga no Makro para 8,20€"
• "Processa os uploads pendentes"

Se o utilizador perguntar algo fora do teu alcance (ex: enviar email, gerar PDF), diz educadamente qual a limitação.`;

    // Loop com NO máximo 5 iterações
    let allMessages = [...messages];
    const toolResults: any[] = [];
    let lastAssistant: any = null;
    let emptyToolStreak = 0;
    const MAX_ITER = 6;

    for (let i = 0; i < MAX_ITER; i++) {
      const resp = await callProvider(provider, resolvedKey, resolvedBase, resolvedModel, systemPrompt, allMessages);

      let choice: any;
      if (provider === "minimax") {
        choice = resp.choices?.[0] || resp;
      } else {
        choice = resp.choices?.[0];
      }
      if (!choice) {
        return new Response(JSON.stringify({ error: "Sem resposta do provider", raw: resp }), { status: 502, headers: CORS });
      }

      const msg = choice.message || choice;
      lastAssistant = msg;
      allMessages.push(msg);

      // Tool calls nativos
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        emptyToolStreak = 0;
        for (const tc of msg.tool_calls) {
          const fnName = tc.function?.name || tc.name;
          const fnArgsRaw = tc.function?.arguments || tc.arguments || "{}";
          let fnArgs: any = {};
          try { fnArgs = typeof fnArgsRaw === "string" ? JSON.parse(fnArgsRaw) : fnArgsRaw; } catch { fnArgs = {}; }
          const result = await executeTool(fnName, fnArgs, user.id, supabaseAdmin);
          toolResults.push({ tool: fnName, args: fnArgs, result });
          allMessages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result) });
        }
        continue;
      }

      // Pseudo tool-calls (regex fallback)
      const text = String(msg.content || msg.text || "");
      const pseudoCalls: { name: string; args: any }[] = [];
      const fnRegex = /functions\.(\w+)\((\{[^{}]*\})\)/g;
      let m: RegExpExecArray | null;
      while ((m = fnRegex.exec(text))) {
        try { pseudoCalls.push({ name: m[1], args: JSON.parse(m[2]) }); } catch { /* */ }
      }
      const tagRegex = /<fct_(\w+)\s+([^>]+)\/?>/g;
      while ((m = tagRegex.exec(text))) {
        const attrs: any = {};
        for (const am of m[2].matchAll(/(\w+)="([^"]+)"/g)) attrs[am[1]] = am[2];
        pseudoCalls.push({ name: m[1], args: attrs });
      }

      if (pseudoCalls.length > 0) {
        emptyToolStreak = 0;
        for (const pc of pseudoCalls) {
          const result = await executeTool(pc.name, pc.args, user.id, supabaseAdmin);
          toolResults.push({ tool: pc.name, args: pc.args, result });
        }
        allMessages.push({
          role: "tool",
          tool_call_id: `pseudo_${i}`,
          content: JSON.stringify(pseudoCalls.map((pc) => ({ tool: pc.name, result: { ok: true } }))),
        });
        continue;
      }

      emptyToolStreak++;
      // Dar 2 chances ao modelo para responder (em caso de tool call parcial)
      if (emptyToolStreak >= 2) break;
    }

    const reply = lastAssistant?.content || lastAssistant?.text || lastAssistant?.message || "(sem resposta)";

    // FALLBACK INTELIGENTE: se a resposta for vazia/genérica e temos tool_results com dados,
    // construímos uma resposta útil a partir dos dados.
    const isGeneric = !reply || reply === "(sem resposta)" || /^(se precisar|estou à disposi[çc][ãa]o|posso ajudar|diga|claro)/i.test(reply.trim());
    if (isGeneric && toolResults.length > 0) {
      const fallback = buildFallbackFromTools(toolResults);
      if (fallback) {
        return new Response(JSON.stringify({ reply: fallback, messages: allMessages, tool_results: toolResults, fallback: true }), {
          status: 200, headers: CORS,
        });
      }
    }

    return new Response(JSON.stringify({ reply, messages: allMessages, tool_results: toolResults }), {
      status: 200,
      headers: CORS,
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500,
      headers: CORS,
    });
  }
});
