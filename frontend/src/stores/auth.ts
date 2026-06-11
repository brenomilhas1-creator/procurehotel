'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  // O access_token do Supabase (será enviado ao FastAPI)
  accessToken: string | null;
  refreshToken: string | null;
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
    { name: 'procurehotel.auth' }
  )
);
