---
title: Docs-Aware Plan Grill Pathway Across Guest, Mary, Tools, and Artifacts
date: 2026-05-20
category: architecture-patterns
module: plan-grill-docs-aware-pathway
problem_type: architecture_pattern
component: assistant
severity: medium
related_components:
  - development_workflow
  - documentation
  - tooling
tags:
  - plan-grill
  - hosted-pathway
  - docs-aware-prompts
  - document-tools
  - guest-migration
  - artifacts
  - method-kit
applies_when:
  - Adding a hosted ThinkHaven pathway that must survive guest and authenticated flows
  - Extending Mary with documentation-aware prompting
  - Generating user-visible decision or domain artifacts from tool calls
---

# Docs-Aware Plan Grill Pathway Across Guest, Mary, Tools, and Artifacts

## Context

Adding `plan-grill` showed that a ThinkHaven pathway is not just a dashboard link or chat prompt. A pathway has to survive every boundary where session identity can drift: client route params, localStorage, guest API calls, message saving, guest-to-auth migration, Supabase session rows, Mary prompt construction, dynamic context, tool schemas, document generation, artifact rendering, and tests.

The feature combined two modes of plan pressure-testing:

- `grill-me`: use when the user has a plan, idea, or decision but no project/codebase/docs reference.
- `grill-with-docs`: use when the user provides or references a codebase, project, docs, domain glossary, prior decisions, or pasted implementation context.

The implementation needed Mary to understand that distinction without implying live access to a repository, filesystem, or private docs. If the user has not pasted reference context, Mary should grill the plan directly. If the user has pasted docs or project context, Mary can cross-check only against that pasted material.

The code-review pass found several failure modes worth preserving as institutional knowledge (session history):

- A fresh `/try?mode=plan-grill` guest session could be initialized correctly, then flipped back to `new-idea` when the first message was saved through `GuestSessionStore.addMessage()`.
- Existing tests checked welcome copy but not first-message persistence, stored pathway, API payload, or guest migration.
- `update_session_context` wrote singular `output_data.insight`, while dynamic context only read plural `output_data.insights`.
- `generate_document` saved generated docs without making them first-class visible artifacts.
- Adding `pathway` to analytics violated the typed `session_started` event contract.
- Plan-grill quick actions drifted between Mary and a secondary helper.

## Guidance

### Centralize Pathway Configuration

Keep pathway metadata in one client-safe source of truth. A hosted pathway needs at least:

- pathway id
- label
- initial phase
- message limit
- default title
- phase order

Use the shared config from routes, client pages, guest code, session primitives, and tests rather than re-declaring literals in each layer.

```ts
export const ACTIVE_PATHWAYS = {
  'plan-grill': {
    id: 'plan-grill',
    label: 'Plan Grill',
    phase: 'intake',
    messageLimit: 20,
    defaultTitle: 'Plan Grill',
    phaseOrder: ['intake'],
  },
};
```

Keep the config client-safe. Client components must not import server-only session modules that transitively depend on `next/headers` or Supabase server clients.

For `plan-grill`, `messageLimit: 20` is the authenticated/migrated session limit from shared pathway config. The public `/try` funnel keeps its own 10-message guest cap.

### Preserve Guest Pathway Explicitly

Guest pathway identity has to be carried through localStorage and every message write. Do not let a default pathway rewrite an explicit guest mode.

The dangerous pattern is a helper like this:

```ts
static addMessage(role: 'user' | 'assistant', content: string): GuestSession {
  const session = this.getOrCreateSession();
  // ...
}
```

If `getOrCreateSession()` defaults to `new-idea`, a fresh empty `plan-grill` session can be rewritten on the first user message before migration (session history).

Prefer passing the active pathway when a message is saved, and only realign an empty session when a pathway was explicitly provided:

```ts
static getOrCreateSession(pathway?: GuestPathway): GuestSession {
  const existing = this.getSession();
  if (!existing) return this.createSession(pathway ?? 'new-idea');

  if (pathway && existing.messages.length === 0 && existing.pathway !== pathway) {
    existing.pathway = pathway;
    this.saveSession(existing);
  }

  return existing;
}

static addMessage(
  role: 'user' | 'assistant',
  content: string,
  pathway?: GuestPathway
): GuestSession {
  const session = this.getOrCreateSession(pathway);
  // ...
}
```

Migration should preserve `plan-grill` and only map unknown or classic guest sessions to the legacy/default authenticated pathway:

```ts
const migratedPathway =
  guestData.pathway === 'plan-grill' ? 'plan-grill' : 'quick-decision';
```

### Gate Docs-Aware Mary Behavior

Docs-aware grilling belongs behind `currentBmadSession.pathway === 'plan-grill'`. Other sessions should not suddenly ask for glossaries, ADRs, codebase references, or pasted docs.

```ts
if (context?.currentBmadSession?.pathway === 'plan-grill') {
  sections.push(this.generatePlanGrillSection());
}
```

The prompt should state the access boundary directly:

- Mary has no live access to the repository, filesystem, private docs, or external project context unless the user pasted it.
- Ask exactly one question at a time.
- Provide a recommended answer first so the user can accept, correct, or expose the hard part.
- Ask for relevant excerpts when docs/project context is missing.
- Use classic `grill-me` when no reference context exists.

### Align Context Write and Read Shapes

When a tool persists state for future LLM turns, the read path must understand the write path. `update_session_context` writes one insight at a time:

```ts
output_data: {
  insight,
  category,
  recorded_at: new Date().toISOString(),
}
```

Dynamic context should read both old plural records and new singular records:

```ts
if (Array.isArray(data?.insights)) {
  return data.insights.filter((value): value is string => typeof value === 'string');
}

if (typeof data?.insight === 'string') {
  const category = typeof data.category === 'string' ? data.category : 'general';
  return [`${category}: ${data.insight}`];
}
```

Without this, Mary can call `update_session_context` successfully but never see the captured domain terms, decisions, or assumptions on later turns.

### Make Generated Documents Visible Artifacts

Saving a generated document to `bmad_generated_documents` is not enough if the workspace UI reads `session_artifacts`. A tool-generated `domain_context` or `decision_record` should be persisted and visible through the same artifact path users already use.

```ts
const { data: documentRow, error: insertError } = await supabase
  .from('bmad_generated_documents')
  .insert({
    session_id: sessionId,
    document_name: documentTitle,
    document_type: input.document_type,
    content: documentContent,
    format: 'markdown',
  })
  .select('id')
  .single();

if (insertError || !documentRow) {
  throw new Error(insertError?.message || 'Failed to save generated document');
}

await supabase.from('session_artifacts').insert({
  id: documentRow.id,
  session_id: sessionId,
  type: artifactType,
  title: documentTitle,
  content: documentContent,
  metadata: {
    source: 'generate_document',
    document_type: input.document_type,
    generated_document_id: documentRow.id,
  },
  view_mode: 'inline',
  render_mode: 'rendered',
});
```

Also return artifact metadata from the tool result and serialize an artifact marker into the assistant response. The marker only helps if every workspace message path hydrates artifacts from assistant text. Normal Mary messages, streaming messages, and board-speaker messages should route through a shared artifact-aware renderer, or the workspace must load `session_artifacts` directly.

```tsx
<ArtifactAwareContent content={message.content} sessionId={session.id} />
```

Do not assume one chat component covers the whole workspace. Authenticated session history, guest chat, and speaker-switch messages may each have their own renderer.

### Test the Boundaries

The tests should cover the places where pathway identity or generated output can disappear:

- API session creation inserts `pathway: 'plan-grill'`, `current_phase: 'intake'`, `title: 'Plan Grill'`, and `message_limit: 20`.
- Guest session store preserves `plan-grill` after the first user message.
- Guest migration preserves `plan-grill`, phase, message limit, and user-only message count.
- Mary prompt includes plan-grill instructions only for `plan-grill`.
- Tool schemas include `domain_context`, `decision_record`, and context categories.
- Document generation creates both a generated-document row and a visible artifact.
- Dynamic context includes singular `update_session_context` insights.
- `/try?mode=plan-grill` renders plan-grill welcome copy.

## Why This Matters

Pathway drift is easy because ThinkHaven repeats session concepts across UI routing, guest state, database rows, prompt construction, phase progression, tools, and artifacts. A user can enter through the right CTA and still end up with the wrong Mary behavior or a migrated `quick-decision` session if one layer silently applies a default.

Docs-aware behavior has a second risk: overclaiming context. If Mary asks like she has repo/docs access when the user only pasted a plan, the product feels unreliable. The `grill-me` vs `grill-with-docs` distinction keeps the behavior honest: use pasted docs when they exist, and otherwise pressure-test the plan directly.

Generated artifacts carry the same agent-native requirement as UI actions. If Mary can create a document but the user cannot see it in the workspace artifact surface, the tool succeeded technically while failing product behavior.

## When to Apply

- Adding or changing a hosted pathway.
- Adding a guest mode that later migrates into authenticated sessions.
- Adding a Mary coaching mode that depends on session pathway.
- Adding a session-scoped tool that persists data for later turns.
- Adding a generated document type that should appear in the user workspace.
- Upgrading Method Kit or open-source prompt behavior while keeping hosted ThinkHaven product behavior distinct.

## Examples

### Plan-Grill Session Lifecycle

```text
/try?mode=plan-grill
  -> GuestChatInterface(pathway='plan-grill')
  -> GuestSessionStore.getOrCreateSession('plan-grill')
  -> GuestSessionStore.addMessage(..., 'plan-grill')
  -> POST /api/chat/guest { pathway: 'plan-grill' }
  -> Mary plan-grill prompt section
  -> SessionMigration.migrateToUserWorkspace()
  -> bmad_sessions.pathway = 'plan-grill'
```

Each arrow is a regression point. Test the first message and migration path, not only the initial welcome UI.

### Docs-Aware Mode Selection

```text
User only has a plan:
  Use classic grill-me. Ask one decision-tree question at a time.

User pasted docs, glossary, project notes, or prior decisions:
  Use docs-aware grill-with-docs. Cross-check only against pasted context.

User references docs but did not paste them:
  Ask for the relevant excerpt. Do not imply repository or private-doc access.
```

### Domain and Decision Artifacts

`domain_context` is glossary-focused and implementation-free:

- Language
- Relationships
- Example Dialogue
- Flagged Ambiguities

`decision_record` is sparse and reserved for durable choices:

- Resolved Decisions
- Open Questions
- Assumptions
- Risks
- ADR-Worthy Decisions
- Recommended Next Action

Do not force these artifacts when the user has no docs/project context or when the session has not resolved useful language or decisions yet.

## Related

- [Personal Board of Directors - Multi-Perspective AI via Tool-Call Speaker Switching](./personal-board-of-directors-multi-perspective-ai.md) - related Mary/tool-call architecture.
- [Dashboard Crash & E2E Auth Test Failures](../runtime-errors/dashboard-hydration-undefined-property.md) - related pathway/schema drift lesson.
- [God Component Decomposition and Codebase Cleanup](../code-quality/god-component-decomposition-and-codebase-cleanup.md) - related session workspace and guest chat complexity.
- [Extract, Don't Just Link](../patterns/individual/pattern-07-extract-dont-just-link.md) - related artifact self-containment pattern.
- [Centralized Configuration Single Source of Truth](../patterns/individual/pattern-31-centralized-configuration-single-source-of-truth.md) - related config-drift prevention.

## Verification

For this implementation, focused verification included the following commands run from `apps/web`:

```bash
npm run test:run -- tests/lib/session/session-primitives.test.ts tests/lib/ai/mary-persona.test.ts tests/lib/ai/tools-index.test.ts tests/lib/ai/document-tools.test.ts tests/lib/ai/context-builder.test.ts tests/lib/guest/session-store.test.ts tests/lib/guest/session-migration.test.ts tests/api/session/create-session.test.ts
npm run test:run -- tests/lib/ai/workspace-context.test.ts -t "plan-grill actions"
npm run test:run -- tests/components/chat/ArtifactAwareContent.test.tsx
npx eslint app/components/guest/GuestChatInterface.tsx app/api/chat/guest/route.ts app/api/chat/stream/route.ts app/api/session/route.ts app/app/new/page.tsx app/app/page.tsx app/app/session/[id]/page.tsx app/try/page.tsx app/page.tsx app/components/board/SpeakerMessage.tsx app/components/chat/ArtifactAwareContent.tsx app/components/chat/MarkdownRenderer.tsx app/components/chat/StreamingMessage.tsx lib/analytics/events.ts lib/ai/mary-persona.ts lib/ai/workspace-context.ts lib/ai/context-builder.ts lib/ai/tools/index.ts lib/ai/tools/document-tools.ts lib/session/pathway-config.ts lib/session/pathway-labels.ts lib/session/session-primitives.ts lib/guest/session-store.ts lib/guest/session-migration.ts lib/artifact/artifact-parser.ts lib/artifact/artifact-types.ts
```

Browser smoke can be blocked in sandboxed environments that cannot bind `0.0.0.0:3000`. In that case, record the port-binding failure separately from feature behavior and rerun smoke in an environment allowed to start the Next.js dev server.
