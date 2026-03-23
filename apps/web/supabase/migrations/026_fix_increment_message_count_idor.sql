-- Migration 026: Fix IDOR on increment_message_count
-- The function previously accepted only session_id with no ownership check.
-- Any authenticated user could increment another user's message count.

CREATE OR REPLACE FUNCTION increment_message_count(p_session_id TEXT, p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE(
  new_count INTEGER,
  limit_reached BOOLEAN,
  message_limit INTEGER
) AS $$
DECLARE
  v_count INTEGER;
  v_limit INTEGER;
  v_reached BOOLEAN;
BEGIN
  -- Atomically increment message count with ownership check
  UPDATE bmad_sessions
  SET
    message_count = message_count + 1,
    updated_at = NOW(),
    limit_reached_at = CASE
      WHEN message_count + 1 >= message_limit AND limit_reached_at IS NULL
      THEN NOW()
      ELSE limit_reached_at
    END
  WHERE id = p_session_id
    AND user_id = p_user_id
  RETURNING message_count, bmad_sessions.message_limit, (message_count >= bmad_sessions.message_limit)
  INTO v_count, v_limit, v_reached;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found or access denied: %', p_session_id;
  END IF;

  RETURN QUERY SELECT v_count, v_reached, v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
