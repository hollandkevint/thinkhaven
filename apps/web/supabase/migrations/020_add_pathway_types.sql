-- Add new pathway types for the redesigned session selection flow.
-- Keep old values for backward compatibility with existing sessions.

ALTER TABLE bmad_sessions DROP CONSTRAINT IF EXISTS bmad_sessions_pathway_check;

ALTER TABLE bmad_sessions ADD CONSTRAINT bmad_sessions_pathway_check
  CHECK (pathway IN (
    -- Legacy pathways (existing sessions)
    'new-idea', 'business-model', 'business-model-problem',
    'feature-refinement', 'strategic-optimization',
    -- New pathways (redesigned flow)
    'quick-decision', 'deep-analysis', 'board-of-directors', 'strategy-sprint'
  ));
