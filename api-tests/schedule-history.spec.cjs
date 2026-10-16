const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const settings = require('../test-support/settings.cjs');
const { openProject } = require('../test-support/workflow.cjs');
test.use({ storageState: settings.storageState });
test('observed schedule history API returns execution records', async ({ page, context }) => {
  await openProject(page);
  await page.getByRole('tab', { name: 'Schedule', exact: true }).click();
  const observed = page.waitForRequest(request => {
    const u = new URL(request.url());
    return u.origin === 'https://api.rhombusai.com' && request.method() === 'GET' &&
      new RegExp(`/projects/${settings.projectId}/pipeline/schedules/[0-9]+/executions$`).test(u.pathname);
  });
  await page.getByRole('complementary').getByRole('button').filter({ has: page.locator('svg.lucide-history') }).click();
  const response = await context.request.fetch(await observed);
  expect(response.status()).toBe(200);
  const body = await response.json();
  const rows = Array.isArray(body) ? body : (body.results || body.executions || body.items);
  expect(Array.isArray(rows)).toBe(true);
  expect(rows.length).toBeGreaterThan(0);
  const allowed = ['id', 'schedule_id', 'trigger', 'started_at', 'completed_at', 'success', 'failed_node', 'total_duration_seconds'];
  const evidence = { status: response.status(), root_keys: Object.keys(body), row_keys: Object.keys(rows[0]),
    executions: rows.map(row => Object.fromEntries(allowed.filter(key => ['string', 'number', 'boolean'].includes(typeof row[key])).map(key => [key, row[key]]))) };
  fs.writeFileSync('.runtime/schedule-history.json', JSON.stringify(evidence, null, 2));
  for (const row of rows) {
    expect(row.id).toBeDefined();
    expect(typeof row.trigger).toBe('string');
    expect(typeof row.success).toBe('boolean');
    expect(Number.isFinite(Date.parse(row.started_at))).toBe(true);
  }
});
