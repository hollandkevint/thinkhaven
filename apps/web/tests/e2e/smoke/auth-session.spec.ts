import { test, expect } from '@playwright/test';

const EMAIL = process.env.TEST_ADMIN_EMAIL || '';
const PASSWORD = process.env.TEST_ADMIN_PASSWORD || '';

test.describe('Authenticated Session - test-admin', () => {
  test('login, access /app, create session, and send message', async ({ page }) => {
    test.skip(!EMAIL || !PASSWORD, 'TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD env vars required');
    test.setTimeout(120000);

    // Step 1: Login
    await page.goto('/login');
    await page.fill('input[name="email"]', EMAIL);
    await page.fill('input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');

    // Step 2: Should reach /app (not /waitlist)
    await page.waitForURL('**/app**', { timeout: 15000 });
    expect(page.url()).not.toContain('waitlist');
    console.log('PASS: Dashboard loaded:', page.url());

    // Step 3: Click "New Session"
    await page.waitForLoadState('networkidle');
    const newSessionBtn = page.getByRole('button', { name: /new session/i }).first();
    await expect(newSessionBtn).toBeVisible({ timeout: 10000 });
    await newSessionBtn.click();
    console.log('PASS: Clicked New Session button');

    // Step 4: Wait for session creation and redirect
    console.log('Waiting for session creation...');
    await page.waitForURL('**/app/session/**', { timeout: 30000 });
    console.log('PASS: Session created:', page.url());

    // Step 5: Wait for page to fully hydrate — look for the workspace header or tab bar
    await page.waitForLoadState('networkidle');
    const maryChatTab = page.locator('button', { hasText: 'Mary Chat' }).first();
    await expect(maryChatTab).toBeVisible({ timeout: 15000 });
    console.log('PASS: Session page hydrated');
    await page.screenshot({ path: '/tmp/thinkhaven-01-session.png', fullPage: true });

    // Step 6: Switch to Mary Chat tab (default may be BMad Method)
    await maryChatTab.click();
    await page.waitForTimeout(500);
    console.log('PASS: Clicked Mary Chat tab');

    // Step 7: Find the chat textarea by placeholder
    const chatInput = page.locator('textarea[placeholder*="strategic question"]');
    await expect(chatInput).toBeVisible({ timeout: 10000 });
    console.log('PASS: Chat input found');
    await page.screenshot({ path: '/tmp/thinkhaven-02-chat-ready.png', fullPage: true });

    // Step 8: Type and send a message
    await chatInput.fill('Hello, this is a test message. What can you help me with?');
    const sendBtn = page.getByRole('button', { name: /send/i }).first();
    await expect(sendBtn).toBeEnabled({ timeout: 3000 });
    await sendBtn.click();
    console.log('PASS: Message sent — waiting for response...');
    await page.screenshot({ path: '/tmp/thinkhaven-03-sent.png', fullPage: true });

    // Step 9: Wait for assistant response (look for the Mary avatar + response bubble)
    // The streaming response creates an assistant message div
    const assistantMessage = page.locator('.flex.justify-start .rounded-xl').last();
    await expect(assistantMessage).toBeVisible({ timeout: 30000 });
    // Wait a bit more for streaming to finish
    await page.waitForTimeout(10000);
    await page.screenshot({ path: '/tmp/thinkhaven-04-response.png', fullPage: true });
    console.log('PASS: Assistant response received');

    // Step 10: Verify no limit messages
    const pageText = await page.textContent('body');
    const hasLimitMsg = pageText?.includes('MESSAGE_LIMIT') || pageText?.includes('limit reached');
    console.log('Contains limit message:', hasLimitMsg);
    expect(hasLimitMsg).toBeFalsy();

    console.log('PASS: Full auth session test complete');
  });
});
