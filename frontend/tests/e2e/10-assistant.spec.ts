import { test, expect } from '@playwright/test';
import { login } from './helpers';

/**
 * T10: Assistente IA
 * Garante que a página carrega, mostra botão de config, e tem UI de chat.
 */
test.describe('Assistente IA', () => {
  test('página /assistant carrega e mostra UI', async ({ page }) => {
    await login(page);
    await page.goto('/pt-PT/assistant');
    await expect(page.getByRole('heading', { name: /Assistente IA/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Escreve uma mensagem/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Enviar/i })).toBeVisible();
  });

  test('botão de Config mostra painel de configuração', async ({ page }) => {
    await login(page);
    await page.goto('/pt-PT/assistant');
    await page.getByRole('button', { name: /Config/i }).click();
    await expect(page.getByText('Provider').first()).toBeVisible();
    await expect(page.locator('select')).toContainText('MiniMax');
  });

  test('sugestões aparecem quando não há mensagens', async ({ page }) => {
    await login(page);
    await page.goto('/pt-PT/assistant');
    await expect(page.getByText(/Cria um fornecedor/i)).toBeVisible();
    await expect(page.getByText(/Lista os fornecedores/i)).toBeVisible();
  });
});
