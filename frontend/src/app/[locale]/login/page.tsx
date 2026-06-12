'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { ChefHat, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuthStore } from '@/stores/auth';
import { getSupabase } from '@/lib/supabase';
import { trackEvent } from '@/lib/supabase-data';

function LoginForm() {
  const t = useTranslations('auth');
  const tApp = useTranslations('app');
  const router = useRouter();
  const sp = useSearchParams();
  const locale = useLocale();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => {
      if (data.session) {
        const access = data.session.access_token;
        const refresh = data.session.refresh_token;
        useAuthStore.setState({ accessToken: access, refreshToken: refresh });
        const next = sp.get('next') || `/${locale}/dashboard`;
        router.push(next);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function applySession(access: string, refresh: string) {
    useAuthStore.setState({ accessToken: access, refreshToken: refresh });
    const sb = getSupabase();
    if (sb) {
      try {
        const { data } = await sb.auth.getUser();
        if (data.user) {
          const role = ((data.user.user_metadata as any)?.role || 'user') as 'admin' | 'user';
          setSession({
            accessToken: access,
            refreshToken: refresh,
            user: {
              id: data.user.id,
              email: data.user.email || '',
              full_name: (data.user.user_metadata as any)?.full_name || data.user.email || '',
              role,
              is_active: true,
              created_at: data.user.created_at || new Date().toISOString(),
              last_login_at: (data.user as any).last_sign_in_at || null,
            },
          });
        }
      } catch {
        setSession({ accessToken: access, refreshToken: refresh });
      }
    }
    const next = sp.get('next') || `/${locale}/dashboard`;
    router.push(next);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    const sb = getSupabase();
    if (!sb) {
      setError('Supabase não configurado. Verifica NEXT_PUBLIC_SUPABASE_URL / ANON_KEY.');
      setLoading(false);
      return;
    }
    const { data, error: sbErr } = await sb.auth.signInWithPassword({ email, password });
    if (sbErr || !data.session) {
      setError(sbErr?.message || t('invalid'));
      setLoading(false);
      trackEvent({ event_type: 'error', payload: { kind: 'login_failed', email, error: sbErr?.message } });
      return;
    }
    await applySession(data.session.access_token, data.session.refresh_token);
    trackEvent({ event_type: 'login', payload: { email, method: 'password' } });
  }

  async function onMagicLink() {
    setLoading(true);
    setError(null);
    setInfo(null);
    const sb = getSupabase();
    if (!sb) {
      setError('Supabase não configurado.');
      setLoading(false);
      return;
    }
    const { error: sbErr } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + `/${locale}/dashboard` },
    });
    setLoading(false);
    if (sbErr) setError(sbErr.message);
    else setInfo('Verifica o teu email para o link de acesso.');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <Card className="w-full max-w-md animate-slide-up">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ChefHat className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">{tApp('name')}</CardTitle>
          <CardDescription>{tApp('tagline')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('email')}</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                     placeholder="email@empresa.com" required autoComplete="email" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('password')}</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                     placeholder="••••••••" required autoComplete="current-password" />
            </div>
            {error && (
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" /> {error}
              </p>
            )}
            {info && <p className="text-sm text-emerald-600 dark:text-emerald-400">{info}</p>}
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('submit')}
              </Button>
              <Button type="button" variant="outline" disabled={loading} onClick={onMagicLink}>
                Magic link
              </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Autenticação via Supabase. Se não tens conta, pede ao admin.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">A carregar...</div>}>
      <LoginForm />
    </Suspense>
  );
}
