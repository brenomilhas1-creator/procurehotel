'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useCompanyStore } from '@/stores/company';
import { Sidebar } from '@/components/shared/Sidebar';
import { MobileMenu } from '@/components/shared/MobileMenu';
import { Header } from '@/components/shared/Header';
import { getMyCompany } from '@/lib/supabase-data';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, accessToken } = useAuthStore();
  const { company, setCompany } = useCompanyStore();

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

  if (!user) {
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
