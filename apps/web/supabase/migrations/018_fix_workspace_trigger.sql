-- Migration 018: Fix workspace trigger to never block signup
-- Purpose: Add exception handling so workspace issues don't prevent user creation
-- Date: 2026-02-02

CREATE OR REPLACE FUNCTION public.handle_new_user_workspace()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user_workspace already exists for this user
    IF NOT EXISTS (
        SELECT 1 FROM public.user_workspace
        WHERE user_id = NEW.id
    ) THEN
        BEGIN
            -- Create a new user_workspace record
            INSERT INTO public.user_workspace (user_id, workspace_state, created_at, updated_at)
            VALUES (
                NEW.id,
                jsonb_build_object(
                    'initialized', true,
                    'name', 'My Strategic Workspace',
                    'description', 'Strategic thinking and planning workspace',
                    'dual_pane_state', jsonb_build_object(
                        'chat_width', 50,
                        'canvas_width', 50,
                        'active_pane', 'chat',
                        'collapsed', false
                    ),
                    'chat_context', '[]'::jsonb,
                    'canvas_elements', '[]'::jsonb,
                    'created_at', NOW()
                ),
                NOW(),
                NOW()
            );
        EXCEPTION
            WHEN OTHERS THEN
                -- Log but don't fail - user signup is more important
                RAISE WARNING 'Failed to create workspace for user %: %', NEW.id, SQLERRM;
        END;
    END IF;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Never let workspace issues block user signup
        RAISE WARNING 'handle_new_user_workspace failed for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user_workspace() IS 'Creates user_workspace on signup. Defensive - never blocks signup.';
