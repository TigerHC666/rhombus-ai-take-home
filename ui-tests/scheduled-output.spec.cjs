const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { promisify, isDeepStrictEqual } = require('node:util');
const execFile = promisify(require('node:child_process').execFile);
const settings = require('../test-support/settings.cjs');
const { openProject, confirmSource, observeRoutes } = require('../test-support/workflow.cjs');

test.use({ storageState: settings.storageState });

test('scheduled pipeline produces a fresh independently validated GCS artifact', async ({ page, context }) => {
  test.setTimeout(600000);
  const scenario = process.env.SCENARIO || 'baseline';
  const phase = process.env.RUN_PHASE || 'scheduled-followup';
  const directory = path.join(settings.root, 'observations/evidence', scenario, `${phase === 'scheduled-pre-repair' ? phase : 'scheduled'}-${Date.now()}`);
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
      columns_to_drop: node.params?.columns_to_drop,
      source_type: node.params?.source_type, dataset_id: node.params?.dataset_id,
      data_asset_ref: node.params?.data_asset_ref, source_connection_id: node.params?.source_connection_id,
      destination_id: node.params?.destination_id, format_type: node.params?.format_type,
      custom_filename: node.params?.custom_filename,
    }));
    configuration = JSON.parse(JSON.stringify(configuration));
  });
  const manifest = {
    scenario, phase, trigger: 'unverified', observed_after: null,
    started_at: new Date().toISOString(), source: 'source-provenance.json',
    activation_attempted: false, schedule_disabled: null, cleanup_attempted: false,
    status: 'in_progress', stage: 'source_verification', outputs_observed: [], errors: [],
  };
  const persist = () => fs.writeFileSync(path.join(directory, 'run-manifest.json'), JSON.stringify(manifest, null, 2));
  const describe = error => ({ name: error.name || 'Error', message: String(error.message || error),
    ...(error.errors ? { causes: Array.from(error.errors, describe) } : {}) });
  const failures = [];
  const captureFailure = async operation => {
    try { return await operation(); } catch (error) { failures.push(error); return undefined; }
  };
  persist();
  try {
  if (process.env.UPLOAD_SOURCE !== '1') {
    await python(['data-validation/source_s3.py', '--scenario', scenario, '--destination', directory]);
  }
  manifest.stage = 'schedule_setup';
  persist();
  await openProject(page);
  await expect.poll(() => configuration?.length || 0).toBeGreaterThan(0);
  const serializedConfiguration = JSON.stringify(configuration, null, 2);
  fs.writeFileSync(path.join(directory, 'configuration.json'), serializedConfiguration);
  manifest.configuration_sha256 = crypto.createHash('sha256').update(serializedConfiguration).digest('hex');
  const frozenConfiguration = process.env.FROZEN_CONFIGURATION_FILE
    ? JSON.parse(fs.readFileSync(path.resolve(settings.root, process.env.FROZEN_CONFIGURATION_FILE), 'utf8')) : null;
  if (frozenConfiguration) {
    expect(configuration, 'Saved configuration must match the frozen baseline before activation').toEqual(frozenConfiguration);
    manifest.frozen_configuration_before_match = true;
  }
  manifest.cron = cron;
  await confirmSource(page);
  await page.getByRole('tab', { name: 'Schedule', exact: true }).click();
  await expect(page.getByRole('complementary')).toContainText(`Custom: ${cron}`);
  const inactiveBefore = page.getByRole('switch', { name: 'Activate schedule', exact: true });
  await expect(inactiveBefore).toBeVisible();
  await expect(inactiveBefore).not.toBeChecked();
  manifest.inactive_before_source_verified = true;
  fs.writeFileSync(path.join(directory, 'schedule-before-source.txt'), await page.getByRole('complementary').innerText());

  const historyButton = () => page.getByRole('complementary').getByRole('button').filter({ has: page.locator('svg.lucide-history') });
  const observedHistory = page.waitForRequest(request => {
    const url = new URL(request.url());
    return url.origin === 'https://api.rhombusai.com' && request.method() === 'GET' &&
      new RegExp(`/projects/${settings.projectId}/pipeline/schedules/[0-9]+/executions$`).test(url.pathname);
  });
  await historyButton().click();
  const historyRequest = await observedHistory;
  const historyFields = ['id', 'schedule_id', 'trigger', 'started_at', 'completed_at', 'success', 'failed_node', 'total_duration_seconds'];
  const readHistory = async label => {
    const response = await context.request.fetch(historyRequest);
    expect(response.status(), 'Observed schedule history API').toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.executions)).toBe(true);
    const rows = body.executions.map(row => Object.fromEntries(historyFields
      .filter(key => row[key] === null || ['string', 'number', 'boolean'].includes(typeof row[key]))
      .map(key => [key, row[key]])));
    fs.writeFileSync(path.join(directory, `schedule-history-${label}.json`), JSON.stringify({
      executions: rows, total: body.total, page: body.page, page_size: body.page_size,
    }, null, 2));
    return rows;
  };
  const priorExecutions = await readHistory('before');
  expect(priorExecutions.every(row => Boolean(row.completed_at)), 'No previous scheduled execution may remain active before source mutation').toBe(true);
  if (process.env.UPLOAD_SOURCE === '1') {
    await python(['data-validation/source_s3.py', '--scenario', scenario, '--upload', '--destination', directory]);
    manifest.source_uploaded_before_activation = true;
    persist();
  }

  await expect(page.getByRole('table')).toBeVisible();
  const priorIds = new Set(priorExecutions.map(row => String(row.id)));
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
  const executions = await readHistory('after');
  const historyReadAt = Date.now();
  newExecutions = executions.filter(row => !priorIds.has(String(row.id)) &&
    Number.isFinite(Date.parse(row.started_at)) && Date.parse(row.started_at) >= Date.parse(start) &&
    Date.parse(row.started_at) <= historyReadAt);
  manifest.executions = newExecutions;
  await historyButton().click();
  await expect(page.getByRole('table')).toBeVisible();
  fs.writeFileSync(path.join(directory, 'schedule-history.txt'), await page.locator('body').innerText());
  } catch (error) {
    historyFailure = error;
    manifest.history_error = describe(error);
  }
  persist();
  failures.push(...[executionFailure, cleanupFailure, historyFailure].filter(Boolean));
  await captureFailure(async () => {
    expect(newExecutions.length, 'Fresh output must correlate with a new schedule-history execution').toBeGreaterThan(0);
    // Verified from the observed schedule-history API; not inferred from UI text.
    const expectedTrigger = 'scheduled';
    expect(newExecutions.every(row => row.trigger === expectedTrigger)).toBe(true);
    manifest.trigger = 'scheduled';
    manifest.verified_trigger_literal = expectedTrigger;
    manifest.execution_outcomes = {
      succeeded: newExecutions.filter(row => row.success === true).map(row => row.id),
      failed: newExecutions.filter(row => row.success === false).map(row => row.id),
      completed: newExecutions.filter(row => row.completed_at).map(row => row.id),
    };
    persist();
    // A failed scheduled job still proves the trigger identity, never success.
    expect(newExecutions.length).toBeLessThanOrEqual(3);
    expect(newExecutions.some(row => row.success === true)).toBe(true);
  });
  manifest.stage = 'artifact_download';
  persist();
  await captureFailure(async () => {
    fs.writeFileSync(path.join(directory, 'schedule-history.txt'), await page.locator('body').innerText());
    await page.screenshot({ path: path.join(directory, 'scheduled-run.png') });
  });
  await captureFailure(async () => {
    // Capture visible logs after shutdown; these may include older/manual events.
    // They are supplementary observations, not job-to-object attribution proof.
    await page.getByRole('tab', { name: 'Canvas', exact: true }).click({ timeout: 10000 });
    await page.getByRole('button', { name: /^Logs(?: \d+)?$/ }).click({ timeout: 10000 });
    const collapsed = page.getByRole('button', { name: 'Expand log', exact: true });
    for (let remaining = Math.min(await collapsed.count(), 20); remaining > 0; remaining--) {
      if (await collapsed.count() === 0) break;
      await collapsed.first().click({ timeout: 5000 });
    }
    fs.writeFileSync(path.join(directory, 'scheduled-visible-logs.txt'), await page.locator('body').innerText({ timeout: 5000 }));
    await page.screenshot({ path: path.join(directory, 'scheduled-visible-logs.png') });
    manifest.logs_scope = 'Visible UI logs after schedule shutdown; not restricted to the observed executions';
  });
  if (frozenConfiguration) {
    await captureFailure(async () => {
      configuration = undefined;
      await page.reload();
      await expect.poll(() => configuration?.length || 0).toBeGreaterThan(0);
      fs.writeFileSync(path.join(directory, 'configuration-after.json'), JSON.stringify(configuration, null, 2));
      manifest.frozen_configuration_after_match = isDeepStrictEqual(configuration, frozenConfiguration);
      persist();
      expect(configuration, 'Saved configuration must remain frozen after collection').toEqual(frozenConfiguration);
    });
  }
  await python(['data-validation/download_gcs.py', '--since', start, '--destination', path.join(directory, 'gcs')]);
  manifest.outputs = JSON.parse(fs.readFileSync(path.join(directory, 'gcs/inventory.json')));
  await captureFailure(() => python(['data-validation/source_s3.py', '--scenario', scenario, '--destination', path.join(directory, 'source-after')]));
  manifest.outputs.sort((a, b) => a.timeCreated.localeCompare(b.timeCreated));
  manifest.output = manifest.outputs[0];
  manifest.output_attribution = 'Candidates observed during the schedule window; exact object-to-execution linkage is not established';
  manifest.stage = 'strict_validation';
  manifest.output_validations = [];
  persist();
  if (manifest.outputs.length === 0) {
    await captureFailure(async () => {
      const reportPath = path.join(directory, 'validation.json');
      // Do not manufacture an empty CSV: the validator records actual absence.
      const missingPath = path.join(directory, 'gcs', 'no-fresh-output.csv');
      expect(fs.existsSync(missingPath)).toBe(false);
      try {
        await python(['data-validation/validate.py', '--scenario', scenario, '--source', path.join(directory, 'source.csv'), '--output', missingPath, '--report', reportPath]);
      } catch (error) {
        if (!fs.existsSync(reportPath)) throw error;
      }
      const result = JSON.parse(fs.readFileSync(reportPath));
      expect(result.passed).toBe(false);
      expect(result.output_present).toBe(false);
      manifest.missing_output_validation = { report: 'validation.json', passed: false, output_present: false };
      persist();
    });
  }
  for (const [index, output] of manifest.outputs.entries()) {
    await captureFailure(async () => {
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
    });
  }
  manifest.validation = {
    report: 'validation.json', report_scope: manifest.outputs.length
      ? 'First object only; aggregate below includes every downloaded candidate'
      : 'No fresh object downloaded; report records unavailable output, not CSV equality',
    output_count: manifest.output_validations.length,
    passed: manifest.output_validations.length > 0 && manifest.output_validations.length === manifest.outputs.length && manifest.output_validations.every(item => item.passed),
    business_values_match: manifest.output_validations.length > 0 && manifest.output_validations.length === manifest.outputs.length && manifest.output_validations.every(item => item.business_values_match),
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
