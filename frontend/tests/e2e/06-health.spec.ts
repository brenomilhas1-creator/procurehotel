import { test, expect } from '@playwright/test';
import { login } from './helpers';

/**
 * T6: Saúde e Exceções
 * - Saúde mostra score
 * - Exceções mostra tabs
 */
test.describe('Saúde e Exceções', () => {
  test('saúde carrega e mostra score', async ({ page }) => {
    await login(page);
    await page.goto('/pt-PT/health');
    await expect(page.getByRole('heading', { name: /Saúde da Base/i })).toBeVisible();
    await expect(page.getByText(/Score geral/i)).toBeVisible();
  });

  test('exceções mostra 5 tabs', async ({ page }) => {
    await login(page);
    await page.goto('/pt-PT/exceptions');
    await expect(page.getByRole('heading', { name: /Centro de Exceções/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Preços antigos/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Sem preço/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Sem categoria/i })).toBeVisible();
  });
});
