-- 030: Add would_recommend and disappear_alternative fields to feedback table
-- Both columns are optional (nullable) to keep existing feedback valid.

ALTER TABLE public.feedback ADD COLUMN would_recommend BOOLEAN;
ALTER TABLE public.feedback ADD COLUMN disappear_alternative TEXT;
