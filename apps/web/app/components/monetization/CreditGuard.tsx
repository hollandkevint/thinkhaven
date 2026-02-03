'use client';

/**
 * CreditGuard Component
 *
 * Displays credit balance and trial limit messaging
 * Shows feedback form when user runs out of credits
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { FeedbackForm } from './FeedbackForm';
import { CheckCircle, Sparkles, Layout, FileText, Brain, AlertCircle } from 'lucide-react';

interface CreditGuardProps {
  userId: string;
  onCreditsUpdated?: (balance: number) => void;
  /** When true, shows full card layout. When false (default), shows compact popover for nav. */
  expanded?: boolean;
}

interface CreditBalance {
  balance: number;
  total_granted: number;
  total_purchased: number;
  total_used: number;
}

export function CreditGuard({ userId, onCreditsUpdated, expanded = false }: CreditGuardProps) {
  const [credits, setCredits] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCredits();
  }, [userId]);

  const fetchCredits = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/credits/balance');

      if (!response.ok) {
        throw new Error('Failed to fetch credits');
      }

      const data = await response.json();
      setCredits(data);

      if (onCreditsUpdated) {
        onCreditsUpdated(data.balance);
      }

      // Show feedback form if user has no credits (only in expanded mode)
      if (data.balance === 0 && data.total_used > 0 && expanded) {
        setShowFeedback(true);
      }
    } catch (err) {
      console.error('Error fetching credits:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-blue">
        <div className="animate-spin rounded-full h-3 w-3 border-2 border-parchment border-t-terracotta" />
      </div>
    );
  }

  if (error || !credits) {
    return null;
  }

  // Zero credits - compact popover for nav, full card for expanded
  if (credits.balance === 0) {
    if (!expanded) {
      // Compact popover trigger for navigation
      return (
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-mustard bg-mustard/10 rounded-md hover:bg-mustard/20 transition-colors">
              <AlertCircle className="w-4 h-4" />
              <span>Trial ended</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0 bg-parchment border-mustard/30" align="end">
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-mustard" />
                <h3 className="font-display font-semibold text-ink">Trial Complete</h3>
              </div>
              <p className="text-sm text-slate-blue">
                You've used all {credits.total_granted} free sessions
              </p>
              <div className="bg-cream rounded-lg p-3 border border-ink/5">
                <p className="text-xs text-slate-blue font-display uppercase tracking-wide mb-2">Unlocked features</p>
                <ul className="text-xs space-y-1.5">
                  <li className="flex items-center gap-2 text-ink-light">
                    <CheckCircle className="w-3 h-3 text-forest" />
                    Strategic frameworks
                  </li>
                  <li className="flex items-center gap-2 text-ink-light">
                    <Brain className="w-3 h-3 text-forest" />
                    AI coaching
                  </li>
                  <li className="flex items-center gap-2 text-ink-light">
                    <FileText className="w-3 h-3 text-forest" />
                    PDF exports
                  </li>
                </ul>
              </div>
              <Button
                className="w-full bg-terracotta hover:bg-terracotta-hover text-cream font-display text-sm"
                size="sm"
                disabled
              >
                Purchase Credits (Coming Soon)
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      );
    }

    // Expanded card layout for dedicated pages
    return (
      <div className="p-4 space-y-4">
        <Card className="border-mustard/30 bg-parchment shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-display text-ink flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-mustard" />
              Trial Complete
            </CardTitle>
            <CardDescription className="text-slate-blue">
              You've used all {credits.total_granted} free sessions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-ink-light font-body">
              Ready to continue your strategic thinking journey?
            </p>
            <div className="bg-cream rounded-lg p-4 border border-ink/5">
              <p className="text-xs text-slate-blue font-display uppercase tracking-wide mb-3">What you've unlocked</p>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-forest flex-shrink-0" />
                  <span className="text-ink-light">Strategic frameworks</span>
                </li>
                <li className="flex items-center gap-3">
                  <Brain className="w-4 h-4 text-forest flex-shrink-0" />
                  <span className="text-ink-light">AI-powered strategic coaching</span>
                </li>
                <li className="flex items-center gap-3">
                  <Layout className="w-4 h-4 text-forest flex-shrink-0" />
                  <span className="text-ink-light">Canvas visual workspace</span>
                </li>
                <li className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-forest flex-shrink-0" />
                  <span className="text-ink-light">PDF & Markdown exports</span>
                </li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button
              className="w-full bg-terracotta hover:bg-terracotta-hover text-cream font-display"
              disabled
            >
              Purchase Credits (Coming Soon)
            </Button>
            <p className="text-xs text-center text-slate-blue">
              We're finalizing pricing. Share your feedback below!
            </p>
          </CardFooter>
        </Card>

        {showFeedback && (
          <FeedbackForm
            userId={userId}
            onSubmitted={() => setShowFeedback(false)}
          />
        )}
      </div>
    );
  }

  // Has credits - show compact balance indicator
  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${
          credits.balance === 1 ? 'bg-mustard' : 'bg-forest'
        }`} />
        <span className="text-sm font-medium text-ink">
          {credits.balance} {credits.balance === 1 ? 'session' : 'sessions'}
        </span>
      </div>

      {credits.balance === 1 && (
        <span className="text-xs text-mustard bg-mustard/10 px-1.5 py-0.5 rounded font-display">
          Last!
        </span>
      )}
    </div>
  );
}
