/**
 * Smoke Tests - Health Check
 *
 * Fast tests that verify all routes render without errors.
 * These are the minimal tests to ensure the app is working.
 */

import { test, expect } from '@playwright/test';
import { PUBLIC_ROUTES } from '../../helpers/routes';

test.describe('Smoke Tests - Public Routes Render', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route.name} page (${route.path}) renders`, async ({ page }) => {
      const response = await page.goto(route.path);

      // Should return 200 OK (or redirect which is also fine)
      expect(response?.status()).toBeLessThan(400);

      // Page should have visible content
      await expect(page.locator('body')).toBeVisible();
      await expect(page.getByText('ThinkHaven is a decision design system')).toHaveCount(0);

      // Should have a page title
      const hasTitle = await page.title();
      expect(hasTitle.length).toBeGreaterThan(0);
    });
  }

  test('guest trial route shows the canonical trial promise', async ({ page }) => {
    await page.goto('/try');
    await expect(page.getByText(/10 free messages/i).first()).toBeVisible();
    await expect(page.getByText('ThinkHaven is a decision design system')).toHaveCount(0);
  });
});
