import { test, expect } from '@playwright/test';
import { login } from './helpers';

/**
 * T7: Status (saúde em tempo real)
 */
test.describe('Status em tempo real', () => {
  test('página /status verifica todos os serviços', async ({ page }) => {
    await login(page);
    await page.goto('/pt-PT/status');
    await expect(page.getByRole('heading', { name: /Estado do Sistema/i })).toBeVisible();
    // Espera que pelo menos os checks apareçam
    await expect(page.getByText('Frontend (Vercel)')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Supabase Auth')).toBeVisible();
    await expect(page.getByText('Supabase Database')).toBeVisible();
  });
});
