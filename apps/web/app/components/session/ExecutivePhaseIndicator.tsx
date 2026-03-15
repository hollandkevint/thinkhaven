'use client'

import type { ExecutivePhase } from '@/lib/ai/executive-persona'
import { getPhaseConfig } from '@/lib/ai/executive-persona'

const PHASES: ExecutivePhase[] = ['context_loading', 'challenge', 'synthesis', 'artifact_generation'];

interface ExecutivePhaseIndicatorProps {
  currentPhase: ExecutivePhase
}

export default function ExecutivePhaseIndicator({ currentPhase }: ExecutivePhaseIndicatorProps) {
  const currentIndex = PHASES.indexOf(currentPhase);

  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {PHASES.map((phase, index) => {
        const config = getPhaseConfig(phase);
        const isActive = index === currentIndex;
        const isComplete = index < currentIndex;

        return (
          <div key={phase} className="flex items-center gap-1">
            <div
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
                isActive
                  ? 'bg-ink text-cream font-medium'
                  : isComplete
                    ? 'bg-ink/10 text-ink'
                    : 'bg-parchment text-slate-blue'
              }`}
              title={config.description}
            >
              {isComplete && (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {config.label}
            </div>
            {index < PHASES.length - 1 && (
              <div className={`w-4 h-px ${isComplete ? 'bg-ink/30' : 'bg-parchment'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
