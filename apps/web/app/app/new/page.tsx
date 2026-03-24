'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import AnimatedLoader from '@/app/components/ui/AnimatedLoader';
import { ErrorState } from '@/app/components/ui/ErrorState';

const MAX_RETRIES = 3;

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

      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pathway: 'explore' }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (data.error === 'NO_CREDITS') {
          router.push('/pricing');
          return;
        }
        throw new Error(data.error || `Failed to create session (${response.status})`);
      }

      const { id } = await response.json();
      if (id) router.push(`/app/session/${id}`);
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
    if (retryCount >= MAX_RETRIES) {
      setError('Too many retries. Please go back and try again.');
      return;
    }
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
          onRetry={retryCount < MAX_RETRIES ? handleRetry : undefined}
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
