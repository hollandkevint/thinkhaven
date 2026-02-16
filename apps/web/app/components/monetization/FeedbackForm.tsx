'use client';

/**
 * FeedbackForm Component
 *
 * Collects user feedback when they complete their trial
 * Helps validate product-market fit before monetization
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface FeedbackFormProps {
  userId: string;
  onSubmitted: () => void;
}

export function FeedbackForm({ userId, onSubmitted }: FeedbackFormProps) {
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [wouldPay, setWouldPay] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rating || wouldPay === null) {
      alert('Please answer all required questions');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/feedback/trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          rating,
          wouldPay,
          feedback: feedback.trim() || null,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setSubmitted(true);
      setTimeout(() => {
        onSubmitted();
      }, 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-forest/20 bg-forest/5">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-4xl mb-2">🙏</div>
            <p className="font-medium text-forest">Thank you for your feedback!</p>
            <p className="text-sm text-forest mt-1">
              Your input helps us build a better product
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Help Us Improve</CardTitle>
        <CardDescription>
          Your feedback shapes the future of ThinkHaven
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium mb-2">
              How valuable was your experience? *
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className={`w-12 h-12 rounded-lg border-2 transition-all ${
                    rating === value
                      ? 'border-terracotta bg-terracotta/5 text-terracotta'
                      : 'border-ink/8 hover:border-ink/8'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-blue mt-1">1 = Not valuable, 5 = Extremely valuable</p>
          </div>

          {/* Would Pay */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Would you purchase more sessions? *
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setWouldPay(true)}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                  wouldPay === true
                    ? 'border-forest bg-forest/5 text-forest font-medium'
                    : 'border-ink/8 hover:border-ink/8'
                }`}
              >
                Yes, I'd pay
              </button>
              <button
                type="button"
                onClick={() => setWouldPay(false)}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                  wouldPay === false
                    ? 'border-rust bg-rust/5 text-rust font-medium'
                    : 'border-ink/8 hover:border-ink/8'
                }`}
              >
                Not yet
              </button>
            </div>
          </div>

          {/* Open Feedback */}
          <div>
            <label htmlFor="feedback" className="block text-sm font-medium mb-2">
              What would make ThinkHaven more valuable? (optional)
            </label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Your thoughts, suggestions, or concerns..."
              className="w-full px-3 py-2 border border-ink/8 rounded-lg focus:ring-2 focus:ring-terracotta focus:border-transparent"
              rows={4}
            />
          </div>

          <Button
            type="submit"
            disabled={submitting || !rating || wouldPay === null}
            className="w-full"
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
