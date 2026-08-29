-- Migration 034: Share-page indexing opt-in + session UTM attribution
-- Date: 2026-08-29
--
-- Two GTM-distribution changes that ship together:
--   1. public_artifacts.indexable -- share pages are noindex by default. Advisors send
--      these to clients; they must never become silently search-visible. Indexing is
--      opt-in per record, and there is deliberately no UI toggle yet (DB-only).
--   2. bmad_sessions.utm -- UTM params captured on /try arrival, carried through guest
--      migration so a saved session can be attributed to the link that produced it.
--
-- Rollback:
--   ALTER TABLE public.public_artifacts DROP COLUMN indexable;
--   ALTER TABLE public.bmad_sessions DROP COLUMN utm;

ALTER TABLE public.public_artifacts
  ADD COLUMN IF NOT EXISTS indexable boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.public_artifacts.indexable IS 'Opt-in search indexing. False means the /share page renders robots noindex,nofollow. Default false, by product decision.';

ALTER TABLE public.bmad_sessions
  ADD COLUMN IF NOT EXISTS utm jsonb;

COMMENT ON COLUMN public.bmad_sessions.utm IS 'UTM params (utm_source/medium/campaign/content/term) plus optional ref token, captured on /try arrival and carried through guest migration.';
