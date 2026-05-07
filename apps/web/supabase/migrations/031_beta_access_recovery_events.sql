-- Migration 031: Beta access recovery and support events
-- Purpose: Track last approved access and support-oriented beta lifecycle events
-- Date: 2026-05-07

ALTER TABLE public.beta_access
    ADD COLUMN IF NOT EXISTS last_access_at timestamptz;

COMMENT ON COLUMN public.beta_access.last_access_at IS 'Most recent observed approved access to the protected app.';

CREATE INDEX IF NOT EXISTS idx_beta_access_last_access
    ON public.beta_access(last_access_at DESC)
    WHERE last_access_at IS NOT NULL;

ALTER TABLE public.beta_auth_events
    DROP CONSTRAINT IF EXISTS beta_auth_events_event_type_check;

ALTER TABLE public.beta_auth_events
    ADD CONSTRAINT beta_auth_events_event_type_check CHECK (
        event_type IN (
            'waitlist_joined',
            'waitlist_duplicate',
            'beta_approved',
            'beta_revoked',
            'beta_restored',
            'invite_copied',
            'invite_arrived',
            'signup_from_invite',
            'guest_migration_attempted',
            'beta_gate_pending',
            'beta_gate_approved',
            'beta_gate_revoked',
            'first_app_access',
            'support_requested',
            'support_note'
        )
    );

ALTER TABLE public.beta_auth_events
    ADD CONSTRAINT beta_auth_events_metadata_size_check CHECK (
        octet_length(metadata::text) <= 4096
    );
