-- Migration 014: Add unique constraint to beta_access email
-- Purpose: Prevent duplicate waitlist signups with same email
-- Date: 2026-02-02

-- First, remove duplicates (keep earliest entry)
DELETE FROM public.beta_access a
USING public.beta_access b
WHERE a.email = b.email
  AND a.created_at > b.created_at;

-- Now add unique constraint
ALTER TABLE public.beta_access
ADD CONSTRAINT beta_access_email_unique UNIQUE (email);

COMMENT ON CONSTRAINT beta_access_email_unique ON public.beta_access IS 'Prevents duplicate waitlist signups with same email';
