# Reports

Analysis reports and audits. Point-in-time snapshots: each report is dated and describes the repo as of that date; line-number citations rot as code moves, so trust the date, not the anchors.

## Naming convention

`YYYY-MM-DD-<topic>.md`, flat in this directory. Reports produced by a plan should link back to it.

## Live reports

- `2026-07-05-beta-gate-readiness.md` - Can the 60/50/40 beta-gate metrics be measured today? (instrumentation audit)
- `2026-07-05-strategy-product-drift.md` - Does shipped code enforce STRATEGY.md's promises? (test-backed CONFIRMED/WEAK/MISSING verdicts)

Both produced by `docs/plans/2026-07-05-001-feat-fable-briefs-gtm-audits-plan.md`.

## Archive

- `archive/YYYY-MM/` - older reports by month
- December 2025: `DATA_INTEGRITY_REPORT.md` (data consistency analysis), `SECURITY_AUDIT_FINAL.md` (system security audit)
