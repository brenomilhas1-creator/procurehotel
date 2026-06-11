import { test, expect } from '@playwright/test';
import { login } from './helpers';

/**
 * T8: Painel Operacional
 */
test.describe('Painel Operacional', () => {
  test('página /operational mostra 7 secções', async ({ page }) => {
    await login(page);
    await page.goto('/pt-PT/operational');
    await expect(page.getByRole('heading', { name: /Painel Operacional/i })).toBeVisible();

    // Espera que os dados carreguem
    await expect(page.getByText(/Economia/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Tempo Poupado/i)).toBeVisible();
    await expect(page.getByText(/Qualidade da Base/i)).toBeVisible();
    await expect(page.getByText(/Precisão da IA/i)).toBeVisible();
    await expect(page.getByText(/Pendentes/i)).toBeVisible();
    await expect(page.getByText(/Estabilidade/i)).toBeVisible();
  });

  test('seletor de período (1d / 7d / 30d) funciona', async ({ page }) => {
    await login(page);
    await page.goto('/pt-PT/operational');
    // Default = 7d
    await expect(page.getByRole('button', { name: '7d' })).toBeVisible();
    await page.getByRole('button', { name: '30d' }).click();
    await expect(page.getByText(/Últimos 30 dias/i)).toBeVisible();
  });
});
