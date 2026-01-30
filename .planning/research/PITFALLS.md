# Beta Launch Pitfalls

**Project:** ThinkHaven
**Context:** 100-user beta launch for validation
**Researched:** 2026-01-29
**Confidence:** MEDIUM (WebSearch verified against multiple sources)

---

## Critical Pitfalls

Mistakes that cause failed beta or misleading data.

### Pitfall 1: Authentication Breaks Under Real Users

**What goes wrong:** Auth works in dev but fails with real email providers, edge cases, and varied browsers. Supabase email verification links don't work, sessions drop unexpectedly, OAuth providers reject callbacks.

**Why it happens:** Dev testing uses ideal conditions. Real users have:
- Corporate firewalls blocking Supabase email domain (`supabase.io`)
- Email tracking pixels that rewrite verification links
- Multiple devices with session conflicts
- OAuth state mismatches

**Consequences:**
- Users can't sign up (immediate churn)
- Users can't log back in (lost session data)
- Support load spikes while you're trying to collect feedback
- Beta users assume product is broken, not just auth

**Warning signs:**
- Zero confirmed users despite signups
- Support tickets all about "can't log in"
- Users mentioning "email never arrived"
- Session-related errors in Supabase logs

**Prevention:**
1. **Configure custom email provider** - Don't use Supabase default (blocked by many firewalls)
2. **Disable email tracking** if using external provider
3. **Test the full flow** - signup, email delivery, verification link, first login, session restore
4. **Create fallback auth** - magic link or manual verification for enterprise users

**Phase to address:** Phase 1 (before any users)

---

### Pitfall 2: No Access Control = Public Beta Chaos

**What goes wrong:** Anyone can sign up. Bots create fake accounts. Random internet strangers pollute your data. Competitors reverse-engineer your AI prompts.

**Why it happens:** "Open beta" seems faster to launch than invite system. You delay access control for post-beta.

**Consequences:**
- Feedback from non-target users (worthless data)
- Database filled with spam accounts
- API abuse (Claude costs spike)
- Security vulnerabilities exposed publicly

**Warning signs:**
- Signup spike from unexpected geographies
- Nonsense workspace content
- Claude API costs inconsistent with user count
- Sessions with zero meaningful interactions

**Prevention:**
1. **Implement invite-only access** - Whitelist beta emails in database
2. **Rate limit signups** - Max 5/day from same IP
3. **Require beta access code** - Simple password gate
4. **Manual approval queue** for signup requests

**Phase to address:** Phase 1 (critical gating)

---

### Pitfall 3: Collecting Feedback Nobody Will Act On

**What goes wrong:** You ask "how was your experience?" and get unusable responses. Feedback is vague ("it's confusing"), contradictory, or from users who didn't actually engage with the core value.

**Why it happens:**
- No structure to feedback collection
- Feedback at wrong moment (before "aha" moment)
- Questions are leading or too broad
- Survivorship bias - only hearing from users who stayed

**Consequences:**
- Wasted beta period with no actionable insights
- False confidence from positive but shallow feedback
- Missing critical issues because churned users didn't respond

**Warning signs:**
- High survey completion but low detail quality
- Feedback contradicts observed behavior
- No one mentions the core value prop
- Churned users ghost completely

**Prevention:**
1. **In-app feedback at key moments** - After first Mary session, after document generation
2. **Exit surveys for churned users** - "What prevented you from using ThinkHaven?"
3. **Ask specific questions** - "Did Mary challenge any of your assumptions?" not "Was Mary helpful?"
4. **Track behavior separately from stated preferences** - What they do vs what they say
5. **Seek disappointed feedback actively** - Low engagement users are most valuable

**Phase to address:** Phase 2 (feedback infrastructure before inviting users)

---

### Pitfall 4: Survivorship Bias Skews Validation

**What goes wrong:** Only engaged users give feedback. You conclude "users love Mary!" when actually 80% churned silently.

**Why it happens:**
- Active users are vocal, churned users are invisible
- Feedback mechanisms only capture engaged users
- Human tendency to seek confirming evidence

**Consequences:**
- False product-market fit signal
- Building for the 20% who already like it
- Missing the fixes that would convert the 80%
- Wasted runway on wrong features

**Warning signs:**
- High NPS from respondents but low overall retention
- Feedback is uniformly positive
- "Would be disappointed" > 40% but DAU is flat
- No one mentions problems you know exist

**Prevention:**
1. **Track non-responders separately** - How many users didn't give feedback?
2. **Exit interviews for churned users** - Even 5 calls reveals patterns
3. **Measure engagement before asking satisfaction** - Filter by actual usage
4. **A/B test your questions** - Ensure you're not leading the witness

**Phase to address:** Phase 3 (once you have users to track)

---

## Moderate Pitfalls

Mistakes that cause delays or waste time.

### Pitfall 5: Error States That Kill Trust

**What goes wrong:** Users hit a bug, see a white screen or generic error, assume product is broken, never return.

**Why it happens:**
- Error handling is tedious and deferred
- "Happy path" testing only
- No error tracking infrastructure

**Consequences:**
- Single bad experience loses user forever
- Can't diagnose what went wrong
- Support can't help users recover

**Warning signs:**
- Users report "it stopped working" with no details
- Blank screens in session recordings
- High bounce rate on specific pages
- Sentry/error tracking shows unhandled exceptions

**Prevention:**
1. **Every error needs a recovery path** - Clear message + action
2. **Log errors with context** - User ID, session state, last action
3. **Test the unhappy paths** - Network failure, timeout, invalid input
4. **Loading states for everything async** - Never leave user wondering

**Phase to address:** Phase 1 (polish before launch)

---

### Pitfall 6: Scope Creep From Feature Requests

**What goes wrong:** Beta users request features. You add them. Original validation goals get buried under implementation work.

**Why it happens:**
- Desire to please early adopters
- "Just one more feature" seems small
- No documented scope boundary

**Consequences:**
- Beta extends indefinitely
- Original hypothesis never tested
- Team burns out before launch
- Product bloats before proving core value

**Warning signs:**
- Sprint scope keeps growing
- Backlog grows faster than it shrinks
- "We'll launch after X" keeps moving
- Core metrics unchanged despite new features

**Prevention:**
1. **Document "not in beta" explicitly** - What you won't build yet
2. **Log requests but defer** - "Noted for post-beta"
3. **Validation-first filter** - "Does this help us learn if Mary helps?"
4. **Time-box beta** - Launch ends DATE, period

**Phase to address:** Set boundary in Phase 2, enforce throughout

---

### Pitfall 7: Missing Analytics = Flying Blind

**What goes wrong:** Users interact with the app but you don't know what they actually did. Can't tell if Mary helped because you only have "they logged in."

**Why it happens:**
- Analytics seems like "later" work
- Privacy concerns cause over-caution
- Tracking setup is boring

**Consequences:**
- Can't validate hypotheses
- Feedback contradicts (invisible) behavior
- Can't prioritize fixes without data

**Warning signs:**
- Can't answer "how many users completed a session?"
- Feedback says one thing, gut says another
- No idea where users drop off
- "I think users do X" with no data

**Prevention:**
1. **Track key moments, not everything** - Session start, Mary response, document generated, export
2. **Use free tier tools** - Mixpanel/Amplitude free is enough for 100 users
3. **Privacy-first approach** - Track events, not content
4. **Dashboard before inviting users** - If you can't see it, you can't learn from it

**Phase to address:** Phase 2 (before inviting users)

---

## Minor Pitfalls

Annoying but recoverable mistakes.

### Pitfall 8: Email Deliverability Issues

**What goes wrong:** Verification emails, magic links, or feedback requests go to spam.

**Prevention:**
- Use custom domain email
- Test with Gmail, Outlook, corporate email
- Warm up sending domain before beta

---

### Pitfall 9: Mobile Viewport Breaks

**What goes wrong:** 30% of users try on mobile, UI is broken.

**Prevention:**
- Quick mobile viewport check before launch
- Explicitly tell beta users "desktop only" if needed

---

### Pitfall 10: Onboarding Friction From Sign-up Fields

**What goes wrong:** Every extra field costs ~7% conversion. Asking for company name, role, use case before they've experienced value.

**Prevention:**
- Sign-up: email + password only
- Profile enrichment after first session
- Ask context questions through Mary, not forms

---

## Phase-Specific Warnings

| Phase | Likely Pitfall | Mitigation |
|-------|---------------|------------|
| Phase 1: Auth Fix | Email verification breaks | Test with 3 email providers, configure custom SMTP |
| Phase 1: Auth Fix | OAuth callback mismatch | Verify all redirect URIs in provider settings |
| Phase 2: Access Control | Whitelist bypassed | Test auth with non-whitelisted email |
| Phase 2: Feedback Setup | Questions too vague | Write specific questions tied to hypotheses |
| Phase 3: User Invite | Survivorship bias | Proactively contact low-engagement users |
| Phase 3: User Invite | Scope creep begins | Document "not in beta" before first request |
| Ongoing | Error states hide issues | Set up error tracking before launch |
| Ongoing | No analytics baseline | Can't measure change without Day 1 data |

---

## Hypothesis Validation Checklist

Before declaring beta successful, confirm:

- [ ] Auth works for >95% of invited users (tracked, not assumed)
- [ ] Non-invited users cannot access (tested)
- [ ] Feedback collected from >50% of active users
- [ ] Exit interviews with >3 churned users
- [ ] Behavior data shows Mary sessions completed (not just started)
- [ ] WTP question asked after meaningful engagement

---

## Sources

Research synthesized from:
- [BetaTesting Blog: Top 5 Mistakes Companies Make in Beta Testing](https://blog.betatesting.com/2025/04/28/top-5-mistakes-companies-make-in-beta-testing-and-how-to-avoid-them/)
- [Supabase Auth Troubleshooting Documentation](https://supabase.com/docs/guides/auth/troubleshooting)
- [Parallel HQ: What Does Closed Beta Mean?](https://www.parallelhq.com/blog/what-does-closed-beta-mean)
- [Medium: Designing Effective Error States (2025)](https://medium.com/design-bootcamp/designing-effective-error-states-turning-frustration-into-opportunity-in-2025-ux-998e5dc204fc)
- [Medium: How to Avoid Survivorship Bias in Product Management](https://medium.com/@falkgottlob/how-to-avoid-survivorship-bias-in-product-management-lessons-from-the-british-bomber-study-25edb8ab4ab7)
- [Luciq: Beta Test Privacy and Security](https://www.luciq.ai/blog/beta-test-privacy-security-what-to-consider)
- [Asana: What is Scope Creep (2025)](https://asana.com/resources/what-is-scope-creep)
- [LivePlan: SaaS Beta Launch](https://www.liveplan.com/blog/starting/saas-beta-launch)
