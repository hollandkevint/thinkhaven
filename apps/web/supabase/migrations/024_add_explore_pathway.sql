-- Migration 024: Add 'explore' pathway to CHECK constraint
-- Rollback: Restore old CHECK from migration 020 (remove 'explore')

BEGIN;
  ALTER TABLE bmad_sessions DROP CONSTRAINT IF EXISTS bmad_sessions_pathway_check;
  ALTER TABLE bmad_sessions ADD CONSTRAINT bmad_sessions_pathway_check
    CHECK (pathway IN (
      'new-idea', 'business-model', 'strategic-optimization',
      'quick-decision', 'deep-analysis', 'board-of-directors', 'strategy-sprint',
      'explore'
    ));
COMMIT;
