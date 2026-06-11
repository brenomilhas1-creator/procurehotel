import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config para testes E2E.
 *
 * Roda contra o ambiente de produção (Vercel).
 * Para rodar local, defina BASE_URL=http://localhost:3000
 */
const BASE_URL = process.env.BASE_URL || 'https://compra-facil-hoteis.vercel.app';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 30_000,
  expect: { timeout: 5_000 },

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 14'] },
    },
  ],

  // Não iniciar webServer (estamos a testar contra produção)
});
