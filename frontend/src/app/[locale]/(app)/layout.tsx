'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { useCompanyStore } from '@/stores/company';
import { Sidebar } from '@/components/shared/Sidebar';
import { MobileMenu } from '@/components/shared/MobileMenu';
import { Header } from '@/components/shared/Header';
import { getMyCompany } from '@/lib/supabase-data';
import { runLocalStorageMigration } from '@/lib/migrate-localstorage';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const { company, setCompany } = useCompanyStore();

  // Migração one-time de localStorage (limpar tokens antigos)
  useEffect(() => { runLocalStorageMigration(); }, []);

  // Carregar branding ao iniciar sessão
  useEffect(() => {
    if (accessToken && !company) {
      getMyCompany().then((c) => {
        if (c) setCompany(c);
      });
    } else if (!accessToken) {
      setCompany(null);
    }
  }, [accessToken, company, setCompany]);

  // Redirecionar para login se não houver user (sessão expirou)
  useEffect(() => {
    if (!user) {
      // pequena espera para não piscar se for refresh rápido
      const t = setTimeout(() => {
        if (!useAuthStore.getState().user) {
          router.replace('/login');
        }
      }, 500);
      return () => clearTimeout(t);
    }
  }, [user, router]);

  if (!user) {
    // Sem user: renderiza só children, mas se houver token no localStorage, deixa o client restaurar
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
