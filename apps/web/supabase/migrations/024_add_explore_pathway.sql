-- Migration 024: Add 'explore' pathway + Lean Canvas
-- Rollback: DROP FUNCTION merge_lean_canvas; ALTER TABLE bmad_sessions DROP COLUMN lean_canvas;
--   then restore old CHECK constraint from migration 020.

-- 1. Update constraint (migration runner wraps in transaction)
ALTER TABLE bmad_sessions DROP CONSTRAINT IF EXISTS bmad_sessions_pathway_check;
ALTER TABLE bmad_sessions ADD CONSTRAINT bmad_sessions_pathway_check
  CHECK (pathway IN (
    'new-idea', 'business-model', 'strategic-optimization',
    'quick-decision', 'deep-analysis', 'board-of-directors', 'strategy-sprint',
    'explore'
  ));

-- 2. Add lean_canvas JSONB column
ALTER TABLE bmad_sessions
  ADD COLUMN IF NOT EXISTS lean_canvas JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 3. Atomic JSONB merge RPC with key validation
CREATE OR REPLACE FUNCTION merge_lean_canvas(p_session_id UUID, p_updates JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allowed_keys text[] := ARRAY[
    'problem','customer_segments','unique_value_proposition',
    'solution','channels','revenue_streams',
    'cost_structure','key_metrics','unfair_advantage'
  ];
  update_key text;
  sanitized JSONB := '{}'::jsonb;
  result JSONB;
  rows_affected integer;
BEGIN
  -- Strip unknown keys, coerce values to text, enforce 500 char limit
  FOR update_key IN SELECT jsonb_object_keys(p_updates) LOOP
    IF update_key = ANY(allowed_keys) THEN
      sanitized := sanitized || jsonb_build_object(
        update_key,
        left(p_updates->>update_key, 500)
      );
    END IF;
  END LOOP;

  UPDATE bmad_sessions
  SET lean_canvas = COALESCE(lean_canvas, '{}'::jsonb) || sanitized
  WHERE id = p_session_id
    AND user_id = auth.uid()
  RETURNING lean_canvas INTO result;

  GET DIAGNOSTICS rows_affected = ROW_COUNT;

  IF rows_affected = 0 THEN
    RETURN NULL;
  END IF;

  RETURN result;
END;
$$;
