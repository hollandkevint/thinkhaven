'use client';

import { StrategyQuiz } from '../components/assessment/StrategyQuiz';

export default function AssessmentPage() {
  return (
    <div className="min-h-screen bg-cream py-12 px-4">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="mb-4 text-xs font-display font-medium uppercase tracking-wider text-terracotta">
            Decision readiness
          </p>
          <h1 className="font-display text-4xl font-semibold text-ink mb-4">
            Find the weak point before the room does
          </h1>
          <p className="text-lg leading-relaxed text-ink-light max-w-2xl mx-auto">
            A short diagnostic for evidence, decision framing, and execution risk. The result routes you toward the next pressure test.
          </p>
        </div>

        {/* Quiz Component */}
        <StrategyQuiz />

        {/* Trust indicators */}
        <div className="mt-10 text-center text-sm text-slate-blue">
          <p>5 minutes &middot; no credit card &middot; result stays on this device unless submitted</p>
        </div>
      </div>
    </div>
  );
}
