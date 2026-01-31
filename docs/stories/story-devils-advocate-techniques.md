# Story: Devil's Advocate Lateral Provocation Techniques - Brownfield Addition

**Requirement:** FR-AC8a
**Epic:** Epic 1 (Claude AI Integration & Decision Accelerator Platform)
**Type:** Enhancement - Prompt Engineering

---

## User Story

As a **user receiving Devil's Advocate mode feedback**,
I want **Mary to use specific lateral thinking techniques to challenge my assumptions**,
So that **I break out of confirmation bias and discover blind spots in my thinking**.

---

## Story Context

**Existing System Integration:**
- Integrates with: `lib/ai/mary-persona.ts` (Mary persona definition)
- Technology: Claude API system prompts, TypeScript
- Follows pattern: Existing sub-persona mode definitions
- Touch points: Devil's Advocate mode prompt content

**Lateral Provocation Techniques (from Tools for Thinking):**
| Technique | Description | Example |
|-----------|-------------|---------|
| **Provocation (PO)** | Deliberately provocative statements to break patterns | "What if your solution made the problem worse?" |
| **Reversal** | Invert assumptions | "What if the opposite of your assumption were true?" |
| **Challenge** | Question the status quo | "Why is this done this way? Who decided?" |
| **Dominant Idea Escape** | Surface shared assumptions | "What assumption does everyone in your market share that might be wrong?" |

---

## Acceptance Criteria

**Functional Requirements:**
1. Devil's Advocate mode includes specific technique vocabulary in system prompt
2. Mary uses Provocation technique when user shows confirmation bias
3. Mary uses Reversal technique to challenge core assumptions
4. Mary uses Challenge technique to question conventional approaches
5. Mary uses Dominant Idea Escape to surface industry-wide blind spots

**Integration Requirements:**
6. Existing Devil's Advocate weight percentage behavior unchanged
7. Techniques integrate naturally with dynamic mode shifting
8. Kill recommendation escalation sequence uses these techniques in diplomatic flags

**Quality Requirements:**
9. Manual testing confirms varied technique usage
10. Techniques feel natural, not formulaic
11. No regression in other sub-persona modes

---

## Technical Notes

- **Integration Approach:** Expand Devil's Advocate mode definition in `mary-persona.ts` with technique examples
- **Existing Pattern Reference:** Follow existing mode behavior definitions
- **Key Constraints:** Techniques must feel conversational, not academic

**Implementation Sketch:**
```typescript
// mary-persona.ts - Devil's Advocate mode enhancement
const DEVILS_ADVOCATE_TECHNIQUES = `
When in Devil's Advocate mode, use these lateral provocation techniques:

PROVOCATION (PO): Make deliberately provocative statements to break thinking patterns.
- "What if your solution actually made things worse for users?"
- "Imagine your biggest competitor already solved this. Now what?"

REVERSAL: Invert the user's core assumptions.
- "What if the opposite of that assumption were true?"
- "What if your target customer actively avoided this solution?"

CHALLENGE: Question why things are done a certain way.
- "Why is this the accepted approach? Who decided?"
- "What would happen if you violated that industry norm?"

DOMINANT IDEA ESCAPE: Surface assumptions everyone shares.
- "What assumption does everyone in your market share that might be wrong?"
- "What would a complete outsider question about this approach?"

Use these techniques naturally in conversation. Don't announce them—embody them.
`;
```

---

## Definition of Done

- [ ] Devil's Advocate mode prompt includes technique definitions
- [ ] Manual testing shows varied technique usage across sessions
- [ ] Techniques integrate with kill recommendation diplomatic flags
- [ ] Existing mode weight behavior unchanged
- [ ] No regression in other sub-persona modes

---

## Risk and Compatibility Check

**Primary Risk:** Techniques feel too aggressive or formulaic
**Mitigation:** Add "embody, don't announce" instruction; test conversational flow
**Rollback:** Revert to simpler Devil's Advocate mode definition

**Compatibility Verification:**
- [x] No breaking changes to existing APIs
- [x] Database changes: None required
- [x] UI changes: None required
- [x] Performance impact: Negligible
