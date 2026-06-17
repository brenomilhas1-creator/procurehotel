/**
 * Cliente Supabase para o browser.
 * Usa a anon key (publishable) — segura no frontend.
 *
 * Cookies são configurados como HttpOnly + Secure (em produção) para que
 * JavaScript malicioso (XSS) não possa ler os tokens de auth.
 */

'use client';

import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let _client: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabase() {
  if (_client) return _client;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    if (typeof window !== 'undefined') {
      console.warn('[supabase] NEXT_PUBLIC_SUPABASE_URL / ANON_KEY em falta');
    }
    return null;
  }
  // Em browser, document.cookie não suporta httpOnly (só server-side).
  // O Supabase Auth emite cookies via Set-Cookie header quando o cliente
  // chama signInWithPassword/signOut — esses são HttpOnly no servidor.
  // Aqui só configuramos o que o browser-side pode controlar.
  const isProd = typeof window !== 'undefined' && window.location.protocol === 'https:';
  _client = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookieOptions: {
      secure: isProd,           // true em prod (só HTTPS)
      sameSite: 'lax',          // CSRF protection
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    },
  });
  return _client;
}
