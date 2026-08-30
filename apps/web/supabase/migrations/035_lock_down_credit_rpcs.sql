-- Migration 035: Close credit-RPC privilege holes
-- Date: 2026-08-29
--
-- Both credit RPCs are SECURITY DEFINER, take p_user_id as a caller-supplied parameter,
-- and were executable by `anon` via /rest/v1/rpc/. Neither checked the caller. The anon
-- key ships in the browser bundle, so before this migration anyone could:
--   * mint unlimited credits for any account   -> add_credits_transaction
--   * drain any other user's balance           -> deduct_credit_transaction
--
-- add_credits_transaction has no callers in the application -- the addCredits() wrapper
-- in lib/monetization/credit-manager.ts is dead code -- so it is restricted to
-- service_role outright rather than given a guard.
--
-- deduct_credit_transaction is called by the app as the `authenticated` role through the
-- cookie client (credit-manager.deductCredit), so it keeps that grant and enforces
-- ownership instead. service_role has a NULL auth.uid(), so trusted server-side calls
-- still pass the guard.
--
-- This encodes the existing repo rule "SECURITY DEFINER RPCs must use auth.uid()
-- directly", which these two predated.
--
-- Rollback:
--   GRANT EXECUTE ON FUNCTION public.add_credits_transaction(uuid,integer,text,text,text) TO anon, authenticated;
--   GRANT EXECUTE ON FUNCTION public.deduct_credit_transaction(uuid,uuid) TO anon;
--   -- and remove the ownership guard below.

REVOKE EXECUTE ON FUNCTION public.add_credits_transaction(uuid, integer, text, text, text) FROM anon, authenticated, public;

CREATE OR REPLACE FUNCTION public.deduct_credit_transaction(p_user_id uuid, p_session_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_balance INTEGER;
    v_new_balance INTEGER;
    v_caller uuid;
BEGIN
    -- Ownership guard. auth.uid() is NULL for service_role, which is trusted;
    -- any signed-in caller may only deduct from their own balance.
    v_caller := auth.uid();
    IF v_caller IS NOT NULL AND v_caller <> p_user_id THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'message', 'Not authorized',
            'balance', 0
        );
    END IF;

    SELECT balance INTO v_balance
    FROM user_credits
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF v_balance IS NULL THEN
        RETURN jsonb_build_object('success', FALSE, 'message', 'User credits not found', 'balance', 0);
    END IF;

    IF v_balance < 1 THEN
        RETURN jsonb_build_object('success', FALSE, 'message', 'Insufficient credits', 'balance', v_balance);
    END IF;

    v_new_balance := v_balance - 1;

    UPDATE user_credits
    SET balance = v_new_balance,
        total_used = total_used + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    INSERT INTO credit_transactions (
        user_id, transaction_type, amount, balance_after, session_id, description
    )
    VALUES (
        p_user_id, 'deduct', -1, v_new_balance, p_session_id, 'Credit deducted for session start'
    );

    RETURN jsonb_build_object('success', TRUE, 'balance', v_new_balance, 'message', 'Credit deducted successfully');
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.deduct_credit_transaction(uuid, uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.deduct_credit_transaction(uuid, uuid) TO authenticated;
