'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AIProvider = 'minimax' | 'openai' | 'ollama' | 'custom';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
  setProvider: (p: AIProvider) => void;
  setApiKey: (k: string) => void;
  setBaseUrl: (u: string) => void;
  setModel: (m: string) => void;
  reset: () => void;
}

const defaults = {
  minimax: { baseUrl: 'https://api.minimaxi.chat/v1', model: 'MiniMax-Text-01' },
  openai: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  ollama: { baseUrl: 'http://localhost:11434/v1', model: 'llama3.2' },
  custom: { baseUrl: '', model: '' },
};

export const useAIConfig = create<AIConfig>()(
  persist(
    (set, get) => ({
      provider: 'minimax',
      apiKey: '',
      baseUrl: defaults.minimax.baseUrl,
      model: defaults.minimax.model,
      setProvider: (provider) => {
        set({
          provider,
          baseUrl: defaults[provider].baseUrl,
          model: defaults[provider].model,
        });
      },
      setApiKey: (apiKey) => set({ apiKey }),
      setBaseUrl: (baseUrl) => set({ baseUrl }),
      setModel: (model) => set({ model }),
      reset: () => set({ provider: 'minimax', apiKey: '', baseUrl: defaults.minimax.baseUrl, model: defaults.minimax.model }),
    }),
    { name: 'cf-ai-config' }
  )
);
