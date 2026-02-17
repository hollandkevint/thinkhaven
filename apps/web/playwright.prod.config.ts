/**
 * Playwright config for running smoke tests against production.
 * No local webServer, no globalSetup (env files not needed).
 *
 * Usage: npm run test:prod
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'https://thinkhaven.co',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  testMatch: '**/*.spec.ts',
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
