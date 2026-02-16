'use client';

import { StrategyQuiz } from '../components/assessment/StrategyQuiz';

export default function AssessmentPage() {
  return (
    <div className="min-h-screen bg-cream py-12 px-4">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-ink mb-4">
            Strategic Thinking Assessment
          </h1>
          <p className="text-xl text-ink-light max-w-2xl mx-auto">
            Discover your strategic thinking strengths and areas for growth in just 5 minutes
          </p>
        </div>

        {/* Quiz Component */}
        <StrategyQuiz />

        {/* Trust indicators */}
        <div className="mt-12 text-center text-sm text-slate-blue space-y-2">
          <p>✓ Takes 5 minutes • ✓ Instant results • ✓ Completely free</p>
          <p>✓ No credit card required • ✓ Privacy protected</p>
        </div>
      </div>
    </div>
  );
}
