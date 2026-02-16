'use client'

import React, { useState, useEffect } from 'react'
import { UniversalSessionState } from '@/lib/bmad/session/universal-state-manager'

interface SessionHistoryProps {
  sessionId: string
  universalState: UniversalSessionState
  onStateUpdate: (update: Partial<UniversalSessionState>) => void
  className?: string
}

export default function SessionHistory({
  sessionId,
  universalState,
  onStateUpdate,
  className = ''
}: SessionHistoryProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString()
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  if (!universalState) {
    return null
  }

  return (
    <div className={`session-history ${className}`}>
      <div className="bg-white rounded-lg border border-divider p-6">
        <h3 className="text-lg font-semibold text-primary mb-4">Session History & Context</h3>

        {/* Shared Context */}
        <div className="mb-6">
          <button
            onClick={() => toggleSection('context')}
            className="w-full flex items-center justify-between p-3 bg-parchment rounded-lg hover:bg-parchment transition-colors"
          >
            <span className="font-medium text-primary">Shared Context</span>
            <svg
              className={`w-5 h-5 text-secondary transition-transform ${
                expandedSection === 'context' ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedSection === 'context' && (
            <div className="mt-3 p-4 bg-parchment rounded-lg space-y-4">
              {/* User Inputs */}
              {universalState.sharedContext.userInputs.length > 0 && (
                <div>
                  <h4 className="font-medium text-secondary mb-2">User Inputs</h4>
                  <div className="space-y-2">
                    {universalState.sharedContext.userInputs.slice(-5).map((input, index) => (
                      <div key={index} className="p-3 bg-white rounded border text-sm">
                        {input}
                      </div>
                    ))}
                    {universalState.sharedContext.userInputs.length > 5 && (
                      <div className="text-xs text-secondary text-center">
                        ... and {universalState.sharedContext.userInputs.length - 5} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Key Insights */}
              {universalState.sharedContext.keyInsights.length > 0 && (
                <div>
                  <h4 className="font-medium text-secondary mb-2">Key Insights</h4>
                  <div className="space-y-2">
                    {universalState.sharedContext.keyInsights.map((insight, index) => (
                      <div key={index} className="p-3 bg-terracotta/5 rounded border-l-4 border-terracotta text-sm">
                        {insight}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {universalState.sharedContext.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-secondary mb-2">Recommendations</h4>
                  <div className="space-y-2">
                    {universalState.sharedContext.recommendations.map((rec, index) => (
                      <div key={index} className="p-3 bg-forest/5 rounded border-l-4 border-forest text-sm">
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pathway History */}
        {universalState.pathwayHistory.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => toggleSection('history')}
              className="w-full flex items-center justify-between p-3 bg-parchment rounded-lg hover:bg-parchment transition-colors"
            >
              <span className="font-medium text-primary">Pathway History</span>
              <svg
                className={`w-5 h-5 text-secondary transition-transform ${
                  expandedSection === 'history' ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expandedSection === 'history' && (
              <div className="mt-3 p-4 bg-parchment rounded-lg">
                <div className="space-y-4">
                  {universalState.pathwayHistory.map((transition, index) => (
                    <div key={index} className="flex items-start gap-4 p-3 bg-white rounded border">
                      <div className="w-8 h-8 bg-terracotta/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-terracotta text-sm font-medium">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {transition.fromPathway && (
                            <span className="px-2 py-1 bg-parchment text-ink-light rounded text-sm">
                              {transition.fromPathway.replace('-', ' ')}
                            </span>
                          )}
                          <svg className="w-4 h-4 text-slate-blue/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                            {transition.toPathway.replace('-', ' ')}
                          </span>
                        </div>
                        <div className="text-sm text-secondary mb-1">
                          Reason: <span className="capitalize">{transition.reason.replace('_', ' ')}</span>
                        </div>
                        <div className="text-xs text-slate-blue">
                          {formatTimestamp(transition.timestamp)}
                        </div>
                        {transition.contextTransferred && (
                          <div className="mt-2 text-xs bg-forest/10 text-forest px-2 py-1 rounded inline-block">
                            Context transferred
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Progress Tracking */}
        <div className="mb-6">
          <button
            onClick={() => toggleSection('progress')}
            className="w-full flex items-center justify-between p-3 bg-parchment rounded-lg hover:bg-parchment transition-colors"
          >
            <span className="font-medium text-primary">Progress Tracking</span>
            <svg
              className={`w-5 h-5 text-secondary transition-transform ${
                expandedSection === 'progress' ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedSection === 'progress' && (
            <div className="mt-3 p-4 bg-parchment rounded-lg space-y-4">
              {/* Overall Progress */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-secondary">Overall Progress</span>
                  <span className="text-sm font-semibold text-primary">
                    {Math.round(universalState.globalProgress.overallCompletion)}%
                  </span>
                </div>
                <div className="w-full bg-ink/10 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${universalState.globalProgress.overallCompletion}%` }}
                  ></div>
                </div>
              </div>

              {/* Pathway Completions */}
              {Object.entries(universalState.globalProgress.pathwayCompletions).length > 0 && (
                <div>
                  <h4 className="font-medium text-secondary mb-3">Pathway Progress</h4>
                  <div className="space-y-3">
                    {Object.entries(universalState.globalProgress.pathwayCompletions).map(([pathway, completion]) => (
                      <div key={pathway}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-secondary capitalize">
                            {pathway.replace('-', ' ')}
                          </span>
                          <span className="text-sm font-medium">
                            {Math.round(completion)}%
                          </span>
                        </div>
                        <div className="w-full bg-ink/10 rounded-full h-2">
                          <div
                            className="bg-terracotta h-2 rounded-full transition-all duration-300"
                            style={{ width: `${completion}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Time Tracking */}
              {Object.entries(universalState.globalProgress.timeSpent).length > 0 && (
                <div>
                  <h4 className="font-medium text-secondary mb-3">Time Spent</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-white rounded p-3">
                      <div className="text-ink-light mb-1">Total Session</div>
                      <div className="font-semibold">
                        {Math.round(universalState.globalProgress.totalSessionTime / 60000)} min
                      </div>
                    </div>
                    {Object.entries(universalState.globalProgress.timeSpent).map(([pathway, time]) => (
                      <div key={pathway} className="bg-white rounded p-3">
                        <div className="text-ink-light mb-1 capitalize">
                          {pathway.replace('-', ' ')}
                        </div>
                        <div className="font-semibold">
                          {Math.round(time / 60000)} min
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Analytics Summary */}
        <div>
          <button
            onClick={() => toggleSection('analytics')}
            className="w-full flex items-center justify-between p-3 bg-parchment rounded-lg hover:bg-parchment transition-colors"
          >
            <span className="font-medium text-primary">Analytics Summary</span>
            <svg
              className={`w-5 h-5 text-secondary transition-transform ${
                expandedSection === 'analytics' ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedSection === 'analytics' && (
            <div className="mt-3 p-4 bg-parchment rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-white rounded p-3 text-center">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {universalState.analytics.pathwaySwitches}
                  </div>
                  <div className="text-ink-light">Pathway Switches</div>
                </div>
                <div className="bg-white rounded p-3 text-center">
                  <div className="text-2xl font-bold text-forest mb-1">
                    {Math.round(universalState.analytics.completionRate * 100)}%
                  </div>
                  <div className="text-ink-light">Completion Rate</div>
                </div>
                <div className="bg-white rounded p-3 text-center">
                  <div className="text-2xl font-bold text-terracotta mb-1">
                    {universalState.sharedContext.keyInsights.length}
                  </div>
                  <div className="text-ink-light">Key Insights</div>
                </div>
                <div className="bg-white rounded p-3 text-center">
                  <div className="text-2xl font-bold text-terracotta mb-1">
                    {universalState.sharedContext.generatedDocuments.length}
                  </div>
                  <div className="text-ink-light">Documents</div>
                </div>
              </div>

              {/* Behavior Patterns */}
              {universalState.analytics.userBehaviorPatterns && (
                <div className="mt-4 p-3 bg-terracotta/5 rounded">
                  <h4 className="font-medium text-ink mb-2">Session Pattern</h4>
                  <div className="text-sm text-ink">
                    Your session shows a{' '}
                    <strong>{universalState.analytics.userBehaviorPatterns.sessionPattern || 'focused'}</strong>{' '}
                    approach to strategic thinking.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}