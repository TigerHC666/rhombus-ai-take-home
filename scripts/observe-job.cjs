const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const settings = require('../test-support/settings.cjs');
async function main() {
  if (!process.env.OBSERVE_JOB_ID || !process.env.JOB_EVIDENCE_DIRECTORY) throw new Error('Set OBSERVE_JOB_ID and JOB_EVIDENCE_DIRECTORY');
  const browser = await chromium.launch({ channel: 'chrome' });
  try {
  const context = await browser.newContext({ storageState: settings.storageState, baseURL: 'https://rhombusai.com' });
  const page = await context.newPage();
  const id = process.env.OBSERVE_JOB_ID;
  expect(id).toMatch(/^[a-f0-9-]{36}$/);
  const directory = path.resolve(process.env.JOB_EVIDENCE_DIRECTORY);
  fs.mkdirSync(directory, { recursive: true });
  const observations = [];
  let resolveObservation, rejectObservation;
  const done = new Promise((resolve, reject) => { resolveObservation = resolve; rejectObservation = reject; });
  // Replay a normal same-origin authenticated request to the already observed job URL.
  // No header/token values are read, extracted, logged, or persisted.
  await page.route(`https://api.rhombusai.com/api/dataset/analyzer/v2/projects/${settings.projectId}/nodes`, async route => {
    try {
      const original = await route.fetch();
      await expect.poll(async () => {
        const response = await route.fetch({ url: `https://api.rhombusai.com/api/background_jobs/jobs/${id}/` });
        expect(response.status()).toBe(200);
        const job = await response.json();
        expect(job.id || job.job_id).toBe(id);
        const messages = [];
        const inspect = value => {
          if (typeof value === 'string') {
            const match = value.match(/ValueError:\s*(INPUT_TYPE_PROBE\s*\{[^\r\n]+\})/);
            if (match) messages.push(match[1].slice(0, 1000));
          } else if (value && typeof value === 'object') Object.values(value).forEach(inspect);
        };
        inspect(job.result);
        const codeEvidence = {};
        for (const key of ['llm_codegen_final_code', 'llm_codegen_current_code', 'llm_codegen_code_source']) {
          if (job.result && job.result[key] !== undefined) codeEvidence[key] = job.result[key];
        }
        fs.writeFileSync(path.join(directory, 'codegen-evidence.json'), JSON.stringify(codeEvidence, null, 2));
        observations.push({ observed_at: new Date().toISOString(), job_id: id, status: job.status,
          result_type: typeof job.result, result_keys: job.result && typeof job.result === 'object' ? Object.keys(job.result) : [], messages });
        fs.writeFileSync(path.join(directory, 'continued-job-observation.json'), JSON.stringify(observations, null, 2));
        return ['SUCCESS', 'FAILED', 'CANCELLED', 'REVOKED'].includes(job.status);
      }, { timeout: 300000, intervals: [5000] }).toBe(true);
      await route.fulfill({ response: original });
      resolveObservation();
    } catch (error) {
      await route.abort().catch(() => {});
      rejectObservation(error);
    }
  }, { times: 1 });
  await page.goto(`/workflow/${settings.projectId}`, { waitUntil: 'domcontentloaded' });
  await done;
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
