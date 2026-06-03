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

-- No anon policies, by design. Both reads (the /share/[token] page) and writes (the share API)
-- go through the service-role admin client, which bypasses RLS. A permissive public SELECT
-- (USING(true)) would expose every row -- including captured lead emails and full artifact
-- content -- to any holder of the NEXT_PUBLIC anon key via PostgREST, with the token providing
-- no protection. RLS-enabled-with-no-policies denies the anon role entirely.
-- If a future anon read path is ever needed, scope it by token: USING (token = <value>), never USING(true).
