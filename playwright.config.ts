import { defineConfig } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://brickbanq.au';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 120000,
  retries: 2,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'tests/report', open: 'never' }],
    ['json', { outputFile: 'tests/report/results.json' }],
  ],
  use: {
    baseURL: BASE_URL,
    headless: true,
    slowMo: 300,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 800 },
    actionTimeout: 20000,
    navigationTimeout: 45000,
  },
  outputDir: './tests/screenshots',
});
