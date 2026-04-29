-- Migration 030: Beta operations and durable event log
-- Purpose: Track current beta access state, invite operations, and sanitized auth/beta funnel events
-- Date: 2026-04-28

-- ============================================================================
-- 1. BETA ACCESS OPERATIONS STATE
-- ============================================================================

ALTER TABLE public.beta_access
    ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
    ADD COLUMN IF NOT EXISTS revoked_by text,
    ADD COLUMN IF NOT EXISTS last_invited_at timestamptz,
    ADD COLUMN IF NOT EXISTS invite_copied_at timestamptz,
    ADD COLUMN IF NOT EXISTS invite_count integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_gate_at timestamptz,
    ADD COLUMN IF NOT EXISTS last_gate_status text,
    ADD COLUMN IF NOT EXISTS first_access_at timestamptz;

COMMENT ON COLUMN public.beta_access.revoked_at IS 'Current beta access is revoked when this is set, even if approved_at remains for audit history.';
COMMENT ON COLUMN public.beta_access.revoked_by IS 'Admin identifier that last revoked current beta access.';
COMMENT ON COLUMN public.beta_access.last_invited_at IS 'Last time an invite was sent or explicitly recorded by an operator.';
COMMENT ON COLUMN public.beta_access.invite_copied_at IS 'Last time an operator copied an invite link for this beta record.';
COMMENT ON COLUMN public.beta_access.invite_count IS 'Number of recorded invite copy/send actions.';
COMMENT ON COLUMN public.beta_access.last_gate_at IS 'Last time the server beta guard evaluated this record.';
COMMENT ON COLUMN public.beta_access.last_gate_status IS 'Last server beta guard status observed for this record.';
COMMENT ON COLUMN public.beta_access.first_access_at IS 'First observed approved access to the protected app.';

-- Waitlist writes now go through /api/beta/waitlist with the service role.
-- Remove the legacy public insert policy so browser clients cannot set
-- privileged beta_access columns such as approved_at, user_id, or revoked_at.
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.beta_access;

CREATE INDEX IF NOT EXISTS idx_beta_access_current_approved
    ON public.beta_access(user_id)
    WHERE approved_at IS NOT NULL AND revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_beta_access_revoked
    ON public.beta_access(revoked_at)
    WHERE revoked_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_beta_access_last_gate
    ON public.beta_access(last_gate_at DESC)
    WHERE last_gate_at IS NOT NULL;

-- The custom access-token hook executes as supabase_auth_admin. Under RLS it
-- needs an explicit policy in addition to grants.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'beta_access'
          AND policyname = 'Auth hook can read beta access'
    ) THEN
        CREATE POLICY "Auth hook can read beta access"
            ON public.beta_access
            FOR SELECT
            TO supabase_auth_admin
            USING (true);
    END IF;
END $$;

GRANT SELECT ON public.beta_access TO supabase_auth_admin;

-- ============================================================================
-- 2. CUSTOM ACCESS TOKEN HOOK CURRENT ACCESS STATE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb AS $$
DECLARE
    claims jsonb;
    v_user_id uuid;
    is_approved boolean;
BEGIN
    v_user_id := (event->>'user_id')::uuid;
    claims := COALESCE(event->'claims', '{}'::jsonb);

    SELECT (approved_at IS NOT NULL AND revoked_at IS NULL) INTO is_approved
    FROM public.beta_access
    WHERE beta_access.user_id = v_user_id;

    is_approved := COALESCE(is_approved, false);
    claims := jsonb_set(claims, '{beta_approved}', to_jsonb(is_approved));

    RETURN jsonb_set(event, '{claims}', claims);
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER;

COMMENT ON FUNCTION public.custom_access_token_hook IS 'Supabase Auth hook that injects beta_approved based on current, non-revoked beta access.';

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

-- ============================================================================
-- 3. DURABLE BETA/AUTH EVENT LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.beta_auth_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type text NOT NULL,
    actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    beta_access_id uuid REFERENCES public.beta_access(id) ON DELETE SET NULL,
    target_email_hash text,
    request_path text,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT beta_auth_events_event_type_check CHECK (
        event_type IN (
            'waitlist_joined',
            'waitlist_duplicate',
            'beta_approved',
            'beta_revoked',
            'invite_copied',
            'invite_arrived',
            'signup_from_invite',
            'guest_migration_attempted',
            'beta_gate_pending',
            'beta_gate_approved',
            'beta_gate_revoked',
            'first_app_access'
        )
    ),
    CONSTRAINT beta_auth_events_metadata_object_check CHECK (jsonb_typeof(metadata) = 'object')
);

COMMENT ON TABLE public.beta_auth_events IS 'Durable sanitized beta/auth funnel events for beta operations. Avoid raw emails and session payloads.';
COMMENT ON COLUMN public.beta_auth_events.target_email_hash IS 'Stable hash of an email or invite target, not the raw email address.';
COMMENT ON COLUMN public.beta_auth_events.metadata IS 'Sanitized operational metadata. Do not store raw secrets, sessions, or full user content.';

CREATE INDEX IF NOT EXISTS idx_beta_auth_events_type_created
    ON public.beta_auth_events(event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_beta_auth_events_actor_created
    ON public.beta_auth_events(actor_user_id, created_at DESC)
    WHERE actor_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_beta_auth_events_target_created
    ON public.beta_auth_events(target_user_id, created_at DESC)
    WHERE target_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_beta_auth_events_beta_access_created
    ON public.beta_auth_events(beta_access_id, created_at DESC)
    WHERE beta_access_id IS NOT NULL;

ALTER TABLE public.beta_auth_events ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated table policies. Server-side admin/service-role code is
-- the only writer/reader for operational beta events.
