import { test, expect } from '@playwright/test';
import { TEST_USER } from './helpers';

/**
 * T1: Login + persistência
 * - Verifica que login funciona
 * - Verifica que sessão persiste após F5
 */
test.describe('Autenticação', () => {
  test('login com credenciais válidas redireciona para /dashboard', async ({ page }) => {
    await page.goto('/pt-PT/login');
    await expect(page).toHaveTitle(/Compra Facil/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 15_000 });
    await expect(page.getByText(TEST_USER.email)).toBeVisible();
  });

  test('sessão persiste após F5', async ({ page }) => {
    // Login
    await page.goto('/pt-PT/login');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Recarregar
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByText(TEST_USER.email)).toBeVisible();
  });

  test('logout limpa a sessão', async ({ page }) => {
    await page.goto('/pt-PT/login');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Logout
    await page.click('button:has-text("Sair")');
    await page.waitForURL('**/login', { timeout: 10_000 });
  });
});
