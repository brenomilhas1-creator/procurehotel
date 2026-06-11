'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';

export default function AuthCallback() {
  const router = useRouter();
  const locale = useLocale();
  const [msg, setMsg] = useState('A finalizar sessão...');

  useEffect(() => {
    (async () => {
      const sb = getSupabase();
      if (!sb) { setMsg('Supabase não configurado'); return; }
      const { data, error } = await sb.auth.getSession();
      if (error) { setMsg(error.message); return; }
      if (!data.session) { setMsg('Sessão não encontrada'); return; }
      useAuthStore.setState({
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      });
      // Pull user from supabase auth (sem chamar backend)
      try {
        const { data: u } = await sb.auth.getUser();
        if (u.user) {
          const role = ((u.user.user_metadata as any)?.role || 'user') as 'admin' | 'user';
          useAuthStore.getState().setUser({
            id: u.user.id,
            email: u.user.email || '',
            full_name: (u.user.user_metadata as any)?.full_name || u.user.email || '',
            role,
            is_active: true,
            created_at: u.user.created_at || new Date().toISOString(),
            last_login_at: (u.user as any).last_sign_in_at || null,
          });
        }
      } catch { /* ignore */ }
      setMsg('Sessão ativa. A redirecionar...');
      setTimeout(() => router.push(`/${locale}/dashboard`), 400);
    })();
  }, [router, locale]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-sm text-muted-foreground gap-2">
      <Loader2 className="h-6 w-6 animate-spin" />
      <p>{msg}</p>
    </div>
  );
}
