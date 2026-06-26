'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  added_at: number;
}

interface CartState {
  items: CartItem[];
  last_cleared_at: number | null;
  addItem: (item: Omit<CartItem, 'added_at'>) => void;
  addMany: (items: Omit<CartItem, 'added_at'>[]) => void;
  updateQuantity: (product_id: string, quantity: number) => void;
  removeItem: (product_id: string) => void;
  clear: () => void;
  totalItems: () => number;
  totalValue: () => number;
}

const STORAGE_KEY = 'compra-facil-cart';
const BACKUP_KEY = 'compra-facil-cart-backup';

/**
 * Persistência dupla:
 * 1. Zustand persist (localStorage 'compra-facil-cart') — fonte primária
 * 2. Backup raw em 'compra-facil-cart-backup' — atualizado em cada mudança
 *
 * Se o Zustand tiver problemas (hydration, race condition), o backup garante recovery.
 */
function customStorage() {
  return createJSONStorage(() => {
    if (typeof window === 'undefined') {
      // SSR: usar storage mock para evitar erros
      return {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      };
    }
    const localStorage = window.localStorage;
    return {
      getItem: (key: string) => {
        try {
          return localStorage.getItem(key);
        } catch {
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
          // Backup raw (apenas items, não metadata)
          if (key === STORAGE_KEY) {
            try {
              const parsed = JSON.parse(value);
              if (parsed.state?.items) {
                localStorage.setItem(BACKUP_KEY, JSON.stringify({
                  items: parsed.state.items,
                  timestamp: Date.now(),
                }));
                if (typeof window !== 'undefined' && (window as any).__CART_DEBUG__) {
                  console.log('[CART] Saved', parsed.state.items.length, 'items to localStorage');
                }
              }
            } catch {}
          }
        } catch (e) {
          if (typeof window !== 'undefined') {
            console.warn('[CART] Failed to save:', e);
          }
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
          if (key === STORAGE_KEY) {
            localStorage.removeItem(BACKUP_KEY);
          }
        } catch {}
      },
    };
  });
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      last_cleared_at: null,
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
      clear: () => set({ items: [], last_cleared_at: Date.now() }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalValue: () => get().items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0),
    }),
    {
      name: STORAGE_KEY,
      version: 2,
      storage: customStorage(),
      partialize: (state) => ({ items: state.items, last_cleared_at: state.last_cleared_at }),
    }
  )
);

/**
 * Hook de recuperação: se o cart aparece vazio mas há backup,
 * significa que algo correu mal (hydration, race condition).
 * Devolve um botão "Recuperar items anteriores".
 */
export function useCartRecovery() {
  const items = useCart((s) => s.items);
  const addMany = useCart((s) => s.addMany);

  function recover() {
    if (typeof window === 'undefined') return false;
    try {
      const backup = window.localStorage.getItem(BACKUP_KEY);
      if (!backup) return false;
      const parsed = JSON.parse(backup);
      if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
        addMany(parsed.items);
        return true;
      }
    } catch {}
    return false;
  }

  function checkRecovery() {
    if (typeof window === 'undefined') return { available: false, count: 0 };
    try {
      const backup = window.localStorage.getItem(BACKUP_KEY);
      if (!backup) return { available: false, count: 0 };
      const parsed = JSON.parse(backup);
      if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
        return { available: true, count: parsed.items.length, timestamp: parsed.timestamp };
      }
    } catch {}
    return { available: false, count: 0 };
  }

  return { recover, checkRecovery, items };
}
