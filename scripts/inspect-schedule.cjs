// Read only the observed schedule-list endpoint; never inspect auth headers.
const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const settings = require('../test-support/settings.cjs');
async function main() {
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
    const context = await browser.newContext({ storageState: settings.storageState, baseURL: 'https://rhombusai.com' });
    const page = await context.newPage();
    const responsePromise = page.waitForResponse(response => {
      const u = new URL(response.url());
      return u.origin === 'https://api.rhombusai.com' && response.request().method() === 'GET' &&
        u.pathname === `/api/dataset/analyzer/v2/projects/${settings.projectId}/pipeline/schedules`;
    });
    await page.goto(`/workflow/${settings.projectId}`);
    await page.getByRole('tab', { name: 'Schedule', exact: true }).click();
    const response = await responsePromise;
    if (response.status() !== 200) throw new Error(`Schedule list HTTP ${response.status()}`);
    const body = await response.json();
    const shape = value => Array.isArray(value) ? value.slice(0, 3).map(shape) :
      value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([key, child]) =>
        [key, typeof child === 'boolean' || typeof child === 'number' || child === null ? child :
          typeof child === 'string' && /^(?:20\d\d-\d\d-\d\dT|\*\/\d+ )/.test(child) ? child :
          Array.isArray(child) || typeof child === 'object' ? shape(child) : typeof child])) : typeof value;
    const result = { observed_at: new Date().toISOString(), http_status: response.status(), schedule_shape: shape(body) };
    fs.writeFileSync('.runtime/schedule-inspection.json', JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
