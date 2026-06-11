'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { listSuppliers, type Supplier, type Page } from '@/lib/supabase-data';

export default function SuppliersPage() {
  const t = useTranslations('suppliers');
  const tCommon = useTranslations('common');
  const [data, setData] = useState<Page<Supplier> | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    const debounce = setTimeout(() => {
      listSuppliers({ q, limit: 50 }).then(setData).catch(() => null);
    }, 300);
    return () => clearTimeout(debounce);
  }, [q]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{data?.total ?? 0} fornecedores</p>
        </div>
        <Button disabled title="Em breve"><Plus className="h-4 w-4" /> {t('add')}</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('search')}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>{t('name')}</TH>
                <TH>NIF</TH>
                <TH>{t('email')}</TH>
                <TH>{t('phone')}</TH>
                <TH>Prazo (h)</TH>
                <TH>Preferido</TH>
              </TR>
            </THead>
            <TBody>
              {data?.items.map((s) => (
                <TR key={s.id}>
                  <TD className="font-medium">{s.name}</TD>
                  <TD className="font-mono text-xs">{s.tax_id ?? '—'}</TD>
                  <TD className="text-xs">{s.contact_email ?? '—'}</TD>
                  <TD className="text-xs">{s.contact_phone ?? '—'}</TD>
                  <TD>{s.delivery_lead_time_hours ?? '—'}</TD>
                  <TD>{s.is_preferred ? <Badge variant="success">★</Badge> : '—'}</TD>
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
