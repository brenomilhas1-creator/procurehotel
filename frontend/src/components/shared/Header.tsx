'use client';

import { useTranslations } from 'next-intl';
import { MobileMenu } from './MobileMenu';
import { Search, ShoppingCart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useCart } from '@/stores/cart';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export function Header() {
  const t = useTranslations('common');
  const totalItems = useCart((s) => s.totalItems());
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md md:px-6">
      <MobileMenu />
      <div className="md:hidden font-semibold">Compra Facil Hoteis</div>
      <div className="relative flex-1 max-w-md hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={t('search') + '...'} className="pl-9" />
      </div>
      <Link
        href="/order"
        className="relative flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-accent text-sm font-medium"
        title="Ver carrinho / ir para Pedido Rápido"
      >
        <ShoppingCart className="h-4 w-4" />
        <span className="hidden sm:inline">Carrinho</span>
        {totalItems > 0 && (
          <Badge variant="default" className="ml-1 h-5 min-w-[20px] px-1.5 flex items-center justify-center">
            {totalItems}
          </Badge>
        )}
      </Link>
    </header>
  );
}
