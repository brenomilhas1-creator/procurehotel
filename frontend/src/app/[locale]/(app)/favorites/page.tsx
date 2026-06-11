'use client';

import { useEffect, useState } from 'react';
import { Star, Plus, Trash2, Play, ShoppingCart, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { listFavorites, createFavorite, deleteFavorite, useFavorite, getProductNamesForAutocomplete, getFrequentItems, type Favorite, type FrequentItem } from '@/lib/supabase-data';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function FavoritesPage() {
  const router = useRouter();
  const [favs, setFavs] = useState<Favorite[]>([]);
  const [frequent, setFrequent] = useState<FrequentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newItems, setNewItems] = useState<Favorite['items']>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [suggestQ, setSuggestQ] = useState('');
  const [suggestList, setSuggestList] = useState<{ id: string; name: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    const [f, fr, p] = await Promise.all([listFavorites(), getFrequentItems(10), getProductNamesForAutocomplete()]);
    setFavs(f);
    setFrequent(fr);
    setProducts(p);
    setLoading(false);
  }
  useEffect(() => { refresh().catch(() => null); }, []);

  useEffect(() => {
    if (!suggestQ) { setSuggestList([]); return; }
    const q = suggestQ.toLowerCase();
    setSuggestList(
      products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8)
    );
  }, [suggestQ, products]);

  function addItem(name: string, id: string) {
    if (newItems.find((i) => i.product_id === id)) {
      setMsg('Produto já adicionado');
      return;
    }
    setNewItems([...newItems, { product_id: id, product_name: name, quantity: 1 }]);
    setSuggestQ('');
    setSuggestList([]);
    setMsg(null);
  }

  function removeItem(id: string) {
    setNewItems(newItems.filter((i) => i.product_id !== id));
  }

  function setItemQty(id: string, qty: number) {
    setNewItems(newItems.map((i) => i.product_id === id ? { ...i, quantity: Math.max(1, qty) } : i));
  }

  async function save() {
    if (!newName.trim()) { setMsg('Dá um nome ao favorito'); return; }
    if (newItems.length === 0) { setMsg('Adiciona pelo menos 1 item'); return; }
    setBusy(true);
    const r = await createFavorite(newName, newDesc, newItems);
    setBusy(false);
    if (r.ok) {
      setNewName(''); setNewDesc(''); setNewItems([]); setCreating(false);
      refresh();
    } else {
      setMsg(r.error || 'Erro');
    }
  }

  async function applyFavorite(f: Favorite) {
    setBusy(true);
    await useFavorite(f.id);
    // Redirecionar para /order com os items pré-preenchidos via localStorage
    localStorage.setItem('procurehotel.preorder', JSON.stringify(f.items));
    router.push('/order?from_fav=' + f.id);
  }

  async function del(id: string) {
    if (!confirm('Apagar este favorito?')) return;
    await deleteFavorite(id);
    refresh();
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pedidos Rápidos</h1>
          <p className="text-sm text-muted-foreground">Os teus conjuntos de produtos favoritos — 1 clique para iniciar</p>
        </div>
        <Button onClick={() => { setCreating(!creating); setNewItems([]); setNewName(''); setNewDesc(''); }}>
          <Plus className="h-4 w-4" /> Novo favorito
        </Button>
      </div>

      {/* Form para criar */}
      {creating && (
        <Card>
          <CardHeader>
            <CardTitle>Criar favorito</CardTitle>
            <CardDescription>Define um nome e os produtos que costumas pedir em conjunto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input placeholder="Nome (ex: Pequeno Almoço, Bar, Limpeza)" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Input placeholder="Descrição (opcional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
            </div>
            <div className="relative">
              <Input
                placeholder="Adicionar produto..."
                value={suggestQ}
                onChange={(e) => setSuggestQ(e.target.value)}
              />
              {suggestList.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full bg-popover border rounded-md shadow-md max-h-60 overflow-y-auto">
                  {suggestList.map((p) => (
                    <li key={p.id}>
                      <button
                        onClick={() => addItem(p.name, p.id)}
                        className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                      >
                        {p.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {newItems.length > 0 && (
              <ul className="divide-y border rounded-md">
                {newItems.map((i) => (
                  <li key={i.product_id} className="px-3 py-2 flex items-center gap-3">
                    <span className="flex-1 text-sm">{i.product_name}</span>
                    <Input
                      type="number"
                      min="1"
                      value={i.quantity}
                      onChange={(e) => setItemQty(i.product_id, parseInt(e.target.value) || 1)}
                      className="w-20"
                    />
                    <button onClick={() => removeItem(i.product_id)} className="text-red-500"><X className="h-4 w-4" /></button>
                  </li>
                ))}
              </ul>
            )}
            {msg && <p className="text-sm text-red-500">{msg}</p>}
            <div className="flex gap-2">
              <Button onClick={save} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
                Guardar
              </Button>
              <Button variant="outline" onClick={() => setCreating(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de favoritos */}
      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">A carregar...</p>
      ) : favs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Star className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium">Sem favoritos ainda</p>
            <p className="text-xs text-muted-foreground mb-4">Cria um para reutilizar em 1 clique</p>
            <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Criar primeiro favorito</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favs.map((f) => (
            <Card key={f.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  {f.name}
                </CardTitle>
                {f.description && <CardDescription>{f.description}</CardDescription>}
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground mb-2">{f.items.length} produto{f.items.length !== 1 ? 's' : ''} · usado {f.use_count}x</div>
                <ul className="text-sm space-y-1 mb-3">
                  {f.items.slice(0, 4).map((i) => (
                    <li key={i.product_id} className="flex justify-between">
                      <span className="truncate">{i.product_name}</span>
                      <span className="text-muted-foreground">×{i.quantity}</span>
                    </li>
                  ))}
                  {f.items.length > 4 && <li className="text-xs text-muted-foreground">+{f.items.length - 4} mais</li>}
                </ul>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => applyFavorite(f)} disabled={busy} className="flex-1">
                    <Play className="h-4 w-4" /> Usar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => del(f.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Items frequentes (sugestão para criar favorito) */}
      {frequent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Items mais comprados</CardTitle>
            <CardDescription>Para te inspirar a criar favoritos</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {frequent.map((f) => (
                <li key={f.product_id} className="px-4 py-2.5 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{f.product_name} {f.brand && <span className="text-xs text-muted-foreground">({f.brand})</span>}</div>
                    <div className="text-xs text-muted-foreground">{f.times_ordered}x encomendado · {f.preferred_supplier_name || 'sem fornecedor'} · {formatCurrency(f.avg_unit_price)}/{f.unit}</div>
                  </div>
                  <Badge variant="secondary">×{f.times_ordered}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
