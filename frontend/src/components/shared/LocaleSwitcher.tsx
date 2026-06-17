'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';

export function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const current = useLocale();
  const [isPending, startTransition] = useTransition();

  function switchTo(target: 'pt-PT' | 'en') {
    startTransition(() => {
      const newPath = pathname.replace(/^\/(pt-PT|en)/, `/${target}`);
      router.replace(newPath || `/${target}`);
      router.refresh();
    });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => switchTo(current === 'pt-PT' ? 'en' : 'pt-PT')}
      disabled={isPending}
      className="gap-1.5"
    >
      <Languages className="h-4 w-4" />
      <span className="uppercase">{current === 'pt-PT' ? 'EN' : 'PT'}</span>
    </Button>
  );
}
