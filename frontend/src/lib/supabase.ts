/**
 * Cliente Supabase para o browser.
 * Usa a anon key (publishable) — segura no frontend.
 */

'use client';

import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let _client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabase() {
  if (_client) return _client;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // Não rebentar em SSR/build — só no browser quando for usado
    if (typeof window !== 'undefined') {
      console.warn('[supabase] NEXT_PUBLIC_SUPABASE_URL / ANON_KEY em falta');
    }
    return null;
  }
  _client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return _client;
}
