'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';

/**
 * Guarda a área autenticada. Se não houver access_token Supabase,
 * redireciona para /login.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (!accessToken) {
      router.replace(`/login?next=${encodeURIComponent(pathname || '/')}`);
    }
  }, [accessToken, pathname, router]);

  if (!accessToken) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        A redirecionar...
      </div>
    );
  }
  return <>{children}</>;
}
