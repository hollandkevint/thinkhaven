---
topic: Beta Invite Comms
date: 2026-04-04
status: ready-to-send
author: Kevin Holland
---

# Beta Invite Comms

Copy for inviting 5–10 people this week to dogfood ThinkHaven and generate feedback. Targets the two ICPs from the GTM playbook: Alex (multi-bet operators) and Jordan (consultants/strategists).

Pick one variant per person based on how well you know them and the channel. Personalize the **[BRACKET]** fields — the invite fails the moment it feels templated.

---

## Guiding principles

- **It's a favor, not a pitch.** You're asking for help, not announcing a launch.
- **Name a specific decision.** Don't say "try my product." Say "run [the thing they're actually wrestling with] through it."
- **Protect their time.** 15 minutes. No signup needed to start. No commitment after.
- **Make the ask concrete.** One session + one feedback submission. That's it.
- **Give an easy out.** "No worries if it's not a fit this week" should appear in every version.

---

## Variant 1: Short DM / text (close network)

Best for: people you talk to regularly. Slack, iMessage, Signal.

> Hey [NAME] — I just opened up ThinkHaven for a small group of testers this week and you're on my shortlist. It's a 15-minute AI session that pressure-tests a decision with six advisor personas (think: the co-founder or board you don't have).
>
> I know you're thinking about [SPECIFIC DECISION THEY MENTIONED]. Would you run it through? No signup needed to start: thinkhaven.co/try
>
> The one thing I'd ask: hit the feedback button at the end and tell me what you'd do if the tool disappeared tomorrow. That answer is worth more to me than polite praise.
>
> Totally fine to pass if the week is rough.

**Why it works:** References a real decision they told you about. Frames the feedback ask as a single question (Sean-Ellis style — this maps to the `disappear_alternative` field). The "rough week" out lowers social cost.

---

## Variant 2: Email (warmer, wants more context)

Best for: people who need a bit of framing. Founders you've talked to once, former colleagues, folks in your network you haven't messaged in months.

> **Subject:** Quick favor — 15 min of your brain on a thing I built
>
> Hey [NAME],
>
> I've been building ThinkHaven for the last several months and I'm finally at the point where I want a handful of people I trust to kick the tires before I open it up more widely. You came to mind because [SPECIFIC REASON — their work, a conversation, what you know about their current situation].
>
> **What it is:** A structured strategy session with six AI advisors (operator, investor, coach, realist, etc.) that pressure-tests a decision and outputs a lean canvas. Fifteen minutes. Not a chatbot.
>
> **What I'd love from you:**
> 1. Pick a decision you're actually chewing on. Not a hypothetical — a real "should I do X or Y" question.
> 2. Go to **thinkhaven.co/try** (no signup needed to start)
> 3. Run a session. Ten free messages in guest mode, more after signup.
> 4. Hit the feedback button at the end. There's a question in there that asks what you'd do if the tool disappeared tomorrow — that's the one I really care about.
>
> If it's not useful, tell me why. If it is, I'd love to hear what clicked. Harsh feedback >> polite feedback.
>
> Totally fine if this week is the wrong week. No follow-up pressure.
>
> Thanks,
> Kevin

**Why it works:** Explains what it is in one sentence, makes the ask a numbered list (removes ambiguity), and explicitly invites harsh feedback. The "not a chatbot" line preempts the most common wrong assumption.

---

## Variant 3: LinkedIn DM (professional network, lukewarm)

Best for: LinkedIn connections you haven't talked to in a while but who match the ICP.

> Hey [NAME] — hope you're well. Working on something I think might be up your alley and looking for a few sharp people to test it this week.
>
> It's called ThinkHaven: a 15-minute AI session with six advisor personas that pressure-tests a decision. Built for people running multiple bets or making high-stakes calls without a real board to think alongside.
>
> No signup, no credit card, 10 free messages to see if it's useful: thinkhaven.co/try
>
> If you give it a shot, the feedback button at the end takes 30 seconds. That's the entire ask. Worst case, you kill 15 minutes and tell me it's not for you.

**Why it works:** LinkedIn DMs get skimmed, so this is shorter and leads with the value prop. "Running multiple bets" is ICP-1 language directly from the playbook.

---

## Variant 4: Post-session follow-up (24–48 hours after invite)

Send if they haven't responded or haven't hit the feedback button yet. Once.

> Hey [NAME] — no pressure at all, just checking in. If ThinkHaven wasn't a fit or the timing was bad, totally fine, happy to hear that too. The "this isn't for me because X" feedback is actually more useful to me right now than enthusiastic reviews.
>
> If you did run a session and just haven't hit the feedback button — takes 30 seconds: [session URL or thinkhaven.co]

**Why it works:** Explicitly validates negative feedback. Most beta invites die in the "meant to get to it" gap — this nudge gives them permission to bail politely or complete the loop.

---

## Variant 5: Consultant / strategist angle (ICP 2 — Jordan)

Best for: independent consultants, fractional strategists, advisors who run their own client sessions.

> Hey [NAME] — I built a tool I think might fit into your client workflow and I want your honest read before I push it wider.
>
> ThinkHaven runs a 15-minute structured strategy session — six advisor personas pressure-test a question and output a lean canvas. I built it because I kept doing the same facilitation process manually and wanted to see if AI could do the diagnostic layer.
>
> Two ways it might be useful to you:
> 1. **Pre-session prep for clients.** Send them to thinkhaven.co/try before your next call, have them show up with a filled lean canvas. Skip the first 2 hours of discovery.
> 2. **Pressure-testing your own recommendations.** Run your strategy through the board before you present it. See if Victoria (the investor persona) finds holes you missed.
>
> Would you run one of your actual client situations through it and tell me if the output is client-grade or if it reads like generic ChatGPT? That's the signal I need.
>
> thinkhaven.co/try — no signup to start.

**Why it works:** Names the two specific use cases Jordan cares about (ICP playbook angles A and B). The explicit "client-grade or generic ChatGPT" question is the one that matters for consultants — if the lean canvas export isn't professional enough to send to a client, they won't convert.

---

## The feedback ask, said three ways

When you follow up to collect feedback, pick the framing that fits the person:

1. **Sean-Ellis style (default):** "If ThinkHaven disappeared tomorrow, what would you do instead?" — This is already in the feedback modal. It's the single most predictive PMF question.
2. **Differentiation:** "What did the board ask that ChatGPT wouldn't have asked?" — Use this if they told you they use Claude/ChatGPT for similar stuff.
3. **Willingness to pay:** "If this cost $39 for unlimited sessions, would you buy it? Why or why not?" — Use this only after they've completed at least one full session with the board.

---

## What to watch in PostHog after sending

For each invite sent, track the funnel in PostHog:

| Event | What it means |
|---|---|
| `$pageview` on `/try` | They clicked the link |
| `board_offered` | They made it to exchange 3 in guest mode (the tease fires) |
| `signup_prompt_shown` with `trigger: guest_limit` | They used all 10 guest messages |
| Signup completed | They got past the friction |
| `board_activated` | They saw the full board experience |
| `canvas_exported` | Strong "got value" signal — they wanted the artifact |
| `feedback_submitted` | The loop closed |

**Red flag:** People click `/try` but never reach `board_offered`. Means they bounced in the first 2–3 messages. Ask them why directly.

**Green flag:** People hit `canvas_exported` before `feedback_submitted`. They wanted the output enough to take it with them.

---

## Target list format

Keep a simple tracking doc for the 5–10 people you invite this week:

| Name | ICP | Channel | Sent | Opened /try | Completed session | Feedback submitted | `would_recommend` |
|---|---|---|---|---|---|---|---|
| | Alex/Jordan | DM/Email/LI | | | | | |

If fewer than 3 of 10 hit `feedback_submitted` within 5 days, the issue isn't the product — it's the invite. Revise the copy based on what they tell you (or don't tell you) and try again.

---

## Final nudge

Don't send all 10 on the same day. Send 2–3, watch what happens in PostHog for 24 hours, then tune the next batch based on what you learn. The invite copy above is a starting point, not a finished script.
