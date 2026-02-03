-- Migration 015: Fix beta_access signup trigger
-- Purpose: Handle email unique constraint when linking waitlist to user
-- Date: 2026-02-02

-- The previous trigger failed when:
-- 1. User joins waitlist (creates row with email, user_id=NULL)
-- 2. User signs up (trigger tries INSERT, fails on email unique constraint)
-- 3. UPDATE never runs because INSERT threw an error

CREATE OR REPLACE FUNCTION public.handle_new_user_beta_access()
RETURNS TRIGGER AS $$
BEGIN
    -- First, try to update any existing waitlist entry (by email)
    UPDATE public.beta_access
    SET user_id = NEW.id
    WHERE email = NEW.email AND user_id IS NULL;

    -- If no row was updated, create a new entry
    IF NOT FOUND THEN
        INSERT INTO public.beta_access (user_id, email, source)
        VALUES (NEW.id, NEW.email, 'signup')
        ON CONFLICT (email) DO UPDATE SET user_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user_beta_access IS 'Links new auth.users to beta_access. Updates existing waitlist entry or creates new one.';
