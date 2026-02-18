---
status: pending
priority: p2
issue_id: "017"
tags: [code-review, security, database]
dependencies: []
---

# Overly Permissive RLS on Credit Tables

## Problem Statement
Migration `010_fix_rls_insert_policies.sql` sets `WITH CHECK (true)` for INSERT and UPDATE on `user_credits` and `credit_transactions`. Any authenticated user could craft a direct Supabase client call (using the public anon key) to grant themselves arbitrary credits.

## Findings
- **Security Sentinel**: LOW severity but exploitable. The more restrictive policies are already commented out in the migration file.
- **Architecture Strategist**: The `SECURITY DEFINER` RPC functions bypass RLS, so tightening policies won't break the trigger or atomic deduction flow.

## Proposed Solutions
Switch to the restrictive policies already in the migration comments:
```sql
CREATE POLICY "Users can insert their own credits" ON user_credits
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## Technical Details
- **Files**: `supabase/migrations/010_fix_rls_insert_policies.sql`
- Requires a new migration to alter policies

## Acceptance Criteria
- [ ] RLS policies restrict INSERT/UPDATE to `auth.uid() = user_id`
- [ ] `grant_free_credit()` trigger still works on signup
- [ ] `deduct_credit_transaction()` RPC still works

## Work Log
| Date | Action | Notes |
|------|--------|-------|
| 2026-02-17 | Created | From code review - security sentinel finding |
