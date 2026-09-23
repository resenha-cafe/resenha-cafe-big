import { test, expect } from '@playwright/test';

test('exibir erro para DOI inválido', async ({ page }) => {
  page.on('pageerror', err => console.log('BROWSER PAGEERROR:', err.message));

  await page.goto('http://localhost:3000/pages/artigo.html?doi=abc');

  // Aguarda o contêiner de erro aparecer
  const errorRoot = page.locator('#error-root');
  await expect(errorRoot).toBeVisible({ timeout: 10000 });

  // Verifica a mensagem de erro
  await expect(errorRoot).toContainText('DOI');

  // Verifica que não há título de artigo renderizado
  const title = page.locator('.article-header__title');
  await expect(title).toHaveCount(0);
});
