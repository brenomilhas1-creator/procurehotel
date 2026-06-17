import { Page, expect } from '@playwright/test';

export const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'admin@fourpoint.pt',
  password: process.env.TEST_USER_PASSWORD || '#Four1010',
};

export const BASE_URL = process.env.BASE_URL || 'https://compra-facil-hoteis.vercel.app';

/** Faz login via UI e espera redirect para /dashboard. */
export async function login(page: Page) {
  await page.goto('/pt-PT/login');
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15_000 });
}

/** Verifica que a página carregou e tem o email do user logado. */
export async function expectLoggedIn(page: Page) {
  await expect(page.getByText(TEST_USER.email)).toBeVisible({ timeout: 5_000 });
}
