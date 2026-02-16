'use client';

import React from 'react';
import { NewIdeaPathway } from '@/lib/bmad/pathways/new-idea-pathway';
import { NEW_IDEA_PHASES } from '@/lib/bmad/templates/new-idea-templates';

interface PhaseProgressProps {
  pathway: NewIdeaPathway;
  currentPhaseIndex: number;
}

export default function PhaseProgress({
  pathway,
  currentPhaseIndex
}: PhaseProgressProps) {
  const getPhaseStatus = (index: number) => {
    if (index < currentPhaseIndex) return 'completed';
    if (index === currentPhaseIndex) return 'active';
    return 'pending';
  };

  const getPhaseIcon = (status: string, phaseId: string) => {
    if (status === 'completed') return '✓';
    if (status === 'active') return '▶';

    switch (phaseId) {
      case 'ideation': return '💡';
      case 'market_exploration': return '🎯';
      case 'concept_refinement': return '🔧';
      case 'positioning': return '🚀';
      default: return '○';
    }
  };

  const totalProgress = Math.round((currentPhaseIndex / NEW_IDEA_PHASES.length) * 100);
  const remainingTime = Math.ceil(pathway.getRemainingTime() / (60 * 1000));

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Overall Progress */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-ink">Session Progress</h3>
          <p className="text-sm text-ink-light">
            Phase {currentPhaseIndex + 1} of {NEW_IDEA_PHASES.length}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-terracotta" data-testid="overall-progress">
            {totalProgress}%
          </div>
          <div className="text-sm text-slate-blue">
            {remainingTime} min remaining
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-ink/10 rounded-full h-3">
          <div
            className="bg-terracotta h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${totalProgress}%` }}
          ></div>
        </div>
      </div>

      {/* Phase Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {NEW_IDEA_PHASES.map((phase, index) => {
          const status = getPhaseStatus(index);
          const isActive = status === 'active';
          const isCompleted = status === 'completed';

          return (
            <div
              key={phase.id}
              data-testid={`phase-indicator-${index + 1}`}
              className={`
                relative p-4 rounded-lg border-2 transition-all duration-300
                ${isActive
                  ? 'border-terracotta bg-terracotta/5 active'
                  : isCompleted
                    ? 'border-forest bg-forest/5 completed'
                    : 'border-ink/8 bg-parchment pending'
                }
              `}
            >
              {/* Phase Icon */}
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-2
                ${isActive
                  ? 'bg-terracotta text-white'
                  : isCompleted
                    ? 'bg-forest text-white'
                    : 'bg-ink/20 text-ink-light'
                }
              `}>
                {getPhaseIcon(status, phase.id)}
              </div>

              {/* Phase Info */}
              <div>
                <div className={`
                  text-sm font-medium mb-1
                  ${isActive ? 'text-ink' : isCompleted ? 'text-ink' : 'text-ink-light'}
                `}>
                  {phase.name}
                </div>
                <div className="text-xs text-slate-blue mb-2">
                  {phase.timeAllocation} min
                </div>

                {/* Phase Status */}
                <div className={`
                  text-xs px-2 py-1 rounded-full inline-block
                  ${isActive
                    ? 'bg-terracotta/10 text-ink'
                    : isCompleted
                      ? 'bg-forest/10 text-forest'
                      : 'bg-parchment text-ink-light'
                  }
                `}>
                  {isActive ? 'In Progress' : isCompleted ? 'Complete' : 'Pending'}
                </div>
              </div>

              {/* Current Phase Indicator */}
              {isActive && (
                <div className="absolute -top-2 -right-2">
                  <div className="w-4 h-4 bg-terracotta rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Current Phase Details */}
      {currentPhaseIndex < NEW_IDEA_PHASES.length && (
        <div className="mt-6 p-4 bg-terracotta/5 rounded-lg border border-terracotta/20">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-ink">
                Current Phase: {NEW_IDEA_PHASES[currentPhaseIndex].name}
              </h4>
              <p className="text-sm text-terracotta mt-1">
                {NEW_IDEA_PHASES[currentPhaseIndex].description}
              </p>
            </div>
            <div className="text-right text-sm text-terracotta" data-testid="current-phase-time">
              {NEW_IDEA_PHASES[currentPhaseIndex].timeAllocation}:00
            </div>
          </div>
        </div>
      )}

      {/* Time Warnings */}
      {remainingTime <= 5 && (
        <div className="mt-4 p-3 bg-rust/5 border border-rust/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-rust">⚠️</span>
            <span className="text-sm font-medium text-rust">
              Less than 5 minutes remaining! Consider moving to final phases.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}