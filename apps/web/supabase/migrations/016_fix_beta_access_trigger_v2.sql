-- Migration 016: Fix beta_access signup trigger (v2)
-- Purpose: More defensive trigger that won't break user signup
-- Date: 2026-02-02

-- The trigger should NEVER prevent user signup from completing.
-- Use exception handling to ensure signup succeeds even if beta_access fails.

CREATE OR REPLACE FUNCTION public.handle_new_user_beta_access()
RETURNS TRIGGER AS $$
BEGIN
    -- First, try to update any existing waitlist entry (by email)
    UPDATE public.beta_access
    SET user_id = NEW.id
    WHERE email = NEW.email AND user_id IS NULL;

    -- If no row was updated, create a new entry
    IF NOT FOUND THEN
        BEGIN
            INSERT INTO public.beta_access (user_id, email, source)
            VALUES (NEW.id, NEW.email, 'signup');
        EXCEPTION
            WHEN unique_violation THEN
                -- Email already exists, try to update it
                UPDATE public.beta_access
                SET user_id = NEW.id
                WHERE email = NEW.email;
            WHEN OTHERS THEN
                -- Log but don't fail - user signup is more important
                RAISE WARNING 'beta_access insert failed for user %: %', NEW.id, SQLERRM;
        END;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Never let beta_access issues block user signup
        RAISE WARNING 'handle_new_user_beta_access failed for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user_beta_access IS 'Links new auth.users to beta_access. Defensive - never blocks signup.';
