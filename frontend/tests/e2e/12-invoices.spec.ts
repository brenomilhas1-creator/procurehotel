import { test, expect } from '@playwright/test';

test.describe('Faturas Recebidas', () => {
  test('página carrega com 5 faturas matched e 100% taxa', async ({ page }) => {
    await page.goto('/pt-PT/login');
    await page.fill('input[type="email"]', 'admin@fourpoint.pt');
    await page.fill('input[type="password"]', '#Four1010');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/);
    await page.waitForTimeout(1000);

    await page.goto('/pt-PT/invoices');
    await page.waitForTimeout(2500);

    // Título
    await expect(page.getByRole('heading', { name: /Faturas Recebidas/i })).toBeVisible();
    // KPIs
    await expect(page.getByText('Faturas').first()).toBeVisible();
    await expect(page.getByText('Valor total').first()).toBeVisible();
    // 5 matched
    await expect(page.getByText('5 matched')).toBeVisible();
    // 100% match
    await expect(page.getByText('100%').first()).toBeVisible();
    // Pelo menos uma fatura visível
    await expect(page.getByText(/Avoneto Hortefruti/).first()).toBeVisible();
  });

  test('API /api/invoices/summary responde JSON válido', async ({ request }) => {
    const res = await request.get('https://compra-facil-hoteis.vercel.app/api/invoices/summary');
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThanOrEqual(5);
    // Cada invoice tem match_pct = 100 (auto_matched)
    for (const inv of data) {
      expect(inv.total_lines).toBeGreaterThan(0);
      expect(inv.invoice_status).toBe('matched');
    }
  });

  test('sidebar tem link "Faturas"', async ({ page }) => {
    await page.goto('/pt-PT/login');
    await page.fill('input[type="email"]', 'admin@fourpoint.pt');
    await page.fill('input[type="password"]', '#Four1010');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/);
    await page.waitForTimeout(1000);

    const link = page.locator('a[href*="/invoices"]').filter({ hasText: 'Faturas' });
    await expect(link.first()).toBeVisible();

    await link.first().click();
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/invoices/);
    await expect(page.getByRole('heading', { name: /Faturas Recebidas/i })).toBeVisible();
  });
});
