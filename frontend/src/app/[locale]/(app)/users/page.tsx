'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { listUsers } from '@/lib/supabase-data';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    listUsers().then(setUsers).catch(() => null);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Utilizadores</h1>
        <p className="text-sm text-muted-foreground">{users.length} registados</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Nome</TH>
                <TH>Email</TH>
                <TH>Role</TH>
                <TH>Status</TH>
                <TH>Último login</TH>
              </TR>
            </THead>
            <TBody>
              {users.map((u) => (
                <TR key={u.id}>
                  <TD className="font-medium">{u.full_name || '—'}</TD>
                  <TD className="text-xs">{u.email}</TD>
                  <TD><Badge variant={u.role === 'admin' ? 'destructive' : 'secondary'}>{u.role}</Badge></TD>
                  <TD><Badge variant={u.is_active !== false ? 'success' : 'secondary'}>{u.is_active !== false ? 'active' : 'inactive'}</Badge></TD>
                  <TD className="text-xs text-muted-foreground">{u.last_login_at ? new Date(u.last_login_at).toLocaleString('pt-PT') : '—'}</TD>
                </TR>
              ))}
              {!users.length && (
                <TR><TD colSpan={5} className="text-center text-muted-foreground py-8">Sem utilizadores</TD></TR>
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
