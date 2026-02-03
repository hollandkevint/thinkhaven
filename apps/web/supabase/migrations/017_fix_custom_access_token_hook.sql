-- Migration 017: Fix custom_access_token_hook SQL error
-- Purpose: Fix "missing FROM-clause entry" error that breaks user signup
-- Date: 2026-02-02

-- The previous version referenced "custom_access_token_hook.user_id"
-- which PostgreSQL interpreted as table.column, not function.variable.

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb AS $$
DECLARE
    claims jsonb;
    v_user_id uuid;
    is_approved boolean;
BEGIN
    -- Extract user_id from the event
    v_user_id := (event->>'user_id')::uuid;

    -- Get current claims (or empty object)
    claims := COALESCE(event->'claims', '{}'::jsonb);

    -- Check if user is approved in beta_access table
    SELECT (approved_at IS NOT NULL) INTO is_approved
    FROM public.beta_access
    WHERE beta_access.user_id = v_user_id;

    -- Default to false if no record found
    is_approved := COALESCE(is_approved, false);

    -- Add beta_approved claim
    claims := jsonb_set(claims, '{beta_approved}', to_jsonb(is_approved));

    -- Return modified event with new claims
    RETURN jsonb_set(event, '{claims}', claims);
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;

COMMENT ON FUNCTION public.custom_access_token_hook IS 'Supabase Auth hook that injects beta_approved claim into JWTs. Configure in Dashboard > Authentication > Hooks.';

-- Re-grant permissions (in case they were lost)
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
