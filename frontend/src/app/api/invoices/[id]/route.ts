import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, ctx: any) {
  try {
    const params = await ctx.params;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const sb = createClient(url, key, { auth: { persistSession: false } });

    const { data, error } = await sb.from('invoices')
      .select('id, invoice_number, invoice_date, due_date, subtotal, tax_amount, total_amount, status, notes, source, suppliers!invoices_supplier_id_fkey(name, tax_id)')
      .eq('id', params.id).single();
    if (error || !data) return NextResponse.json({ error: error?.message || 'not_found' }, { status: 404 });

    const s: any = (data as any).suppliers;
    return NextResponse.json({
      ...(data as any),
      supplier_name: s?.name,
      supplier_tax_id: s?.tax_id,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
