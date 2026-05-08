# Product

## Register

product

## Users

**Primary: Executives & product leaders running Growth-tier strategy work.**

Context when using ThinkHaven: pre-meeting prep, mid-week strategy stress-testing, post-board-review reflection. Often working late, with partial information, against a decision they have to defend out loud to peers, boards, or skeptical stakeholders. They are not looking for ideation help. They already have a position, and they want it stress-tested before they walk into the room.

**Job to be done:** "Take this thing I'm leaning toward and tell me where it breaks." Convert inputs (data, dashboards, market signals, half-formed positions) into a defensible output the user can act on and share.

**Secondary user (entry tier, not the primary design driver):** Solo entrepreneurs running validation sessions. Same methodology, lighter framing. Design decisions optimize for the executive use case; the entry tier inherits the surface.

## Product Purpose

ThinkHaven is a **decision architecture platform**. When build cost approaches zero, the bottleneck becomes specification and decision-making. ThinkHaven owns the gap between "I have information" and "I know what to do."

A successful session produces a **sequence**, in this order:

1. **An artifact.** A written output the user can share, edit, and return to (spec, brief, plan, structured analysis).
2. **A decision.** A clear conclusion the artifact makes the case for (build, kill, pivot, defer, escalate).
3. **Confidence.** The user knows where the decision is strong and where it is fragile, and can defend both.

A session that ends in chat-only output, or a decision without a defensible artifact behind it, has failed regardless of how the user feels about it.

## Brand Personality

**Wes Anderson editorial confidence.** Warm but quiet. Symmetric but not sterile. Vintage-modern fusion that signals "thoughtful expert" rather than "helpful chatbot."

Three-word personality: **deliberate, warm, defensible.**

**Voice and tone:**
- Talks like a senior strategist, not a coach. No "great question." No "let's explore together."
- Direct, sometimes contrarian. Names what it sees. Uses fewer words than the user expects.
- Precision over softening. "This assumption breaks if X" beats "you might want to consider X."

**Emotional goal:** the user closes the laptop feeling sharper, not validated. They should be slightly humbled by the rigor and reassured by the artifact.

**Visual evolution:** the existing organic-warmth palette (cream / terracotta / forest / ink) is correct, but the execution should evolve toward editorial restraint. Stripe, Linear blog, and quality longform-publication composure are the reference points. Less whimsy, more confidence. Symmetry stays. Whimsical touches only where they earn their place.

## Anti-references

ThinkHaven explicitly does NOT look like:

- **Generic B2B SaaS.** Blue gradients, hero-metric templates, identical icon-card grids, "Trusted by" logo strips, animated gradient backgrounds. The 2020-era starter aesthetic. If a visitor could swap our wordmark for any other SaaS company's, we have failed.
- **Corporate consulting deliverables.** McKinsey/Bain navy + gold, dense chart-stacked decks, formal pyramid frameworks rendered as UI. Too institutional. Signals "expensive process" instead of "fast clarity."
- **Crypto / AI-bro hype aesthetic.** Neon on black, glassmorphism, animated gradients, oversized type, "ship fast" energy. Undermines the anti-sycophancy positioning. The look promises hype, the product promises rigor. Direct contradiction.

Cross-cutting: anything that telegraphs "AI-generated UI." Identical card grids, side-stripe borders, gradient text, modal-as-first-thought patterns, and category-reflex color choices ("AI tool → dark blue gradient") are all out.

## Design Principles

1. **Practice what you preach.** This is a decision tool. The interface itself should make decisions visibly: clear default actions, explicit hierarchy, no false neutrality. If the UI hedges, the product loses authority.

2. **Artifact over conversation.** Chat is the input mechanism, not the output. Every screen should make the durable artifact more visible, more editable, and more obviously the point. When in doubt, surface the artifact, not the message thread.

3. **Quiet confidence.** Warmth without whimsy, opinion without aggression. One strong typographic voice, restrained color, deliberate spacing. Nothing should look like it's trying to impress an executive. It should look like it was built by someone who already has their respect.

4. **Sequence the experience: artifact → decision → confidence.** Reflect this order in onboarding, empty states, session flow, and post-session screens. The user should always know which stage of the sequence they're in and what closes it.

5. **Anti-sycophancy as a visual discipline.** Avoid affirming patterns: no "" success stamps, no oversized praise, no green checkmarks for routine actions. State changes should feel observational, not celebratory. The product earns trust by being slightly cooler than expected.

## Accessibility & Inclusion

**Target: WCAG 2.1 AA.**

- Minimum 4.5:1 contrast for body text, 3:1 for large text and UI components. The cream/terracotta and cream/ink pairings already pass; verify any low-chroma slate-blue or dusty-rose text against parchment backgrounds before shipping.
- Full keyboard navigation across all session, dashboard, and account flows. Visible focus rings on every interactive element.
- All new modals via `@radix-ui/react-dialog` (focus trap, Escape, aria-modal). Existing hand-rolled modals are tracked for migration.
- Respect `prefers-reduced-motion`: animations under 200ms still run, longer ones become instant transitions.
- Color is never the sole carrier of state. Mode indicators (Inquisitive / Devil's Advocate / Encouraging / Realistic) pair color with label text and icon.
- Body line length capped at 65–75ch for the long-form artifact reading surface (serif body type makes this especially load-bearing).
