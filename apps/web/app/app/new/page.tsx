'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase/client';
import AnimatedLoader from '@/app/components/ui/AnimatedLoader';
import { ErrorState } from '@/app/components/ui/ErrorState';

const sessionMessages = [
  'Starting your session...',
  'Preparing Mary...',
  'Setting up your workspace...',
];

export default function NewSessionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const creatingRef = useRef(false);

  const createSession = useCallback(async () => {
    if (!user || creatingRef.current) return;
    creatingRef.current = true;

    try {
      setError(null);

      const { data: session, error: createError } = await supabase
        .from('bmad_sessions')
        .insert({
          user_id: user.id,
          workspace_id: user.id,
          pathway: 'explore',
          title: 'New Session',
          current_phase: 'discovery',
          current_template: 'general',
          current_step: 'chat',
          templates: [],
          next_steps: [],
          status: 'active',
          overall_completion: 0,
          message_count: 0,
          message_limit: 20,
        })
        .select('id')
        .single();

      if (createError) throw createError;
      if (session) router.push(`/app/session/${session.id}`);
    } catch (err) {
      creatingRef.current = false;
      console.error('Error creating session:', err);
      setError(err instanceof Error ? err.message : 'Failed to create session');
      setIsRetrying(false);
    }
  }, [user, router]);

  useEffect(() => {
    if (user) createSession();
  }, [user, createSession]);

  const handleRetry = () => {
    setIsRetrying(true);
    setRetryCount((c) => c + 1);
    creatingRef.current = false;
    createSession();
  };

  if (!user) return null;

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center">
        <ErrorState
          error={error}
          onRetry={handleRetry}
          retryCount={retryCount}
          isRetrying={isRetrying}
        />
        <Link
          href="/app"
          className="mt-4 px-4 py-2 text-sm text-ink-light hover:text-ink transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <AnimatedLoader messages={sessionMessages} className="min-h-screen" />
    </div>
  );
}
