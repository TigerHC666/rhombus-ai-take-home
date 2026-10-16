const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const { promisify } = require('node:util');
const execFile = promisify(require('node:child_process').execFile);
const settings = require('../test-support/settings.cjs');
const { openProject, confirmSource, observeRoutes, submitBuilderPrompt } = require('../test-support/workflow.cjs');

test.use({ storageState: settings.storageState });

test('S3 source through AI-built pipeline to a fresh GCS export', async ({ page }) => {
  test.setTimeout(600000);
  const scenario = process.env.SCENARIO || 'baseline';
  const phase = process.env.RUN_PHASE || 'unchanged';
  const directory = path.join(settings.root, 'observations/evidence', scenario, `${phase}-${Date.now()}`);
  fs.mkdirSync(directory, { recursive: true });
  const python = async args => (await execFile('python', args, { cwd: settings.root, timeout: 60000 })).stdout;
  const routes = observeRoutes(page);
  const jobStates = [];
  let configuration;
  page.on('response', async response => {
    if (new URL(response.url()).pathname.startsWith('/api/background_jobs/jobs/') && response.status() === 200) {
      const job = await response.json();
      jobStates.push({ observed_at: new Date().toISOString(), status: job.status, state: job.state,
        job_id: job.id || job.job_id, fields: Object.keys(job) });
      fs.writeFileSync(path.join(directory, 'job-states.json'), JSON.stringify(jobStates, null, 2));
    }
    if (new URL(response.url()).pathname !== `/api/dataset/analyzer/v2/projects/${settings.projectId}/nodes` || response.status() !== 200) return;
    const nodes = await response.json();
    configuration = nodes.map(node => ({
      node_id: node.node_id, inputs: node.inputs, outputs: node.outputs,
      transformation_type: node.transformation_type,
      prompt: node.params?.prompt,
      code: node.transformation_type === 'llm' ? node.params?.code : undefined,
      mode: node.transformation_type === 'llm' ? node.params?.mode : undefined,
      sort_columns: node.params?.sort_columns, ascending: node.params?.ascending,
      source_type: node.params?.source_type, data_asset_ref: node.params?.data_asset_ref,
      destination_id: node.params?.destination_id, format_type: node.params?.format_type,
    }));
  });
  const manifest = { scenario, phase, trigger: 'manual', started_at: new Date().toISOString() };
  const checkpoint = stage => {
    manifest.stage = stage;
    fs.writeFileSync(path.join(directory, 'run-manifest.json'), JSON.stringify(manifest, null, 2));
    console.log(`${scenario}: ${stage}`);
  };
  try {
    checkpoint('opening-project');
    await openProject(page);
    await page.getByRole('tab', { name: 'Schedule', exact: true }).click();
    await expect(page.getByRole('complementary')).toContainText('Schedules');
    await expect(page.getByRole('switch', { name: 'Deactivate schedule', exact: true })).toHaveCount(0);
    checkpoint('uploading-source');
    await python(['data-validation/source_s3.py', '--scenario', scenario, '--upload', '--destination', directory]);
    checkpoint('confirming-source');
    await confirmSource(page);
    if (process.env.BUILDER_PROMPT_FILE) {
      await submitBuilderPrompt(page, fs.readFileSync(process.env.BUILDER_PROMPT_FILE, 'utf8'), directory);
    }
    await page.getByRole('tab', { name: 'Canvas', exact: true }).click();
    manifest.triggered_at = new Date().toISOString();
    checkpoint('triggering-pipeline');
    await page.getByRole('button').filter({ has: page.locator('svg.lucide-play') }).click();
    checkpoint('waiting-for-output');
    let fresh = [];
    let outputTimeout;
    try {
      await expect.poll(async () => {
        fresh = JSON.parse(await python(['data-validation/download_gcs.py', '--list-only', '--since', manifest.triggered_at]));
        return fresh.length > 0 || jobStates.some(job => job.observed_at >= manifest.triggered_at && job.status === 'FAILED');
      }, { timeout: 150000, intervals: [5000], message: 'Fresh GCS export or an observed terminal pipeline failure' }).toBe(true);
    } catch (error) {
      outputTimeout = error.message;
    }
    checkpoint('capturing-logs');
    await page.getByRole('button', { name: /^Logs(?: \d+)?$/ }).click();
    const collapsedLogs = page.getByRole('button', { name: 'Expand log', exact: true });
    for (let count = await collapsedLogs.count(); count > 0; count--) await collapsedLogs.first().click();
    fs.writeFileSync(path.join(directory, 'page-and-logs.txt'), await page.locator('body').innerText());
    await page.screenshot({ path: path.join(directory, 'pipeline-result.png') });
    await confirmSource(page);
    await page.getByRole('tab', { name: 'Profile', exact: true }).click();
    await page.getByRole('complementary').getByRole('combobox').click();
    await page.getByRole('option', { name: 'quantity', exact: true }).press('Enter');
    await expect(page.getByRole('complementary')).toContainText('Overview');
    fs.writeFileSync(path.join(directory, 'quantity-profile.txt'), await page.getByRole('complementary').innerText());
    await python(['data-validation/source_s3.py', '--scenario', scenario, '--destination', path.join(directory, 'source-after')]);
    if (configuration) fs.writeFileSync(path.join(directory, 'configuration.json'), JSON.stringify(configuration, null, 2));
    if (fresh.length) {
      await python(['data-validation/download_gcs.py', '--since', manifest.triggered_at, '--destination', path.join(directory, 'gcs')]);
      manifest.outputs = JSON.parse(fs.readFileSync(path.join(directory, 'gcs/inventory.json')));
      const output = manifest.outputs.sort((a,b) => a.timeCreated.localeCompare(b.timeCreated))[0];
      try {
        await python(['data-validation/validate.py', '--scenario', scenario, '--source', path.join(directory, 'source.csv'), '--output', path.join(directory, 'gcs', output.name), '--report', path.join(directory, 'validation.json')]);
      } catch (error) {
        if (!fs.existsSync(path.join(directory, 'validation.json'))) throw error;
      }
      const validation = JSON.parse(fs.readFileSync(path.join(directory, 'validation.json')));
      manifest.business_values_match = validation.business_values_match;
      manifest.strict_contract_passed = validation.passed;
      expect(validation.passed, 'The actual cloud output must satisfy the frozen contract').toBe(true);
    } else {
      manifest.outputs = [];
      manifest.output_wait_failure = outputTimeout;
      fs.writeFileSync(path.join(directory, 'validation.json'), JSON.stringify({ scenario, passed: false, output_present: false, source_present: true, errors: ['No fresh output was observed in the bounded execution window'] }, null, 2));
      expect(fresh.length, 'Pipeline must produce a fresh output; inspect captured failure logs').toBeGreaterThan(0);
    }
  } catch (error) {
    manifest.failure = error.message;
    if (!page.isClosed()) {
      await page.screenshot({ path: path.join(directory, 'failure.png'), timeout: 10000 }).catch(() => {});
      await page.locator('body').innerText({ timeout: 10000 }).then(text => fs.writeFileSync(path.join(directory, 'failure-page.txt'), text)).catch(() => {});
    }
    throw error;
  } finally {
    manifest.finished_at = new Date().toISOString();
    fs.writeFileSync(path.join(directory, 'run-manifest.json'), JSON.stringify(manifest, null, 2));
    fs.writeFileSync(path.join(directory, 'network-endpoints.json'), JSON.stringify([...routes.values()], null, 2));
  }
});
