'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { listProducts, type Product, type Page } from '@/lib/supabase-data';

export default function ProductsPage() {
  const t = useTranslations('products');
  const tCommon = useTranslations('common');
  const [data, setData] = useState<Page<Product> | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    const debounce = setTimeout(() => {
      listProducts({ q, limit: 50 }).then(setData).catch(() => null);
    }, 300);
    return () => clearTimeout(debounce);
  }, [q]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{data?.total ?? 0} produtos</p>
        </div>
        <Button disabled title="Em breve"><Plus className="h-4 w-4" /> {t('add')}</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('search')}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>{t('name')}</TH>
                <TH>{t('brand')}</TH>
                <TH>{t('category')}</TH>
                <TH>{t('unit')}</TH>
                <TH>{t('status')}</TH>
                <TH>Aliases</TH>
              </TR>
            </THead>
            <TBody>
              {data?.items.map((p) => (
                <TR key={p.id}>
                  <TD className="font-medium">{p.master_name}</TD>
                  <TD>{p.brand ?? '—'}</TD>
                  <TD>{p.category ?? '—'}</TD>
                  <TD>{p.unit}</TD>
                  <TD>
                    <Badge variant={p.status === 'active' ? 'success' : p.status === 'hidden' ? 'secondary' : 'destructive'}>
                      {p.status}
                    </Badge>
                  </TD>
                  <TD className="text-xs text-muted-foreground">
                    {p.aliases.length} ({p.aliases.slice(0, 3).map((a) => a.alias).join(', ')})
                  </TD>
                </TR>
              ))}
              {!data?.items.length && (
                <TR>
                  <TD colSpan={6} className="text-center text-muted-foreground py-8">
                    {tCommon('noData')}
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
