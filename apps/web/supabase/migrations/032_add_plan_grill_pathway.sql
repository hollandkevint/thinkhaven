-- Migration 032: Add plan-grill pathway.
-- Keep active hosted pathway IDs and historical pathway IDs valid.

ALTER TABLE bmad_sessions DROP CONSTRAINT IF EXISTS bmad_sessions_pathway_check;

ALTER TABLE bmad_sessions ADD CONSTRAINT bmad_sessions_pathway_check
  CHECK (pathway IN (
    'decision',
    'product-idea',
    'strategy-review',
    'explore',
    'plan-grill',
    'new-idea',
    'business-model',
    'business-model-problem',
    'feature-refinement',
    'strategic-optimization',
    'quick-decision',
    'deep-analysis',
    'board-of-directors',
    'strategy-sprint'
  ));
