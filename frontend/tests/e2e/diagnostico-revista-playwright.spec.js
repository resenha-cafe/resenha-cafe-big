import { test } from '@playwright/test';

test('diagnóstico da revista no Playwright', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER PAGEERROR:', err.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));

  await page.goto('http://localhost:3000/pages/revista.html');
  await page.waitForTimeout(5000);

  const bodyText = await page.locator('body').innerText();
  console.log('Texto da página:\n', bodyText.slice(0, 500));

  console.log('Formulário presente?', await page.locator('.search-form').count());
  console.log('SearchBox presente?', await page.locator('.search-box').count());
  console.log('Input search presente?', await page.locator('input[type="search"]').count());
  console.log('Botão submit presente?', await page.locator('button[type="submit"]').count());
});
