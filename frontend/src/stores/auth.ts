'use client';

import { create } from 'zustand';
import type { User } from '@/types';

interface AuthState {
  // Tokens em MEMÓRIA APENAS — não persistem. O Supabase Auth guarda os tokens
  // em cookies HttpOnly + Secure configurados via supabase.ts.
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  setSession: (data: { accessToken: string; refreshToken: string; user?: User | null }) => void;
  setUser: (user: User) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  setSession: ({ accessToken, refreshToken, user }) =>
    set({ accessToken, refreshToken, user: user ?? null }),
  setUser: (user) => set({ user }),
  clear: () => set({ user: null, accessToken: null, refreshToken: null }),
}));
