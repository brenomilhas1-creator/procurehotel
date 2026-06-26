'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRealtimeRefresh } from '@/hooks/useRealtimeRefresh';
import {
  Search, Tag, Truck, Calendar, ShoppingCart, ChevronDown, ChevronRight,
  Package, AlertCircle, Check, Plus, Filter, X, SlidersHorizontal, Star, ShoppingBag,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getCatalog, type CatalogProduct } from '@/lib/supabase-data';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { useCart } from '@/stores/cart';
import Link from 'next/link';

type StockStatus = 'any' | 'with_price' | 'no_price' | 'fresh' | 'stale';
type Popularity = 'any' | 'ordered' | 'never_ordered';

interface FilterState {
  categories: Set<string>;
  suppliers: Set<string>;
  stockStatus: StockStatus;
  popularity: Popularity;
}

const EMPTY_FILTERS: FilterState = {
  categories: new Set(),
  suppliers: new Set(),
  stockStatus: 'any',
  popularity: 'any',
};

export default function CatalogPage() {
  const [data, setData] = useState<CatalogProduct[]>([]);
  const [q, setQ] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    getCatalog({ q, limit: 500 }).then((d) => { setData(d); setLoading(false); });
  }, [q]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(reload, 200);
    return () => clearTimeout(t);
  }, [q, reload]);

  // Auto-refresh quando há mudanças em produtos/preços (ex: upload de fatura)
  useRealtimeRefresh({
    tables: ['products', 'supplier_prices', 'supplier_price_history'],
    onChange: reload,
    debounceMs: 3000,
  });

  /**
   * "Adicionar ao carrinho" — não navega. O user pode adicionar vários items
   * e depois ir ao Pedido Rápido quando quiser.
   * Items ficam em localStorage (Zustand persist) até finalizar.
   */
  const addToCart = useCart((s) => s.addItem);
  const cartItems = useCart((s) => s.items);
  const totalCartItems = useCart((s) => s.totalItems());

  function handlePedir(p: CatalogProduct) {
    setAdding(p.id);
    addToCart({
      product_id: p.id,
      product_name: p.master_name,
      unit_price: p.suppliers[0]?.unit_price || 0,
      quantity: 1,
    });
    toast.success('Adicionado ao carrinho', {
      description: `${p.master_name} — ${totalCartItems + 1} item(s) no carrinho`,
      duration: 2000,
    });
    setAdding(null);
  }

  // Extrair listas únicas para os filtros (a partir dos dados carregados)
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    data.forEach((p) => p.category && set.add(p.category));
    return Array.from(set).sort();
  }, [data]);

  const availableSuppliers = useMemo(() => {
    const map = new Map<string, string>(); // id → name
    data.forEach((p) => p.suppliers.forEach((s) => map.set(s.id, s.name)));
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  // Aplicar filtros
  const filtered = useMemo(() => {
    return data.filter((p) => {
      // Categoria (OR dentro do grupo)
      if (filters.categories.size > 0 && !filters.categories.has(p.category || '')) {
        return false;
      }
      // Fornecedor (OR dentro do grupo — produto tem pelo menos 1 dos fornecedores selecionados)
      if (filters.suppliers.size > 0) {
        const hasMatch = p.suppliers.some((s) => filters.suppliers.has(s.id));
        if (!hasMatch) return false;
      }
      // Estado do preço
      if (filters.stockStatus !== 'any') {
        const hasPrice = p.suppliers.length > 0;
        const daysAgo = p.last_price_update
          ? Math.floor((Date.now() - new Date(p.last_price_update).getTime()) / (1000 * 60 * 60 * 24))
          : null;
        if (filters.stockStatus === 'with_price' && !hasPrice) return false;
        if (filters.stockStatus === 'no_price' && hasPrice) return false;
        if (filters.stockStatus === 'fresh' && (daysAgo === null || daysAgo > 90)) return false;
        if (filters.stockStatus === 'stale' && (daysAgo === null || daysAgo <= 90)) return false;
      }
      // Popularidade
      if (filters.popularity === 'ordered' && p.total_orders === 0) return false;
      if (filters.popularity === 'never_ordered' && p.total_orders > 0) return false;
      return true;
    });
  }, [data, filters]);

  // Helpers
  const toggleCategory = (c: string) => {
    setFilters((f) => {
      const next = new Set(f.categories);
      if (next.has(c)) next.delete(c); else next.add(c);
      return { ...f, categories: next };
    });
  };
  const toggleSupplier = (id: string) => {
    setFilters((f) => {
      const next = new Set(f.suppliers);
      if (next.has(id)) next.delete(id); else next.add(id);
      return { ...f, suppliers: next };
    });
  };
  const activeFilterCount =
    filters.categories.size +
    filters.suppliers.size +
    (filters.stockStatus !== 'any' ? 1 : 0) +
    (filters.popularity !== 'any' ? 1 : 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Catálogo Mestre</h1>
        <p className="text-sm text-muted-foreground">
          {filtered.length} de {data.length} produtos — pesquisa, filtra e clica "Pedir" para enviar ao Pedido Rápido
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* SIDEBAR DE FILTROS */}
        <aside className={`${showFilters ? 'block' : 'hidden lg:block'} space-y-4`}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" /> Filtros
                  {activeFilterCount > 0 && (
                    <Badge variant="default" className="ml-1">{activeFilterCount}</Badge>
                  )}
                </CardTitle>
                {activeFilterCount > 0 && (
                  <Button size="sm" variant="ghost" onClick={() => setFilters(EMPTY_FILTERS)} className="h-7 px-2 text-xs">
                    <X className="h-3 w-3" /> Limpar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* CATEGORIAS */}
              {availableCategories.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-2">Categoria</div>
                  <div className="flex flex-wrap gap-1.5">
                    {availableCategories.map((c) => {
                      const active = filters.categories.has(c);
                      return (
                        <button
                          key={c}
                          onClick={() => toggleCategory(c)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                            active
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background hover:bg-accent border-border text-foreground'
                          }`}
                        >
                          {active && <Check className="h-3 w-3" />}
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* FORNECEDORES */}
              {availableSuppliers.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-2">Fornecedor</div>
                  <div className="flex flex-wrap gap-1.5">
                    {availableSuppliers.map((s) => {
                      const active = filters.suppliers.has(s.id);
                      return (
                        <button
                          key={s.id}
                          onClick={() => toggleSupplier(s.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                            active
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-background hover:bg-accent border-border text-foreground'
                          }`}
                        >
                          {active && <Check className="h-3 w-3" />}
                          <Truck className="h-3 w-3" />
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ESTADO DO PREÇO */}
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">Preço</div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { v: 'any', l: 'Todos' },
                    { v: 'with_price', l: 'Com preço' },
                    { v: 'no_price', l: 'Sem preço' },
                    { v: 'fresh', l: '< 90 dias' },
                    { v: 'stale', l: '> 90 dias' },
                  ].map((opt) => {
                    const active = filters.stockStatus === opt.v;
                    return (
                      <button
                        key={opt.v}
                        onClick={() => setFilters((f) => ({ ...f, stockStatus: opt.v as StockStatus }))}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                          active
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-background hover:bg-accent border-border text-foreground'
                        }`}
                      >
                        {opt.l}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* POPULARIDADE */}
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">Já pedi antes?</div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { v: 'any', l: 'Todos' },
                    { v: 'ordered', l: 'Sim' },
                    { v: 'never_ordered', l: 'Nunca' },
                  ].map((opt) => {
                    const active = filters.popularity === opt.v;
                    return (
                      <button
                        key={opt.v}
                        onClick={() => setFilters((f) => ({ ...f, popularity: opt.v as Popularity }))}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                          active
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-background hover:bg-accent border-border text-foreground'
                        }`}
                      >
                        {opt.l}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* LISTA DE PRODUTOS */}
        <div className="space-y-4">
          {/* Pesquisa + toggle de filtros (mobile) */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar produto, marca ou alias..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden"
            >
              <Filter className="h-4 w-4" />
              {activeFilterCount > 0 && <span className="ml-1">{activeFilterCount}</span>}
            </Button>
          </div>

          {/* TAGS DE FILTROS ATIVOS */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-muted-foreground">Filtros ativos:</span>
              {Array.from(filters.categories).map((c) => (
                <Badge key={c} variant="secondary" className="gap-1">
                  {c}
                  <button onClick={() => toggleCategory(c)} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {Array.from(filters.suppliers).map((id) => {
                const s = availableSuppliers.find((x) => x.id === id);
                return (
                  <Badge key={id} variant="secondary" className="gap-1 bg-emerald-100 text-emerald-800">
                    <Truck className="h-3 w-3" /> {s?.name}
                    <button onClick={() => toggleSupplier(id)} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
              {filters.stockStatus !== 'any' && (
                <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800">
                  Preço: {filters.stockStatus === 'with_price' ? 'com preço' : filters.stockStatus === 'no_price' ? 'sem preço' : filters.stockStatus === 'fresh' ? '< 90d' : '> 90d'}
                  <button onClick={() => setFilters((f) => ({ ...f, stockStatus: 'any' }))} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.popularity !== 'any' && (
                <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-800">
                  {filters.popularity === 'ordered' ? 'Já pedi' : 'Nunca pedi'}
                  <button onClick={() => setFilters((f) => ({ ...f, popularity: 'any' }))} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}

          {/* LISTA */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <p className="text-sm text-muted-foreground text-center py-8">A carregar...</p>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {data.length === 0
                      ? <>Sem produtos. <a href="/imports" className="underline">Importar uma lista →</a></>
                      : <>Nenhum produto corresponde aos filtros. <button onClick={() => setFilters(EMPTY_FILTERS)} className="underline">Limpar filtros</button></>
                    }
                  </p>
                </div>
              ) : (
                <ul className="divide-y">
                  {filtered.map((p) => {
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
                              {p.total_orders > 0 && <span className="flex items-center gap-1 text-emerald-600"><Star className="h-3 w-3" /> {p.total_orders} ordens</span>}
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
                            {p.suppliers.length > 0 && (
                              <div>
                                <div className="font-medium text-xs text-muted-foreground mb-1">Fornecedores e preços:</div>
                                <ul className="space-y-1">
                                  {p.suppliers.sort((a, b) => a.unit_price - b.unit_price).map((s) => (
                                    <li key={s.id} className="flex justify-between text-sm">
                                      <span className="flex items-center gap-1.5">
                                        <Truck className="h-3 w-3" /> {s.name}
                                        {filters.suppliers.has(s.id) && <Badge variant="default" className="text-[10px] py-0">filtro ativo</Badge>}
                                      </span>
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
      </div>
    </div>
  );
}
