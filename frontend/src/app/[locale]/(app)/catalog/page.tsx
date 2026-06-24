'use client';

import { useEffect, useState } from 'react';
import { Search, Tag, Truck, Calendar, ShoppingCart, ChevronDown, ChevronRight, Package, AlertCircle, Check, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getCatalog, type CatalogProduct } from '@/lib/supabase-data';
import { formatCurrency } from '@/lib/utils';

/**
 * Adiciona um produto ao preorder do sessionStorage.
 * O Pedido Rápido (v2) lê isto no mount e injeta os items.
 */
function addToPreorder(product: { id: string; master_name: string; unit_price?: number; unit?: string }) {
  try {
    const existing = JSON.parse(sessionStorage.getItem('cf.preorder') || '[]');
    // Verificar se já existe — se sim, incrementar qty
    const idx = existing.findIndex((i: any) => i.product_id === product.id);
    if (idx >= 0) {
      existing[idx].quantity = (existing[idx].quantity || 1) + 1;
    } else {
      existing.push({
        product_id: product.id,
        product_name: product.master_name,
        quantity: 1,
        unit_price: product.unit_price || 0,
      });
    }
    sessionStorage.setItem('cf.preorder', JSON.stringify(existing));
  } catch {
    sessionStorage.setItem('cf.preorder', JSON.stringify([{
      product_id: product.id,
      product_name: product.master_name,
      quantity: 1,
      unit_price: product.unit_price || 0,
    }]));
  }
}

export default function CatalogPage() {
  const [data, setData] = useState<CatalogProduct[]>([]);
  const [q, setQ] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      getCatalog({ q, limit: 200 }).then((d) => { setData(d); setLoading(false); });
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  /**
   * "Pedir" — adiciona 1 unidade do produto ao preorder e vai para o Pedido Rápido.
   * O user pode depois acrescentar mais ou confirmar.
   */
  function handlePedir(p: CatalogProduct) {
    setAdding(p.id);
    addToPreorder({
      id: p.id,
      master_name: p.master_name,
      unit_price: p.suppliers[0]?.unit_price,
      unit: p.unit,
    });
    // Pequeno delay para mostrar feedback visual antes de navegar
    setTimeout(() => {
      window.location.href = '/order?from_catalog=' + p.id;
    }, 250);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Catálogo Mestre</h1>
        <p className="text-sm text-muted-foreground">{data.length} produtos — pesquisa e clica "Pedir" para enviar ao Pedido Rápido</p>
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
                const isAdding = adding === p.id;
                const daysAgo = p.last_price_update
                  ? Math.floor((Date.now() - new Date(p.last_price_update).getTime()) / (1000 * 60 * 60 * 24))
                  : null;
                const priceStale = daysAgo !== null && daysAgo > 90;
                return (
                  <li key={p.id}>
                    <div className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-accent/50">
                      <button
                        onClick={() => setExpanded(isOpen ? null : p.id)}
                        className="flex-1 min-w-0 text-left"
                      >
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
                      </button>
                      <div className="flex items-center gap-2 shrink-0">
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
                        <Button
                          size="sm"
                          variant="default"
                          onClick={(e) => { e.stopPropagation(); handlePedir(p); }}
                          disabled={isAdding}
                          title="Enviar para o Pedido Rápido (qty=1)"
                          className="ml-1"
                        >
                          {isAdding ? (
                            <>
                              <Check className="h-4 w-4" />
                              <span>Adicionado</span>
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4" />
                              <span>Pedir</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
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
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handlePedir(p)}
                            disabled={isAdding}
                          >
                            {isAdding ? <><Check className="h-4 w-4" /> Adicionado</> : <><Plus className="h-4 w-4" /> Pedir este produto</>}
                          </Button>
                          <a href={`/order?product=${p.id}`} className="text-xs text-primary hover:underline flex items-center gap-1 self-center">
                            <ShoppingCart className="h-3 w-3" /> Adicionar a um pedido existente
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
