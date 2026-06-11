import { test, expect } from '@playwright/test';
import { login } from './helpers';

/**
 * T2: Dashboard
 * - Após login, dashboard mostra KPIs
 * - Atalhos visíveis
 */
test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('dashboard mostra KPIs e atalhos', async ({ page }) => {
    // KPIs usam .first() porque 'Fornecedores' também aparece na sidebar
    await expect(page.getByText('Produtos').first()).toBeVisible();
    await expect(page.getByText('Fornecedores').first()).toBeVisible();
    await expect(page.getByText('Pedidos (30d)')).toBeVisible();
    await expect(page.getByText('Saúde da base')).toBeVisible();

    // Atalhos
    await expect(page.getByRole('link', { name: /Pedido Rápido/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Favoritos/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Preços/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Exceções/i }).first()).toBeVisible();
  });

  test('sidebar mostra todos os módulos', async ({ page }) => {
    const links = ['Dashboard', 'Pedido Rápido', 'Favoritos', 'Catálogo', 'Pedidos', 'Importações', 'Preços', 'Exceções', 'Saúde', 'Fornecedores', 'Economia'];
    for (const l of links) {
      await expect(page.getByRole('link', { name: l }).first()).toBeVisible();
    }
  });
});
