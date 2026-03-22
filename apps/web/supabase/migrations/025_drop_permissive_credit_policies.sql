-- Migration 025: Drop overly permissive RLS policies on credit tables
-- These policies allow ANY authenticated user to insert/update credit balances.
-- SECURITY DEFINER functions (grant_free_credit, deduct_credit_transaction,
-- add_credits_transaction) already bypass RLS, so these policies are unnecessary.
--
-- Rollback: Restore policies from migration 010_fix_rls_insert_policies.sql

DROP POLICY IF EXISTS "Service can insert user credits" ON user_credits;
DROP POLICY IF EXISTS "Service can insert credit transactions" ON credit_transactions;
DROP POLICY IF EXISTS "Service can update user credits" ON user_credits;
