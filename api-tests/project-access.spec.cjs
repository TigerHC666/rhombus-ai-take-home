const { test, expect } = require('@playwright/test');

test.use({ storageState: '.auth/rhombus.json' });

test('direct backend request returns the authorized assessment project', async ({ page, context }) => {
  const observed = page.waitForRequest(request => {
    const url = new URL(request.url());
    return url.origin === 'https://api.rhombusai.com' && url.pathname === '/api/dataset/projects/all' && request.method() === 'GET';
  });
  await page.goto('/workflow/5348');
  // Replay the observed Request in the same authenticated context. Never inspect,
  // print, serialize, or persist its authentication headers.
  const response = await context.request.fetch(await observed);
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(Array.isArray(body.items)).toBe(true);
  expect(body.items).toEqual(expect.arrayContaining([
    expect.objectContaining({ id: 5348, name: 'LLM Observability Assessment', visibility: 'restricted' }),
  ]));
});

test('project inventory rejects an unauthenticated direct backend request', async ({ playwright }) => {
  const anonymous = await playwright.request.newContext();
  try {
    const response = await anonymous.get('https://api.rhombusai.com/api/dataset/projects/all');
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toHaveProperty('detail');
    expect(typeof body.detail).toBe('string');
    expect(body.detail.toLowerCase()).toMatch(/auth|credential|token/);
    expect(body).not.toHaveProperty('items');
  } finally {
    await anonymous.dispose();
  }
});
