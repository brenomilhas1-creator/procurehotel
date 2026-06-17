import { test, expect } from '@playwright/test';

test.describe('Pendentes de Cotação', () => {
  test('página carrega com lista vazia quando não há pendentes', async ({ page }) => {
    await page.goto('/pt-PT/login');
    await page.fill('input[type="email"]', 'admin@fourpoint.pt');
    await page.fill('input[type="password"]', '#Four1010');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/);
    await page.waitForTimeout(1000);

    await page.goto('/pt-PT/pending');
    await page.waitForTimeout(2500);

    // Título
    await expect(page.getByRole('heading', { name: /Pendentes de Cotação/i })).toBeVisible();
    // 3 KPIs (mesmo sem items, mostra 0)
    await expect(page.getByText(/Aguardam cotação/i).first()).toBeVisible();
    // Empty state OU lista
    const empty = page.getByText(/Nenhum item|Nenhum item neste estado|Nenhum produto/);
    const temEmpty = await empty.count() > 0;
    // Se não há empty state, deve haver pelo menos um card de fornecedor
    if (!temEmpty) {
      await expect(page.getByText(/Aviludo|Avoneto|Makro|Sumol/).first()).toBeVisible();
    }
  });

  test('filtros funcionam mesmo com lista vazia', async ({ page }) => {
    await page.goto('/pt-PT/login');
    await page.fill('input[type="email"]', 'admin@fourpoint.pt');
    await page.fill('input[type="password"]', '#Four1010');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/);
    await page.waitForTimeout(1000);

    await page.goto('/pt-PT/pending');
    await page.waitForTimeout(2000);

    // Filtro "Cotados" não deve dar erro
    await page.locator('button:has-text("Cotados")').first().click();
    await page.waitForTimeout(1000);
    // Volta para Aguarda cotação
    await page.locator('button:has-text("Aguarda")').first().click();
    await page.waitForTimeout(1000);
    // Página continua visível
    await expect(page.getByRole('heading', { name: /Pendentes de Cotação/i })).toBeVisible();
  });

  test('sidebar tem link "Pendentes"', async ({ page }) => {
    await page.goto('/pt-PT/login');
    await page.fill('input[type="email"]', 'admin@fourpoint.pt');
    await page.fill('input[type="password"]', '#Four1010');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/);
    await page.waitForTimeout(1000);

    // Link do sidebar (apenas o link, não o title da página)
    const link = page.locator('a[href*="/pending"]').filter({ hasText: 'Pendentes' });
    await expect(link.first()).toBeVisible();

    // Click navega
    await link.click();
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/pending/);
    await expect(page.getByRole('heading', { name: /Pendentes de Cotação/i })).toBeVisible();
  });
});
