-- Migration 027: Credit system activation
-- 1. Drop old 2-credit trigger (from migration 005/019) to prevent conflicts
-- 2. Auto-create user_credits row on signup via trigger with 5 free sessions
-- 3. Grant 5 free sessions to all existing users who don't have credits
-- 4. Log all grants as credit_transactions for audit trail

-- 1. Drop the old trigger that granted 2 credits (replaced by this one)
DROP TRIGGER IF EXISTS trigger_grant_free_credit ON auth.users;

-- 2. Trigger: auto-create user_credits row with 5 free sessions on signup
-- Uses exception handling so signup never breaks if credit insert fails
CREATE OR REPLACE FUNCTION create_user_credits_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    INSERT INTO user_credits (user_id, balance, total_granted, total_purchased, total_used)
    VALUES (NEW.id, 5, 5, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;

    -- Log the grant for audit trail
    INSERT INTO credit_transactions (user_id, transaction_type, amount, balance_after, description)
    VALUES (NEW.id, 'grant', 5, 5, 'Welcome grant: 5 free sessions');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'create_user_credits_on_signup failed for user %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END;
$$;

-- Drop if exists to make migration idempotent
DROP TRIGGER IF EXISTS on_auth_user_created_credits ON auth.users;
CREATE TRIGGER on_auth_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_credits_on_signup();

-- 3. Grant 5 free sessions to existing users who don't have a user_credits row
INSERT INTO user_credits (user_id, balance, total_granted, total_purchased, total_used)
SELECT id, 5, 5, 0, 0
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_credits)
ON CONFLICT (user_id) DO NOTHING;

-- For existing users who DO have a row but have 0 balance and 0 grants, add 5
UPDATE user_credits
SET balance = balance + 5,
    total_granted = total_granted + 5,
    updated_at = NOW()
WHERE balance = 0 AND total_granted = 0;

-- 4. Log the grants as transactions for audit trail
INSERT INTO credit_transactions (user_id, transaction_type, amount, balance_after, description)
SELECT uc.user_id, 'grant', 5, uc.balance, 'Beta user welcome grant: 5 free sessions'
FROM user_credits uc
WHERE NOT EXISTS (
  SELECT 1 FROM credit_transactions ct
  WHERE ct.user_id = uc.user_id
    AND ct.description = 'Beta user welcome grant: 5 free sessions'
);
