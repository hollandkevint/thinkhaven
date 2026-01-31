# Story: Value Articulation Checkpoint (Behavioral Pattern) - Brownfield Addition

**Requirement:** FR-AC24 (Simplified Scope)
**Epic:** Epic 2 (Strategic Pathways with Sub-Persona Weighting)
**Type:** Enhancement - Prompt Engineering

---

## User Story

As a **user progressing through a strategic session**,
I want **Mary to naturally ask me to articulate my solution's value without technology references**,
So that **I clarify the core value proposition and expected behavior change**.

---

## Story Context

**Existing System Integration:**
- Integrates with: `lib/ai/mary-persona.ts` (Mary persona definition)
- Technology: Claude API system prompts, TypeScript
- Follows pattern: Existing session progression prompts
- Touch points: Mary's questioning patterns, Inquisitive mode

**Simplified MVP Scope:**
- NO formal mid-session checkpoint UI (deferred)
- NO explicit progress interruption (deferred)
- YES: Add value articulation questions to Mary's natural repertoire
- YES: Train Mary to ask these questions organically at appropriate moments

**Value Articulation Questions (from Pavel Samsonov):**
1. "Without mentioning technology, what value does your solution provide?"
2. "What behavior change do you expect from your users?"
3. "If your solution works perfectly, what's different in your customer's life?"

---

## Acceptance Criteria

**Functional Requirements:**
1. Mary's system prompt includes value articulation questions
2. Questions appear naturally during Inquisitive mode phases
3. Mary asks at least one value articulation question per session
4. Questions adapt to pathway context (New Idea vs. Business Model vs. Feature)

**Integration Requirements:**
5. Questions integrate with existing sub-persona mode system
6. No changes to session flow or UI
7. Questions feel conversational, not checkpoint-like

**Quality Requirements:**
8. Manual testing confirms organic question placement
9. Questions don't feel repetitive across sessions
10. No regression in session flow

---

## Technical Notes

- **Integration Approach:** Add value articulation prompts to Mary's Inquisitive mode and general questioning guidelines
- **Existing Pattern Reference:** Follow existing questioning pattern injection
- **Key Constraints:** Must feel natural, not formulaic; timing should be organic

**Implementation Sketch:**
```typescript
// mary-persona.ts - Value articulation addition
const VALUE_ARTICULATION_PROMPTS = `
VALUE ARTICULATION QUESTIONS (use naturally during exploration):

When the user is describing their solution, gently probe for value clarity:
- "Setting aside the technology for a moment—what value does this create for your customer?"
- "If this works exactly as you envision, what changes in your customer's daily life?"
- "What behavior are you expecting to change? What will people do differently?"

These questions help users articulate value without hiding behind technical details.
Use them when:
- User is overly focused on features/technology
- User hasn't clearly stated the core value proposition
- You sense the user hasn't thought through the behavior change

Don't announce these as a "checkpoint"—weave them into natural conversation.
`;
```

**Pathway-Specific Variations:**
```typescript
const PATHWAY_VALUE_QUESTIONS = {
  'new-idea': 'What problem are you solving that people currently pay to have solved another way?',
  'business-model': 'Why would someone pay for this instead of the free alternative they use today?',
  'feature-refinement': 'How will users behave differently after using this feature?'
};
```

---

## Definition of Done

- [ ] Value articulation prompts added to Mary's system prompt
- [ ] Prompts vary by pathway context
- [ ] Manual testing confirms natural question placement
- [ ] Questions appear at appropriate moments (not forced)
- [ ] No regression in session flow or mode shifting

---

## Risk and Compatibility Check

**Primary Risk:** Questions feel repetitive or formulaic
**Mitigation:** Provide multiple variations; instruct Mary to choose contextually
**Rollback:** Remove value articulation section from system prompt

**Compatibility Verification:**
- [x] No breaking changes to existing APIs
- [x] Database changes: None required
- [x] UI changes: None required
- [x] Performance impact: Negligible
