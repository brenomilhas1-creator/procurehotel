/**
 * Data layer — Supabase direto (sem backend FastAPI).
 * Tudo client-side. RLS protege acessos.
 */

import { getSupabase } from './supabase';

export interface Product {
  id: string;
  master_name: string;
  brand: string | null;
  category: string | null;
  unit: string;
  status: string;
  aliases: { alias: string; locale: string }[];
}

export interface Supplier {
  id: string;
  name: string;
  tax_id: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  delivery_lead_time_hours: number | null;
  is_preferred: boolean;
  is_active: boolean;
}

export interface SupplierPrice {
  id: string;
  supplier_id: string;
  product_id: string;
  price: number;
  unit_price: number;
  package_qty: number;
  min_order_qty: number;
  currency: string;
  is_current: boolean;
  source: string;
  valid_from: string;
}

export interface PurchaseOrder {
  id: string;
  code: string;
  status: string;
  user_id: string;
  supplier_id: string;
  total_amount: number;
  currency: string;
  notes: string | null;
  placed_at: string | null;
  expected_delivery: string | null;
  created_at: string;
  supplier?: Supplier;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  is_substitution: boolean;
  raw_line: string | null;
  product?: Product;
}

export interface ImportRow {
  id: string;
  supplier_id: string | null;
  user_id: string;
  import_type: string;
  original_filename: string;
  status: string;
  error_message: string | null;
  rows_total: number;
  rows_approved: number;
  rows_rejected: number;
  created_at: string;
  supplier?: Supplier;
}

export interface FreeTextItem {
  raw_line: string;
  product_id: string | null;
  product_name?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  needs_review: boolean;
  matched_alias?: string;
}

export interface Page<T> { items: T[]; total: number; page: number; size: number; }

function sb() { return getSupabase(); }

// ============= PRODUCTS =============

export async function listProducts(opts: { q?: string; limit?: number } = {}): Promise<Page<Product>> {
  const { q = '', limit = 100 } = opts;
  const c = sb();
  if (!c) return { items: [], total: 0, page: 1, size: limit };

  let qb = c.from('products')
    .select('id, master_name, brand, category, unit, status, product_aliases(alias, locale)', { count: 'exact' })
    .eq('is_active', true)
    .order('master_name', { ascending: true })
    .limit(limit);

  if (q) qb = qb.ilike('master_name', `%${q}%`);

  const { data, count, error } = await qb;
  if (error) throw new Error(error.message);

  return {
    items: (data || []).map((p: any) => ({
      ...p,
      aliases: (p.product_aliases || []).map((a: any) => ({ alias: a.alias, locale: a.locale })),
    })),
    total: count || 0,
    page: 1,
    size: limit,
  };
}

export async function getProductById(id: string): Promise<Product | null> {
  const c = sb();
  if (!c) return null;
  const { data, error } = await c.from('products')
    .select('id, master_name, brand, category, unit, status, product_aliases(alias, locale)')
    .eq('id', id)
    .single();
  if (error) return null;
  return {
    ...(data as any),
    aliases: ((data as any).product_aliases || []).map((a: any) => ({ alias: a.alias, locale: a.locale })),
  };
}

// ============= SUPPLIERS =============

export async function listSuppliers(opts: { q?: string; limit?: number } = {}): Promise<Page<Supplier>> {
  const { q = '', limit = 100 } = opts;
  const c = sb();
  if (!c) return { items: [], total: 0, page: 1, size: limit };

  let qb = c.from('suppliers')
    .select('id, name, tax_id, contact_email, contact_phone, delivery_lead_time_hours, is_preferred, is_active', { count: 'exact' })
    .eq('is_active', true)
    .order('name', { ascending: true })
    .limit(limit);

  if (q) qb = qb.ilike('name', `%${q}%`);

  const { data, count, error } = await qb;
  if (error) throw new Error(error.message);
  return { items: data || [], total: count || 0, page: 1, size: limit };
}

// ============= PRICES =============

export async function listSupplierPricesForProducts(productIds: string[]): Promise<SupplierPrice[]> {
  const c = sb();
  if (!c || productIds.length === 0) return [];
  const { data, error } = await c.from('supplier_prices')
    .select('id, supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, is_current, source, valid_from')
    .in('product_id', productIds)
    .eq('is_current', true);
  if (error) return [];
  return data || [];
}

export async function getPriceHistory(productId: string, days = 90): Promise<SupplierPrice[]> {
  const c = sb();
  if (!c) return [];
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await c.from('supplier_prices')
    .select('id, supplier_id, product_id, price, unit_price, package_qty, min_order_qty, currency, is_current, source, valid_from')
    .eq('product_id', productId)
    .gte('created_at', since)
    .order('created_at', { ascending: true });
  return data || [];
}

// ============= ORDERS =============

export async function listOrders(limit = 50): Promise<Page<PurchaseOrder>> {
  const c = sb();
  if (!c) return { items: [], total: 0, page: 1, size: limit };
  const { data, count, error } = await c.from('purchase_orders')
    .select('id, code, status, user_id, supplier_id, total_amount, currency, notes, placed_at, expected_delivery, created_at, suppliers!purchase_orders_supplier_id_fkey(name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return {
    items: (data || []).map((o: any) => ({ ...o, supplier: o.suppliers })),
    total: count || 0,
    page: 1,
    size: limit,
  };
}

export async function getOrder(id: string): Promise<PurchaseOrder | null> {
  const c = sb();
  if (!c) return null;
  const { data, error } = await c.from('purchase_orders')
    .select('*, suppliers!purchase_orders_supplier_id_fkey(name), purchase_order_items(*, products(master_name, brand))')
    .eq('id', id)
    .single();
  if (error) return null;
  return data as any;
}

export async function createOrder(payload: {
  supplier_id: string;
  raw_input: string;
  items: { product_id: string; quantity: number; unit_price: number; raw_line?: string; is_substitution?: boolean; substitution_reason?: string }[];
  notes?: string;
  currency?: string;
}): Promise<PurchaseOrder> {
  const c = sb();
  if (!c) throw new Error('Supabase não disponível');

  // Get current user
  const { data: { user } } = await c.auth.getUser();
  if (!user) throw new Error('Não autenticado');

  const code = `PO-${Date.now().toString(36).toUpperCase()}`;
  const total = payload.items.reduce((s, i) => s + i.quantity * i.unit_price, 0);

  const { data: order, error: oerr } = await c.from('purchase_orders').insert({
    code,
    status: 'placed',
    user_id: user.id,
    supplier_id: payload.supplier_id,
    total_amount: total,
    currency: payload.currency || 'EUR',
    raw_input: payload.raw_input,
    notes: payload.notes || null,
    placed_at: new Date().toISOString(),
  }).select('id, code').single();
  if (oerr) throw new Error(oerr.message);

  if (payload.items.length > 0) {
    const items = payload.items.map((i) => ({
      order_id: order.id,
      product_id: i.product_id,
      quantity: i.quantity,
      unit_price: i.unit_price,
      line_total: i.quantity * i.unit_price,
      is_substitution: i.is_substitution || false,
      substitution_reason: i.substitution_reason || null,
      raw_line: i.raw_line || null,
    }));
    const { error: ierr } = await c.from('purchase_order_items').insert(items);
    if (ierr) throw new Error(ierr.message);
  }

  return { ...order, total_amount: total, currency: payload.currency || 'EUR', user_id: user.id, status: 'placed' } as PurchaseOrder;
}

// ============= PARSE / OPTIMIZE (client-side) =============

/**
 * Parse de texto livre para itens estruturados.
 * Sem LLM: usa heurística + alias match.
 */
export async function parseOrderText(text: string): Promise<{ items: FreeTextItem[] }> {
  const c = sb();
  if (!c) return { items: [] };

  // Get all aliases + products
  const { data: aliases } = await c
    .from('product_aliases')
    .select('alias, product_id, products!inner(master_name, unit)');
  const { data: products } = await c
    .from('products')
    .select('id, master_name, unit')
    .eq('is_active', true);

  const aliasMap = new Map<string, { product_id: string; product_name: string; unit: string }>();
  for (const a of (aliases || []) as any[]) {
    aliasMap.set(a.alias.toLowerCase(), {
      product_id: a.product_id,
      product_name: a.products?.master_name,
      unit: a.products?.unit,
    });
  }
  for (const p of (products || []) as any[]) {
    aliasMap.set(p.master_name.toLowerCase(), { product_id: p.id, product_name: p.master_name, unit: p.unit });
  }

  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const items: FreeTextItem[] = [];

  for (const line of lines) {
    // Match "5x coca" / "5 coca" / "coca x 5" / "5 unidades coca"
    const re = /^([0-9]+(?:[.,][0-9]+)?)\s*(?:x|un|kg|l|cl|ml)?\s*\.?\s*(.+)$/i;
    const m = line.match(re) || line.match(/^(.+?)\s*[-–x]\s*([0-9]+(?:[.,][0-9]+)?)\s*(.*)$/i);
    let qty = 1;
    let rawProduct = line;
    if (m) {
      // Decide which side is number
      if (/^\d/.test(m[1])) { qty = parseFloat(m[1].replace(',', '.')); rawProduct = m[2]; }
      else { qty = parseFloat(m[2].replace(',', '.')); rawProduct = m[1]; }
    }

    // Find best match in aliases
    const norm = rawProduct.toLowerCase().trim();
    let match: { product_id: string; product_name: string; unit: string } | null = null;
    let matchedAlias = '';
    for (const [alias, info] of aliasMap.entries()) {
      if (norm.includes(alias) || alias.includes(norm)) {
        match = info; matchedAlias = alias; break;
      }
    }

    items.push({
      raw_line: line,
      product_id: match?.product_id || null,
      product_name: match?.product_name,
      quantity: qty,
      unit_price: 0,
      line_total: 0,
      needs_review: !match,
      matched_alias: matchedAlias,
    });
  }

  return { items };
}

/**
 * Optimize: escolhe os melhores preços.
 * Recebe items parsed, devolve items com supplier e price escolhidos.
 */
export async function optimizeOrder(items: FreeTextItem[]): Promise<{
  items: FreeTextItem[];
  bySupplier: Record<string, { items: FreeTextItem[]; total: number }>;
}> {
  const c = sb();
  if (!c) return { items: [], bySupplier: {} };

  const productIds = items.filter((i) => i.product_id).map((i) => i.product_id!);
  if (productIds.length === 0) return { items, bySupplier: {} };

  const prices = await listSupplierPricesForProducts(productIds);
  if (prices.length === 0) return { items, bySupplier: {} };

  // Para cada item, escolher o menor unit_price
  const byProduct = new Map<string, SupplierPrice[]>();
  for (const p of prices) {
    if (!byProduct.has(p.product_id)) byProduct.set(p.product_id, []);
    byProduct.get(p.product_id)!.push(p);
  }

  const updated: FreeTextItem[] = items.map((i) => {
    if (!i.product_id) return i;
    const opts = byProduct.get(i.product_id) || [];
    if (opts.length === 0) return i;
    const best = opts.reduce((a, b) => (a.unit_price <= b.unit_price ? a : b));
    return { ...i, unit_price: best.unit_price, line_total: i.quantity * best.unit_price };
  });

  return { items: updated, bySupplier: {} };
}

// ============= IMPORTS =============

export async function listImports(limit = 20): Promise<Page<ImportRow>> {
  const c = sb();
  if (!c) return { items: [], total: 0, page: 1, size: limit };
  const { data, count, error } = await c.from('imports')
    .select('id, supplier_id, user_id, import_type, original_filename, status, error_message, rows_total, rows_approved, rows_rejected, created_at, suppliers!imports_supplier_id_fkey(name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return {
    items: (data || []).map((i: any) => ({ ...i, supplier: i.suppliers })),
    total: count || 0, page: 1, size: limit,
  };
}

// ============= ANALYTICS =============

export interface KpiSummary {
  total_suppliers: number;
  total_products: number;
  total_orders_30d: number;
  total_spend_30d: number;
  avg_order_value: number;
  pending_orders: number;
}

export async function getAnalyticsSummary(): Promise<KpiSummary> {
  const c = sb();
  const empty: KpiSummary = { total_suppliers: 0, total_products: 0, total_orders_30d: 0, total_spend_30d: 0, avg_order_value: 0, pending_orders: 0 };
  if (!c) return empty;

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [sup, prod, orders] = await Promise.all([
    c.from('suppliers').select('id', { count: 'exact', head: true }).eq('is_active', true),
    c.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
    c.from('purchase_orders').select('id, total_amount, status', { count: 'exact' }).gte('created_at', since),
  ]);

  const ordersData = orders.data || [];
  const total_spend_30d = ordersData.reduce((s, o) => s + Number(o.total_amount || 0), 0);
  const total_orders_30d = ordersData.length;
  const pending = ordersData.filter((o) => o.status === 'pending' || o.status === 'placed').length;

  return {
    total_suppliers: sup.count || 0,
    total_products: prod.count || 0,
    total_orders_30d,
    total_spend_30d,
    avg_order_value: total_orders_30d > 0 ? total_spend_30d / total_orders_30d : 0,
    pending_orders: pending,
  };
}

// ============= USERS =============

export async function getMyProfile(): Promise<{ id: string; email: string; full_name: string; role: string } | null> {
  const c = sb();
  if (!c) return null;
  const { data: { user } } = await c.auth.getUser();
  if (!user) return null;
  const { data } = await c.from('users').select('id, email, full_name, role').eq('supabase_user_id', user.id).maybeSingle();
  if (data) return data as any;

  // Se ainda não há profile, tentar criar via RPC (security definer)
  const { data: ensured } = await c.rpc('ensure_user_profile').maybeSingle();
  if (ensured) return ensured as any;

  // Fallback: usar metadados do auth
  return {
    id: user.id,
    email: user.email || '',
    full_name: (user.user_metadata as any)?.full_name || user.email || '',
    role: (user.user_metadata as any)?.role || 'user',
  };
}

export async function listUsers(): Promise<{ id: string; email: string; full_name: string; role: string; is_active: boolean; last_login_at: string | null; created_at: string }[]> {
  const c = sb();
  if (!c) return [];
  const { data } = await c.from('users')
    .select('id, email, full_name, role, is_active, last_login_at, created_at')
    .order('created_at', { ascending: false })
    .limit(100);
  return (data || []) as any;
}

// ============= ADMIN DASHBOARD =============

export async function getAdminDashboard() {
  const c = sb();
  if (!c) return null;
  const kpi = await getAnalyticsSummary();
  const { count: importsTotal } = await c.from('imports').select('id', { count: 'exact', head: true });
  const { count: ordersTotal } = await c.from('purchase_orders').select('id', { count: 'exact', head: true });
  const { count: usersTotal } = await c.from('users').select('id', { count: 'exact', head: true });
  return { ...kpi, imports_total: importsTotal || 0, orders_total: ordersTotal || 0, users_total: usersTotal || 0 };
}

export async function getAuditLog(limit = 50) {
  const c = sb();
  if (!c) return [];
  const { data } = await c.from('audit_logs')
    .select('id, user_id, action, entity_type, entity_id, payload, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data || []) as any[];
}

export async function getPriceAlerts(thresholdPct = 5) {
  const c = sb();
  if (!c) return [];
  // Buscar preços atuais, comparar com o penúltimo de cada (product, supplier)
  const { data: current } = await c.from('supplier_prices')
    .select('id, supplier_id, product_id, unit_price, valid_from, suppliers!inner(name), products!inner(master_name, brand)')
    .eq('is_current', true);
  if (!current || current.length === 0) return [];

  const { data: history } = await c.from('supplier_prices')
    .select('product_id, supplier_id, unit_price, valid_from')
    .order('valid_from', { ascending: false })
    .limit(2000);

  const lastByPair = new Map<string, number>();
  for (const h of (history || []) as any[]) {
    const key = `${h.product_id}|${h.supplier_id}`;
    if (!lastByPair.has(key)) lastByPair.set(key, Number(h.unit_price));
  }

  const alerts: any[] = [];
  for (const cur of current as any[]) {
    const key = `${cur.product_id}|${cur.supplier_id}`;
    const prev = lastByPair.get(key);
    if (prev == null) continue;
    if (prev === 0) continue;
    const pct = ((Number(cur.unit_price) - prev) / prev) * 100;
    if (Math.abs(pct) >= thresholdPct) {
      alerts.push({
        product_id: cur.product_id,
        product_name: cur.products?.master_name,
        brand: cur.products?.brand,
        supplier_id: cur.supplier_id,
        supplier_name: cur.suppliers?.name,
        old_price: prev,
        new_price: Number(cur.unit_price),
        change_pct: pct,
        change_abs: Number(cur.unit_price) - prev,
      });
    }
  }
  alerts.sort((a, b) => Math.abs(b.change_pct) - Math.abs(a.change_pct));
  return alerts.slice(0, 50);
}

// ============= ROI =============

export interface RoiSummary {
  period_days: number;
  orders_count: number;
  items_count: number;
  total_spend_eur: number;
  suppliers_compared_total: number;
  estimated_savings_eur: number;
  estimated_savings_pct: number;
  avg_order_value_eur: number;
  avg_items_per_order: number;
}

export async function getRoiSummary(days = 30): Promise<RoiSummary> {
  const c = sb();
  const empty: RoiSummary = { period_days: days, orders_count: 0, items_count: 0, total_spend_eur: 0, suppliers_compared_total: 0, estimated_savings_eur: 0, estimated_savings_pct: 8, avg_order_value_eur: 0, avg_items_per_order: 0 };
  if (!c) return empty;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: orders } = await c.from('purchase_orders')
    .select('id, total_amount, supplier_id')
    .gte('created_at', since);
  const orderIds = (orders || []).map((o) => o.id);
  const { data: items } = orderIds.length
    ? await c.from('purchase_order_items').select('id, order_id, product_id, unit_price, line_total').in('order_id', orderIds)
    : { data: [] };

  const { data: prices } = await c.from('supplier_prices')
    .select('product_id, unit_price')
    .eq('is_current', true);
  const minPrice = new Map<string, number>();
  for (const p of (prices || []) as any[]) {
    const cur = minPrice.get(p.product_id);
    if (cur == null || Number(p.unit_price) < cur) minPrice.set(p.product_id, Number(p.unit_price));
  }

  const itemsArr = (items as any[]) || [];
  let chosenTotal = 0;
  let minPossibleTotal = 0;
  for (const i of itemsArr) {
    chosenTotal += Number(i.line_total);
    const min = minPrice.get(i.product_id) || 0;
    minPossibleTotal += min * Number((i as any).quantity || 1);
  }

  const total = orders?.reduce((s, o) => s + Number(o.total_amount), 0) || 0;
  const estimated = Math.max(0, chosenTotal - minPossibleTotal);

  return {
    period_days: days,
    orders_count: orders?.length || 0,
    items_count: itemsArr.length,
    total_spend_eur: Number(total.toFixed(2)),
    suppliers_compared_total: new Set((orders || []).map((o: any) => o.supplier_id)).size,
    estimated_savings_eur: Number(estimated.toFixed(2)),
    estimated_savings_pct: total > 0 ? Number(((estimated / total) * 100).toFixed(2)) : 8,
    avg_order_value_eur: orders?.length ? Number((total / orders.length).toFixed(2)) : 0,
    avg_items_per_order: orders?.length ? Number((itemsArr.length / orders.length).toFixed(2)) : 0,
  };
}

export async function getSavingsBySupplier(days = 30) {
  const c = sb();
  if (!c) return { period_days: days, suppliers: [] as any[] };
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await c.from('purchase_orders')
    .select('id, supplier_id, total_amount, suppliers!purchase_orders_supplier_id_fkey(name)')
    .gte('created_at', since);
  const total = (data || []).reduce((s, o: any) => s + Number(o.total_amount), 0) || 1;
  const grouped: Record<string, { id: string; name: string; orders: number; total: number }> = {};
  for (const o of (data || []) as any[]) {
    const id = o.supplier_id;
    if (!grouped[id]) grouped[id] = { id, name: o.suppliers?.name || '?', orders: 0, total: 0 };
    grouped[id].orders += 1;
    grouped[id].total += Number(o.total_amount);
  }
  return {
    period_days: days,
    suppliers: Object.values(grouped).map((s) => ({ ...s, total_eur: Number(s.total.toFixed(2)), share_pct: Number(((s.total / total) * 100).toFixed(1)) })).sort((a, b) => b.total - a.total),
  };
}

export async function getTopPriceIncreases(days = 30, limit = 10) {
  const c = sb();
  if (!c) return { top: [] as any[] };
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data: history } = await c.from('supplier_prices')
    .select('product_id, unit_price, created_at, products!inner(master_name, brand)')
    .gte('created_at', since)
    .order('created_at', { ascending: true });

  const byProduct = new Map<string, { name: string; brand: string | null; prices: number[] }>();
  for (const h of (history || []) as any[]) {
    if (!byProduct.has(h.product_id)) byProduct.set(h.product_id, { name: h.products?.master_name, brand: h.products?.brand, prices: [] });
    byProduct.get(h.product_id)!.prices.push(Number(h.unit_price));
  }

  const top = [...byProduct.entries()]
    .map(([pid, info]) => {
      const oldP = info.prices[0];
      const newP = info.prices[info.prices.length - 1];
      const pct = oldP > 0 ? ((newP - oldP) / oldP) * 100 : 0;
      return { product_id: pid, name: info.name, brand: info.brand, old_price: oldP, new_price: newP, increase_pct: pct, abs_increase: newP - oldP };
    })
    .filter((x) => x.increase_pct > 0)
    .sort((a, b) => b.increase_pct - a.increase_pct)
    .slice(0, limit);

  return { top };
}

// ============= AUTH MANAGEMENT (admin) — via Edge Function =============

async function callAdminFn(action: string, payload: Record<string, unknown> = {}): Promise<{ ok: boolean; error?: string }> {
  const c = sb();
  if (!c) return { ok: false, error: 'Supabase indisponível' };
  const { data: { session } } = await c.auth.getSession();
  if (!session) return { ok: false, error: 'Sessão expirou — faça login novamente' };
  const res = await fetch(`${(c as any).supabaseUrl}/functions/v1/admin-users`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, ...payload }),
  });
  let r: any = {};
  try { r = await res.json(); } catch { /* ignore */ }
  if (!res.ok || r.error) return { ok: false, error: r.error || `HTTP ${res.status}` };
  return { ok: true, ...r };
}

export async function createLogin(opts: { email: string; password: string; full_name: string; role: 'admin' | 'user' }): Promise<{ ok: boolean; error?: string; user_id?: string }> {
  const c = sb();
  if (!c) return { ok: false, error: 'Supabase indisponível' };
  const { data: { session } } = await c.auth.getSession();
  if (!session) return { ok: false, error: 'Sessão expirou — faça login novamente' };
  const res = await fetch(`${(c as any).supabaseUrl}/functions/v1/admin-users`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create', ...opts }),
  });
  const r = await res.json().catch(() => ({}));
  if (!res.ok || r.error) return { ok: false, error: r.error || `HTTP ${res.status}` };
  return { ok: true, user_id: r.user_id };
}

export async function changeMyPassword(currentPwd: string, newPassword: string): Promise<{ ok: boolean; error?: string }> {
  const c = sb();
  if (!c) return { ok: false, error: 'Supabase indisponível' };
  const { data: { user } } = await c.auth.getUser();
  if (!user || !user.email) return { ok: false, error: 'Sessão expirou' };
  // Re-autenticar para garantir password atual está correta
  const { error: reauthErr } = await c.auth.signInWithPassword({ email: user.email, password: currentPwd });
  if (reauthErr) return { ok: false, error: 'Password atual incorreta' };
  const { error } = await c.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function changeUserRole(userId: string, newRole: 'admin' | 'user'): Promise<{ ok: boolean; error?: string }> {
  return callAdminFn('change_role', { userId, role: newRole });
}

export async function deleteUserLogin(userId: string): Promise<{ ok: boolean; error?: string }> {
  return callAdminFn('delete', { userId });
}

export async function setUserActive(userId: string, isActive: boolean): Promise<{ ok: boolean; error?: string }> {
  // Não temos endpoint dedicado; usar update direto em public.users (RLS permite se for admin)
  const c = sb();
  if (!c) return { ok: false, error: 'Supabase indisponível' };
  const { error } = await c.from('users').update({ is_active: isActive }).eq('id', userId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ============= FASE 3 — OPERAÇÃO REAL =============

/**
 * M1: Catálogo Mestre - produto + aliases + fornecedores + stats
 */
export interface CatalogProduct {
  id: string;
  master_name: string;
  brand: string | null;
  category: string | null;
  unit: string;
  status: string;
  aliases: { alias: string; locale: string; hit_count: number }[];
  suppliers: { id: string; name: string; price: number; unit_price: number; updated_at: string }[];
  last_price_update: string | null;
  total_orders: number;
  total_quantity: number;
  has_duplicates: boolean;
  duplicate_of?: string;
}

export async function getCatalog(opts: { q?: string; category?: string; limit?: number } = {}): Promise<CatalogProduct[]> {
  const { q = '', category, limit = 200 } = opts;
  const c = sb();
  if (!c) return [];

  // 1. Produtos
  let qb = c.from('products')
    .select('id, master_name, brand, category, unit, status, is_active')
    .eq('is_active', true)
    .order('master_name', { ascending: true })
    .limit(limit);
  if (q) qb = qb.ilike('master_name', `%${q}%`);
  if (category) qb = qb.eq('category', category);
  const { data: products } = await qb;
  if (!products || products.length === 0) return [];

  const ids = products.map((p: any) => p.id);

  // 2. Aliases (em batch)
  const { data: aliases } = await c.from('product_aliases')
    .select('alias, locale, hit_count, product_id')
    .in('product_id', ids);

  // 3. Preços atuais
  const { data: prices } = await c.from('supplier_prices')
    .select('product_id, supplier_id, price, unit_price, updated_at, suppliers!inner(name)')
    .eq('is_current', true)
    .in('product_id', ids);

  // 4. Items de ordens (total_orders + total_quantity)
  const { data: items } = await c.from('purchase_order_items')
    .select('product_id, quantity')
    .in('product_id', ids);

  // Mapear
  return products.map((p: any) => {
    const prodAliases = (aliases || []).filter((a: any) => a.product_id === p.id);
    const prodPrices = (prices || []).filter((p2: any) => p2.product_id === p.id);
    const prodItems = (items || []).filter((i: any) => i.product_id === p.id);
    const lastUpdate = prodPrices.length > 0
      ? prodPrices.reduce((a: any, b: any) => (a.updated_at > b.updated_at ? a : b)).updated_at
      : null;
    return {
      ...p,
      aliases: prodAliases.map((a: any) => ({ alias: a.alias, locale: a.locale, hit_count: a.hit_count })),
      suppliers: prodPrices.map((pr: any) => ({
        id: pr.supplier_id,
        name: pr.suppliers?.name,
        price: Number(pr.price),
        unit_price: Number(pr.unit_price),
        updated_at: pr.updated_at,
      })),
      last_price_update: lastUpdate,
      total_orders: prodItems.length,
      total_quantity: prodItems.reduce((s: number, i: any) => s + Number(i.quantity), 0),
      has_duplicates: false,
    } as CatalogProduct;
  });
}

export async function getProductNamesForAutocomplete(): Promise<{ id: string; name: string; brand: string | null; aliases: string[] }[]> {
  const c = sb();
  if (!c) return [];
  const { data: products } = await c.from('products')
    .select('id, master_name, brand, product_aliases(alias)')
    .eq('is_active', true)
    .order('master_name', { ascending: true });
  if (!products) return [];
  return (products as any[]).map((p) => ({
    id: p.id,
    name: p.master_name,
    brand: p.brand,
    aliases: (p.product_aliases || []).map((a: any) => a.alias),
  }));
}

export async function searchProductsAutocomplete(q: string, limit = 10): Promise<{ id: string; name: string; brand: string | null; alias: string; unit_price?: number }[]> {
  const c = sb();
  if (!c) return [];
  const norm = q.toLowerCase().trim();
  if (norm.length < 1) return [];
  // Buscar em produtos + aliases
  const { data: products } = await c.from('products')
    .select('id, master_name, brand')
    .eq('is_active', true)
    .or(`master_name.ilike.%${norm}%,brand.ilike.%${norm}%`)
    .limit(limit);
  const { data: aliases } = await c.from('product_aliases')
    .select('alias, product_id, products!inner(master_name, brand)')
    .ilike('alias', `%${norm}%`)
    .limit(limit);
  // Combinar e deduplicar
  const results: { id: string; name: string; brand: string | null; alias: string; unit_price?: number }[] = [];
  const seen = new Set<string>();
  for (const p of (products || []) as any[]) {
    if (!seen.has(p.id)) {
      seen.add(p.id);
      results.push({ id: p.id, name: p.master_name, brand: p.brand, alias: p.master_name });
    }
  }
  for (const a of (aliases || []) as any[]) {
    if (!seen.has(a.product_id)) {
      seen.add(a.product_id);
      results.push({ id: a.product_id, name: a.products?.master_name, brand: a.products?.brand, alias: a.alias });
    }
  }
  return results.slice(0, limit);
}

/**
 * M2: Preços antigos (stale prices)
 */
export interface StalePrice {
  product_id: string;
  product_name: string;
  brand: string | null;
  category: string | null;
  unit: string;
  last_price_date: string | null;
  days_since_update: number | null;
  current_price: number | null;
  current_supplier: string | null;
  supplier_count: number;
  urgency: 'critical' | 'warning' | 'ok';
}

export async function getStalePrices(thresholdDays = 30): Promise<StalePrice[]> {
  const c = sb();
  if (!c) return [];
  const { data: products } = await c.from('products')
    .select('id, master_name, brand, category, unit')
    .eq('is_active', true)
    .order('master_name', { ascending: true });
  if (!products) return [];

  const ids = products.map((p: any) => p.id);
  const { data: prices } = await c.from('supplier_prices')
    .select('product_id, supplier_id, price, unit_price, updated_at, suppliers!inner(name)')
    .eq('is_current', true)
    .in('product_id', ids);

  const now = Date.now();
  return (products as any[]).map((p) => {
    const pp = (prices || []).filter((pr: any) => pr.product_id === p.id);
    if (pp.length === 0) {
      return {
        product_id: p.id, product_name: p.master_name, brand: p.brand,
        category: p.category, unit: p.unit, last_price_date: null,
        days_since_update: null, current_price: null, current_supplier: null,
        supplier_count: 0, urgency: 'critical' as const,
      };
    }
    const newest = pp.reduce((a: any, b: any) => (a.updated_at > b.updated_at ? a : b));
    const days = Math.floor((now - new Date(newest.updated_at).getTime()) / (1000 * 60 * 60 * 24));
    let urgency: 'critical' | 'warning' | 'ok' = 'ok';
    if (days > 90) urgency = 'critical';
    else if (days > thresholdDays) urgency = 'warning';
    return {
      product_id: p.id, product_name: p.master_name, brand: p.brand,
      category: p.category, unit: p.unit, last_price_date: newest.updated_at,
      days_since_update: days, current_price: Number(newest.unit_price),
      current_supplier: newest.suppliers?.name, supplier_count: pp.length,
      urgency,
    };
  }).filter((s) => s.urgency !== 'ok').sort((a, b) => (b.days_since_update || 9999) - (a.days_since_update || 9999));
}

/**
 * M3: Saúde da Base
 */
export interface DataHealth {
  score: number;
  total_products: number;
  active_products: number;
  without_supplier: number;
  without_price: number;
  without_category: number;
  stale_prices: number;
  total_suppliers: number;
  active_suppliers: number;
  total_aliases: number;
  total_orders: number;
  total_purchase_items: number;
  duplicate_candidates: number;
  last_import_at: string | null;
  issues: { severity: 'critical' | 'warning' | 'info'; message: string; count: number }[];
}

export async function getDataHealth(): Promise<DataHealth> {
  const c = sb();
  const empty: DataHealth = { score: 100, total_products: 0, active_products: 0, without_supplier: 0, without_price: 0, without_category: 0, stale_prices: 0, total_suppliers: 0, active_suppliers: 0, total_aliases: 0, total_orders: 0, total_purchase_items: 0, duplicate_candidates: 0, last_import_at: null, issues: [] };
  if (!c) return empty;

  const [prods, supps, aliases, orders, items, allPrices, imports] = await Promise.all([
    c.from('products').select('id, master_name, brand, category, unit, is_active', { count: 'exact' }),
    c.from('suppliers').select('id, is_active', { count: 'exact' }),
    c.from('product_aliases').select('id', { count: 'exact', head: true }),
    c.from('purchase_orders').select('id', { count: 'exact', head: true }),
    c.from('purchase_order_items').select('id', { count: 'exact', head: true }),
    c.from('supplier_prices').select('product_id, updated_at, is_current').eq('is_current', true),
    c.from('imports').select('created_at').order('created_at', { ascending: false }).limit(1),
  ]);

  const productsArr = (prods.data || []) as any[];
  const suppliersArr = (supps.data || []) as any[];
  const pricesArr = (allPrices.data || []) as any[];
  const activeProducts = productsArr.filter((p) => p.is_active !== false);
  const productIdsWithPrice = new Set(pricesArr.map((p) => p.product_id));
  const withoutPrice = activeProducts.filter((p) => !productIdsWithPrice.has(p.id)).length;
  const withoutCategory = activeProducts.filter((p) => !p.category).length;
  const activeSuppliers = suppliersArr.filter((s) => s.is_active !== false);

  // Stale prices (>90 days)
  const now = Date.now();
  const staleSet = new Set<string>();
  for (const pr of pricesArr) {
    const days = (now - new Date(pr.updated_at).getTime()) / (1000 * 60 * 60 * 24);
    if (days > 90) staleSet.add(pr.product_id);
  }

  // Duplicados heurística: mesmo nome normalizado (lowercase + trim)
  const nameCount = new Map<string, number>();
  for (const p of activeProducts) {
    const k = p.master_name.toLowerCase().trim();
    nameCount.set(k, (nameCount.get(k) || 0) + 1);
  }
  const duplicateCandidates = [...nameCount.values()].filter((c) => c > 1).length;

  const issues: DataHealth['issues'] = [];
  if (withoutPrice > 0) issues.push({ severity: 'critical', message: 'Produtos sem preço', count: withoutPrice });
  if (staleSet.size > 0) issues.push({ severity: 'warning', message: 'Produtos com preço > 90 dias', count: staleSet.size });
  if (withoutCategory > 0) issues.push({ severity: 'warning', message: 'Produtos sem categoria', count: withoutCategory });
  if (duplicateCandidates > 0) issues.push({ severity: 'info', message: 'Possíveis duplicados', count: duplicateCandidates });
  if (activeSuppliers.length === 0) issues.push({ severity: 'critical', message: 'Sem fornecedores ativos', count: 0 });

  // Score: 100 - (withoutPrice*2 + stale + withoutCat + duplicates*0.5) / totalProducts * 100
  const totalActive = activeProducts.length || 1;
  const deductions = (withoutPrice * 3) + (staleSet.size * 1) + (withoutCategory * 0.5) + (duplicateCandidates * 0.5);
  const score = Math.max(0, Math.min(100, 100 - (deductions / totalActive) * 50));

  return {
    score: Math.round(score),
    total_products: productsArr.length,
    active_products: activeProducts.length,
    without_supplier: 0, // calculado abaixo
    without_price: withoutPrice,
    without_category: withoutCategory,
    stale_prices: staleSet.size,
    total_suppliers: suppliersArr.length,
    active_suppliers: activeSuppliers.length,
    total_aliases: aliases.count || 0,
    total_orders: orders.count || 0,
    total_purchase_items: items.count || 0,
    duplicate_candidates: duplicateCandidates,
    last_import_at: imports.data?.[0]?.created_at || null,
    issues,
  };
}

/**
 * M5: Favoritos (pedidos rápidos)
 */
export interface Favorite {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  items: { product_id: string; product_name: string; quantity: number; unit_price?: number; supplier_id?: string; supplier_name?: string }[];
  use_count: number;
  last_used_at: string | null;
  created_at: string;
}

export async function listFavorites(): Promise<Favorite[]> {
  const c = sb();
  if (!c) return [];
  const { data } = await c.from('favorites')
    .select('*')
    .order('use_count', { ascending: false });
  return (data || []) as Favorite[];
}

export async function createFavorite(name: string, description: string, items: Favorite['items']): Promise<{ ok: boolean; error?: string; id?: string }> {
  const c = sb();
  if (!c) return { ok: false, error: 'Supabase indisponível' };
  const { data: { user } } = await c.auth.getUser();
  if (!user) return { ok: false, error: 'Sessão expirou' };
  const { data, error } = await c.from('favorites').insert({
    user_id: user.id, name, description, items,
  }).select('id').single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data.id };
}

export async function deleteFavorite(id: string): Promise<{ ok: boolean; error?: string }> {
  const c = sb();
  if (!c) return { ok: false, error: 'Supabase indisponível' };
  const { error } = await c.from('favorites').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function useFavorite(id: string): Promise<void> {
  const c = sb();
  if (!c) return;
  // Incrementar use_count
  const { data } = await c.from('favorites').select('use_count').eq('id', id).single();
  const current = (data as any)?.use_count || 0;
  await c.from('favorites').update({ use_count: current + 1, last_used_at: new Date().toISOString() }).eq('id', id);
}

/**
 * M8: Items mais comprados
 */
export interface FrequentItem {
  product_id: string;
  product_name: string;
  brand: string | null;
  unit: string;
  times_ordered: number;
  total_quantity: number;
  last_ordered: string;
  avg_unit_price: number;
  preferred_supplier_id: string | null;
  preferred_supplier_name: string | null;
}

export async function getFrequentItems(limit = 20): Promise<FrequentItem[]> {
  const c = sb();
  if (!c) return [];
  const { data: items } = await c.from('purchase_order_items')
    .select('product_id, quantity, unit_price, order_id, purchase_orders!inner(created_at, supplier_id, suppliers(name))')
    .limit(2000);
  if (!items) return [];

  // Agrupar por product_id
  const grouped = new Map<string, any[]>();
  for (const i of (items as any[])) {
    if (!grouped.has(i.product_id)) grouped.set(i.product_id, []);
    grouped.get(i.product_id)!.push(i);
  }

  // Buscar nomes
  const ids = [...grouped.keys()];
  const { data: products } = await c.from('products')
    .select('id, master_name, brand, unit')
    .in('id', ids);
  const pMap = new Map(((products || []) as any[]).map((p) => [p.id, p]));

  const result: FrequentItem[] = [];
  for (const [pid, list] of grouped) {
    const p = pMap.get(pid);
    if (!p) continue;
    const dates = list.map((i: any) => i.purchase_orders?.created_at).filter(Boolean).sort();
    const supplierCount = new Map<string, { name: string; count: number }>();
    for (const i of list) {
      const sid = i.purchase_orders?.supplier_id;
      const sname = i.purchase_orders?.suppliers?.name;
      if (sid) {
        const cur = supplierCount.get(sid);
        if (cur) cur.count++;
        else supplierCount.set(sid, { name: sname, count: 1 });
      }
    }
    const preferred = [...supplierCount.entries()].sort((a, b) => b[1].count - a[1].count)[0];
    const avgUnitPrice = list.reduce((s, i) => s + Number(i.unit_price), 0) / list.length;
    result.push({
      product_id: pid, product_name: p.master_name, brand: p.brand, unit: p.unit,
      times_ordered: list.length,
      total_quantity: list.reduce((s, i) => s + Number(i.quantity), 0),
      last_ordered: dates[dates.length - 1] || new Date().toISOString(),
      avg_unit_price: Number(avgUnitPrice.toFixed(2)),
      preferred_supplier_id: preferred?.[0] || null,
      preferred_supplier_name: preferred?.[1]?.name || null,
    });
  }
  return result.sort((a, b) => b.times_ordered - a.times_ordered).slice(0, limit);
}

/**
 * M6: Items de uma ordem (para "Repetir compra")
 */
export async function getOrderItems(orderId: string): Promise<any[]> {
  const c = sb();
  if (!c) return [];
  const { data } = await c.from('purchase_order_items')
    .select('id, product_id, quantity, unit_price, raw_line, products(master_name, brand, unit)')
    .eq('order_id', orderId);
  return (data || []) as any[];
}

/**
 * M10: Exceções agregadas
 */
export interface Exceptions {
  stale_prices: { count: number; items: StalePrice[] };
  no_price: { count: number; items: any[] };
  no_supplier: { count: number; items: any[] };
  no_category: { count: number; items: any[] };
  pending_imports: { count: number; items: any[] };
  pending_ocr: { count: number; items: any[] };
  total: number;
}

export async function getExceptions(): Promise<Exceptions> {
  const c = sb();
  const empty: Exceptions = { stale_prices: { count: 0, items: [] }, no_price: { count: 0, items: [] }, no_supplier: { count: 0, items: [] }, no_category: { count: 0, items: [] }, pending_imports: { count: 0, items: [] }, pending_ocr: { count: 0, items: [] }, total: 0 };
  if (!c) return empty;

  const [stale, products, imports] = await Promise.all([
    getStalePrices(30),
    c.from('products').select('id, master_name, category, is_active').eq('is_active', true),
    c.from('imports').select('id, original_filename, status, created_at, rows_total, rows_approved, rows_rejected').order('created_at', { ascending: false }).limit(50),
  ]);

  const productsArr = (products.data || []) as any[];

  // Sem preço
  const { data: prices } = await c.from('supplier_prices').select('product_id').eq('is_current', true);
  const idsWithPrice = new Set(((prices || []) as any[]).map((p) => p.product_id));
  const noPriceItems = productsArr.filter((p) => !idsWithPrice.has(p.id));

  // Sem fornecedor = sem preço (porque preço tem supplier_id)
  const noSupplierItems = noPriceItems;

  // Sem categoria
  const noCategoryItems = productsArr.filter((p) => !p.category);

  // Imports pendentes
  const importsArr = (imports.data || []) as any[];
  const pendingImports = importsArr.filter((i) => i.status === 'uploaded' || i.status === 'ocr_done' || i.status === 'normalized' || i.status === 'reviewing');
  const pendingOcr = importsArr.filter((i) => i.status === 'uploaded' || i.status === 'ocr_done');

  return {
    stale_prices: { count: stale.length, items: stale.slice(0, 20) },
    no_price: { count: noPriceItems.length, items: noPriceItems.slice(0, 20) },
    no_supplier: { count: noSupplierItems.length, items: noSupplierItems.slice(0, 20) },
    no_category: { count: noCategoryItems.length, items: noCategoryItems.slice(0, 20) },
    pending_imports: { count: pendingImports.length, items: pendingImports },
    pending_ocr: { count: pendingOcr.length, items: pendingOcr },
    total: stale.length + noPriceItems.length + noCategoryItems.length + pendingImports.length,
  };
}

/**
 * M7: Economia real (simples)
 */
export interface RealEconomy {
  period: string;
  total_spent: number;
  best_price_total: number;
  savings: number;
  savings_pct: number;
  order_count: number;
  item_count: number;
}

export async function getRealEconomy(days = 30): Promise<RealEconomy> {
  const c = sb();
  const empty: RealEconomy = { period: `${days}d`, total_spent: 0, best_price_total: 0, savings: 0, savings_pct: 0, order_count: 0, item_count: 0 };
  if (!c) return empty;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data: orders } = await c.from('purchase_orders').select('id, total_amount').gte('created_at', since);
  const orderIds = ((orders || []) as any[]).map((o) => o.id);
  if (orderIds.length === 0) return empty;
  const { data: items } = await c.from('purchase_order_items')
    .select('product_id, quantity, line_total, unit_price')
    .in('order_id', orderIds);
  const { data: currentPrices } = await c.from('supplier_prices')
    .select('product_id, unit_price').eq('is_current', true);
  const minPrice = new Map<string, number>();
  for (const p of (currentPrices || []) as any[]) {
    const cur = minPrice.get(p.product_id);
    if (cur == null || Number(p.unit_price) < cur) minPrice.set(p.product_id, Number(p.unit_price));
  }
  const itemsArr = (items || []) as any[];
  let spent = 0, best = 0;
  for (const i of itemsArr) {
    spent += Number(i.line_total);
    best += (minPrice.get(i.product_id) || 0) * Number(i.quantity);
  }
  return {
    period: `${days}d`,
    total_spent: Number(spent.toFixed(2)),
    best_price_total: Number(best.toFixed(2)),
    savings: Number(Math.max(0, spent - best).toFixed(2)),
    savings_pct: spent > 0 ? Number((((spent - best) / spent) * 100).toFixed(1)) : 0,
    order_count: orderIds.length,
    item_count: itemsArr.length,
  };
}

// ============= FASE 3 - WHITE LABEL FOUNDATION =============

export interface Company {
  id: string;
  slug: string;
  name: string;
  legal_name: string | null;
  tax_id: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  accent_color: string;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  settings: Record<string, any>;
  status: 'active' | 'suspended' | 'trial';
  created_at: string;
  updated_at: string;
}

export interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'comprador' | 'visualizador';
  joined_at: string;
  is_active: boolean;
  created_at: string;
  user?: { id: string; email: string; full_name: string; role: string };
}

export async function getMyCompany(): Promise<Company | null> {
  const c = sb();
  if (!c) return null;
  // Tentar via RPC primeiro (admin global)
  const { data: rpc } = await c.rpc('list_all_companies').limit(1).maybeSingle();
  if (rpc) return rpc as Company;
  // Tentar via query normal (member)
  const { data: companies } = await c.from('companies').select('*').limit(1);
  if (companies && companies.length > 0) return companies[0] as Company;
  return null;
}

export async function getCompanyById(id: string): Promise<Company | null> {
  const c = sb();
  if (!c) return null;
  const { data } = await c.from('companies').select('*').eq('id', id).single();
  return (data as Company) || null;
}

export async function listCompanies(): Promise<Company[]> {
  const c = sb();
  if (!c) return [];
  const { data } = await c.from('companies').select('*').order('name');
  return (data || []) as Company[];
}

export async function updateCompany(id: string, updates: Partial<Company>): Promise<{ ok: boolean; error?: string }> {
  const c = sb();
  if (!c) return { ok: false, error: 'Supabase indisponível' };
  updates.updated_at = new Date().toISOString();
  const { error } = await c.from('companies').update(updates).eq('id', id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function createCompany(input: { slug: string; name: string; legal_name?: string; primary_color?: string }): Promise<{ ok: boolean; error?: string; id?: string }> {
  const c = sb();
  if (!c) return { ok: false, error: 'Supabase indisponível' };
  const { data, error } = await c.from('companies').insert({
    slug: input.slug,
    name: input.name,
    legal_name: input.legal_name || null,
    primary_color: input.primary_color || '#10b981',
  }).select('id').single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data.id };
}

export async function listCompanyMembers(companyId: string): Promise<CompanyMember[]> {
  const c = sb();
  if (!c) return [];
  const { data } = await c.from('company_members')
    .select('*, users!company_members_user_id_fkey(id, email, full_name, role)')
    .eq('company_id', companyId)
    .order('joined_at', { ascending: false });
  return (data || []) as any[];
}

export async function addCompanyMember(companyId: string, userId: string, role: string): Promise<{ ok: boolean; error?: string }> {
  const c = sb();
  if (!c) return { ok: false, error: 'Supabase indisponível' };
  const { error } = await c.from('company_members').insert({
    company_id: companyId,
    user_id: userId,
    role: role as any,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updateCompanyMember(memberId: string, updates: { role?: string; is_active?: boolean }): Promise<{ ok: boolean; error?: string }> {
  const c = sb();
  if (!c) return { ok: false, error: 'Supabase indisponível' };
  const { error } = await c.from('company_members').update({
    role: updates.role as any,
    is_active: updates.is_active,
  }).eq('id', memberId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function removeCompanyMember(memberId: string): Promise<{ ok: boolean; error?: string }> {
  const c = sb();
  if (!c) return { ok: false, error: 'Supabase indisponível' };
  const { error } = await c.from('company_members').delete().eq('id', memberId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function getMyRole(companyId?: string): Promise<'owner' | 'admin' | 'comprador' | 'visualizador' | 'global_admin' | null> {
  const c = sb();
  if (!c) return null;
  // Verificar se é admin global
  const { data: { user } } = await c.auth.getUser();
  if (!user) return null;
  const { data: u } = await c.from('users').select('role').eq('supabase_user_id', user.id).maybeSingle();
  if (u?.role === 'admin') return 'global_admin';
  // Verificar company_member
  let q = c.from('company_members').select('role').eq('user_id', u?.id || user.id).eq('is_active', true);
  if (companyId) q = q.eq('company_id', companyId);
  const { data: m } = await q.order('joined_at', { ascending: true }).limit(1).maybeSingle();
  return (m?.role as any) || null;
}
