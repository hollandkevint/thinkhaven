# ThinkHaven SLC Launch Checklist

**Goal:** Share ThinkHaven with your network for initial testing (target: 100 sessions with 10-message limits).

**Status:** ✅ Implementation complete - Ready for testing and deployment

---

## Implementation Summary

### What Was Built (Past 30 minutes)

1. **Launch Mode Bypass** ([credit-manager.ts](lib/monetization/credit-manager.ts))
   - `NEXT_PUBLIC_LAUNCH_MODE=true` bypasses all credit checks
   - Sessions created without credit deduction
   - Console logs for debugging: `[LAUNCH_MODE] Bypassing credit check`

2. **Message Limit System** ([Migration 008](supabase/migrations/008_add_message_limits.sql))
   - New columns: `message_count`, `message_limit`, `limit_reached_at`
   - RPC functions: `increment_message_count()`, `check_message_limit()`
   - Default limit: 10 messages per session

3. **API Integration** ([route.ts](app/api/chat/stream/route.ts))
   - Checks message limit before processing
   - Returns 429 error when limit reached
   - Increments count after successful message
   - Returns `limitStatus` in response metadata

4. **Warning UI Components** ([MessageLimitWarning.tsx](app/components/chat/MessageLimitWarning.tsx))
   - `MessageLimitWarning`: Full banner with export/new session actions
   - `MessageCounterBadge`: Compact counter for chat header
   - Color-coded warnings: Yellow (5 remaining) → Orange (2 remaining) → Red (limit reached)

5. **Setup Documentation**
   - [LAUNCH_MODE_SETUP.md](LAUNCH_MODE_SETUP.md): Complete setup guide
   - [.env.example](.env.example): Updated with `NEXT_PUBLIC_LAUNCH_MODE`

---

## Pre-Launch Checklist (45-60 minutes)

### Phase 1: Database Setup (10 minutes)

- [ ] **Apply Migration 008**
  ```bash
  # In Supabase Dashboard → SQL Editor
  # Copy/paste: apps/web/supabase/migrations/008_add_message_limits.sql
  # Run migration
  ```

- [ ] **Verify Migration Success**
  ```sql
  -- Should return 3 rows
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'bmad_sessions'
  AND column_name IN ('message_count', 'message_limit', 'limit_reached_at');
  ```

### Phase 2: Environment Configuration (5 minutes)

- [ ] **Set Local Environment**
  ```bash
  cd apps/web
  echo "NEXT_PUBLIC_LAUNCH_MODE=true" >> .env.local
  ```

- [ ] **Set Vercel Production Environment**
  ```bash
  vercel env add NEXT_PUBLIC_LAUNCH_MODE production
  # When prompted, enter: true
  ```

### Phase 3: Local Testing (15 minutes)

- [ ] **Start dev server**
  ```bash
  npm run dev
  ```

- [ ] **Test Credit Bypass**
  1. Sign up with test email (e.g., test+launch1@yourdomain.com)
  2. Start "New Idea" session
  3. Expected: Session starts immediately (no credit error)
  4. Check terminal: Look for `[LAUNCH_MODE] Bypassing credit check`

- [ ] **Test Message Limits**
  1. In the session, send 5 messages (use short messages to speed up)
  2. Expected: No warnings yet
  3. Send 5 more messages (10 total)
  4. Expected: Yellow warning appears after message 5
  5. Try to send message 11
  6. Expected: Red error banner, message blocked

- [ ] **Test Limit Status in API**
  1. Open DevTools → Network tab
  2. Send a message
  3. Check `/api/chat/stream` response
  4. Verify `limitStatus` object exists in metadata

### Phase 4: Production Deployment (10 minutes)

- [ ] **Commit and Push**
  ```bash
  git add .
  git commit -m "✨ FEAT: Add launch mode with 10-message session limits

  - Bypass credit system via NEXT_PUBLIC_LAUNCH_MODE flag
  - Add message_count tracking to bmad_sessions (migration 008)
  - Implement 10-message limit enforcement in chat API
  - Add warning UI components for limit notifications
  - Create setup documentation for SLC launch period

  Goal: Enable 100-session testing period before Stripe integration"

  git push origin main
  ```

- [ ] **Verify Vercel Deployment**
  1. Wait for Vercel deploy to complete (watch GitHub Actions or Vercel dashboard)
  2. Check deployment logs for errors
  3. Verify env var is set: Vercel dashboard → Settings → Environment Variables

### Phase 5: Production Testing (10 minutes)

- [ ] **Test on Production URL (https://thinkhaven.co)**
  1. Sign up with new test account
  2. Start session → Verify immediate start (no credit error)
  3. Send 8-10 messages → Verify warnings appear
  4. Hit limit → Verify error message and export options

- [ ] **Cross-Browser Testing**
  - [ ] Desktop Chrome ✓
  - [ ] Mobile Safari (this is where auth breaks typically happen)
  - [ ] Desktop Firefox (optional)

- [ ] **Test Error States**
  1. Kill internet mid-session → Graceful error?
  2. Reconnect → Session resumes?
  3. Refresh page mid-session → State persists?

### Phase 6: Monitoring Setup (5 minutes)

- [ ] **Add to Vercel Dashboard**
  - Pin "Deployments" tab for quick access
  - Set up Vercel Slack/email notifications (optional)

- [ ] **Bookmark Monitoring Queries**
  ```sql
  -- Sessions during launch period
  SELECT COUNT(*), DATE(created_at) as date
  FROM bmad_sessions
  WHERE created_at > '2025-11-14'
  GROUP BY date
  ORDER BY date DESC;

  -- Average messages per session
  SELECT AVG(message_count) as avg_messages,
         MAX(message_count) as max_messages
  FROM bmad_sessions
  WHERE created_at > '2025-11-14';

  -- Sessions that hit limit
  SELECT COUNT(*) as sessions_hit_limit
  FROM bmad_sessions
  WHERE limit_reached_at IS NOT NULL;
  ```

---

## Launch Strategy

### Week 1: Soft Launch (3-5 users)

**Goal:** Find critical bugs before wider release

- [ ] **Day 1:** Share with 2-3 close colleagues
  - People who will give honest feedback
  - Ideally technical folks who can report issues clearly
  - Ask them to try 2-3 sessions each

- [ ] **Day 2-3:** Monitor and fix issues
  - Check Vercel logs daily
  - Run monitoring queries to see usage patterns
  - Fix any critical bugs before expanding

- [ ] **Day 4:** Expand to 2 more users if no major issues

### Week 2: Network Launch (10 users total)

**Goal:** Reach 100 sessions with diverse use cases

- [ ] **Share with 5 more people** (for a total of 10)
  - Product managers (will test strategy use cases)
  - Entrepreneurs (will test new idea pathway)
  - Mix of technical and non-technical

- [ ] **Ask for structured feedback:**
  ```
  Hey [Name],

  I'm testing the MVP of ThinkHaven - an AI strategic thinking partner.
  I'd love your feedback before the full launch.

  What to test:
  - Go to https://thinkhaven.co
  - Sign up and start a "New Idea" session
  - Work through a real business problem you have
  - Each session has a 10-message limit (this is intentional for focused work)

  What I'm looking for:
  1. Did Mary (the AI coach) help you think more clearly?
  2. Any bugs or confusing moments?
  3. Would you use this for strategy work?

  Takes 10-15 minutes. Thanks!

  - Kevin
  ```

### Success Metrics

**Target:** 100 sessions within 2-3 weeks

**Leading Indicators:**
- [ ] 50+ sessions completed (not just started)
- [ ] Average 7+ messages per session (engagement)
- [ ] <5% of sessions hit errors (stability)

**Feedback to Collect:**
- "Would you pay for this?" (willingness to pay)
- "What was most valuable?" (value prop validation)
- "What was confusing?" (UX issues)

---

## Troubleshooting Guide

### Problem: "Insufficient credits" error still appearing

**Fix:**
1. Verify `NEXT_PUBLIC_LAUNCH_MODE=true` in Vercel env vars
2. Redeploy: `vercel --prod`
3. Hard refresh browser (Cmd+Shift+R)
4. Check server logs for `[LAUNCH_MODE]` messages

### Problem: Message limits not working

**Fix:**
1. Verify migration 008 ran: Check `bmad_sessions` columns
2. Verify session exists: Query `bmad_sessions` for your test user
3. Check console logs for `[MESSAGE_LIMIT]` logs
4. Verify `NEXT_PUBLIC_LAUNCH_MODE=true` (limits only work in launch mode)

### Problem: Warning UI not showing

**Fix:**
1. Check that chat component fetches `limitStatus` from API
2. Verify `MessageLimitWarning` is imported and rendered
3. Check browser console for React errors
4. Ensure API response includes `limitStatus` in metadata

### Problem: Users hitting limits too quickly

**Adjust:**
```sql
-- Increase limit to 30 messages
UPDATE bmad_sessions
SET message_limit = 30
WHERE created_at > '2025-11-14';

-- Or change default for new sessions
ALTER TABLE bmad_sessions
ALTER COLUMN message_limit SET DEFAULT 30;
```

---

## Post-100 Sessions: Stripe Integration

When you're ready to add Stripe (after collecting 100 sessions of feedback):

1. **Keep the message limit infrastructure** - Tie to pricing tiers
   - Free tier: 10 messages/session
   - Pro tier: 50 messages/session
   - Enterprise: Unlimited

2. **Turn off launch mode:**
   ```bash
   vercel env rm NEXT_PUBLIC_LAUNCH_MODE production
   vercel env add NEXT_PUBLIC_LAUNCH_MODE production
   # Enter: false
   ```

3. **Re-enable credit system** - It's already built, just bypassed

4. **Optional cleanup:**
   - Remove `if (isLaunchMode)` blocks from [credit-manager.ts](lib/monetization/credit-manager.ts)
   - Keep message limit system (it's useful!)

---

## Quick Reference

**Key Files:**
- Launch mode bypass: [lib/monetization/credit-manager.ts](lib/monetization/credit-manager.ts)
- Message limits: [lib/session/message-limit-manager.ts](lib/session/message-limit-manager.ts)
- API integration: [app/api/chat/stream/route.ts](app/api/chat/stream/route.ts)
- Migration: [supabase/migrations/008_add_message_limits.sql](supabase/migrations/008_add_message_limits.sql)
- UI components: [app/components/chat/MessageLimitWarning.tsx](app/components/chat/MessageLimitWarning.tsx)

**Environment Variables:**
```bash
# Enable launch mode
NEXT_PUBLIC_LAUNCH_MODE=true

# Disable launch mode (post-100 sessions)
NEXT_PUBLIC_LAUNCH_MODE=false
```

**Build Commands:**
```bash
npm run dev          # Local development
npm run build        # Test production build
vercel --prod        # Deploy to production
```

**Monitoring:**
- Vercel logs: https://vercel.com/your-project/logs
- Supabase logs: https://supabase.com/dashboard/project/_/logs
- Session analytics: Run SQL queries in Supabase

---

## You're Ready! 🚀

**Next steps:**
1. Complete Pre-Launch Checklist above
2. Test locally (15 minutes)
3. Deploy to production (10 minutes)
4. Share with 2-3 close colleagues first
5. Monitor for 48 hours
6. Expand to 10 users from your network

**Timeline:** This should take 1-2 hours total, then you're live!

**Questions?** Check [LAUNCH_MODE_SETUP.md](LAUNCH_MODE_SETUP.md) for detailed troubleshooting.

Good luck with the launch! 🎉
