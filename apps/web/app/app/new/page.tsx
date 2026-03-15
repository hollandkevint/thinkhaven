'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { PATHWAYS, getPathway } from '@/lib/pathways';
import { createInitialBoardState } from '@/lib/ai/board-members';
import PathwayCard from '@/app/components/pathway/PathwayCard';
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
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [selectedPathway, setSelectedPathway] = useState<string | null>(null);
  const creatingRef = useRef(false);

  const createSession = useCallback(
    async (pathwayId: string) => {
      if (!user) {
        router.push('/login');
        return;
      }

      if (creatingRef.current) return;
      creatingRef.current = true;

      const pathway = getPathway(pathwayId);
      if (!pathway) {
        setError('Invalid pathway selected');
        creatingRef.current = false;
        return;
      }

      try {
        setError(null);
        setCreating(true);
        setSelectedPathway(pathwayId);

        const workspaceId = user.id;

        const sessionInsert: Record<string, unknown> = {
          user_id: user.id,
          workspace_id: workspaceId,
          pathway: pathway.id,
          current_phase: pathway.phase,
          current_template: 'general',
          current_step: 'chat',
          templates: [],
          next_steps: [],
          status: 'active',
          overall_completion: 0,
          message_count: 0,
          message_limit: pathway.messageLimit,
        };

        if (pathway.activatesBoard) {
          sessionInsert.sub_persona_state = createInitialBoardState();
        }

        const { data: session, error: createError } = await supabase
          .from('bmad_sessions')
          .insert(sessionInsert)
          .select()
          .single();

        if (createError) throw createError;

        router.push(`/app/session/${session.id}`);
      } catch (err) {
        creatingRef.current = false;
        setCreating(false);
        console.error('Error creating session:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create session';
        setError(errorMessage);
        setIsRetrying(false);
      }
    },
    [user, router]
  );

  // Auto-create session when a valid pathway query param is present
  // (e.g., /app/new?pathway=quick-decision from dashboard cards)
  useEffect(() => {
    const pathwayParam = searchParams.get('pathway');
    if (pathwayParam && user && getPathway(pathwayParam)) {
      createSession(pathwayParam);
    }
  }, [searchParams, user, createSession]);

  const handleSelect = (pathwayId: string) => {
    createSession(pathwayId);
  };

  const handleRetry = () => {
    setIsRetrying(true);
    setRetryCount((c) => c + 1);
    if (selectedPathway) {
      creatingRef.current = false;
      createSession(selectedPathway);
    }
  };

  if (!user) return null;

  if (creating && !error) {
    return (
      <div className="min-h-screen bg-cream">
        <AnimatedLoader messages={sessionMessages} className="min-h-screen" />
      </div>
    );
  }

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
    <div className="min-h-screen bg-pathway-warm">
      {/* Header */}
      <header className="flex items-center gap-3 px-8 py-5">
        <Link
          href="/app"
          className="flex items-center gap-2 text-ink-light hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Link href="/" className="font-display text-xl font-semibold text-ink">
          ThinkHaven
        </Link>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-8 py-12">
        <div className="flex flex-col items-center text-center mb-12">
          <span className="font-display text-xs uppercase tracking-[0.15em] text-ink-light mb-4">
            New Session
          </span>
          <h1 className="font-display text-5xl font-medium text-ink leading-tight mb-3">
            Choose Your Path
          </h1>
          <p className="font-body text-[17px] text-ink-light max-w-lg leading-relaxed">
            Select the approach that best fits your decision.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {PATHWAYS.map((pathway) => (
            <PathwayCard
              key={pathway.id}
              pathway={pathway}
              onSelect={handleSelect}
              disabled={creating}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
