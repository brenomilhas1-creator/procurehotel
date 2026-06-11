'use client';

import { useTranslations } from 'next-intl';
import { MobileMenu } from './MobileMenu';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function Header() {
  const t = useTranslations('common');
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md md:px-6">
      <MobileMenu />
      <div className="md:hidden font-semibold">Compra Facil Hoteis</div>
      <div className="relative flex-1 max-w-md hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={t('search') + '...'} className="pl-9" />
      </div>
    </header>
  );
}
