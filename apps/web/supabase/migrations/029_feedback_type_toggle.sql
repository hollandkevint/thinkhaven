-- 029: Switch feedback from Likert ratings to type-based categorization
-- Drops decision_usefulness and return_likelihood columns.
-- Adds feedback_type enum column (praise/bug/feature_request).
-- Makes free_text NOT NULL (always required with type toggles).

-- 1. Add feedback_type column
ALTER TABLE public.feedback
  ADD COLUMN feedback_type TEXT;

-- 2. Backfill existing rows (map high usefulness to praise, low to bug, else feature_request)
UPDATE public.feedback
SET feedback_type = CASE
  WHEN decision_usefulness >= 4 THEN 'praise'
  WHEN decision_usefulness <= 2 THEN 'bug'
  ELSE 'feature_request'
END;

-- 3. Add constraints after backfill
ALTER TABLE public.feedback
  ALTER COLUMN feedback_type SET NOT NULL,
  ADD CONSTRAINT feedback_type_check CHECK (feedback_type IN ('praise', 'bug', 'feature_request'));

-- 4. Make free_text NOT NULL (existing rows already have it or NULL)
UPDATE public.feedback SET free_text = '' WHERE free_text IS NULL;
ALTER TABLE public.feedback ALTER COLUMN free_text SET NOT NULL;

-- 5. Drop old Likert columns
ALTER TABLE public.feedback
  DROP COLUMN decision_usefulness,
  DROP COLUMN return_likelihood;

-- 6. Update table comment
COMMENT ON TABLE public.feedback IS 'In-app feedback with type categorization (praise/bug/feature_request)';
