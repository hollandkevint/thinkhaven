# Story: Assumption Tracking (Simplified MVP) - Brownfield Addition

**Requirement:** FR-AC23 (Simplified Scope)
**Epic:** Epic 3 (Polished Output Generation & Export)
**Type:** Enhancement - Output Generation

---

## User Story

As a **user exporting my session outputs**,
I want **key assumptions from my session to be captured and included in my PRD/Spec export**,
So that **I have a clear list of what needs validation before building**.

---

## Story Context

**Existing System Integration:**
- Integrates with: `lib/bmad/generators/` (output generators)
- Technology: TypeScript, Markdown generation
- Follows pattern: Existing PRD/Spec generator structure
- Touch points: `ProductBriefGenerator.ts`, PRD export templates

**Simplified MVP Scope:**
- NO testability rating UI (deferred)
- NO assumption logging UI during session (deferred)
- YES: Extract assumptions from conversation history at export time
- YES: Include assumptions section in PRD/Spec output

---

## Acceptance Criteria

**Functional Requirements:**
1. PRD/Spec generator includes "Key Assumptions" section
2. Assumptions extracted from conversation history using pattern matching
3. Assumptions formatted as bullet list with source context
4. Devil's Advocate challenges are captured as "Challenged Assumptions"

**Integration Requirements:**
5. Existing PRD/Spec export flow unchanged
6. New section is additive to existing output structure
7. Works with both PDF and Markdown export formats

**Quality Requirements:**
8. Assumption extraction captures 80%+ of explicit assumptions
9. Export formatting is professional and scannable
10. No regression in existing export functionality

---

## Technical Notes

- **Integration Approach:** Add assumption extraction to PRD generator; pattern match phrases like "assuming that," "if we assume," "the assumption is"
- **Existing Pattern Reference:** Follow existing section generation in ProductBriefGenerator
- **Key Constraints:** Extraction is heuristic, not perfect—good enough for MVP

**Implementation Sketch:**
```typescript
// lib/bmad/generators/assumption-extractor.ts
const ASSUMPTION_PATTERNS = [
  /assuming (that )?(.+)/gi,
  /the assumption is (.+)/gi,
  /if we assume (.+)/gi,
  /this assumes (.+)/gi,
  /based on the assumption (.+)/gi,
];

export function extractAssumptions(conversationHistory: Message[]): Assumption[] {
  const assumptions: Assumption[] = [];

  for (const message of conversationHistory) {
    if (message.role === 'user') {
      for (const pattern of ASSUMPTION_PATTERNS) {
        const matches = message.content.matchAll(pattern);
        for (const match of matches) {
          assumptions.push({
            text: match[1] || match[2],
            source: 'user',
            messageIndex: message.index,
          });
        }
      }
    }
  }

  return deduplicateAssumptions(assumptions);
}
```

**Output Format:**
```markdown
## Key Assumptions

The following assumptions were identified during this session and should be validated:

**User Assumptions:**
- Enterprise customers will pay $500/month for this feature
- The API can handle 10,000 concurrent requests
- Users prefer mobile over desktop for this workflow

**Challenged Assumptions:**
- "Users want more features" → Mary challenged: actual need may be simplicity
- "Competitors can't copy this" → Mary challenged: low barrier to entry
```

---

## Definition of Done

- [ ] Assumption extraction function implemented
- [ ] PRD/Spec generator includes "Key Assumptions" section
- [ ] Both PDF and Markdown exports include assumptions
- [ ] Manual testing confirms reasonable assumption capture
- [ ] No regression in existing export functionality

---

## Risk and Compatibility Check

**Primary Risk:** Assumption extraction misses important assumptions or captures noise
**Mitigation:** Start with explicit phrases only; iterate based on user feedback
**Rollback:** Remove assumptions section from export, revert generator

**Compatibility Verification:**
- [x] No breaking changes to existing APIs
- [x] Database changes: None required
- [x] UI changes: None required (export-only)
- [x] Performance impact: Minimal (text pattern matching)
