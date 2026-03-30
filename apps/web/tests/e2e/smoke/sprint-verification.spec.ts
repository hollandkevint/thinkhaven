import { test, expect } from '@playwright/test';

test.describe('Sprint 0-3 Verification', () => {
  test('Pricing page loads with two tiers', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.locator('h1')).toContainText('pricing');
    // Use text locators — h2 headings with exact text
    await expect(page.getByText('Free', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Pro', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Get started free')).toBeVisible();
  });

  test('Guest chat page loads with chat interface', async ({ page }) => {
    await page.goto('/try');
    await expect(page.locator('textarea')).toBeVisible();
    await expect(page.getByText('Try before you sign up')).toBeVisible();
  });

  test('Login page has forgot password link', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Forgot password?')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('Protected routes redirect to login', async ({ page }) => {
    await page.goto('/app');
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('/login');
  });

  test('Landing page loads and has CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();
    // Landing page should have at least one actionable button or link
    const ctaCount = await page.locator('a[href="/signup"], a[href="/try"], button:has-text("Get Started"), button:has-text("Try")').count();
    expect(ctaCount).toBeGreaterThan(0);
  });

  test('Guest chat header has sign up button', async ({ page }) => {
    await page.goto('/try');
    // Sign up is a button on /try, not a link
    await expect(page.getByRole('button', { name: 'Sign up' })).toBeVisible();
  });
});
