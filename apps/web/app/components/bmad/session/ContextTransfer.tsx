'use client'

import React from 'react'
import { UniversalSessionState } from '@/lib/bmad/session/universal-state-manager'
import { PathwayType } from '@/lib/bmad/types'

interface ContextTransferProps {
  sessionId: string
  universalState: UniversalSessionState
  onClose: () => void
  className?: string
}

export default function ContextTransfer({
  sessionId,
  universalState,
  onClose,
  className = ''
}: ContextTransferProps) {
  const getPathwayDisplayName = (pathway: PathwayType): string => {
    const names: Record<PathwayType, string> = {
      [PathwayType.NEW_IDEA]: 'New Idea Development',
      [PathwayType.BUSINESS_MODEL]: 'Business Model Analysis',
      [PathwayType.BUSINESS_MODEL_PROBLEM]: 'Business Model Problem Analysis',
      [PathwayType.FEATURE_REFINEMENT]: 'Feature Refinement',
      [PathwayType.STRATEGIC_OPTIMIZATION]: 'Strategic Optimization'
    }
    return names[pathway]
  }

  const getTransferredElements = () => {
    const elements = []

    if (universalState.sharedContext.userInputs.length > 0) {
      elements.push({
        type: 'User Inputs',
        count: universalState.sharedContext.userInputs.length,
        description: 'Your responses and strategic thinking inputs',
        icon: (
          <svg className="w-5 h-5 text-terracotta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.418 8-8 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.418-8 8-8s8 3.582 8 8z" />
          </svg>
        )
      })
    }

    if (universalState.sharedContext.keyInsights.length > 0) {
      elements.push({
        type: 'Key Insights',
        count: universalState.sharedContext.keyInsights.length,
        description: 'Strategic insights and discoveries from your analysis',
        icon: (
          <svg className="w-5 h-5 text-forest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )
      })
    }

    if (universalState.sharedContext.recommendations.length > 0) {
      elements.push({
        type: 'Recommendations',
        count: universalState.sharedContext.recommendations.length,
        description: 'Strategic recommendations and next steps',
        icon: (
          <svg className="w-5 h-5 text-terracotta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0V9m0 10h6m-9-3h9M9 5l2 2 4-4" />
          </svg>
        )
      })
    }

    if (universalState.sharedContext.generatedDocuments.length > 0) {
      elements.push({
        type: 'Documents',
        count: universalState.sharedContext.generatedDocuments.length,
        description: 'Generated documents and deliverables',
        icon: (
          <svg className="w-5 h-5 text-mustard" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      })
    }

    return elements
  }

  const transferredElements = getTransferredElements()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-divider">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-primary mb-2">Context Transfer</h2>
              <p className="text-secondary">
                Your strategic insights preserved across pathways
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-parchment flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 text-slate-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Current Pathway */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-primary mb-3">Current Pathway</h3>
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <div className="font-semibold text-primary">
                {getPathwayDisplayName(universalState.currentPathway)}
              </div>
              <div className="text-sm text-primary/80 mt-1">
                Active strategic thinking pathway with preserved context
              </div>
            </div>
          </div>

          {/* Pathway History */}
          {universalState.pathwayHistory.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-primary mb-3">Pathway Journey</h3>
              <div className="space-y-2">
                {universalState.pathwayHistory.map((transition, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-parchment rounded-lg">
                    <div className="w-6 h-6 bg-terracotta/10 rounded-full flex items-center justify-center text-xs font-medium text-terracotta">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        {transition.fromPathway && (
                          <span className="text-ink-light">
                            {getPathwayDisplayName(transition.fromPathway)}
                          </span>
                        )}
                        <svg className="w-4 h-4 text-slate-blue/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-primary font-medium">
                          {getPathwayDisplayName(transition.toPathway)}
                        </span>
                      </div>
                    </div>
                    {transition.contextTransferred && (
                      <div className="text-xs bg-forest/10 text-forest px-2 py-1 rounded">
                        Context preserved
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transferred Elements */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-primary mb-4">Preserved Context Elements</h3>
            {transferredElements.length > 0 ? (
              <div className="grid gap-4">
                {transferredElements.map((element, index) => (
                  <div key={index} className="bg-cream border border-terracotta/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {element.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-ink">{element.type}</span>
                          <span className="px-2 py-1 bg-terracotta/10 text-ink rounded-full text-xs font-medium">
                            {element.count} items
                          </span>
                        </div>
                        <p className="text-ink-light text-sm">{element.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-parchment rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-blue/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H7" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-ink mb-2">No Context to Transfer</h4>
                <p className="text-ink-light text-sm">
                  Start working through your current pathway to build up insights and context that can be preserved across pathway switches.
                </p>
              </div>
            )}
          </div>

          {/* Context Transfer Benefits */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-primary mb-3">Context Transfer Benefits</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-forest flex-shrink-0">
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-ink">Preserved Strategic Thinking</div>
                  <div className="text-sm text-ink-light">Your insights and analysis remain available across different strategic approaches</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-forest flex-shrink-0">
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-ink">Accelerated Analysis</div>
                  <div className="text-sm text-ink-light">Build on previous work instead of starting from scratch when switching pathways</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 text-forest flex-shrink-0">
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-ink">Comprehensive Perspective</div>
                  <div className="text-sm text-ink-light">Combine insights from multiple strategic approaches for richer analysis</div>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Summary */}
          {universalState.analytics && (
            <div className="border-t border-divider pt-6">
              <h3 className="text-lg font-semibold text-primary mb-3">Session Analytics</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-terracotta/5 rounded-lg p-3">
                  <div className="text-2xl font-bold text-terracotta mb-1">
                    {universalState.analytics.pathwaySwitches}
                  </div>
                  <div className="text-sm text-ink">Pathway Switches</div>
                </div>
                <div className="bg-forest/5 rounded-lg p-3">
                  <div className="text-2xl font-bold text-forest mb-1">
                    {Math.round(universalState.analytics.completionRate * 100)}%
                  </div>
                  <div className="text-sm text-forest">Completion Rate</div>
                </div>
                <div className="bg-terracotta/5 rounded-lg p-3">
                  <div className="text-2xl font-bold text-terracotta mb-1">
                    {Math.round(universalState.globalProgress.overallCompletion)}%
                  </div>
                  <div className="text-sm text-terracotta">Overall Progress</div>
                </div>
              </div>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-center mt-6">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
            >
              Continue Session
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}