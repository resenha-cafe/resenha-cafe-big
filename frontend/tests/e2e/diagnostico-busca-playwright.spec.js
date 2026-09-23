import { test } from '@playwright/test';

test('diagnóstico da busca', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER PAGEERROR:', err.message));
  page.on('response', async (response) => {
    if (response.url().includes('/search?')) {
      console.log('RESPONSE URL:', response.url());
      console.log('RESPONSE STATUS:', response.status());
      try {
        const json = await response.json();
        console.log('RESPONSE TOTAL:', json.total);
        console.log('RESPONSE FIRST TITLE:', json.results?.[0]?.title);
      } catch {}
    }
  });

  await page.goto('http://localhost:3000/pages/revista.html');
  await page.waitForTimeout(2000);

  await page.fill('input[type="search"]', 'saúde');
  await page.click('button[type="submit"]');

  await page.waitForTimeout(8000);

  const cardsCount = await page.locator('.article-card').count();
  const bodyText = await page.locator('body').innerText();

  console.log('Cards:', cardsCount);
  console.log('Texto da página:', bodyText.slice(0, 800));
});
