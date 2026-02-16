'use client'

import React, { useState, useEffect } from 'react'
import { PathwayType } from '@/lib/bmad/types'
import { PathwaySwitchRecommendation, pathwaySwitcher, PathwaySwitchImpact } from '@/lib/bmad/session/pathway-switcher'

interface PathwaySwitcherProps {
  sessionId: string
  currentPathway: PathwayType
  recommendations: PathwaySwitchRecommendation[]
  onSwitch: (pathway: PathwayType, transferContext: boolean) => Promise<void>
  onCancel: () => void
}

export default function PathwaySwitcher({
  sessionId,
  currentPathway,
  recommendations,
  onSwitch,
  onCancel
}: PathwaySwitcherProps) {
  const [selectedPathway, setSelectedPathway] = useState<PathwayType | null>(null)
  const [switchImpact, setSwitchImpact] = useState<PathwaySwitchImpact | null>(null)
  const [transferContext, setTransferContext] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  // Get pathway display names
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

  // Get pathway description
  const getPathwayDescription = (pathway: PathwayType): string => {
    const descriptions: Record<PathwayType, string> = {
      [PathwayType.NEW_IDEA]: 'Transform early concepts into validated business opportunities through structured brainstorming and market analysis',
      [PathwayType.BUSINESS_MODEL]: 'Deep dive into revenue models and business strategy using systematic market research and competitive analysis',
      [PathwayType.BUSINESS_MODEL_PROBLEM]: 'Solve specific business model challenges with targeted problem-solving frameworks',
      [PathwayType.FEATURE_REFINEMENT]: 'Refine features using data-driven analysis and user-centered design principles',
      [PathwayType.STRATEGIC_OPTIMIZATION]: 'Optimize existing strategies using competitive positioning and performance frameworks'
    }
    return descriptions[pathway]
  }

  // Get pathway icon
  const getPathwayIcon = (pathway: PathwayType) => {
    const icons: Record<PathwayType, JSX.Element> = {
      [PathwayType.NEW_IDEA]: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      [PathwayType.BUSINESS_MODEL]: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      [PathwayType.BUSINESS_MODEL_PROBLEM]: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      [PathwayType.FEATURE_REFINEMENT]: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a1 1 0 01-1-1V7a1 1 0 011-1h1a2 2 0 100-4H4a1 1 0 01-1-1V2a1 1 0 011-1h3a1 1 0 011 1v1z" />
        </svg>
      ),
      [PathwayType.STRATEGIC_OPTIMIZATION]: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    }
    return icons[pathway]
  }

  // Handle pathway selection
  const handlePathwaySelect = async (pathway: PathwayType) => {
    if (pathway === currentPathway) return

    setSelectedPathway(pathway)
    setIsLoading(true)

    try {
      const preview = await pathwaySwitcher.previewPathwaySwitch(sessionId, pathway)
      setSwitchImpact(preview.estimatedImpact)
    } catch (error) {
      console.error('Failed to preview pathway switch:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle switch confirmation
  const handleConfirmSwitch = () => {
    if (!selectedPathway) return
    setShowConfirmation(true)
  }

  // Execute the switch
  const executeSwitch = async () => {
    if (!selectedPathway) return

    setIsLoading(true)
    try {
      await onSwitch(selectedPathway, transferContext)
    } catch (error) {
      console.error('Failed to execute pathway switch:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Get all available pathways
  const availablePathways = Object.values(PathwayType).filter(p => p !== currentPathway)

  // Get recommendation for selected pathway
  const selectedRecommendation = recommendations.find(r => r.recommendedPathway === selectedPathway)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-divider">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-primary mb-2">Switch Strategic Pathway</h2>
              <p className="text-secondary">
                Choose a new pathway to continue your strategic thinking journey
              </p>
            </div>
            <button
              onClick={onCancel}
              className="w-8 h-8 rounded-full hover:bg-parchment flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 text-slate-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {!showConfirmation ? (
            <>
              {/* Current Pathway */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-primary mb-3">Current Pathway</h3>
                <div className="bg-parchment rounded-lg p-4 border-l-4 border-ink/20">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-ink-light">
                      {getPathwayIcon(currentPathway)}
                    </div>
                    <span className="font-medium text-ink">
                      {getPathwayDisplayName(currentPathway)}
                    </span>
                  </div>
                  <p className="text-ink-light text-sm">
                    {getPathwayDescription(currentPathway)}
                  </p>
                </div>
              </div>

              {/* Available Pathways */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-primary mb-4">Available Pathways</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {availablePathways.map((pathway) => {
                    const recommendation = recommendations.find(r => r.recommendedPathway === pathway)
                    const isSelected = selectedPathway === pathway
                    const confidence = recommendation ? Math.round(recommendation.confidence * 100) : 0

                    return (
                      <button
                        key={pathway}
                        onClick={() => handlePathwaySelect(pathway)}
                        className={`text-left p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-divider hover:border-primary/50 hover:bg-primary/5'
                        }`}
                        disabled={isLoading}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={isSelected ? 'text-primary' : 'text-secondary'}>
                            {getPathwayIcon(pathway)}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-primary">
                              {getPathwayDisplayName(pathway)}
                            </div>
                            {recommendation && (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs bg-forest/10 text-forest px-2 py-1 rounded">
                                  {confidence}% recommended
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-secondary text-sm mb-3">
                          {getPathwayDescription(pathway)}
                        </p>
                        {recommendation && (
                          <div className="text-xs text-terracotta bg-terracotta/5 p-2 rounded">
                            <strong>Why switch:</strong> {recommendation.reasoning}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Switch Impact Preview */}
              {selectedPathway && switchImpact && (
                <div className="mb-6 bg-mustard/5 border border-mustard/20 rounded-lg p-4">
                  <h4 className="font-semibold text-ink mb-3">Switch Impact Analysis</h4>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-mustard mb-1">Progress Impact</div>
                      <div className="font-medium text-ink">
                        {switchImpact.progressLoss}% progress adjustment
                      </div>
                    </div>
                    <div>
                      <div className="text-mustard mb-1">Context Retention</div>
                      <div className="font-medium text-ink">
                        {switchImpact.contextRetention}% context preserved
                      </div>
                    </div>
                    <div>
                      <div className="text-mustard mb-1">Risk Level</div>
                      <div className={`font-medium ${
                        switchImpact.riskLevel === 'low' ? 'text-forest' :
                        switchImpact.riskLevel === 'medium' ? 'text-mustard' :
                        'text-rust'
                      }`}>
                        {switchImpact.riskLevel.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Context Transfer Options */}
              {selectedPathway && (
                <div className="mb-6">
                  <h4 className="font-semibold text-primary mb-3">Context Transfer Options</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={transferContext}
                        onChange={(e) => setTransferContext(e.target.checked)}
                        className="w-4 h-4 text-primary border-ink/8 rounded focus:ring-primary"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-primary">Transfer Context</div>
                        <div className="text-sm text-secondary">
                          Preserve your insights, user inputs, and key findings when switching pathways
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between items-center">
                <button
                  onClick={onCancel}
                  className="px-6 py-3 border border-divider text-secondary rounded-lg hover:bg-parchment transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSwitch}
                  disabled={!selectedPathway || isLoading}
                  className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Analyzing...' : 'Switch Pathway'}
                </button>
              </div>
            </>
          ) : (
            /* Confirmation Modal */
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-mustard/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-mustard" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-primary mb-2">Confirm Pathway Switch</h3>
              <p className="text-secondary mb-6">
                You're about to switch from <strong>{getPathwayDisplayName(currentPathway)}</strong> to{' '}
                <strong>{selectedPathway && getPathwayDisplayName(selectedPathway)}</strong>.
              </p>

              {switchImpact && switchImpact.riskLevel !== 'low' && (
                <div className="bg-rust/5 border border-rust/20 rounded-lg p-4 mb-6 text-left">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-rust mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                    <div>
                      <h4 className="font-semibold text-ink mb-1">
                        {switchImpact.riskLevel === 'high' ? 'High Risk Switch' : 'Medium Risk Switch'}
                      </h4>
                      <p className="text-rust text-sm">
                        This switch may result in {switchImpact.progressLoss}% progress adjustment and {switchImpact.estimatedTimeLoss} minutes of additional work time.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="px-6 py-3 border border-divider text-secondary rounded-lg hover:bg-parchment transition-colors"
                >
                  Go Back
                </button>
                <button
                  onClick={executeSwitch}
                  disabled={isLoading}
                  className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Switching...' : 'Confirm Switch'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}