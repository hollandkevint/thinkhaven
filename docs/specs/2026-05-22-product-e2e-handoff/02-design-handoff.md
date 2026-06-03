---
title: Design Handoff
status: active
date: 2026-05-22
---

# Design Handoff

## Design Position

ThinkHaven is a product-register interface. Design serves repeated strategic work. It should feel like a senior strategist's working surface, not a campaign site, chatbot toy, or consulting deck.

Physical scene: an executive or product leader is pressure-testing a decision late in the day before they have to defend it to peers, a board, or a skeptical team. The light theme, warm paper surfaces, quiet hierarchy, and restrained terracotta action color are correct for that scene.

The governing sequence is:

```text
artifact -> decision -> confidence
```

Every surface should either start that sequence, advance it, or help the user recover back to it.

## Surface Intent

| Surface | Primary UX Job | Design Direction |
|---|---|---|
| Landing | Make the product promise legible and earn the trial click | Preserve the anti-sycophancy hero and board preview, reduce repeated CTAs and duplicate beta marks |
| Guest trial | Let a skeptical user test a real decision quickly | Keep Mary and message limit visible, make mobile layout compact and stable |
| Plan grill | Turn pasted plans into a structured pressure test | Preserve sharper copy, make the input affordance feel document-friendly |
| Pricing | Explain access in the same decision vocabulary | Replace stale session math and generic plan copy with artifact/output framing |
| Waitlist | Explain access status without sounding bureaucratic | Use direct recovery copy and avoid vague "status unavailable" dead ends |
| Assessment | Diagnose strategic blind spots and route to action | Tie result states to a recommended session path and next artifact |
| Blog | Build credibility through editorial content | Remove decorative accent-corner patterns, keep longform calm and readable |
| Auth | Get users into the product with minimal friction | Keep forms simple, add small contextual value copy only where it clarifies |
| Dashboard | Resume or start decision work | Prioritize recent artifacts/sessions and direct "what are you deciding?" entry |
| New session | Create the workspace without ceremony | Keep loading short and explicit, with retry if creation fails |
| Active session | Produce the artifact and decision | Keep chat as input, make artifact/canvas/board state visible and understandable |
| Account | Manage access and identity | Use quiet settings vocabulary and avoid marketing copy |
| Admin/monitoring | Operational control and health | Dense, stable product UI with explicit state, audit history, and no decorative styling |

## Copy Rules

- Speak like a strategist, not a coach.
- Prefer "What are you trying to decide?" over generic "How can I help?"
- Avoid praise and cheerleading.
- Use "pressure-test", "defend", "breaks", "artifact", "decision", and "confidence" when they clarify the task.
- Do not restate section headings in body copy.
- Do not use em dashes in UI copy.
- Keep labels short. Explanations belong in context panels, not buttons.

## Component Rules

### Buttons

Primary actions use terracotta on cream, 8px radius, Jost label weight. Avoid multiple primary CTAs in the same visual group. On public routes, "Try a Free Session" is the full label; compact nav can use a shorter label only if space requires it.

### Dialogs and overlays

All touched modals use Radix Dialog. Overlay colors should use ink tint, for example `bg-ink/50`, never `bg-black` or `bg-black/50`. Avoid modal-first onboarding. Use inline explanation first, user-invoked sheets second, modal only for true interruptive tasks.

### Message and Markdown surfaces

Rendered artifacts should read like documents. Avoid side stripes for quotes or callouts. Use full borders, background tint, spacing, and typography instead. Longform content should stay within 65 to 75 characters when it is prose.

### Empty states

Empty states should set the decision task, not celebrate blankness. The pattern is:

1. Name the absence plainly.
2. Ask for the decision or input.
3. Offer one or two concrete starting actions.

### Loading states

Prefer skeletons or short editorial loading lines over centered spinner-only states. Existing spinner border warnings are lower priority, but when touched, replace with the shared loader pattern or a skeleton.

### Badges and state

Badges must pair color with text. The mode badge pattern in `apps/web/app/components/board/ModeBadge.tsx` is the reference for persona state.

## Anti-Patterns To Remove

| Pattern | Current Locations | Replacement |
|---|---|---|
| Pure black overlays | Artifact panel, branch dialog, export dialog, feedback modal | `bg-ink/50` or `bg-ink/30` without decorative blur |
| Side-tab accent borders | Blog posts, Markdown blockquotes, bookmarks, Lean Canvas selected state | Full border, background tint, leading icon, or typographic treatment |
| Decorative card corners | Blog list cards | Remove or replace with subtle full-border hover |
| Mobile non-collapsing nav | `/try` header | Collapse secondary actions into menu or stack behind a compact affordance |
| Generic loading or blank protected shells | `/app/*`, `/assessment/results`, validation success | Route-specific recovery or explicit loading copy |

## Visual Quality Bar

The interface passes when:

- A fluent Linear, Stripe, or Notion user trusts the component vocabulary.
- The user can tell what stage they are in: artifact, decision, or confidence.
- The route has no horizontal overflow at 390px, 768px, and desktop widths.
- There are no pure black or pure white UI surfaces.
- There are no side-stripe borders greater than 1px.
- A runtime error does not replace the main product surface during normal browsing.

## Implementation Guardrails

- Keep the existing light theme. Do not introduce dark mode.
- Use `globals.css` and `tailwind.config.cjs` tokens over ad hoc colors.
- Keep reusable shadcn primitives compatible with aliases, but use direct brand tokens in app/page-level surfaces when the route owns the product voice.
- Use lucide icons where icons are needed.
- Do not add new visual assets for this handoff. This is a refinement pass, not net-new visual direction.
