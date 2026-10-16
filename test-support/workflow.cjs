const fs = require('node:fs');
const path = require('node:path');
const { expect } = require('@playwright/test');
const settings = require('./settings.cjs');

function observeRoutes(page) {
  const routes = new Map();
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.origin !== 'https://api.rhombusai.com') return;
    const item = { method: response.request().method(), pathname: url.pathname, status: response.status() };
    routes.set(`${item.method} ${item.pathname} ${item.status}`, item);
  });
  return routes;
}

async function openProject(page) {
  await page.addLocatorHandler(page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Ad Blocker Detected', exact: true }) }), async dialog => {
    await dialog.getByRole('button', { name: 'Continue Anyway', exact: true }).click();
  });
  await page.goto(`/workflow/${settings.projectId}`);
  await expect(page.getByRole('link', { name: settings.projectName, exact: true })).toBeVisible({ timeout: 60000 });
  await expect(page.getByRole('tab', { name: 'Canvas', exact: true })).toBeVisible();
}

async function submitBuilderPrompt(page, prompt, evidenceDirectory) {
  fs.mkdirSync(evidenceDirectory, { recursive: true });
  fs.writeFileSync(path.join(evidenceDirectory, 'builder-prompt.txt'), prompt + '\n');
  await page.getByRole('tab', { name: 'AI Builder', exact: true }).click();
  const input = page.getByRole('textbox');
  await expect(input).toHaveCount(1);
  await input.fill(prompt);
  await page.getByRole('button', { name: 'Send message', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Stop generation', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Stop generation', exact: true })).toHaveCount(0, { timeout: 300000 });
  await expect(input).toBeEnabled();
  fs.writeFileSync(path.join(evidenceDirectory, 'builder-response.txt'), await page.getByRole('complementary').innerText());
}

async function confirmSource(page) {
  await page.getByRole('button', { name: /^Amazon S3 Data Input/ }).click();
  await expect(page.getByText('Select Dataset', { exact: true })).toBeVisible();
  await expect(page.getByRole('complementary').getByText('orders.csv', { exact: true })).toBeVisible();
}

module.exports = { observeRoutes, openProject, submitBuilderPrompt, confirmSource };
