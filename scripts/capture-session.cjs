// Dedicated assessment browser. Never reads the user's Chrome profile.
const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const root = path.resolve(__dirname, '..');
  fs.mkdirSync(path.join(root, '.auth'), { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  const records = new Map();
  page.on('response', async response => {
    const request = response.request();
    if (!['fetch', 'xhr'].includes(request.resourceType())) return;
    const url = new URL(response.url());
    if (!url.hostname.endsWith('rhombusai.com')) return;
    // Deliberately exclude headers, request bodies, query strings, and responses.
    const item = { method: request.method(), origin: url.origin, pathname: url.pathname, status: response.status() };
    records.set(`${item.method} ${item.origin}${item.pathname} ${item.status}`, item);
    fs.mkdirSync(path.join(root, 'observations/evidence'), { recursive: true });
    fs.writeFileSync(path.join(root, 'observations/evidence/network-endpoints.json'), JSON.stringify([...records.values()], null, 2) + '\n');
  });
  await page.goto('https://rhombusai.com/workflow/5348');
  console.log('Sign in to Rhombus AI in the dedicated Chrome test window. Waiting for the assessment project.');
  await page.getByRole('button', { name: 'New Project', exact: true }).or(
    page.getByRole('link', { name: 'LLM Observability Assessment', exact: true })
  ).first().waitFor({ timeout: 900000 });
  await context.storageState({ path: path.join(root, '.auth/rhombus.json') });
  console.log('Assessment authentication saved only under ignored .auth/.');
  await page.reload();
  await page.getByRole('button', { name: 'New Project', exact: true }).or(
    page.getByRole('link', { name: 'LLM Observability Assessment', exact: true })
  ).first().waitFor({ timeout: 60000 });
  await browser.close();
})().catch(error => { console.error(error.message); process.exitCode = 1; });
