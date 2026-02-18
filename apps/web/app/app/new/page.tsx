'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase/client';
import AnimatedLoader from '@/app/components/ui/AnimatedLoader';
import { ErrorState } from '@/app/components/ui/ErrorState';

const sessionMessages = [
  'Preparing your workspace...',
  'Loading strategic frameworks...',
  'Configuring your analysis tools...',
  'Initializing your session...',
];

export default function NewSessionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const creatingRef = useRef(false);

  const createSession = useCallback(async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (creatingRef.current) return;
    creatingRef.current = true;

    try {
      setError(null);

      // workspace_id = user_id in current architecture (one workspace per user)
      const workspaceId = user.id;

      // Create a new session with correct schema columns
      const { data: session, error: createError } = await supabase
        .from('bmad_sessions')
        .insert({
          user_id: user.id,
          workspace_id: workspaceId,
          pathway: 'new-idea',
          current_phase: 'discovery',
          current_template: 'general',
          current_step: 'chat',
          templates: [],
          next_steps: [],
          status: 'active',
          overall_completion: 0,
          message_count: 0,
          message_limit: 10,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Redirect to the session workspace
      router.push(`/app/session/${session.id}`);
    } catch (err) {
      creatingRef.current = false;
      console.error('Error creating session:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create session';
      setError(errorMessage);
      setIsRetrying(false);
    }
  }, [user, router]);

  useEffect(() => {
    createSession();
  }, [createSession]);

  const handleRetry = () => {
    setIsRetrying(true);
    setRetryCount(c => c + 1);
    createSession();
  };

  const handleBackToDashboard = () => {
    router.push('/app');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center">
        <ErrorState
          error={error}
          onRetry={handleRetry}
          retryCount={retryCount}
          isRetrying={isRetrying}
        />
        <button
          onClick={handleBackToDashboard}
          className="mt-4 px-4 py-2 text-sm text-ink-light hover:text-ink transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <AnimatedLoader messages={sessionMessages} className="min-h-screen" />
    </div>
  );
}
