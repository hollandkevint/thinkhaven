-- Migration 023: One-time data migration from user_workspace to bmad_sessions
-- Separate from schema (022) for failure isolation. Can be re-run if needed.
-- user_workspace data is preserved (not deleted) for rollback safety.

-- 1. Copy chat to most recent active session per user
-- Guards against malformed guest migration data with jsonb_typeof check
WITH latest_sessions AS (
  SELECT DISTINCT ON (user_id) id, user_id
  FROM bmad_sessions
  WHERE status = 'active'
  ORDER BY user_id, created_at DESC
)
UPDATE bmad_sessions bs
SET chat_context = COALESCE(
  CASE
    WHEN jsonb_typeof(uw.workspace_state->'chat_context') = 'array'
    THEN uw.workspace_state->'chat_context'
    ELSE '[]'::jsonb
  END,
  '[]'::jsonb
)
FROM latest_sessions ls
JOIN user_workspace uw ON uw.user_id = bs.user_id
WHERE bs.id = ls.id
  AND bs.user_id = ls.user_id;

-- 2. Set titles using exact pathway names (INITCAP produces "Board Of Directors")
UPDATE bmad_sessions
SET title = CASE pathway
  WHEN 'quick-decision' THEN 'Quick Decision'
  WHEN 'deep-analysis' THEN 'Deep Analysis'
  WHEN 'board-of-directors' THEN 'Board of Directors'
  WHEN 'strategy-sprint' THEN 'Strategy Sprint'
  WHEN 'new-idea' THEN 'New Idea'
  WHEN 'business-model' THEN 'Business Model'
  WHEN 'business-model-problem' THEN 'Business Model Problem'
  WHEN 'feature-refinement' THEN 'Feature Refinement'
  WHEN 'strategic-optimization' THEN 'Strategic Optimization'
  ELSE INITCAP(REPLACE(pathway, '-', ' '))
END
WHERE title IS NULL;

-- 3. Verification queries
SELECT 'sessions_with_migrated_chat' AS metric,
       COUNT(*) AS value
FROM bmad_sessions
WHERE chat_context != '[]'::jsonb;

SELECT 'orphaned_chat_users' AS metric,
       COUNT(*) AS value
FROM user_workspace uw
WHERE jsonb_typeof(uw.workspace_state->'chat_context') = 'array'
  AND jsonb_array_length(uw.workspace_state->'chat_context') > 0
  AND NOT EXISTS (
    SELECT 1 FROM bmad_sessions bs
    WHERE bs.user_id = uw.user_id AND bs.status = 'active'
  );

SELECT 'malformed_chat_context' AS metric,
       COUNT(*) AS value
FROM bmad_sessions
WHERE chat_context IS NOT NULL
  AND jsonb_typeof(chat_context) != 'array';
