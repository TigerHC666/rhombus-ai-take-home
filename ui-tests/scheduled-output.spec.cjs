const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const { promisify } = require('node:util');
const execFile = promisify(require('node:child_process').execFile);
const settings = require('../test-support/settings.cjs');
const { openProject, confirmSource, observeRoutes } = require('../test-support/workflow.cjs');

test.use({ storageState: settings.storageState });

test('scheduled pipeline produces a fresh independently validated GCS artifact', async ({ page }) => {
  test.setTimeout(600000);
  const scenario = process.env.SCENARIO || 'baseline';
  const directory = path.join(settings.root, 'observations/evidence', scenario, `scheduled-${Date.now()}`);
  fs.mkdirSync(directory, { recursive: true });
  const python = async args => (await execFile('python', args, { cwd: settings.root, timeout: 60000 })).stdout;
  const routes = observeRoutes(page);
  const manifest = {
    scenario, trigger: 'unverified', observed_after: null,
    started_at: new Date().toISOString(), source: 'source-provenance.json',
    activation_attempted: false, schedule_disabled: null, cleanup_attempted: false,
    status: 'in_progress', stage: 'source_verification', outputs_observed: [], errors: [],
  };
  const persist = () => fs.writeFileSync(path.join(directory, 'run-manifest.json'), JSON.stringify(manifest, null, 2));
  const describe = error => ({ name: error.name || 'Error', message: String(error.message || error),
    ...(error.errors ? { causes: Array.from(error.errors, describe) } : {}) });
  const failures = [];
  persist();
  try {
  await python(['data-validation/source_s3.py', '--scenario', scenario, '--destination', directory]);
  manifest.stage = 'schedule_setup';
  persist();
  await openProject(page);
  await confirmSource(page);
  await page.getByRole('tab', { name: 'Schedule', exact: true }).click();
  await expect(page.getByRole('complementary')).toContainText('Custom: */5 * * * *');
  const historyButton = () => page.getByRole('complementary').getByRole('button').filter({ has: page.locator('svg.lucide-history') });
  await historyButton().click();
  await expect(page.getByRole('table')).toBeVisible();
  const priorExecutions = await page.getByRole('row').filter({ hasText: /Execution #[0-9]+/ }).allTextContents();
  const priorIds = new Set(priorExecutions.map(row => row.match(/Execution #[0-9]+/)[0]));
  const start = new Date().toISOString();
  manifest.observed_after = start;
  manifest.prior_executions = priorExecutions;
  let activated = false;
  let fresh = [];
  let executionFailure;
  let cleanupFailure;
  try {
    activated = true;
    manifest.activation_attempted = true;
    manifest.stage = 'schedule_activation';
    persist();
    const active = page.getByRole('switch', { name: 'Deactivate schedule', exact: true });
    if (await active.count() === 0) {
      await page.getByRole('switch', { name: 'Activate schedule', exact: true }).click();
    }
    await expect(active).toBeChecked();
    manifest.stage = 'waiting_for_output';
    persist();
    fs.writeFileSync(path.join(directory, 'schedule-active.txt'), await page.getByRole('complementary').innerText());
    await expect.poll(async () => {
      fresh = JSON.parse(await python(['data-validation/download_gcs.py', '--list-only', '--since', start]));
      manifest.outputs_observed = fresh;
      persist();
      return fresh.length;
    }, { timeout: 420000, intervals: [15000], message: 'A new GCS generation must appear after schedule observation begins' }).toBeGreaterThan(0);
  } catch (error) {
    executionFailure = error;
  } finally {
    if (activated) {
      manifest.cleanup_attempted = true;
      // Do not let evidence-write failure prevent the actual disable attempt.
      try { persist(); } catch (error) { failures.push(error); }
      try {
      await page.getByRole('tab', { name: 'Schedule', exact: true }).click();
      const active = page.getByRole('switch', { name: 'Deactivate schedule', exact: true });
      const inactive = page.getByRole('switch', { name: 'Activate schedule', exact: true });
      await expect(active.or(inactive)).toBeVisible({ timeout: 60000 });
      if (await active.isVisible()) await active.click();
      await expect(inactive).toBeVisible({ timeout: 60000 });
      await expect(inactive).not.toBeChecked();
      manifest.schedule_disabled = true;
      fs.writeFileSync(path.join(directory, 'schedule-inactive.txt'), await page.getByRole('complementary').innerText());
      } catch (error) {
        cleanupFailure = error;
        manifest.cleanup_error = describe(error);
        // null means unknown; never claim an unsuccessful cleanup left it disabled.
      }
    }
    try { persist(); } catch (error) { failures.push(error); }
  }
  if (executionFailure || cleanupFailure) {
    throw new AggregateError([executionFailure, cleanupFailure].filter(Boolean), 'Scheduled execution or cleanup failed');
  }
  manifest.stage = 'history_verification';
  await historyButton().click();
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: /success|succeeded/i })).not.toHaveCount(0);
  const executions = await page.getByRole('row').filter({ hasText: /Execution #[0-9]+/ }).allTextContents();
  const newExecutions = executions.filter(row => !priorIds.has(row.match(/Execution #[0-9]+/)[0]));
  manifest.executions = newExecutions;
  fs.writeFileSync(path.join(directory, 'schedule-history.txt'), await page.locator('body').innerText());
  persist();
  expect(newExecutions.length, 'Fresh output must correlate with a new scheduled execution').toBeGreaterThan(0);
  expect(newExecutions.length).toBeLessThanOrEqual(3);
  expect(newExecutions.some(row => /success/i.test(row))).toBe(true);
  manifest.trigger = 'scheduled';
  manifest.stage = 'artifact_download';
  persist();
  fs.writeFileSync(path.join(directory, 'schedule-history.txt'), await page.locator('body').innerText());
  await page.screenshot({ path: path.join(directory, 'scheduled-run.png') });
  await python(['data-validation/download_gcs.py', '--since', start, '--destination', path.join(directory, 'gcs')]);
  await python(['data-validation/source_s3.py', '--scenario', scenario, '--destination', path.join(directory, 'source-after')]);
  const output = fresh.sort((a, b) => a.timeCreated.localeCompare(b.timeCreated))[0];
  manifest.output = output;
  manifest.stage = 'strict_validation';
  persist();
  try {
    await python(['data-validation/validate.py', '--scenario', scenario, '--source', path.join(directory, 'source.csv'), '--output', path.join(directory, 'gcs', output.name), '--report', path.join(directory, 'validation.json')]);
  } catch (error) {
    if (!fs.existsSync(path.join(directory, 'validation.json'))) throw error;
  }
  const result = JSON.parse(fs.readFileSync(path.join(directory, 'validation.json')));
  manifest.validation = { report: 'validation.json', passed: result.passed, business_values_match: result.business_values_match };
  persist();
  expect(result.business_values_match, 'All actual business values must match the independent oracle').toBe(true);
  expect(result.passed, 'Strict CSV contract, including exact monetary precision').toBe(true);
  manifest.stage = 'complete';
  } catch (error) {
    failures.push(error);
  } finally {
    manifest.observed_until = new Date().toISOString();
    // Persist independently: one failed evidence capture must not prevent the others.
    try {
      fs.writeFileSync(path.join(directory, 'network-endpoints.json'), JSON.stringify([...routes.values()], null, 2));
    } catch (error) { failures.push(error); }
    if (failures.length) {
      try {
        fs.writeFileSync(path.join(directory, 'failure-page.txt'), await page.locator('body').innerText({ timeout: 5000 }));
      } catch (error) { failures.push(error); }
    }
    manifest.status = failures.length ? 'failed' : 'passed';
    manifest.errors = failures.map(describe);
    try { persist(); } catch (error) { failures.push(error); }
  }
  if (failures.length) throw new AggregateError(failures, 'Scheduled pipeline test failed; inspect run-manifest.json and cleanup state');
});
