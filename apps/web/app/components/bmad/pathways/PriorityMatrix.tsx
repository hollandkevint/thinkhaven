'use client'

import { PriorityScoring } from '@/lib/bmad/types'

interface PriorityMatrixProps {
  priorityScoring?: PriorityScoring
  className?: string
}

export default function PriorityMatrix({
  priorityScoring,
  className = ''
}: PriorityMatrixProps) {
  const getQuadrantConfig = (quadrant: string) => {
    switch (quadrant) {
      case 'Quick Wins':
        return {
          bg: 'bg-forest/5',
          border: 'border-forest/20',
          text: 'text-forest',
          dotColor: '#4A6741'
        }
      case 'Major Projects':
        return {
          bg: 'bg-terracotta/5',
          border: 'border-terracotta/20',
          text: 'text-ink',
          dotColor: '#C4785C'
        }
      case 'Fill-ins':
        return {
          bg: 'bg-mustard/5',
          border: 'border-mustard/20',
          text: 'text-mustard',
          dotColor: '#D4A84B'
        }
      case 'Time Wasters':
        return {
          bg: 'bg-rust/5',
          border: 'border-rust/20',
          text: 'text-rust',
          dotColor: '#8B4D3B'
        }
      default:
        return {
          bg: 'bg-parchment',
          border: 'border-ink/8',
          text: 'text-ink',
          dotColor: '#6B7B8C'
        }
    }
  }

  const calculateDotPosition = (effort: number, impact: number) => {
    const effortPercent = ((effort - 1) / 9) * 100
    const impactPercent = ((10 - impact) / 9) * 100
    return {
      left: `${effortPercent}%`,
      top: `${impactPercent}%`
    }
  }

  return (
    <div className={`priority-matrix ${className}`}>
      <div className="bg-white rounded-lg border border-ink/8 p-6">
        <h3 className="text-xl font-semibold text-ink mb-4">
          Priority Matrix
        </h3>
        <p className="text-ink-light mb-6">
          Visual representation of your feature's position based on effort and impact scores.
        </p>

        <div className="relative">
          {/* Matrix Grid */}
          <div className="grid grid-cols-2 gap-2 h-96 border-2 border-ink/8 rounded-lg overflow-hidden">
            {/* Top Left: Fill-ins (Low Impact, Low Effort) */}
            <div className="bg-mustard/5 border-mustard/20 border-r border-b p-4 relative">
              <div className="absolute top-2 left-2">
                <h4 className="font-semibold text-mustard text-sm">Fill-ins</h4>
                <p className="text-xs text-mustard">Low Impact, Low Effort</p>
              </div>
              <div className="absolute bottom-2 right-2">
                <span className="text-xs text-mustard">⏰ Nice-to-have</span>
              </div>
            </div>

            {/* Top Right: Quick Wins (High Impact, Low Effort) */}
            <div className="bg-forest/5 border-forest/20 border-b p-4 relative">
              <div className="absolute top-2 left-2">
                <h4 className="font-semibold text-forest text-sm">Quick Wins</h4>
                <p className="text-xs text-forest">High Impact, Low Effort</p>
              </div>
              <div className="absolute bottom-2 right-2">
                <span className="text-xs text-forest">🎯 Do First</span>
              </div>
            </div>

            {/* Bottom Left: Time Wasters (Low Impact, High Effort) */}
            <div className="bg-rust/5 border-rust/20 border-r p-4 relative">
              <div className="absolute top-2 left-2">
                <h4 className="font-semibold text-rust text-sm">Time Wasters</h4>
                <p className="text-xs text-rust">Low Impact, High Effort</p>
              </div>
              <div className="absolute bottom-2 right-2">
                <span className="text-xs text-rust">⚠️ Avoid</span>
              </div>
            </div>

            {/* Bottom Right: Major Projects (High Impact, High Effort) */}
            <div className="bg-terracotta/5 border-terracotta/20 p-4 relative">
              <div className="absolute top-2 left-2">
                <h4 className="font-semibold text-ink text-sm">Major Projects</h4>
                <p className="text-xs text-terracotta">High Impact, High Effort</p>
              </div>
              <div className="absolute bottom-2 right-2">
                <span className="text-xs text-terracotta">📋 Plan Well</span>
              </div>
            </div>

            {/* Feature Position Dot */}
            {priorityScoring && (
              <div
                className="absolute w-4 h-4 rounded-full shadow-lg border-2 border-white z-10 transform -translate-x-2 -translate-y-2"
                style={{
                  ...calculateDotPosition(priorityScoring.effort_score, priorityScoring.impact_score),
                  backgroundColor: getQuadrantConfig(priorityScoring.quadrant).dotColor
                }}
                title={`Your Feature: ${priorityScoring.quadrant} (Impact: ${priorityScoring.impact_score}, Effort: ${priorityScoring.effort_score})`}
              />
            )}
          </div>

          {/* Axis Labels */}
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center gap-4">
              <span className="text-sm text-ink-light">Low Effort</span>
              <div className="w-24 h-0.5 bg-ink/20"></div>
              <span className="text-sm text-ink-light">High Effort</span>
            </div>
          </div>
          <div className="absolute -left-16 top-1/2 transform -translate-y-1/2 -rotate-90">
            <div className="flex items-center gap-4">
              <span className="text-sm text-ink-light">Low Impact</span>
              <div className="w-16 h-0.5 bg-ink/20"></div>
              <span className="text-sm text-ink-light">High Impact</span>
            </div>
          </div>
        </div>

        {/* Current Position Summary */}
        {priorityScoring && (
          <div className="mt-8 pt-4 border-t border-ink/8">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-ink">Your Feature Position</h4>
                <p className="text-sm text-ink-light">
                  Impact: {priorityScoring.impact_score}/10 • Effort: {priorityScoring.effort_score}/10
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-semibold border ${getQuadrantConfig(priorityScoring.quadrant).bg} ${getQuadrantConfig(priorityScoring.quadrant).border} ${getQuadrantConfig(priorityScoring.quadrant).text}`}>
                {priorityScoring.quadrant}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}