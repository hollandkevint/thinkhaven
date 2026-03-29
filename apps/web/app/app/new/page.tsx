'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { ArrowLeft, Lightbulb, Scale, Compass, Sparkles } from 'lucide-react';
import AnimatedLoader from '@/app/components/ui/AnimatedLoader';
import { ErrorState } from '@/app/components/ui/ErrorState';

const MAX_RETRIES = 3;

const sessionMessages = [
  'Starting your session...',
  'Preparing Mary...',
  'Setting up your workspace...',
];

const PATHWAYS = [
  {
    id: 'product-idea',
    name: 'Test an Idea',
    description: 'Is this worth building? Validate assumptions, find blind spots.',
    icon: Lightbulb,
    color: 'var(--terracotta)',
  },
  {
    id: 'decision',
    name: 'Make a Decision',
    description: 'Should I do X? Pressure-test options, surface tradeoffs.',
    icon: Scale,
    color: 'var(--mustard)',
  },
  {
    id: 'strategy-review',
    name: 'Strategy Review',
    description: 'Optimize what exists. Audit, prioritize, find the next lever.',
    icon: Compass,
    color: 'var(--forest)',
  },
  {
    id: 'explore',
    name: 'Open Exploration',
    description: 'Think through anything. No structure, just Mary and the board.',
    icon: Sparkles,
    color: 'var(--slate-blue)',
  },
];

export default function NewSessionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const creatingRef = useRef(false);
  const selectedPathwayRef = useRef<string>('explore');

  const createSession = async (pathwayId: string) => {
    if (!user || creatingRef.current) return;
    creatingRef.current = true;
    selectedPathwayRef.current = pathwayId;
    setCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pathway: pathwayId }),
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
      setCreating(false);
      console.error('Error creating session:', err);
      setError(err instanceof Error ? err.message : 'Failed to create session');
      setIsRetrying(false);
    }
  };

  const handleRetry = () => {
    if (retryCount >= MAX_RETRIES) {
      setError('Too many retries. Please go back and try again.');
      return;
    }
    setIsRetrying(true);
    setRetryCount((c) => c + 1);
    creatingRef.current = false;
    createSession(selectedPathwayRef.current);
  };

  if (!user) return null;

  if (creating) {
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
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 py-4 border-b border-ink/8">
        <Link href="/app" className="text-ink-light hover:text-ink transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-display text-xl font-semibold text-ink">New Session</h1>
      </header>

      {/* Pathway Selection */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl font-semibold text-ink mb-2">
              What are you working on?
            </h2>
            <p className="text-muted-foreground font-body">
              Choose a pathway and Mary will tailor the session to your needs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PATHWAYS.map((pathway) => {
              const Icon = pathway.icon;
              return (
                <button
                  key={pathway.id}
                  onClick={() => createSession(pathway.id)}
                  className="text-left p-6 rounded-xl border border-ink/8 bg-parchment hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                    style={{ backgroundColor: `color-mix(in srgb, ${pathway.color} 15%, transparent)` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: pathway.color }} />
                  </div>
                  <h3 className="font-display text-base font-medium text-ink mb-1">
                    {pathway.name}
                  </h3>
                  <p className="text-sm text-muted-foreground font-body leading-relaxed">
                    {pathway.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
