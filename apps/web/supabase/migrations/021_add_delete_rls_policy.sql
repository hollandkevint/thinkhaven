-- Add DELETE RLS policy for bmad_sessions.
-- Previously missing: no DELETE policy existed, so deletes silently failed.

CREATE POLICY "Users can delete their own BMad sessions"
  ON bmad_sessions
  FOR DELETE
  USING (auth.uid() = user_id);
