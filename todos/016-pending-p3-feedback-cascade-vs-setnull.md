---
status: pending
priority: p3
created: 2026-03-29
updated: 2026-03-29
tags: [code-review, data-integrity]
---

# Feedback table ON DELETE CASCADE destroys analytics data

## Problem Statement

Migration 028 uses `ON DELETE CASCADE` on `user_id`. If a user deletes their account (GDPR), all their feedback is destroyed. Feedback ratings are analytics gold for product decisions.

Found by: Data integrity guardian

## Context

- All other tables in the project use CASCADE (consistent)
- Alternative: `ON DELETE SET NULL` preserves anonymized aggregate data while severing PII link
- Trade-off: SET NULL requires dropping NOT NULL on user_id and adjusting RLS

## Acceptance Criteria

- [ ] Decide: CASCADE (simple, consistent) vs SET NULL (preserves analytics)
- [ ] Document the decision in migration comment

## Notes

CASCADE is defensible at current scale. Consider SET NULL if/when feedback volume matters for product decisions.

## References

- Migration 028 in the plan
- Existing pattern: all tables use CASCADE
