'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'success' | 'warning' | 'destructive' | 'outline' | 'secondary';

export function Badge({
  className, variant = 'default', children, ...rest
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  const styles: Record<Variant, string> = {
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/20',
    warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/20',
    destructive: 'bg-red-500/15 text-red-700 dark:text-red-300 ring-1 ring-red-500/20',
    outline: 'border border-input',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
        styles[variant], className
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
