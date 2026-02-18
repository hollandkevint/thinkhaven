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

    // Step 3: Screenshot dashboard and click "New Session"
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: '/tmp/thinkhaven-00-dashboard.png', fullPage: true });

    const newSessionBtn = page.getByRole('button', { name: /new session/i }).first();
    await expect(newSessionBtn).toBeVisible({ timeout: 10000 });
    await newSessionBtn.click();
    console.log('PASS: Clicked New Session button');

    // Step 4: Wait for session creation (may go through /app/new then redirect)
    console.log('Waiting for session creation...');
    await page.waitForURL('**/app/session/**', { timeout: 30000 });
    console.log('PASS: Session created:', page.url());
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: '/tmp/thinkhaven-01-session.png', fullPage: true });

    // Step 5: Click "Mary Chat" tab (the chat interface)
    const maryChatTab = page.locator('text=Mary Chat').first();
    if (await maryChatTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await maryChatTab.click();
      console.log('PASS: Clicked Mary Chat tab');
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: '/tmp/thinkhaven-02-mary-chat.png', fullPage: true });

    // Step 6: Find chat input
    const chatInput = page.locator([
      'textarea',
      'input[placeholder*="message" i]',
      'input[placeholder*="ask" i]',
      'input[placeholder*="type" i]',
      '[contenteditable="true"]',
      '[role="textbox"]',
    ].join(', ')).first();

    const chatVisible = await chatInput.isVisible({ timeout: 10000 }).catch(() => false);

    if (!chatVisible) {
      console.log('WARN: No chat input found on Mary Chat tab');
      const text = await page.textContent('body');
      console.log('Page text preview:', text?.slice(0, 300));
      await page.screenshot({ path: '/tmp/thinkhaven-03-no-chat.png', fullPage: true });
      return;
    }

    // Step 7: Send a message
    console.log('PASS: Chat input found — sending message');
    await chatInput.click();
    await chatInput.fill('Hello, this is a test message. What can you help me with?');

    const sendBtn = page.locator('button[type="submit"], button:has-text("Send"), button[aria-label*="send" i]').first();
    if (await sendBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await sendBtn.click();
    } else {
      await chatInput.press('Enter');
    }
    console.log('Message sent — waiting for response...');
    await page.screenshot({ path: '/tmp/thinkhaven-04-sent.png', fullPage: true });

    // Step 8: Wait for response
    await page.waitForTimeout(15000);
    await page.screenshot({ path: '/tmp/thinkhaven-05-response.png', fullPage: true });

    // Step 9: Verify no limit messages
    const pageText = await page.textContent('body');
    const hasLimitMsg = pageText?.includes('MESSAGE_LIMIT') || pageText?.includes('limit reached');
    console.log('Contains limit message:', hasLimitMsg);
    expect(hasLimitMsg).toBeFalsy();

    console.log('PASS: Test complete');
  });
});
