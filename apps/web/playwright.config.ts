import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  globalSetup: './tests/config/global-setup.ts',

  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
    process.env.CI ? ['github'] : ['line'],
  ],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // Only run .spec.ts files (exclude .test.ts which are Vitest unit tests)
  testMatch: '**/*.spec.ts',
  // beta-checklist.spec.ts is production verification (auth-dependent, run via `npm run test:prod`
  // against thinkhaven.co). It cannot pass against a local server without a real session, so it is
  // excluded from the local smoke gate. Public-route coverage lives in health.spec.ts.
  testIgnore: '**/beta-checklist.spec.ts',

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
