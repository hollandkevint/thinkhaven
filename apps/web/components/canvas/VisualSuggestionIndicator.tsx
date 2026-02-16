/**
 * Visual Suggestion Indicator
 *
 * Displays visual diagram suggestions in the chat interface
 * Allows users to apply or dismiss suggestions
 */

'use client'

import { useState } from 'react'
import { VisualSuggestion, VisualSuggestionType } from '@/lib/canvas/visual-suggestion-parser'
import { isHighConfidence } from '@/lib/canvas/useCanvasSync'

interface VisualSuggestionIndicatorProps {
  suggestions: VisualSuggestion[]
  onApply: (suggestionId: string) => void
  onDismiss: (suggestionId: string) => void
  compact?: boolean
}

/**
 * Get icon for diagram type
 */
function getTypeIcon(type: VisualSuggestionType): string {
  const icons: Record<VisualSuggestionType, string> = {
    flowchart: '🔀',
    sequence: '↔️',
    gantt: '📅',
    class: '📦',
    state: '🔄',
    'user-journey': '🚶',
    mindmap: '🧠',
    sketch: '✏️',
  }
  return icons[type] || '📊'
}

/**
 * Get badge color for confidence
 */
function getConfidenceBadge(confidence: number): {
  color: string
  label: string
} {
  if (confidence >= 0.8) {
    return { color: 'bg-forest/10 text-forest border-forest/20', label: 'High' }
  } else if (confidence >= 0.6) {
    return { color: 'bg-mustard/10 text-mustard border-mustard/20', label: 'Medium' }
  } else {
    return { color: 'bg-parchment text-ink-light border-ink/8', label: 'Low' }
  }
}

export default function VisualSuggestionIndicator({
  suggestions,
  onApply,
  onDismiss,
  compact = false,
}: VisualSuggestionIndicatorProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (suggestions.length === 0) {
    return null
  }

  return (
    <div className="my-4 space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-secondary">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <span className="font-medium">
          {suggestions.length} Visual Suggestion{suggestions.length !== 1 ? 's' : ''} Available
        </span>
      </div>

      {/* Suggestions */}
      <div className="space-y-2">
        {suggestions.map(suggestion => {
          const isExpanded = expandedId === suggestion.id
          const badge = getConfidenceBadge(suggestion.confidence)
          const highConf = isHighConfidence(suggestion)

          return (
            <div
              key={suggestion.id}
              className={`border rounded-lg transition-all ${
                highConf
                  ? 'border-terracotta/20 bg-terracotta/5'
                  : 'border-ink/8 bg-white hover:border-terracotta/30'
              }`}
            >
              {/* Suggestion Header */}
              <div className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 flex-1">
                    {/* Icon */}
                    <span className="text-2xl flex-shrink-0" title={suggestion.type}>
                      {getTypeIcon(suggestion.type)}
                    </span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm text-ink truncate">
                          {suggestion.title}
                        </h4>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                        {highConf && (
                          <span className="text-xs bg-terracotta/10 text-terracotta px-2 py-0.5 rounded-full">
                            ✨ Recommended
                          </span>
                        )}
                      </div>
                      {!compact && (
                        <p className="text-xs text-ink-light line-clamp-2">
                          {suggestion.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!compact && suggestion.diagramCode && (
                      <button
                        onClick={() =>
                          setExpandedId(isExpanded ? null : suggestion.id)
                        }
                        className="p-1.5 text-slate-blue hover:text-ink hover:bg-parchment rounded transition-colors"
                        title="Preview diagram"
                      >
                        <svg
                          className={`w-4 h-4 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => onApply(suggestion.id)}
                      className="px-3 py-1.5 text-xs font-medium text-cream bg-terracotta hover:bg-terracotta-hover rounded transition-colors"
                      title="Add to canvas"
                    >
                      Add to Canvas
                    </button>
                    <button
                      onClick={() => onDismiss(suggestion.id)}
                      className="p-1.5 text-slate-blue/60 hover:text-slate-blue hover:bg-parchment rounded transition-colors"
                      title="Dismiss"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview (Expanded) */}
              {isExpanded && suggestion.diagramCode && (
                <div className="border-t border-ink/8 p-3 bg-parchment">
                  <div className="text-xs text-ink-light mb-2 font-medium">
                    Preview Code:
                  </div>
                  <pre className="text-xs bg-white border border-ink/8 rounded p-2 overflow-x-auto max-h-48">
                    <code className="text-ink">{suggestion.diagramCode}</code>
                  </pre>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Help Text */}
      {suggestions.some(s => isHighConfidence(s)) && (
        <div className="text-xs text-slate-blue italic mt-2">
          💡 High-confidence suggestions are based on detected patterns in the conversation
        </div>
      )}
    </div>
  )
}
