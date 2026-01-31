-- Migration 013: Beta Access Control
-- Purpose: Track waitlist signups and approval status for beta access
-- Date: 2026-01-30

-- ============================================================================
-- 1. BETA ACCESS TABLE
-- ============================================================================

-- Table to track waitlist signups and approval status
-- - NULL approved_at = pending/not approved
-- - Non-NULL approved_at = approved (timestamp is when)
CREATE TABLE public.beta_access (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    approved_at timestamptz,
    approved_by text,
    source text NOT NULL DEFAULT 'landing_page'
);

COMMENT ON TABLE public.beta_access IS 'Tracks beta waitlist signups and approval status. NULL approved_at means pending, timestamp means approved.';
COMMENT ON COLUMN public.beta_access.user_id IS 'Links to auth.users when user creates account. NULL for waitlist-only entries.';
COMMENT ON COLUMN public.beta_access.source IS 'How they joined: landing_page, signup, manual, import';
COMMENT ON COLUMN public.beta_access.approved_by IS 'Admin identifier for audit trail';

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

CREATE INDEX idx_beta_access_user_id ON public.beta_access(user_id);
CREATE INDEX idx_beta_access_email ON public.beta_access(email);
CREATE INDEX idx_beta_access_approved ON public.beta_access(approved_at) WHERE approved_at IS NOT NULL;

-- ============================================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.beta_access ENABLE ROW LEVEL SECURITY;

-- Users can view their own beta_access record
CREATE POLICY "Users can view own beta_access"
    ON public.beta_access
    FOR SELECT
    USING (auth.uid() = user_id);

-- Anyone can join the waitlist (insert their email)
CREATE POLICY "Anyone can join waitlist"
    ON public.beta_access
    FOR INSERT
    WITH CHECK (true);

-- No UPDATE/DELETE policies - admin uses service role via Supabase Table Editor

-- ============================================================================
-- 4. AUTO-CREATE TRIGGER ON SIGNUP
-- ============================================================================

-- Function to auto-create beta_access entry when user signs up
-- Uses ON CONFLICT to link existing waitlist entry to new user account
CREATE OR REPLACE FUNCTION public.handle_new_user_beta_access()
RETURNS TRIGGER AS $$
BEGIN
    -- Try to link existing waitlist entry (by email) to new user
    -- If no existing entry, create new one with source='signup'
    INSERT INTO public.beta_access (user_id, email, source)
    VALUES (NEW.id, NEW.email, 'signup')
    ON CONFLICT (user_id) DO NOTHING;

    -- Also try to update any existing email-only waitlist entry
    UPDATE public.beta_access
    SET user_id = NEW.id
    WHERE email = NEW.email AND user_id IS NULL;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger fires after new user created in auth.users
CREATE TRIGGER on_auth_user_created_beta
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_beta_access();

-- ============================================================================
-- 5. CUSTOM ACCESS TOKEN HOOK
-- ============================================================================

-- This function is called by Supabase Auth to customize JWT claims
-- It injects beta_approved=true/false based on approval status
-- Configure in Supabase Dashboard: Authentication > Hooks > Custom Access Token Hook
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb AS $$
DECLARE
    claims jsonb;
    user_id uuid;
    is_approved boolean;
BEGIN
    -- Extract user_id from the event
    user_id := (event->>'user_id')::uuid;

    -- Get current claims (or empty object)
    claims := COALESCE(event->'claims', '{}'::jsonb);

    -- Check if user is approved in beta_access table
    SELECT (approved_at IS NOT NULL) INTO is_approved
    FROM public.beta_access
    WHERE beta_access.user_id = custom_access_token_hook.user_id;

    -- Default to false if no record found
    is_approved := COALESCE(is_approved, false);

    -- Add beta_approved claim
    claims := jsonb_set(claims, '{beta_approved}', to_jsonb(is_approved));

    -- Return modified event with new claims
    RETURN jsonb_set(event, '{claims}', claims);
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;

COMMENT ON FUNCTION public.custom_access_token_hook IS 'Supabase Auth hook that injects beta_approved claim into JWTs. Configure in Dashboard > Authentication > Hooks.';

-- ============================================================================
-- 6. SECURITY: GRANT/REVOKE PERMISSIONS
-- ============================================================================

-- Grant execute to supabase_auth_admin (required for Auth hooks)
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

-- Grant read access to beta_access table for the hook function
GRANT SELECT ON public.beta_access TO supabase_auth_admin;

-- Revoke from all other roles (security best practice)
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
