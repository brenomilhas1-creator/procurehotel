import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const sb = createClient(url, key, { auth: { persistSession: false } });

    // Contar invoices pendentes
    const { count: pending } = await sb.from('invoices').select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'partial']);

    // Contar invoice_lines unmatched
    const { count: unmatched } = await sb.from('invoice_lines').select('id', { count: 'exact', head: true })
      .eq('match_status', 'unmatched');

    // Total de invoices
    const { count: total } = await sb.from('invoices').select('id', { count: 'exact', head: true });

    // Soma de invoices recentes (últimas 30d)
    const since = new Date(Date.now() - 30 * 86400_000).toISOString();
    const { data: recent } = await sb.from('invoices').select('total_amount').gte('received_at', since);
    const recent_total = (recent || []).reduce((s, r) => s + Number(r.total_amount || 0), 0);

    return NextResponse.json({
      pending: pending || 0,
      unmatched: unmatched || 0,
      total: total || 0,
      recent_total,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
