# Story: Cognitive Framework Alignment - Brownfield Addition

**Requirement:** FR-AC7a
**Epic:** Epic 2 (Strategic Pathways with Sub-Persona Weighting)
**Type:** Enhancement - Prompt Engineering

---

## User Story

As a **user selecting a strategic pathway**,
I want **the AI coaching approach to align with the cognitive mode required for my challenge**,
So that **I receive thinking techniques appropriate to my problem type**.

---

## Story Context

**Existing System Integration:**
- Integrates with: `lib/ai/mary-persona.ts` (Mary persona system prompt)
- Technology: Claude API system prompts, TypeScript
- Follows pattern: Existing sub-persona weight injection
- Touch points: `session-orchestrator.ts`, `pathway-router.ts`

**Cognitive Framework Mapping:**
| Pathway | Cognitive Mode | Techniques |
|---------|---------------|------------|
| New Idea | "Thinking about Value" | JTBD, Value Prop Canvas |
| Business Model | "Thinking through Constraints" | Assumption Testing, Feasibility Matrix |
| Feature Refinement | "Thinking with People" | Co-Design, Research Synthesis |

---

## Acceptance Criteria

**Functional Requirements:**
1. Mary's system prompt includes pathway-specific cognitive mode context
2. New Idea pathway prompts emphasize value discovery questions (JTBD framing)
3. Business Model pathway prompts emphasize constraint identification and assumption testing
4. Feature Refinement pathway prompts emphasize user research and co-design language

**Integration Requirements:**
5. Existing sub-persona weights continue to work unchanged
6. New cognitive context is additive to existing system prompt structure
7. No changes to API response format or streaming behavior

**Quality Requirements:**
8. Prompt changes validated through manual conversation testing
9. No regression in existing pathway behavior

---

## Technical Notes

- **Integration Approach:** Add cognitive mode annotation to pathway config in `pathway-router.ts`, inject into system prompt via `mary-persona.ts`
- **Existing Pattern Reference:** Follow sub-persona weight injection pattern
- **Key Constraints:** System prompt size limits (~4000 tokens available)

**Implementation Sketch:**
```typescript
// pathway-router.ts
const PATHWAY_COGNITIVE_MODES = {
  'new-idea': {
    mode: 'Thinking about Value',
    techniques: ['Jobs-to-be-Done framing', 'Value Proposition Canvas'],
    promptContext: 'Focus on discovering what problem the user is really solving and for whom.'
  },
  'business-model': {
    mode: 'Thinking through Constraints',
    techniques: ['Assumption Testing', 'Feasibility Matrix'],
    promptContext: 'Focus on identifying and challenging the riskiest assumptions in their model.'
  },
  'feature-refinement': {
    mode: 'Thinking with People',
    techniques: ['Co-Design', 'Research Synthesis'],
    promptContext: 'Focus on understanding user needs and validating the feature solves real problems.'
  }
};
```

---

## Definition of Done

- [ ] Cognitive mode context added to pathway configuration
- [ ] Mary's system prompt includes cognitive mode when pathway is selected
- [ ] Manual testing confirms mode-appropriate questioning for each pathway
- [ ] Existing sub-persona weighting continues to function
- [ ] No regression in session creation or streaming

---

## Risk and Compatibility Check

**Primary Risk:** System prompt bloat affecting response quality
**Mitigation:** Keep cognitive context concise (<200 tokens per pathway)
**Rollback:** Remove cognitive context from prompt, revert to weights-only

**Compatibility Verification:**
- [x] No breaking changes to existing APIs
- [x] Database changes: None required
- [x] UI changes: None required
- [x] Performance impact: Negligible (slight prompt size increase)
