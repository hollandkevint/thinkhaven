# Feature Landscape: Beta Access Gating

**Domain:** Beta launch access control for SaaS
**Researched:** 2026-01-29
**Scale:** 100 beta users
**Confidence:** HIGH (verified with Supabase docs, common SaaS patterns)

## Current State

ThinkHaven uses Supabase Auth with:
- Email/password authentication
- Google OAuth
- No access restrictions - anyone can sign up and use the app immediately

**Gap:** Need to collect waitlist, manually approve users, gate access for unapproved signups.

---

## Table Stakes

Features users expect from a beta-gated product. Missing = product feels unprofessional or broken.

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| **Waitlist signup form** | Users need a way to express interest | Low | Landing page | Email + optional fields |
| **Waitlist storage** | Can't approve what you can't see | Low | Supabase table | `waitlist_signups` table |
| **Manual approval workflow** | Founder needs to control who gets in | Low | Admin access | Can be Supabase dashboard initially |
| **Access gate on signup** | Unapproved users shouldn't reach the app | Medium | Supabase auth hooks | Block signup OR block app access |
| **Approval notification** | Users need to know when they're in | Low | Email service | Simple "you're approved" email |
| **Clear messaging** | Users must understand they're waitlisted | Low | UI copy | "Thanks! We'll email you when ready" |

### Implementation Notes

**Access Gate Options (pick one):**

1. **Block at signup** (Supabase `before-user-created` hook)
   - Pros: Clean, users can't create accounts until approved
   - Cons: Requires approved email list, OAuth users need pre-registration
   - Complexity: Medium

2. **Block at app access** (RLS + user role)
   - Pros: Users can sign up, you approve later
   - Cons: More moving parts, users might be confused
   - Complexity: Medium-High

3. **Invite codes** (code required at signup)
   - Pros: Simple, self-service after code issued
   - Cons: Codes can leak, no email verification
   - Complexity: Low

**Recommendation for 100 users:** Option 2 (block at app access). Users sign up normally, you flip a flag in their profile to approve. Simpler than managing an approved email list, and you can batch-approve from Supabase dashboard.

---

## Nice-to-Have

Differentiators that improve the experience but can ship without for 100 users.

| Feature | Value | Complexity | Dependencies | Skip Rationale |
|---------|-------|------------|--------------|----------------|
| **Waitlist position display** | Reduces anxiety, gamification | Medium | Queue tracking | 100 users don't need position anxiety |
| **Referral system** | Viral growth | High | Referral tracking, rewards | Overkill for controlled beta |
| **Admin dashboard UI** | Better than SQL queries | Medium | Admin routes | Supabase dashboard works for 100 |
| **Automated approval emails** | Less manual work | Low | Email templates | Can copy-paste for 100 users |
| **Waitlist analytics** | Conversion tracking | Medium | Analytics setup | Nice but not blocking |
| **Priority access tiers** | VIP early access | Medium | Tier logic | Complexity without clear benefit |
| **Self-service invite codes** | Approved users invite friends | High | Code generation, limits | Growth feature, not beta feature |

### When to Add These

- **Waitlist position:** When you have 500+ signups and want engagement
- **Referral system:** When you're ready for viral growth (post-PMF)
- **Admin dashboard:** When you're approving 10+ users/day
- **Analytics:** When you care about funnel optimization

---

## Anti-Features

Features to deliberately NOT build. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Automatic approval based on criteria** | Adds complexity, edge cases | Manual approval is fine for 100 users |
| **Complex tiered waitlist** | Over-engineering | Single queue, FIFO or manual pick |
| **Real-time waitlist position** | Creates anxiety, maintenance burden | Static "you're on the list" is fine |
| **Public waitlist count** | Vanity metric, can backfire if low | Optional, but don't build for it |
| **Complex invite code system** | Leaked codes, fraud prevention | Simple approved email list |
| **Social login gating** | OAuth complicates email-based approval | Allow signup, gate at app level |
| **Waitlist SaaS integration** | External dependency, cost | Roll your own for 100 users |

### Why Anti-Features Matter

Each anti-feature adds:
- Development time (days you could spend on core product)
- Maintenance burden (bugs, edge cases)
- Complexity (more code = more problems)

For 100 users, simpler is better. You can always add sophistication later.

---

## Feature Dependencies

```
Waitlist Form
     │
     ▼
Waitlist Storage ──────────────────────┐
     │                                 │
     ▼                                 ▼
Manual Approval ◄───────────── Access Gate (enforces approval)
     │
     ▼
Approval Notification
```

**Critical path:** Waitlist Form → Storage → Access Gate → Approval Notification

The manual approval step happens in Supabase dashboard (no UI needed initially).

---

## MVP Recommendation

For 100-user beta, prioritize:

1. **Waitlist signup form** on landing page (capture interest)
2. **Waitlist table** in Supabase (store signups)
3. **User approval flag** in auth.users metadata or profile table
4. **Access gate** - check approval flag before showing app
5. **Manual email** when approving (can automate later)

**Total scope:** ~1-2 days of work

### Defer to Post-Beta

- Admin dashboard UI (use Supabase dashboard)
- Automated emails (copy-paste is fine for 100)
- Waitlist analytics (not needed yet)
- Referral system (growth feature, not beta feature)
- Position tracking (adds anxiety, not value)

---

## Technical Implementation Pattern

Based on Supabase docs and ThinkHaven's existing auth:

### Option A: Profile-Based Gating (Recommended)

```sql
-- Add approval column to existing user profile or create beta_access table
CREATE TABLE public.beta_access (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  waitlist_signup_at TIMESTAMPTZ,
  notes TEXT
);

-- RLS policy: users can only see their own record
ALTER TABLE public.beta_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own beta status" ON public.beta_access
  FOR SELECT USING (auth.uid() = user_id);
```

**App-side check:**
```typescript
// In protected route or layout
const { data: betaAccess } = await supabase
  .from('beta_access')
  .select('approved_at')
  .eq('user_id', user.id)
  .single();

if (!betaAccess?.approved_at) {
  redirect('/waitlist-pending');
}
```

### Option B: Auth Hook Gating (More Restrictive)

Uses Supabase `before-user-created` hook to block signups unless email is pre-approved. More complex, requires maintaining approved email list before users can sign up.

**Recommendation:** Option A is simpler for 100 users. Users can sign up immediately, you approve them in Supabase dashboard by inserting a row with `approved_at` timestamp.

---

## Sources

- [Supabase Before User Created Hook](https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook) - HIGH confidence (official docs)
- [Supabase RBAC](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac) - HIGH confidence (official docs)
- [LivePlan SaaS Beta Launch](https://www.liveplan.com/blog/starting/saas-beta-launch) - MEDIUM confidence (industry blog)
- [Waitlister](https://waitlister.me/) - MEDIUM confidence (product reference)
- [Orb Feature Gating](https://www.withorb.com/blog/feature-gating) - MEDIUM confidence (industry blog)
- [Instabug Beta Launch Checklist](https://www.instabug.com/blog/beta-launch-checklist) - MEDIUM confidence (industry blog)
