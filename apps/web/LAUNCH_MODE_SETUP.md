# Launch Mode Setup Guide

This guide explains how to configure ThinkHaven for the SLC (Simple, Lovable, Complete) launch period.

## What is Launch Mode?

Launch Mode is a temporary configuration that:
- **Bypasses the credit system** - Users can create unlimited sessions
- **Enforces 20-message limits per session** - Prevents sessions from becoming overwhelming
- **Prepares for Stripe integration** - All infrastructure is in place, just bypassed

This allows you to:
- Test with 10+ users from your network
- Gather feedback on the core experience
- Avoid Stripe complexity until you hit 100 sessions

## Setup Instructions

### 1. Apply Database Migration

Run migration 008 to add message limit tracking:

```bash
# Option A: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy contents of apps/web/supabase/migrations/008_add_message_limits.sql
4. Run the migration
5. Verify success in the output

# Option B: Using Supabase CLI (if installed)
cd apps/web
supabase db push
```

**Verify migration succeeded:**
```sql
-- Run this query in Supabase SQL Editor
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'bmad_sessions'
AND column_name IN ('message_count', 'message_limit', 'limit_reached_at');

-- Should return 3 rows
```

### 2. Set Environment Variables

#### Local Development (.env.local)

Create or update `apps/web/.env.local`:

```bash
# Copy from example
cp .env.example .env.local

# Ensure this line exists:
NEXT_PUBLIC_LAUNCH_MODE=true
```

#### Vercel Production

Set the environment variable in Vercel:

```bash
# Option A: Using Vercel CLI
cd apps/web
vercel env add NEXT_PUBLIC_LAUNCH_MODE production
# When prompted, enter: true

# Option B: Using Vercel Dashboard
1. Go to https://vercel.com/your-project/settings/environment-variables
2. Add new variable:
   - Key: NEXT_PUBLIC_LAUNCH_MODE
   - Value: true
   - Environment: Production
3. Redeploy to apply changes
```

**Important:** This is a `NEXT_PUBLIC_` variable, which means it's included in the client bundle. Users can technically see it, but that's fine - it just controls feature flags.

### 3. Redeploy to Production

After setting the environment variable:

```bash
# Trigger a new deployment
cd apps/web
git commit -am "Enable launch mode for SLC launch"
git push origin main

# Or use Vercel CLI
vercel --prod
```

### 4. Verify Setup

Test that everything is working:

#### Check 1: Credit System Bypassed
1. Sign up with a new test account
2. Start a new "New Idea" session
3. **Expected:** Session starts immediately (no credit deduction)
4. Check server logs: Should see `[LAUNCH_MODE] Bypassing credit check`

#### Check 2: Message Limits Working
1. In the same session, send 10-15 messages
2. **Expected:** No warnings yet (threshold is 5 remaining)
3. Send 5 more messages (15 total)
4. **Expected:** Yellow warning banner appears: "5 messages remaining"
5. Send 5 more messages (20 total)
6. **Expected:** Red error banner: "Message Limit Reached" with export options

#### Check 3: Limit Status in API
1. Open browser DevTools → Network tab
2. Send a message in your session
3. Find the `/api/chat/stream` request
4. Check the response includes `limitStatus` in metadata
5. **Expected:** JSON like:
   ```json
   {
     "limitStatus": {
       "currentCount": 15,
       "messageLimit": 20,
       "remaining": 5,
       "limitReached": false,
       "warningThreshold": true
     }
   }
   ```

### 5. Integrate Warning UI (Optional)

If your chat interface doesn't already use the warning components, add them:

```tsx
// In your chat/workspace component
import { MessageLimitWarning, MessageCounterBadge } from '@/app/components/chat/MessageLimitWarning';
import { checkMessageLimit } from '@/lib/session/message-limit-manager';

// Fetch limit status after each message
const [limitStatus, setLimitStatus] = useState(null);

useEffect(() => {
  async function fetchLimit() {
    if (sessionId) {
      const status = await checkMessageLimit(sessionId);
      setLimitStatus(status);
    }
  }
  fetchLimit();
}, [messageCount, sessionId]);

// Render in your chat UI
<div className="chat-container">
  <MessageLimitWarning
    limitStatus={limitStatus}
    onExport={() => router.push('/export')}
    onNewSession={() => router.push('/dashboard')}
  />
  {/* Your chat messages */}
</div>

// Optional: Add counter badge in header
<div className="chat-header">
  <h1>ThinkHaven Session</h1>
  <MessageCounterBadge limitStatus={limitStatus} />
</div>
```

## How It Works

### Credit System Bypass

**Before (Production Mode):**
```typescript
// User starts session → Check credits → Deduct 1 credit → Create session
const hasCredits = await hasCredits(userId, 1);
if (!hasCredits) throw new Error('Insufficient credits');
await deductCredit(userId, sessionId);
```

**During Launch Mode:**
```typescript
// User starts session → Skip credit check → Create session
const isLaunchMode = process.env.NEXT_PUBLIC_LAUNCH_MODE === 'true';
if (isLaunchMode) return true; // Bypass!
```

### Message Limit Enforcement

1. **Message sent** → API checks `canSendMessage(sessionId)`
2. If limit reached → Return 429 error with export options
3. If under limit → Process message normally
4. **After message processed** → Increment count: `incrementMessageCount(sessionId)`
5. Return `limitStatus` in API response metadata
6. Frontend shows warnings based on remaining messages

### Database Schema

Migration 008 adds to `bmad_sessions`:
```sql
message_count INTEGER DEFAULT 0      -- Current message count
message_limit INTEGER DEFAULT 20     -- Configurable limit
limit_reached_at TIMESTAMPTZ         -- When limit was hit
```

Plus two RPC functions:
- `increment_message_count(session_id)` - Atomically increment + check limit
- `check_message_limit(session_id)` - Get current limit status

## Removing Launch Mode (Post-100 Sessions)

When you're ready to integrate Stripe:

1. **Set environment variable to false:**
   ```bash
   # Vercel
   vercel env rm NEXT_PUBLIC_LAUNCH_MODE production
   vercel env add NEXT_PUBLIC_LAUNCH_MODE production
   # Enter: false

   # Local
   # In .env.local, change to:
   NEXT_PUBLIC_LAUNCH_MODE=false
   ```

2. **Remove bypass code (optional cleanup):**
   ```typescript
   // In credit-manager.ts, remove these blocks:
   const isLaunchMode = process.env.NEXT_PUBLIC_LAUNCH_MODE === 'true';
   if (isLaunchMode) { /* ... */ }
   ```

3. **Keep message limits (optional):**
   - Message limits can be tied to credit tiers
   - Free tier: 10 messages/session
   - Paid tier: Unlimited
   - Just update the logic in `message-limit-manager.ts`

4. **Migrate existing sessions:**
   - Sessions created during launch mode have no credit transaction
   - That's fine - they're complete or abandoned
   - New sessions will use the credit system normally

## Monitoring

Track launch mode effectiveness:

```sql
-- Sessions created during launch mode (no credit transaction)
SELECT COUNT(*)
FROM bmad_sessions
WHERE created_at > '2025-11-14'  -- Launch date
AND NOT EXISTS (
  SELECT 1 FROM credit_transactions
  WHERE session_id = bmad_sessions.id
);

-- Average messages per session
SELECT AVG(message_count) as avg_messages
FROM bmad_sessions
WHERE created_at > '2025-11-14';

-- Sessions that hit the limit
SELECT COUNT(*)
FROM bmad_sessions
WHERE limit_reached_at IS NOT NULL;
```

## Troubleshooting

### "Credit system still blocking sessions"
- Check `NEXT_PUBLIC_LAUNCH_MODE` is set to `'true'` (string, not boolean)
- Verify it's in Vercel environment (not just local)
- Check browser console: You should see `[LAUNCH_MODE]` logs
- Redeploy after adding the env var

### "Message limits not working"
- Verify migration 008 ran successfully
- Check `bmad_sessions` table has new columns
- Verify functions exist: `SELECT * FROM information_schema.routines WHERE routine_name LIKE 'message%'`
- Check session exists: Message limits only work if there's an active `bmad_sessions` record

### "Warning UI not showing"
- Check that `MessageLimitWarning` component is imported and rendered
- Verify `limitStatus` is being fetched from API response
- Check browser console for errors
- Verify `isMessageLimitEnabled()` returns `true`

## Support

If you encounter issues:
1. Check server logs for `[LAUNCH_MODE]` or `[MESSAGE_LIMIT]` logs
2. Verify environment variables: `echo $NEXT_PUBLIC_LAUNCH_MODE`
3. Test locally first before deploying to production
4. Open DevTools → Network tab to inspect API responses

---

**Ready to launch!** 🚀

Once setup is complete, you're ready to share ThinkHaven with your network.
