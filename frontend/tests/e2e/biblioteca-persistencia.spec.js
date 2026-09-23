import { test, expect } from '@playwright/test';

test('salvar artigo e persistir após reload', async ({ page }) => {
  // 1. Abre a página da revista
  await page.goto('http://localhost:3000/pages/revista.html');
  await page.waitForTimeout(2000);

  // 2. Faz uma busca
  await page.fill('input[type="search"]', 'saúde');
  await page.click('button[type="submit"]');

  // 3. Aguarda cards aparecerem
  await expect(page.locator('.article-card').first()).toBeVisible({ timeout: 15000 });

  // 4. Clica no primeiro botão de salvar
  const primeiroBotao = page.locator('.save-article-button').first();
  await expect(primeiroBotao).toBeVisible({ timeout: 10000 });
  await primeiroBotao.click();

  // 5. Verifica que virou "Salvo ✓"
  await expect(primeiroBotao).toHaveText('Salvo ✓');

  // 6. Recarrega a página
  await page.reload();
  await page.waitForTimeout(2000);

  // 7. Repete a busca
  await page.fill('input[type="search"]', 'saúde');
  await page.click('button[type="submit"]');
  await expect(page.locator('.article-card').first()).toBeVisible({ timeout: 15000 });

  // 8. Verifica que pelo menos um botão está "Salvo ✓"
  const salvoAposReload = page.locator('.save-article-button', { hasText: 'Salvo ✓' });
  await expect(salvoAposReload.first()).toBeVisible({ timeout: 10000 });
});
