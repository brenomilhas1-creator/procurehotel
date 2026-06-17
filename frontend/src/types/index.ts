export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

export interface ProductStatus {
  ACTIVE: 'active';
  HIDDEN: 'hidden';
  BLOCKED: 'blocked';
}

export interface ProductAlias {
  id: string;
  alias: string;
  locale: string;
  hit_count: number;
}

export interface Product {
  id: string;
  master_name: string;
  brand: string | null;
  category: string | null;
  unit: string;
  package_size: number | null;
  package_unit: string | null;
  status: 'active' | 'hidden' | 'blocked';
  substitution_allowed: boolean;
  description: string | null;
  sku: string | null;
  ean: string | null;
  is_active: boolean;
  aliases: ProductAlias[];
}

export interface Supplier {
  id: string;
  name: string;
  tax_id: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  website: string | null;
  notes: string | null;
  payment_terms: string | null;
  delivery_lead_time_hours: number | null;
  minimum_order: number | null;
  is_preferred: boolean;
  is_active: boolean;
}

export interface SupplierPrice {
  id: string;
  supplier_id: string;
  product_id: string;
  price: number;
  currency: string;
  unit_price: number;
  package_qty: number;
  min_order_qty: number;
  valid_from: string | null;
  valid_until: string | null;
  source: 'manual' | 'import' | 'ocr';
  is_current: boolean;
}

export interface FreeTextItem {
  raw_line: string;
  product_name?: string | null;
  product_id?: string | null;
  quantity: number;
  unit: string;
  brand?: string | null;
  notes?: string | null;
  confidence?: number;
}

export interface OptimizedItem {
  raw_line: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  supplier_id: string;
  supplier_name: string;
  unit_price: number;
  line_total: number;
  is_substitution: boolean;
  substitution_reason: string | null;
}

export interface OptimizedSupplierGroup {
  supplier_id: string;
  supplier_name: string;
  items: OptimizedItem[];
  total: number;
  item_count: number;
}

export interface OrderOptimizeResponse {
  groups: OptimizedSupplierGroup[];
  grand_total: number;
  unmatchable: FreeTextItem[];
}

export interface PurchaseOrder {
  id: string;
  code: string;
  status: 'draft' | 'copied' | 'placed' | 'cancelled';
  supplier_id: string;
  supplier_name: string;
  user_id: string;
  total_amount: number;
  currency: string;
  raw_input: string | null;
  notes: string | null;
  placed_at: string | null;
  items: Array<{
    id: string;
    product_id: string;
    product_name: string;
    raw_line: string | null;
    quantity: number;
    unit_price: number;
    line_total: number;
    is_substitution: boolean;
    substitution_reason: string | null;
  }>;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}
