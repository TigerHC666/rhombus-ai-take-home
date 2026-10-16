const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
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
  const cron = process.env.SCHEDULE_CRON || '*/5 * * * *';
  if (!['*/1 * * * *', '*/5 * * * *'].includes(cron)) throw new Error('Unsupported supervised schedule interval');
  let configuration;
  page.on('response', async response => {
    const url = new URL(response.url());
    if (url.origin !== 'https://api.rhombusai.com' || url.pathname !== `/api/dataset/analyzer/v2/projects/${settings.projectId}/nodes` || response.status() !== 200) return;
    const nodes = await response.json();
    configuration = nodes.map(node => ({
      node_id: node.node_id, name: node.name, inputs: node.inputs, outputs: node.outputs,
      transformation_type: node.transformation_type, prompt: node.params?.prompt,
      code: node.transformation_type === 'llm' ? node.params?.code : undefined,
      mode: node.transformation_type === 'llm' ? node.params?.mode : undefined,
      sort_columns: node.params?.sort_columns, ascending: node.params?.ascending,
      source_type: node.params?.source_type, dataset_id: node.params?.dataset_id,
      data_asset_ref: node.params?.data_asset_ref, source_connection_id: node.params?.source_connection_id,
      destination_id: node.params?.destination_id, format_type: node.params?.format_type,
      custom_filename: node.params?.custom_filename,
    }));
  });
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
  await expect.poll(() => configuration?.length || 0).toBeGreaterThan(0);
  const serializedConfiguration = JSON.stringify(configuration, null, 2);
  fs.writeFileSync(path.join(directory, 'configuration.json'), serializedConfiguration);
  manifest.configuration_sha256 = crypto.createHash('sha256').update(serializedConfiguration).digest('hex');
  manifest.cron = cron;
  await confirmSource(page);
  await page.getByRole('tab', { name: 'Schedule', exact: true }).click();
  await expect(page.getByRole('complementary')).toContainText(`Custom: ${cron}`);
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
    }, { timeout: cron.startsWith('*/1 ') ? 110000 : 420000, intervals: [5000], message: 'A new GCS generation must appear after schedule observation begins' }).toBeGreaterThan(0);
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
  // Shutdown always comes first. History remains useful even when no export arrives.
  manifest.stage = 'history_verification';
  let newExecutions = [];
  let historyFailure;
  try {
  fs.writeFileSync(path.join(directory, 'schedule-after-window.txt'), await page.getByRole('complementary').innerText({ timeout: 5000 }));
  await historyButton().click();
  await expect(page.getByRole('table')).toBeVisible();
  const executions = await page.getByRole('row').filter({ hasText: /Execution #[0-9]+/ }).allTextContents();
  newExecutions = executions.filter(row => !priorIds.has(row.match(/Execution #[0-9]+/)[0]));
  manifest.executions = newExecutions;
  fs.writeFileSync(path.join(directory, 'schedule-history.txt'), await page.locator('body').innerText());
  } catch (error) {
    historyFailure = error;
    manifest.history_error = describe(error);
  }
  persist();
  if (executionFailure || cleanupFailure || historyFailure) {
    throw new AggregateError([executionFailure, cleanupFailure, historyFailure].filter(Boolean), 'Scheduled execution, cleanup, or history capture failed');
  }
  expect(newExecutions.length, 'Fresh output must correlate with a new scheduled execution').toBeGreaterThan(0);
  expect(newExecutions.length).toBeLessThanOrEqual(3);
  expect(newExecutions.some(row => /success/i.test(row))).toBe(true);
  manifest.trigger = 'scheduled';
  manifest.stage = 'artifact_download';
  persist();
  fs.writeFileSync(path.join(directory, 'schedule-history.txt'), await page.locator('body').innerText());
  await page.screenshot({ path: path.join(directory, 'scheduled-run.png') });
  await python(['data-validation/download_gcs.py', '--since', start, '--destination', path.join(directory, 'gcs')]);
  manifest.outputs = JSON.parse(fs.readFileSync(path.join(directory, 'gcs/inventory.json')));
  await python(['data-validation/source_s3.py', '--scenario', scenario, '--destination', path.join(directory, 'source-after')]);
  manifest.outputs.sort((a, b) => a.timeCreated.localeCompare(b.timeCreated));
  manifest.output = manifest.outputs[0];
  manifest.output_attribution = 'Candidates observed during the schedule window; exact object-to-execution linkage is not established';
  manifest.stage = 'strict_validation';
  manifest.output_validations = [];
  persist();
  for (const [index, output] of manifest.outputs.entries()) {
    const reportName = `validation-output-${index + 1}.json`;
    const reportPath = path.join(directory, reportName);
    try {
      await python(['data-validation/validate.py', '--scenario', scenario, '--source', path.join(directory, 'source.csv'), '--output', path.join(directory, 'gcs', output.name), '--report', reportPath]);
    } catch (error) {
      if (!fs.existsSync(reportPath)) throw error;
    }
    const result = JSON.parse(fs.readFileSync(reportPath));
    if (index === 0) fs.copyFileSync(reportPath, path.join(directory, 'validation.json'));
    manifest.output_validations.push({ name: output.name, generation: output.generation,
      sha256: output.sha256, report: reportName,
      passed: result.passed === true, business_values_match: result.business_values_match === true });
    persist();
  }
  manifest.validation = {
    report: 'validation.json', report_scope: 'First object only; aggregate below includes every downloaded candidate',
    output_count: manifest.output_validations.length,
    passed: manifest.output_validations.length > 0 && manifest.output_validations.every(item => item.passed),
    business_values_match: manifest.output_validations.length > 0 && manifest.output_validations.every(item => item.business_values_match),
  };
  persist();
  expect(manifest.validation.business_values_match, 'Every output must match the independent business oracle').toBe(true);
  expect(manifest.validation.passed, 'Every output must satisfy the strict CSV contract, including monetary precision').toBe(true);
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
