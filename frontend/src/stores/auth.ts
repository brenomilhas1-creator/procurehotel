'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  // Tokens em MEMÓRIA APENAS — não persistem. O Supabase Auth guarda os tokens
  // em cookies HttpOnly+Secure configurados via supabase.ts.
  accessToken: string | null;
  refreshToken: string | null;
  // O user (id, email, role) é info não-sensível — pode persistir em localStorage
  // para que o layout saiba se mostrar o app ou redirecionar para /login.
  // Os tokens (access/refresh) são sempre em memória.
  user: User | null;
  setSession: (data: { accessToken: string; refreshToken: string; user?: User | null }) => void;
  setUser: (user: User) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setSession: ({ accessToken, refreshToken, user }) =>
        set({ accessToken, refreshToken, user: user ?? null }),
      setUser: (user) => set({ user }),
      clear: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    {
      name: 'cf.user',
      partialize: (s) => ({ user: s.user }), // SÓ o user (não tokens)
    }
  )
);
