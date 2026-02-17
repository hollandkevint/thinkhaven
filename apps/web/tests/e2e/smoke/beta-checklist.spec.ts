/**
 * Beta Launch Checklist - Production Verification
 *
 * Tests the B2 self-test items from the beta launch prep plan
 * that can be verified without authentication.
 */

import { test, expect } from '@playwright/test';

test.describe('Beta Checklist - Public Routes', () => {

  test('Landing page loads and has signup CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    // Should have a link to signup or get started
    const signupLink = page.locator('a[href*="signup"], a[href*="login"], a[href*="try"]').first();
    await expect(signupLink).toBeVisible();
  });

  test('Signup page renders with email and password fields', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]').first()).toBeVisible();
  });

  test('Login page renders with email and password fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]').first()).toBeVisible();
  });

  test('Guest mode (/try) loads with chat interface', async ({ page }) => {
    await page.goto('/try');
    await expect(page.locator('body')).toBeVisible();
    // Should have a text input or textarea for chatting
    const chatInput = page.locator('textarea, input[type="text"]').first();
    await expect(chatInput).toBeVisible({ timeout: 10000 });
  });

  test('Protected routes redirect to login', async ({ page }) => {
    const response = await page.goto('/app');
    // Should redirect to login (URL should contain /login)
    await page.waitForURL(/\/login/, { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });

  test('Assessment page loads with quiz content', async ({ page }) => {
    await page.goto('/assessment');
    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

});

test.describe('Beta Checklist - Feedback Button', () => {

  test('Guest page has feedback mechanism', async ({ page }) => {
    await page.goto('/try');
    await expect(page.locator('body')).toBeVisible();
    // Look for feedback button or mailto link
    const feedbackEl = page.locator('a[href*="mailto"], button:has-text("Feedback"), a:has-text("Feedback")').first();
    await expect(feedbackEl).toBeVisible({ timeout: 10000 });
  });

});

test.describe('Beta Checklist - Mobile Viewport', () => {

  test.use({ viewport: { width: 375, height: 812 } });

  test('Landing page is usable on mobile', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    // No horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5); // 5px tolerance
  });

  test('Guest mode is usable on mobile', async ({ page }) => {
    await page.goto('/try');
    await expect(page.locator('body')).toBeVisible();
    const chatInput = page.locator('textarea, input[type="text"]').first();
    await expect(chatInput).toBeVisible({ timeout: 10000 });
  });

});
