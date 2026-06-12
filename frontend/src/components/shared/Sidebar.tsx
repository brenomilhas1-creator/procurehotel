'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard, ShoppingCart, Package, Truck, Upload, BarChart3, Users, LogOut, ChefHat, Shield, TrendingUp, Star, Activity, AlertCircle, Heart, Building2, HeartPulse, BarChartHorizontal, Bot,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function Sidebar() {
  const t = useTranslations('nav');
  const tAuth = useTranslations('auth');
  const pathname = usePathname();
  const { user, clear } = useAuthStore();
  const router = useRouter();

  const items = [
    { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/order', label: 'Pedido Rápido', icon: ShoppingCart, primary: true },
    { href: '/favorites', label: 'Favoritos', icon: Star },
    { href: '/catalog', label: 'Catálogo', icon: Package },
    { href: '/orders', label: t('orders'), icon: Heart },
    { href: '/imports', label: t('imports'), icon: Upload },
    { href: '/prices', label: 'Preços', icon: Activity },
    { href: '/exceptions', label: 'Exceções', icon: AlertCircle },
    { href: '/health', label: 'Saúde', icon: BarChart3 },
    { href: '/status', label: 'Estado', icon: HeartPulse },
    { href: '/operational', label: 'Operacional', icon: BarChartHorizontal },
    { href: '/assistant', label: 'Assistente IA', icon: Bot },
    { href: '/suppliers', label: t('suppliers'), icon: Truck },
    { href: '/roi', label: 'Economia', icon: TrendingUp },
  ];
  if (user?.role === 'admin') {
    items.push({ href: '/users', label: t('users'), icon: Users });
    items.push({ href: '/admin', label: 'Admin', icon: Shield });
  }
  // Settings sempre disponível (todos os membros)
  items.push({ href: '/settings/company', label: 'Definições', icon: Building2 });

  function logout() {
    clear();
    // tentar terminar sessão Supabase em background (best-effort)
    import('@/lib/supabase').then(({ getSupabase }) => {
      const sb = getSupabase();
      sb?.auth.signOut().catch(() => {});
    });
    router.push('/login');
  }

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-card/40 backdrop-blur-sm">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <ChefHat className="h-5 w-5" />
        </div>
        <div>
          <div className="font-semibold leading-none">Compra Facil</div>
          <div className="text-xs text-muted-foreground">v0.1.0</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map((it) => {
          const active = pathname?.includes(it.href);
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                active ? 'bg-primary text-primary-foreground' : 'hover:bg-accent hover:text-accent-foreground',
                it.primary && !active && 'font-medium',
              )}
            >
              <Icon className="h-4 w-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3">
        <div className="mb-2 px-3 text-xs text-muted-foreground">
          {user?.email}
        </div>
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={logout}>
          <LogOut className="h-4 w-4" /> {tAuth('logout')}
        </Button>
      </div>
    </aside>
  );
}
