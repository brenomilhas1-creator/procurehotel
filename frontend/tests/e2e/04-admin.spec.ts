import { test, expect } from '@playwright/test';
import { login } from './helpers';

/**
 * T4: Admin
 * - Tabs Utilizadores / Novo Login / Alterar Senha
 * - Mostra lista de utilizadores
 * - Mostra formulário de novo login
 */
test.describe('Admin', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/pt-PT/admin');
  });

  test('mostra 3 tabs', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Painel Administrativo/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Utilizadores/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Novo Login/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Alterar Senha/i }).first()).toBeVisible();
  });

  test('tab Utilizadores mostra a lista', async ({ page }) => {
    // Tab Utilizadores é default
    await expect(page.getByText('admin@fourpoint.pt')).toBeVisible();
  });

  test('tab Novo Login mostra formulário', async ({ page }) => {
    await page.getByRole('button', { name: /Novo Login/i }).first().click();
    await expect(page.getByText('Criar novo login')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('tab Alterar Senha mostra formulário', async ({ page }) => {
    await page.getByRole('button', { name: /Alterar Senha/i }).first().click();
    await expect(page.getByText('Alterar a minha password')).toBeVisible();
  });
});
