'use client';

import { useEffect, useState } from 'react';
import { Search, Tag, Truck, Calendar, ShoppingCart, ChevronDown, ChevronRight, Package, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getCatalog, type CatalogProduct } from '@/lib/supabase-data';
import { formatCurrency } from '@/lib/utils';

export default function CatalogPage() {
  const [data, setData] = useState<CatalogProduct[]>([]);
  const [q, setQ] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      getCatalog({ q, limit: 200 }).then((d) => { setData(d); setLoading(false); });
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Catálogo Mestre</h1>
        <p className="text-sm text-muted-foreground">{data.length} produtos — ver aliases, fornecedores e última atualização de preço</p>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar produto ou marca..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">A carregar...</p>
          ) : data.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Sem produtos. <a href="/imports" className="underline">Importar uma lista →</a>
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {data.map((p) => {
                const isOpen = expanded === p.id;
                const daysAgo = p.last_price_update
                  ? Math.floor((Date.now() - new Date(p.last_price_update).getTime()) / (1000 * 60 * 60 * 24))
                  : null;
                const priceStale = daysAgo !== null && daysAgo > 90;
                return (
                  <li key={p.id}>
                    <button
                      onClick={() => setExpanded(isOpen ? null : p.id)}
                      className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-accent text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm flex items-center gap-2">
                          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          {p.master_name}
                          {p.brand && <span className="text-xs text-muted-foreground">({p.brand})</span>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1"><Package className="h-3 w-3" /> {p.category || 'sem categoria'}</span>
                          <span>· {p.unit}</span>
                          <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> {p.aliases.length} alias{p.aliases.length !== 1 ? 'es' : ''}</span>
                          <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> {p.suppliers.length} fornecedor{p.suppliers.length !== 1 ? 'es' : ''}</span>
                          {p.total_orders > 0 && <span>· {p.total_orders} ordens</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {p.suppliers.length > 0 && (
                          <Badge variant="default">{formatCurrency(p.suppliers[0].unit_price)}/{p.unit}</Badge>
                        )}
                        {priceStale && (
                          <Badge variant="destructive" title={`Preço com ${daysAgo} dias`}>
                            <AlertCircle className="h-3 w-3 mr-1" /> {daysAgo}d
                          </Badge>
                        )}
                        {p.suppliers.length === 0 && (
                          <Badge variant="outline">sem preço</Badge>
                        )}
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-4 py-3 bg-muted/30 space-y-3 text-sm">
                        {/* Aliases */}
                        {p.aliases.length > 0 && (
                          <div>
                            <div className="font-medium text-xs text-muted-foreground mb-1">Aliases encontrados:</div>
                            <div className="flex flex-wrap gap-1.5">
                              {p.aliases.map((a, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {a.alias}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* Fornecedores */}
                        {p.suppliers.length > 0 && (
                          <div>
                            <div className="font-medium text-xs text-muted-foreground mb-1">Fornecedores e preços:</div>
                            <ul className="space-y-1">
                              {p.suppliers.sort((a, b) => a.unit_price - b.unit_price).map((s) => (
                                <li key={s.id} className="flex justify-between text-sm">
                                  <span>{s.name}</span>
                                  <span className="flex items-center gap-2">
                                    <span className="text-muted-foreground text-xs">
                                      <Calendar className="h-3 w-3 inline mr-0.5" />
                                      {Math.floor((Date.now() - new Date(s.updated_at).getTime()) / (1000 * 60 * 60 * 24))}d
                                    </span>
                                    <span className="font-medium">{formatCurrency(s.unit_price)}/{p.unit}</span>
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          <a href={`/order?product=${p.id}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                            <ShoppingCart className="h-3 w-3" /> Adicionar a um pedido
                          </a>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
