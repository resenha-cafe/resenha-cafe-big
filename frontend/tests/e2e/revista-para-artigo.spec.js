import { test, expect } from '@playwright/test';

test('navegar da revista para o artigo', async ({ page }) => {
  page.on('pageerror', err => console.log('BROWSER PAGEERROR:', err.message));

  // 1. Acessa a revista
  await page.goto('http://localhost:3000/pages/revista.html');
  await page.waitForTimeout(2000);

  // 2. Faz uma busca que retorne artigos com DOI
  await page.fill('input[type="search"]', 'saúde');
  await page.click('button[type="submit"]');

  // 3. Aguarda cards aparecerem
  await expect(page.locator('.article-card').first()).toBeVisible({ timeout: 15000 });

  // 4. Localiza o primeiro card que tenha link com DOI
  const primeiroLink = page.locator('.article-card__link[href*="doi="]').first();

  // Se não houver nenhum link com DOI, pula o teste com aviso
  const count = await primeiroLink.count();
  if (count === 0) {
    test.skip(true, 'Nenhum artigo com DOI nos resultados desta busca.');
    return;
  }

  await expect(primeiroLink).toBeVisible({ timeout: 10000 });

  const href = await primeiroLink.getAttribute('href');
  expect(href).toContain('artigo.html?doi=');

  // 5. Clica no link
  await primeiroLink.click();
  await page.waitForLoadState('networkidle');

  // 6. Verifica que a URL final contém o DOI
  await expect(page).toHaveURL(/artigo.*doi=/);

  // 7. Verifica que o título do artigo foi renderizado
  await expect(page.locator('.article-header__title')).not.toBeEmpty({ timeout: 15000 });
});
