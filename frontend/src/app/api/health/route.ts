import { NextResponse } from 'next/server';

/**
 * GET /api/health
 *
 * Endpoint público de health check para o UptimeRobot.
 * Retorna 200 OK com JSON se tudo estiver operacional.
 *
 * NUNCA retorna info sensível — apenas timestamp + status.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, string> = {};

  // Verificar Supabase (anônimo) — health endpoint aceita 200/401/404 (200 = ok, outros = responde)
  try {
    const r = await fetch('https://fpjhvyydavssrzrkvlbd.supabase.co/rest/v1/', {
      cache: 'no-store',
      headers: { 'apikey': 'sb_publishable_sY6wLl6b0Ba5hbb_ezMPQA_MmzVkUBV' },
    });
    // 200 = ok, 401/404 = Supabase responde mas precisa de auth = ok para health
    checks.supabase = r.status < 500 ? 'ok' : 'error';
  } catch (e) {
    checks.supabase = 'error';
  }

  const allOk = Object.values(checks).every((c) => c === 'ok');

  return NextResponse.json(
    {
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'compra-facil-hoteis',
      version: '0.7.0',
      checks,
    },
    { status: allOk ? 200 : 503 }
  );
}
