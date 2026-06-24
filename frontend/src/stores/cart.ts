'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  added_at: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'added_at'>) => void;
  addMany: (items: Omit<CartItem, 'added_at'>[]) => void;
  updateQuantity: (product_id: string, quantity: number) => void;
  removeItem: (product_id: string) => void;
  clear: () => void;
  totalItems: () => number;
  totalValue: () => number;
}

/**
 * Cart store — persistente em localStorage.
 * Items sobrevivem a refresh, fechar tab, navegação entre páginas.
 * Só são apagados quando o user finalizar o pedido (clear()) ou manualmente.
 *
 * Porquê localStorage e não sessionStorage:
 * - User pediu: "caso eu saia da aba pedido rapido os itens não somem"
 * - localStorage persiste entre tabs/sessões
 *
 * Porquê Zustand persist e não DB:
 * - Carrinho não-confirmado é efémero (ainda não é um pedido)
 * - Evita poluir DB com abandoned carts
 * - Sync instantâneo (sem roundtrip)
 */
export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const existing = get().items.find((i) => i.product_id === item.product_id);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.product_id === item.product_id
                ? { ...i, quantity: i.quantity + item.quantity, added_at: Date.now() }
                : i
            ),
          });
        } else {
          set({ items: [...get().items, { ...item, added_at: Date.now() }] });
        }
      },
      addMany: (newItems) => {
        const merged = [...get().items];
        for (const item of newItems) {
          const idx = merged.findIndex((i) => i.product_id === item.product_id);
          if (idx >= 0) {
            merged[idx] = {
              ...merged[idx],
              quantity: merged[idx].quantity + item.quantity,
              added_at: Date.now(),
            };
          } else {
            merged.push({ ...item, added_at: Date.now() });
          }
        }
        set({ items: merged });
      },
      updateQuantity: (product_id, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => i.product_id !== product_id) });
        } else {
          set({
            items: get().items.map((i) =>
              i.product_id === product_id ? { ...i, quantity } : i
            ),
          });
        }
      },
      removeItem: (product_id) => {
        set({ items: get().items.filter((i) => i.product_id !== product_id) });
      },
      clear: () => set({ items: [] }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalValue: () => get().items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0),
    }),
    {
      name: 'compra-facil-cart',
      version: 1,
    }
  )
);
