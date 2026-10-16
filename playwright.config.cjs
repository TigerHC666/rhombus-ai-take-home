const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: '.',
  testMatch: /(?:ui-tests|api-tests)\/.*\.spec\.cjs$/,
  timeout: 90000,
  expect: { timeout: 15000 },
  workers: 1,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: '.runtime/playwright-results.json' }]],
  use: {
    actionTimeout: 30000,
    navigationTimeout: 60000,
    baseURL: 'https://rhombusai.com',
    channel: 'chrome',
    viewport: { width: 1920, height: 1080 },
    trace: 'off',
    screenshot: 'off',
    video: process.env.RECORD_DEMO === '1' ? { mode: 'on', size: { width: 1280, height: 720 } } : 'off',
  },
});
