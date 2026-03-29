-- 028: In-app feedback collection
-- Separate from trial_feedback (migration 006) which has different questions.
-- This table collects decision-usefulness and return-likelihood Likert ratings.
-- UNIQUE(user_id, session_id) allows one feedback per user per session.
-- Note: NULL session_id allows multiple "general" feedbacks per user (NULL != NULL in SQL).

-- 1. Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.bmad_sessions(id) ON DELETE SET NULL,
  decision_usefulness SMALLINT NOT NULL CHECK (decision_usefulness BETWEEN 1 AND 5),
  return_likelihood SMALLINT NOT NULL CHECK (return_likelihood BETWEEN 1 AND 5),
  free_text TEXT CHECK (char_length(free_text) <= 2000),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'auto_limit')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, session_id)
);

COMMENT ON TABLE public.feedback IS 'In-app feedback with Likert ratings for decision usefulness and return likelihood';

-- 2. Indexes
CREATE INDEX idx_feedback_user_id ON public.feedback(user_id);

-- 3. RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY feedback_insert_own ON public.feedback
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY feedback_select_own ON public.feedback
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- No UPDATE/DELETE policies by design — feedback is immutable once submitted.
