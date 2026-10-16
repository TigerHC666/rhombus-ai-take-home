const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { promisify } = require('node:util');
const execFile = promisify(require('node:child_process').execFile);
const settings = require('../test-support/settings.cjs');
const { openProject, confirmSource, observeRoutes, submitBuilderPrompt } = require('../test-support/workflow.cjs');

test.use({ storageState: settings.storageState });

test('S3 source through AI-built pipeline to a fresh GCS export', async ({ page }) => {
  test.setTimeout(900000);
  const scenario = process.env.SCENARIO || 'baseline';
  const phase = process.env.RUN_PHASE || 'unchanged';
  const diagnostic = process.env.DIAGNOSTIC_MODE === 'input-types';
  const directory = path.join(settings.root, 'observations/evidence', scenario, `${phase}-${Date.now()}`);
  fs.mkdirSync(directory, { recursive: true });
  const python = async args => (await execFile('python', args, { cwd: settings.root, timeout: 60000 })).stdout;
  const routes = observeRoutes(page);
  const jobStates = [];
  let configuration;
  let processJobId;
  page.on('response', async response => {
    if (new URL(response.url()).origin !== 'https://api.rhombusai.com') return;
    if (new URL(response.url()).pathname.startsWith('/api/background_jobs/jobs/') && response.status() === 200) {
      const job = await response.json();
      if (diagnostic && job.status === 'FAILED' && (job.id || job.job_id) === processJobId) {
        const messages = [];
        const inspect = value => {
          if (typeof value === 'string') {
            const match = value.match(/ValueError:\s*(INPUT_TYPE_PROBE\s*\{[^\r\n]+\})/);
            if (match) messages.push(match[1].slice(0, 1000));
          } else if (value && typeof value === 'object') Object.values(value).forEach(inspect);
        };
        inspect(job.result);
        fs.writeFileSync(path.join(directory, 'diagnostic-job-error.json'), JSON.stringify({ job_id: processJobId, messages }, null, 2));
      }
      if ((job.id || job.job_id) === processJobId && job.result && ['SUCCESS', 'FAILED'].includes(job.status)) {
        const codeEvidence = {};
        for (const key of ['llm_codegen_final_code', 'llm_codegen_current_code', 'llm_codegen_code_source']) {
          if (job.result[key] !== undefined) codeEvidence[key] = job.result[key];
        }
        fs.writeFileSync(path.join(directory, 'executed-codegen-evidence.json'), JSON.stringify(codeEvidence, null, 2));
      }
      jobStates.push({ observed_at: new Date().toISOString(), status: job.status, state: job.state,
        job_id: job.id || job.job_id, fields: Object.keys(job) });
      fs.writeFileSync(path.join(directory, 'job-states.json'), JSON.stringify(jobStates, null, 2));
    }
    if (new URL(response.url()).pathname !== `/api/dataset/analyzer/v2/projects/${settings.projectId}/nodes` || response.status() !== 200) return;
    const nodes = await response.json();
    fs.writeFileSync(path.join(directory, 'llm-output-contract.json'), JSON.stringify(nodes.filter(node => node.transformation_type === 'llm').map(node => ({
      node_id: node.node_id, output_columns: node.params?.output_columns,
    })), null, 2));
    fs.writeFileSync(path.join(directory, 'node-response-schema.json'), JSON.stringify(nodes.map(node => ({
      node_id: node.node_id, transformation_type: node.transformation_type,
      top_level_keys: Object.keys(node),
      params_keys: Object.keys(node.params || {}),
      ...(node.transformation_type === 'llm' ? { metadata_keys: Object.keys(node.metadata || {}) } : {}),
    })), null, 2));
    configuration = nodes.map(node => ({
      node_id: node.node_id, name: node.name, inputs: node.inputs, outputs: node.outputs,
      transformation_type: node.transformation_type,
      prompt: node.params?.prompt,
      code: node.transformation_type === 'llm' ? node.params?.code : undefined,
      mode: node.transformation_type === 'llm' ? node.params?.mode : undefined,
      sort_columns: node.params?.sort_columns, ascending: node.params?.ascending,
      columns_to_drop: node.params?.columns_to_drop,
      source_type: node.params?.source_type, data_asset_ref: node.params?.data_asset_ref,
      dataset_id: node.params?.dataset_id, source_connection_id: node.params?.source_connection_id,
      destination_id: node.params?.destination_id, format_type: node.params?.format_type,
      custom_filename: node.params?.custom_filename,
    }));
  });
  const manifest = { scenario, phase, trigger: 'manual', started_at: new Date().toISOString() };
  manifest.harness_sha256 = Object.fromEntries([__filename, path.join(settings.root, 'test-support/workflow.cjs')].map(file =>
    [path.relative(settings.root, file), crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
  if (diagnostic) manifest.purpose = 'Intentional input-type diagnostic; a marker-bearing failed job is the expected observation';
  const checkpoint = stage => {
    manifest.stage = stage;
    fs.writeFileSync(path.join(directory, 'run-manifest.json'), JSON.stringify(manifest, null, 2));
    console.log(`${scenario}: ${stage}`);
  };
  const verifyInactiveSchedule = async label => {
    await page.getByRole('tab', { name: 'Schedule', exact: true }).click();
    const panel = page.getByRole('complementary');
    const inactive = page.getByRole('switch', { name: 'Activate schedule', exact: true });
    try {
      await expect(panel).toContainText('Schedules');
      await expect(inactive).toBeVisible();
      await expect(inactive).not.toBeChecked();
      await expect(page.getByRole('switch', { name: 'Deactivate schedule', exact: true })).toHaveCount(0);
      manifest.schedule_checks = [...(manifest.schedule_checks || []), {
        label, observed_at: new Date().toISOString(), inactive_verified: true,
      }];
    } finally {
      await panel.innerText({ timeout: 5000 }).then(text => fs.writeFileSync(path.join(directory, `schedule-${label}.txt`), text)).catch(error => {
        manifest.schedule_evidence_error = error.message;
      });
    }
  };
  try {
    checkpoint('opening-project');
    await openProject(page);
    await expect.poll(() => configuration?.length || 0).toBeGreaterThan(0);
    fs.writeFileSync(path.join(directory, 'configuration-before.json'), JSON.stringify(configuration, null, 2));
    if (process.env.FROZEN_CONFIGURATION_FILE) {
      expect(configuration, 'Controlled diagnostic must retain the same saved configuration').toEqual(JSON.parse(fs.readFileSync(process.env.FROZEN_CONFIGURATION_FILE)));
    }
    if (phase === 'pre-repair' || phase.startsWith('restore-after-')) {
      const frozen = JSON.parse(fs.readFileSync(path.join(settings.root, 'observations/evidence/baseline/configuration-v3.json')));
      expect(configuration, 'Isolation requires the complete frozen configuration before source mutation').toEqual(frozen);
      manifest.configuration_verified_before_run = true;
    }
    await verifyInactiveSchedule('before-source');
    checkpoint('uploading-source');
    await python(['data-validation/source_s3.py', '--scenario', scenario, '--upload', '--destination', directory]);
    checkpoint('confirming-source');
    await confirmSource(page);
    if (process.env.BUILDER_PROMPT_FILE) {
      const originalSource = configuration.find(node => node.source_type === 's3');
      const originalDestination = configuration.find(node => node.transformation_type === 'output');
      await submitBuilderPrompt(page, fs.readFileSync(process.env.BUILDER_PROMPT_FILE, 'utf8'), directory);
      configuration = undefined;
      await page.reload();
      await expect.poll(() => configuration?.length || 0).toBeGreaterThan(0);
      const source = configuration.find(node => node.source_type === 's3');
      const destination = configuration.find(node => node.transformation_type === 'output');
      expect(source?.data_asset_ref, 'Builder must retain the authorized live S3 source').toBe(originalSource?.data_asset_ref);
      expect(source?.source_connection_id).toBe(originalSource?.source_connection_id);
      expect(destination?.destination_id, 'Builder must retain the authorized GCS destination').toBe(originalDestination?.destination_id);
      expect(destination?.custom_filename).toBe(originalDestination?.custom_filename);
      fs.writeFileSync(path.join(directory, 'configuration-after-builder.json'), JSON.stringify(configuration, null, 2));
    }
    await verifyInactiveSchedule('before-manual-trigger');
    await page.getByRole('tab', { name: 'Canvas', exact: true }).click();
    manifest.triggered_at = new Date().toISOString();
    checkpoint('triggering-pipeline');
    const [processResponse] = await Promise.all([
      page.waitForResponse(response => {
        const url = new URL(response.url());
        return url.origin === 'https://api.rhombusai.com' &&
          url.pathname === `/api/dataset/analyzer/v2/projects/${settings.projectId}/pipeline/process` &&
          response.request().method() === 'POST';
      }),
      page.getByRole('button').filter({ has: page.locator('svg.lucide-play') }).click(),
    ]);
    const processBody = await processResponse.json();
    processJobId = processBody.task_id || processBody.job_id || processBody.id;
    const executionMode = processBody.execution_mode;
    const processEvidence = {
      observed_at: new Date().toISOString(), http_status: processResponse.status(),
      job_id: processJobId, fields: Object.keys(processBody),
      execution_mode: typeof executionMode === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(executionMode)
        ? executionMode : null,
      execution_mode_type: typeof executionMode,
    };
    fs.writeFileSync(path.join(directory, 'process-response.json'), JSON.stringify(processEvidence, null, 2));
    expect(processResponse.ok(), 'Manual process request must succeed').toBe(true);
    expect(typeof processJobId === 'string' && processJobId.length > 0, 'Manual process must return a job ID').toBe(true);
    manifest.process_job_id = processJobId;
    manifest.execution_mode = processEvidence.execution_mode;
    checkpoint('waiting-for-output');
    let fresh = [];
    let outputTimeout;
    try {
      await expect.poll(async () => {
        fresh = JSON.parse(await python(['data-validation/download_gcs.py', '--list-only', '--since', manifest.triggered_at]));
        const ownJobs = jobStates.filter(job => job.job_id === processJobId && job.observed_at >= manifest.triggered_at);
        return ownJobs.some(job => job.status === 'FAILED') ||
          (fresh.length > 0 && ownJobs.some(job => job.status === 'SUCCESS'));
      }, { timeout: 360000, intervals: [5000], message: 'Fresh GCS export or an observed terminal pipeline failure' }).toBe(true);
    } catch (error) {
      outputTimeout = error.message;
    }
    checkpoint('capturing-logs');
    await page.getByRole('button', { name: /^Logs(?: \d+)?$/ }).click();
    const collapsedLogs = page.getByRole('button', { name: 'Expand log', exact: true });
    for (let count = await collapsedLogs.count(); count > 0; count--) await collapsedLogs.first().click();
    fs.writeFileSync(path.join(directory, 'page-and-logs.txt'), await page.locator('body').innerText());
    await page.screenshot({ path: path.join(directory, 'pipeline-result.png') });
    try {
      await confirmSource(page);
      await page.getByRole('tab', { name: 'Profile', exact: true }).click();
      await page.getByRole('complementary').getByRole('combobox').click();
      await page.getByRole('option', { name: 'quantity', exact: true }).press('Enter');
      await expect(page.getByRole('complementary')).toContainText('Overview');
      fs.writeFileSync(path.join(directory, 'quantity-profile.txt'), await page.getByRole('complementary').innerText());
    } catch (error) {
      // Preserve this UI failure without losing the independently downloadable result.
      manifest.profile_capture_error = error.message;
    }
    await python(['data-validation/source_s3.py', '--scenario', scenario, '--destination', path.join(directory, 'source-after')]);
    if (configuration) fs.writeFileSync(path.join(directory, 'configuration.json'), JSON.stringify(configuration, null, 2));
    if (process.env.FROZEN_CONFIGURATION_FILE) {
      expect(configuration, 'Controlled diagnostic saved code must remain identical after execution').toEqual(JSON.parse(fs.readFileSync(process.env.FROZEN_CONFIGURATION_FILE)));
    }
    manifest.terminal_job_status = jobStates.filter(job => job.job_id === processJobId).at(-1)?.status;
    if (fresh.length) {
      await python(['data-validation/download_gcs.py', '--since', manifest.triggered_at, '--destination', path.join(directory, 'gcs')]);
      manifest.outputs = JSON.parse(fs.readFileSync(path.join(directory, 'gcs/inventory.json')));
      manifest.outputs.sort((a,b) => a.timeCreated.localeCompare(b.timeCreated));
      manifest.output_attribution = 'Objects observed after the manual boundary; exact object-to-job linkage is not established';
      manifest.output_validations = [];
      for (const [index, output] of manifest.outputs.entries()) {
        const reportName = `validation-output-${index + 1}.json`;
        const reportPath = path.join(directory, reportName);
        try {
          await python(['data-validation/validate.py', '--scenario', scenario, '--source', path.join(directory, 'source.csv'), '--output', path.join(directory, 'gcs', output.name), '--report', reportPath]);
        } catch (error) {
          if (!fs.existsSync(reportPath)) throw error;
        }
        const validation = JSON.parse(fs.readFileSync(reportPath));
        if (index === 0) fs.copyFileSync(reportPath, path.join(directory, 'validation.json'));
        manifest.output_validations.push({
          name: output.name, generation: output.generation, sha256: output.sha256,
          report: reportName, business_values_match: validation.business_values_match === true,
          strict_contract_passed: validation.passed === true,
        });
        checkpoint('validating-all-outputs');
      }
      manifest.validation_compatibility = 'validation.json describes the first object only; manifest aggregates every downloaded object';
      manifest.business_values_match = manifest.output_validations.length > 0 && manifest.output_validations.every(item => item.business_values_match);
      manifest.strict_contract_passed = manifest.output_validations.length > 0 && manifest.output_validations.every(item => item.strict_contract_passed);
      expect(manifest.terminal_job_status, 'The captured manual job must succeed').toBe('SUCCESS');
      expect(manifest.strict_contract_passed, 'Every actual cloud output must satisfy the frozen contract').toBe(true);
      expect(manifest.profile_capture_error, 'Source profile capture must succeed').toBeUndefined();
    } else {
      manifest.outputs = [];
      manifest.output_wait_failure = outputTimeout;
      try {
        await python(['data-validation/validate.py', '--scenario', scenario, '--source', path.join(directory, 'source.csv'),
          '--output', path.join(directory, 'gcs', 'no-fresh-output.csv'), '--report', path.join(directory, 'validation.json')]);
      } catch (error) {
        if (!fs.existsSync(path.join(directory, 'validation.json'))) throw error;
      }
      if (diagnostic) {
        expect(manifest.terminal_job_status).toBe('FAILED');
        const captured = JSON.parse(fs.readFileSync(path.join(directory, 'diagnostic-job-error.json'), 'utf8'));
        expect(captured.job_id).toBe(processJobId);
        expect(captured.messages.length, 'Computed diagnostic must come from the matching failed job result').toBeGreaterThan(0);
        const measured = JSON.parse(captured.messages.at(-1).replace(/^INPUT_TYPE_PROBE\s*/, ''));
        for (const column of ['quantity', 'order_date']) {
          expect(typeof measured[column].dtype).toBe('string');
          expect(Array.isArray(measured[column].samples)).toBe(true);
          expect(measured[column].samples.length).toBe(3);
        }
        fs.writeFileSync(path.join(directory, 'input-type-measurement.json'), JSON.stringify(measured, null, 2));
        manifest.diagnostic_observed = true;
        checkpoint('intentional-diagnostic-complete');
        return;
      }
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
