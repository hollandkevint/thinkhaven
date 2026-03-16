-- Migration 022: Per-session chat isolation (schema + RPC + policies)
-- Each bmad_session now owns its own chat_context instead of sharing user_workspace.
-- Architecture decision: per-session isolated (confirmed 2026-03-16).

-- 1. Add chat storage and title columns
ALTER TABLE bmad_sessions
  ADD COLUMN IF NOT EXISTS chat_context JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS title TEXT;

-- 2. RPC for atomic message append
-- Eliminates read-modify-write race condition.
-- Uses Postgres || operator for O(1) append instead of full JSONB rewrite.
CREATE OR REPLACE FUNCTION append_chat_message(
  p_session_id UUID,
  p_user_id UUID,
  p_message JSONB
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE bmad_sessions
  SET chat_context = chat_context || jsonb_build_array(p_message),
      updated_at = now()
  WHERE id = p_session_id
    AND user_id = p_user_id;
$$;

-- 3. Missing DELETE policy (only SELECT, INSERT, UPDATE existed)
CREATE POLICY "Users can delete their own BMad sessions" ON bmad_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Dashboard query index (user_id + updated_at for sorted session list)
-- The PK index on (id) already covers session page lookups.
CREATE INDEX IF NOT EXISTS idx_bmad_sessions_user_dashboard
  ON bmad_sessions(user_id, updated_at DESC);

-- 5. Document deprecation
COMMENT ON TABLE user_workspace IS 'DEPRECATED for chat as of migration 022. Chat now in bmad_sessions.chat_context. Retained for canvas_elements only.';
