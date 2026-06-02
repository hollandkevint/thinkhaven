/**
 * Smoke Tests - Health Check
 *
 * Fast tests that verify all routes render without errors.
 * These are the minimal tests to ensure the app is working.
 */

import { test, expect } from '@playwright/test';
import { PUBLIC_ROUTES, ROUTES, getLegacyRedirect } from '../../helpers/routes';

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
    await page.goto(ROUTES.try);
    await expect(page.getByText(/10 free messages/i).first()).toBeVisible();
    await expect(page.getByText('ThinkHaven is a decision design system')).toHaveCount(0);
  });

  test('plan-grill trial route shows the plan-grill welcome', async ({ page }) => {
    await page.goto(ROUTES.tryPlanGrill);
    await expect(page.getByText(/grill a pasted plan/i).first()).toBeVisible();
    await expect(page.getByText(/What plan should we grill/i)).toBeVisible();
    await expect(page.getByText(/10 free messages/i).first()).toBeVisible();
    await expect(page.getByRole('textbox')).toHaveAttribute('placeholder', /Paste a plan or answer Mary/i);
  });

  const mobileTrialRoutes = [
    { name: 'guest trial', path: ROUTES.try },
    { name: 'plan-grill trial', path: ROUTES.tryPlanGrill },
  ];

  for (const route of mobileTrialRoutes) {
    test(`${route.name} route does not overflow on mobile`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(route.path);
      await expect(page.getByText(/10 free messages/i).first()).toBeVisible();
      await expect(page.getByRole('textbox')).toBeVisible();

      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
          )
        )
        .toBe(true);
    });
  }

  test('pricing route aligns trial and saved session copy', async ({ page }) => {
    await page.goto(ROUTES.pricing);
    await expect(page.getByText(/10 messages with Mary before signup/i)).toBeVisible();
    await expect(page.getByText(/10 saved sessions, one-time/i)).toBeVisible();
    await expect(page.getByText(/Most Popular/i)).toHaveCount(0);
  });

  test('landing navigation keeps one beta mark and exposes beta access', async ({ page }) => {
    await page.goto(ROUTES.landing);
    await expect(page.getByText(/^Beta$/i)).toHaveCount(1);
    // Beta access is exposed in the desktop nav ("Beta access") and the hero copy ("beta access list");
    // role queries skip the display:none desktop link on mobile, so the first visible one is asserted.
    const betaAccess = page.getByRole('link', { name: /beta access/i }).first();
    await expect(betaAccess).toBeVisible();
    await expect(betaAccess).toHaveAttribute('href', ROUTES.waitlist);
  });

  test('waitlist route explains the beta access list', async ({ page }) => {
    await page.goto(ROUTES.waitlist);
    // Exact match targets the section heading, not the recovery-state h1 ("We could not check the beta access list").
    await expect(page.getByRole('heading', { name: 'Beta access list', exact: true })).toBeVisible();
    await expect(page.getByText(/saved workspace/i).first()).toBeVisible();
  });

  test('assessment results has a restart path without stored quiz state', async ({ page }) => {
    await page.goto(ROUTES.assessmentResults);
    await expect(page.getByRole('heading', { name: /no decision readiness scorecard found/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /take assessment/i })).toHaveAttribute('href', ROUTES.assessment);
    await expect(page.getByRole('link', { name: /try mary instead/i })).toHaveAttribute('href', ROUTES.try);
  });

  test.describe('Legacy route redirects', () => {
    const legacyCases = [
      { name: 'dashboard', path: ROUTES.legacy.dashboard },
      { name: 'workspace', path: ROUTES.legacy.workspace('11111111-1111-1111-1111-111111111111') },
      { name: 'account', path: ROUTES.legacy.account },
      { name: 'bmad', path: ROUTES.legacy.bmad },
    ];

    for (const legacyRoute of legacyCases) {
      test(`${legacyRoute.name} redirects to the current route`, async ({ page }) => {
        const expected = getLegacyRedirect(legacyRoute.path);
        expect(expected).not.toBeNull();

        await page.goto(legacyRoute.path);
        await page.waitForFunction((target) => {
          const current = window.location.pathname;
          const search = new URLSearchParams(window.location.search);
          return current === target || search.get('redirect') === target;
        }, expected);
      });
    }
  });
});
