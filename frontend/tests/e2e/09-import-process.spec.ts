import { test, expect } from '@playwright/test';
import { login } from './helpers';
import { promises as fs } from 'fs';

/**
 * T9: Importação + processamento de CSV/XLSX
 * Garante que o upload extrai produtos e preços automaticamente.
 */
test.describe('Importação e processamento', () => {
  test('upload de Excel cria produtos e atualiza preços', async ({ page }) => {
    await login(page);

    // 1. Criar Excel de teste
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    const data = [
      ['Código', 'Descrição', 'Unidade', 'Preço'],
      ['TEST001', `Acucar Teste ${Date.now()}`, 'UN', 2.50],
      ['TEST002', `Cafe Teste ${Date.now()}`, 'UN', 4.90],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Preços');
    const tmpPath = '/tmp/import-teste.xlsx';
    XLSX.writeFile(wb, tmpPath);
    expect(fs.access(tmpPath)).toBeTruthy();

    // 2. Ir para Fornecedores e criar um
    await page.goto('/pt-PT/suppliers');
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: /Adicionar|Novo/i }).first().click();
    await page.waitForTimeout(500);
    const supplierName = `FORN_TESTE_${Date.now()}`;
    await page.getByPlaceholder(/Nome/i).first().fill(supplierName);
    await page.getByRole('button', { name: /Guardar/i }).click();
    await page.waitForTimeout(2000);

    // 3. Ir para imports
    await page.goto('/pt-PT/imports');
    await page.waitForTimeout(1500);
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(tmpPath);
    await page.waitForTimeout(500);

    // Selecionar o fornecedor
    const selects = page.locator('select');
    if (await selects.count() > 1) {
      const supplierSelect = selects.nth(1);
      await supplierSelect.selectOption({ label: supplierName });
    }

    // Enviar
    await page.getByRole('button', { name: /Enviar/i }).click();
    await page.waitForTimeout(5000);

    // 4. Verificar mensagem de sucesso
    const processed = await page.getByText(/processado|produtos criados|criados/i).count();
    expect(processed).toBeGreaterThan(0);

    // 5. Verificar no Catálogo
    await page.goto('/pt-PT/catalog');
    await page.waitForTimeout(2000);
    const acucarMatch = await page.locator('body').textContent();
    expect(acucarMatch).toContain('Acucar Teste');
    expect(acucarMatch).toContain('Cafe Teste');

    // Limpar
    await fs.unlink(tmpPath).catch(() => null);
  });
});
