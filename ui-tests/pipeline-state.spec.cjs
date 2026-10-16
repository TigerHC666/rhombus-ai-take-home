const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
test.use({ storageState: '.auth/rhombus.json' });

test('existing assessment canvas loads its connected S3 input', async ({ page }) => {
  const routes = new Map();
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.origin !== 'https://api.rhombusai.com') return;
    const item = { method: response.request().method(), pathname: url.pathname, status: response.status() };
    routes.set(`${item.method} ${item.pathname} ${item.status}`, item);
  });
  await page.goto('/workflow/5348');
  const source = page.getByRole('button', { name: /Amazon S3 Data Input/ });
  await expect(source).toBeVisible({ timeout: 60000 });
  await source.click();
  await expect(page.getByText('Select Dataset', { exact: true })).toBeVisible();
  await expect(page.getByRole('complementary').getByText('orders.csv', { exact: true })).toBeVisible();
  fs.writeFileSync('.runtime/pipeline-state.txt', await page.locator('body').innerText());
  fs.writeFileSync('observations/evidence/pipeline-network-endpoints.json', JSON.stringify([...routes.values()], null, 2) + '\n');
});
