-- Migration 027: Credit system activation
-- 1. Auto-create user_credits row on signup via trigger
-- 2. Grant 5 free sessions to all existing users who don't have credits

-- 1. Trigger: auto-create user_credits row with 5 free sessions on signup
CREATE OR REPLACE FUNCTION create_user_credits_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_credits (user_id, balance, total_granted, total_purchased, total_used)
  VALUES (NEW.id, 5, 5, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop if exists to make migration idempotent
DROP TRIGGER IF EXISTS on_auth_user_created_credits ON auth.users;
CREATE TRIGGER on_auth_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_credits_on_signup();

-- 2. Grant 5 free sessions to existing users who don't have a user_credits row
INSERT INTO user_credits (user_id, balance, total_granted, total_purchased, total_used)
SELECT id, 5, 5, 0, 0
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_credits)
ON CONFLICT (user_id) DO NOTHING;

-- 3. For existing users who DO have a row but have 0 balance, grant 5
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
