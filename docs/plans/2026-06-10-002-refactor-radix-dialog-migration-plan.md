---
title: "refactor: Migrate hand-rolled modals to Radix Dialog"
type: refactor
date: 2026-06-10
---

# refactor: Migrate hand-rolled modals to Radix Dialog

## Summary

Migrate the three tracked hand-rolled modals — `ExportDialog`, `BranchDialog`, `SignupPromptModal` — to `@radix-ui/react-dialog`, which is already installed and already the mandated pattern for new modals (CLAUDE.md pitfall 27). Hand-rolled modals lack focus trap, Escape handling, and `aria-modal`; the migration closes a known a11y gap with a reference implementation already in the codebase.

## Problem Frame

CLAUDE.md pitfall 27 mandates Radix Dialog for all new modals and explicitly tracks these three for migration. Each currently re-implements overlay/dismiss behavior by hand. `app/app/page.tsx` already uses `* as Dialog from '@radix-ui/react-dialog'` for its rename/delete dialogs — the in-repo pattern to mirror. The unit suite is green, including suites that exercise two of the three components (`feedback-modal-fields` renders SignupPromptModal flows indirectly; ExportDialog has no dedicated suite — see test scenarios).

## Key Technical Decisions

- **Mirror the in-repo Radix usage** (`app/app/page.tsx` rename/delete dialogs), not a new abstraction. Three migrations do not justify a shared wrapper component yet; extract one only if the third migration proves the duplication is real (rule of three, judged at execution time).
- **Behavior-preserving:** visual design (cream/parchment/terracotta tokens) and all callbacks keep their contracts. The change is the dialog shell, not the contents.
- **Keep `data-ph-mask` and analytics attributes** where present — SignupPromptModal sits in the guest funnel.

## Implementation Units

### U1. Migrate SignupPromptModal

**Goal:** Guest signup prompt renders inside `Dialog.Root`/`Dialog.Portal`/`Dialog.Overlay`/`Dialog.Content` with focus trap, Escape-to-dismiss, and `aria-modal` for free.
**Files:** `apps/web/app/components/guest/SignupPromptModal.tsx`; consumer `apps/web/app/components/guest/GuestChatInterface.tsx`; test `apps/web/tests/components/guest/signup-prompt-modal.test.tsx` (new).
**Approach:** Highest-traffic of the three (guest funnel hero path) — do it first so the pattern is settled where it matters most. Map the current open/close props onto `Dialog.Root open onOpenChange`. `Dialog.Title` wraps the existing heading (required by Radix for a11y); use `Dialog.Description` for the body copy.
**Patterns to follow:** `app/app/page.tsx` Radix dialogs; design tokens from `globals.css`.
**Test scenarios:**
- Renders title and CTA when open; renders nothing when closed.
- Escape key closes (calls the close handler) — the new behavior the migration buys.
- Dialog has `aria-modal="true"` and an accessible name (via `Dialog.Title`).
- CTA click fires the signup callback unchanged.
**Verification:** Guest flow works in dev (`/try`, exhaust the message limit, modal appears, Escape dismisses); new test file green; full suite green.

### U2. Migrate ExportDialog

**Goal:** Export dialog on the Radix shell, same trigger and export callbacks.
**Files:** `apps/web/app/components/chat/ExportDialog.tsx`; test `apps/web/tests/components/chat/export-dialog.test.tsx` (new).
**Dependencies:** U1 (pattern settled).
**Approach:** ExportDialog carries 7 of the source tsc errors tracked in the type-safety plan (2026-06-10-001 U4) — fix its types during this rewrite and note that in the commit so the other plan's executor skips it.
**Test scenarios:**
- Opens from its trigger; format options render; selecting a format and confirming fires the export callback with the chosen format.
- Escape and overlay-click dismiss.
- Focus is trapped while open (tab from last element wraps).
**Verification:** Export flow works from the session workspace in dev; new tests green; `tsc --noEmit` errors for this file drop to zero.

### U3. Migrate BranchDialog

**Goal:** Branch-creation dialog on the Radix shell.
**Files:** `apps/web/app/components/chat/BranchDialog.tsx`; test `apps/web/tests/components/chat/branch-dialog.test.tsx` (new).
**Dependencies:** U1.
**Test scenarios:**
- Renders when open with the source-message context; confirm fires `onCreateBranch` with the message id; cancel/Escape dismisses without calling it.
- Input (branch title/label, if present) round-trips into the callback payload.
**Verification:** Branch flow works from a message action menu in dev; tests green.

### U4. Sweep and codify

**Goal:** Confirm no other hand-rolled modals remain; update the tracking note.
**Files:** `CLAUDE.md` (pitfall 27 note), repo-wide grep.
**Dependencies:** U1–U3.
**Approach:** Grep for `role="dialog"`, fixed-overlay patterns (`fixed inset-0`), and `aria-modal` to catch untracked hand-rolled modals; migrate trivial stragglers or list them in the PR as explicitly deferred. Update CLAUDE.md pitfall 27 to remove the "tracked for migration" clause.
**Test expectation:** none — audit/doc unit.
**Verification:** CLAUDE.md no longer lists pending modal migrations; PR notes any deferred stragglers.

## Scope Boundaries

- **Non-goals:** no visual redesign, no copy changes (SignupPromptModal copy has a separate open product question about "Unlimited conversations" honesty — do not touch copy here), no shared dialog abstraction unless the rule of three demands it.
- **Deferred:** replacing `window.confirm`-style flows elsewhere, if any are found, unless trivial.

## Risks

- Radix portals render outside the component subtree — any test or PostHog selector relying on DOM nesting may need updating (`data-ph-mask` must be re-verified on the portaled content).
- Focus-trap behavior in jsdom is partially simulated; the focus-wrap test may need `@testing-library/user-event` (now installed) rather than `fireEvent`.
