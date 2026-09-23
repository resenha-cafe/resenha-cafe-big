import { test, expect } from '@playwright/test';

test('carregar artigo válido pelo DOI', async ({ page }) => {
  page.on('pageerror', err => console.log('BROWSER PAGEERROR:', err.message));

  const doi = '10.1590/s0104-07072008000400018';

  await page.goto(`http://localhost:3000/pages/artigo.html?doi=${encodeURIComponent(doi)}`);

  // Título do artigo
  const title = page.locator('.article-header__title');
  await expect(title).not.toBeEmpty({ timeout: 15000 });

  // DOI visível
  const doiEl = page.locator('.article-header__doi');
  await expect(doiEl).toContainText('10.1590/s0104-07072008000400018');

  // Metadados
  const metadata = page.locator('.article-metadata');
  await expect(metadata).toBeVisible({ timeout: 10000 });

  // Verifica se o Worker retornou abstract para este DOI.
  // Se sim, o componente .article-abstract deve estar visível.
  // Se não, o root do resumo deve estar oculto.
  const rawResponse = await page.evaluate(async (doiValue) => {
    const res = await fetch(
      `https://resenha-cafe-search.wy30032000.workers.dev/article?doi=${encodeURIComponent(doiValue)}`
    );
    return res.json();
  }, doi);

  const hasAbstract = Boolean(rawResponse?.article?.abstract);
  const abstract = page.locator('.article-abstract');
  const abstractRoot = page.locator('#article-abstract-root');

  if (hasAbstract) {
    await expect(abstract).toBeVisible({ timeout: 10000 });
  } else {
    await expect(abstractRoot).toBeHidden({ timeout: 10000 });
  }
});
