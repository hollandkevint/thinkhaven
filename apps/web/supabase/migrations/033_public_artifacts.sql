-- Migration 033: Public Artifacts (shareable decision records)
-- Purpose: Persist a decision_record (or other artifact) behind an unguessable token
--          so it can be rendered read-only at /share/[token] for anyone with the link.
-- Date: 2026-06-02
--
-- Writes happen only through the service-role share API (no anon INSERT policy).
-- Reads are public-by-token: the /share page fetches by the exact token.

-- ============================================================================
-- 1. TABLE
-- ============================================================================

CREATE TABLE public.public_artifacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    token text NOT NULL UNIQUE,
    title text NOT NULL,
    content text NOT NULL,
    pathway text,
    source text NOT NULL DEFAULT 'guest',
    session_id uuid,
    email text,
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.public_artifacts IS 'Shareable, read-only artifacts (e.g. plan-grill decision records) addressed by an unguessable token at /share/[token].';
COMMENT ON COLUMN public.public_artifacts.token IS 'Unguessable URL slug. The only way to read a row.';
COMMENT ON COLUMN public.public_artifacts.source IS 'Origin of the artifact: guest, session, or cli.';
COMMENT ON COLUMN public.public_artifacts.email IS 'Optional lead email captured when the user asked to be emailed the link.';

CREATE INDEX idx_public_artifacts_token ON public.public_artifacts(token);
CREATE INDEX idx_public_artifacts_created ON public.public_artifacts(created_at);

-- ============================================================================
-- 2. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.public_artifacts ENABLE ROW LEVEL SECURITY;

-- Public read: anyone can SELECT (the app only ever queries by exact token).
CREATE POLICY "Anyone can read shared artifacts"
    ON public.public_artifacts
    FOR SELECT
    USING (true);

-- No INSERT/UPDATE/DELETE policies. Inserts run through the service-role share API,
-- which bypasses RLS. This prevents anonymous clients from writing arbitrary rows.
