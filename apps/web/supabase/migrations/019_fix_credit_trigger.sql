-- Migration 019: Fix credit trigger to never block signup
-- Purpose: Add exception handling so credit issues don't prevent user creation
-- Date: 2026-02-02

CREATE OR REPLACE FUNCTION grant_free_credit()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user_credits already exists for this user
    IF NOT EXISTS (
        SELECT 1 FROM user_credits
        WHERE user_id = NEW.id
    ) THEN
        BEGIN
            -- Create user_credits record with 2 free credits (MVP trial)
            INSERT INTO user_credits (user_id, balance, total_granted)
            VALUES (NEW.id, 2, 2);

            -- Log the transaction
            INSERT INTO credit_transactions (
                user_id,
                transaction_type,
                amount,
                balance_after,
                description
            )
            VALUES (
                NEW.id,
                'grant',
                2,
                2,
                'Welcome! Try 2 free sessions to experience ThinkHaven.'
            );
        EXCEPTION
            WHEN OTHERS THEN
                -- Log but don't fail - user signup is more important
                RAISE WARNING 'Failed to grant free credits for user %: %', NEW.id, SQLERRM;
        END;
    END IF;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Never let credit issues block user signup
        RAISE WARNING 'grant_free_credit failed for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION grant_free_credit() IS 'Grants 2 free credits to new users. Defensive - never blocks signup.';
