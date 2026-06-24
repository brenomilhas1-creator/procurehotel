import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET() {
  try {
    const c = sb();
    if (!c) return NextResponse.json({ error: 'missing_env' }, { status: 500 });
    const { data, error } = await c
      .from('invoice_processing_queue')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ items: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'unknown' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const c = sb();
    if (!c) return NextResponse.json({ error: 'missing_env' }, { status: 500 });
    const body = await req.json();

    if (body.action === 'process' && body.id) {
      await c.from('invoice_processing_queue').update({ status: 'processing' }).eq('id', body.id);
      const { data, error } = await c.functions.invoke('process-invoice-pdf', {
        body: { queue_id: body.id },
      });
      if (error) {
        await c.from('invoice_processing_queue').update({
          status: 'failed',
          last_error: error.message,
          attempts: 1,
        }).eq('id', body.id);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true, result: data });
    }

    if (body.action === 'process_all') {
      const { data: pendings } = await c
        .from('invoice_processing_queue')
        .select('id')
        .eq('status', 'pending')
        .limit(50);

      if (pendings && pendings.length > 0) {
        await c.from('invoice_processing_queue')
          .update({ status: 'processing' })
          .in('id', pendings.map((p: any) => p.id));
        await c.functions.invoke('process-invoice-pdf', {
          body: { process_pending: true },
        });
      }
      return NextResponse.json({ ok: true, count: pendings?.length || 0 });
    }

    return NextResponse.json({ error: 'ação inválida' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'unknown' }, { status: 500 });
  }
}
