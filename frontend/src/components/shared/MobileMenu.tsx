'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ChefHat, LayoutDashboard, ShoppingCart, Package, Truck, Upload, BarChart3, Users, Shield, TrendingUp, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const t = useTranslations('nav');
  const tAuth = useTranslations('auth');
  const { user, clear } = useAuthStore();
  const router = useRouter();

  const items = [
    { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/order', label: t('order'), icon: ShoppingCart },
    { href: '/products', label: t('products'), icon: Package },
    { href: '/suppliers', label: t('suppliers'), icon: Truck },
    { href: '/imports', label: t('imports'), icon: Upload },
    { href: '/orders', label: t('orders'), icon: ShoppingCart },
    { href: '/analytics', label: t('analytics'), icon: BarChart3 },
  ];
  if (user?.role === 'admin') {
    items.push({ href: '/users', label: t('users'), icon: Users });
    items.push({ href: '/admin', label: 'Admin', icon: Shield });
    items.push({ href: '/roi', label: 'ROI', icon: TrendingUp });
  }

  function logout() {
    clear();
    setOpen(false);
    import('@/lib/supabase').then(({ getSupabase }) => {
      getSupabase()?.auth.signOut().catch(() => {});
    });
    router.push('/login');
  }

  function nav(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)} aria-label="Menu">
        <Menu className="h-5 w-5" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-card border-r flex flex-col animate-slide-up">
            <div className="flex h-16 items-center justify-between px-4 border-b">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <ChefHat className="h-5 w-5" />
                </div>
                <div className="font-semibold">Compra Facil</div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Fechar">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
              {items.map((it) => {
                const Icon = it.icon;
                return (
                  <button
                    key={it.href}
                    onClick={() => nav(it.href)}
                    className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                  >
                    <Icon className="h-4 w-4" />
                    {it.label}
                  </button>
                );
              })}
            </nav>
            <div className="border-t p-3">
              <div className="mb-2 px-3 text-xs text-muted-foreground truncate">{user?.email}</div>
              <Button variant="ghost" className="w-full justify-start gap-2" onClick={logout}>
                <LogOut className="h-4 w-4" /> {tAuth('logout')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
