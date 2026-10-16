const { test, expect } = require('@playwright/test');
const fs = require('node:fs');

test.use({ storageState: '.auth/rhombus.json' });

test('authenticated session reaches the assessment project inventory', async ({ page }) => {
  let inventory;
  page.on('response', async response => {
    const url = new URL(response.url());
    if (url.origin !== 'https://api.rhombusai.com' || url.pathname !== '/api/dataset/projects/all') return;
    inventory = { status: response.status(), body: await response.json() };
  });
  await page.goto('/workflow/5348');
  await expect(page.getByRole('button', { name: 'New Project', exact: true })).toBeVisible();
  await expect.poll(() => inventory?.status).toBe(200);
  expect(inventory.body.items.some(project => project.id === 5348 && project.name === 'LLM Observability Assessment')).toBe(true);
  // Project metadata only. No profile, token, request header or cookies in evidence.
  fs.writeFileSync('.runtime/project-inventory.json', JSON.stringify(inventory, null, 2));
  fs.writeFileSync('.runtime/authenticated-page.txt', await page.locator('body').innerText());
});
