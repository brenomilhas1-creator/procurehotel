'use client';

import { create } from 'zustand';
import type { Company } from '@/lib/supabase-data';

interface CompanyState {
  company: Company | null;
  loading: boolean;
  setCompany: (c: Company | null) => void;
  setLoading: (l: boolean) => void;
}

export const useCompanyStore = create<CompanyState>()((set) => ({
  company: null,
  loading: true,
  setCompany: (c) => {
    set({ company: c, loading: false });
    if (c && typeof document !== 'undefined') {
      // Apply branding dinâmico
      const root = document.documentElement;
      root.style.setProperty('--brand-primary', c.primary_color || '#10b981');
      root.style.setProperty('--brand-accent', c.accent_color || '#3b82f6');
      // Favicon dinâmico
      if (c.favicon_url) {
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = c.favicon_url;
      }
      // Title
      if (c.name) {
        document.title = `${c.name} — Compras inteligentes`;
      }
    }
  },
  setLoading: (l) => set({ loading: l }),
}));
