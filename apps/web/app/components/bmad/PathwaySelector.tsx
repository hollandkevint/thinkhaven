'use client'

import { useState, useEffect, useCallback } from 'react'
import { PathwayType, BmadPathway } from '@/lib/bmad/types'
import { SessionCreationLoader, PathwayAnalysisLoader, SkeletonLoader } from './LoadingIndicator'
import { GracefulDegradation } from '@/lib/bmad/service-status'
import { BmadErrorMonitor } from '@/lib/bmad/error-monitor'

interface PathwayRecommendation {
  recommendedPathway: PathwayType
  confidence: number
  reasoning: string
  alternativePathways: PathwayType[]
}

interface PathwaySelectorProps {
  onPathwaySelected: (pathway: PathwayType, userInput?: string, recommendation?: PathwayRecommendation) => void
  workspaceId: string
  className?: string
  preservedInput?: string
}

export default function PathwaySelector({ 
  onPathwaySelected, 
  workspaceId: _workspaceId, 
  className = '',
  preservedInput
}: PathwaySelectorProps) {
  const [userInput, setUserInput] = useState('')
  const [pathways, setPathways] = useState<BmadPathway[]>([])
  const [recommendation, setRecommendation] = useState<PathwayRecommendation | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingPathways, setLoadingPathways] = useState(true)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [selectedPathway, setSelectedPathway] = useState<PathwayType | null>(null)
  const [showRecommendation, setShowRecommendation] = useState(false)

  const fetchPathways = useCallback(async () => {
    setLoadingPathways(true)
    
    try {
      const pathways = await GracefulDegradation.withFallback(
        // Primary operation: API-based pathway fetching
        async () => {
          const response = await fetch('/api/bmad?action=pathways')
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          
          const result = await response.json()
          
          if (result.success && result.data.pathways) {
            return result.data.pathways
          } else {
            throw new Error('Failed to load pathways from API')
          }
        },
        // Fallback operation: default pathways
        () => getDefaultPathways(),
        ['bmadApi']
      )

      setPathways(pathways)
    } catch (error) {
      // Monitor error for analytics and debugging
      BmadErrorMonitor.capturePathwayError(error as Error, {
        workspaceId: _workspaceId,
        action: 'fetch-pathways'
      })

      console.error('Error fetching pathways:', error)
      // Final fallback if everything fails
      setPathways(getDefaultPathways())
    } finally {
      setLoadingPathways(false)
    }
  }, [])

  // Load available pathways on component mount
  useEffect(() => {
    fetchPathways()
  }, [fetchPathways])

  // Enhanced default pathways for Epic 2 requirements
  const getDefaultPathways = (): BmadPathway[] => [
    {
      id: PathwayType.NEW_IDEA,
      name: 'New Idea Creative Expansion',
      description: 'Transform your early-stage concept into a structured business opportunity with creative expansion, market positioning, and validation.',
      targetUser: 'Entrepreneurs with brand new business ideas seeking structure',
      expectedOutcome: 'Comprehensive business concept document with market validation and strategic positioning',
      timeCommitment: 25,
      templateSequence: ['ideation', 'market-exploration', 'concept-refinement', 'positioning'],
      maryPersonaConfig: {
        primaryPersona: 'coach',
        adaptationTriggers: [],
        communicationStyle: {
          questioningStyle: 'curious',
          responseLength: 'moderate',
          frameworkEmphasis: 'moderate'
        }
      }
    },
    {
      id: PathwayType.BUSINESS_MODEL_PROBLEM,
      name: 'Business Model Problem Analysis',
      description: 'Systematic analysis of revenue streams, customer segments, and value propositions to solve specific business model challenges.',
      targetUser: 'Business owners with monetization and revenue model challenges',
      expectedOutcome: 'Lean Canvas with detailed implementation roadmap and monetization strategy',
      timeCommitment: 35,
      templateSequence: ['revenue-analysis', 'customer-segmentation', 'value-proposition', 'monetization-strategy', 'implementation-planning'],
      maryPersonaConfig: {
        primaryPersona: 'analyst',
        adaptationTriggers: [],
        communicationStyle: {
          questioningStyle: 'challenging',
          responseLength: 'detailed',
          frameworkEmphasis: 'heavy'
        }
      }
    },
    {
      id: PathwayType.FEATURE_REFINEMENT,
      name: 'Feature Refinement & User-Centered Design',
      description: 'Stress-test features against user needs and business goals with systematic validation, prioritization, and feature brief creation.',
      targetUser: 'Product managers and designers validating features',
      expectedOutcome: 'Data-driven feature brief with priority matrix and measurable success metrics',
      timeCommitment: 20,
      templateSequence: ['feature-validation', 'user-analysis', 'business-impact', 'prioritization', 'brief-creation'],
      maryPersonaConfig: {
        primaryPersona: 'advisor',
        adaptationTriggers: [],
        communicationStyle: {
          questioningStyle: 'supportive',
          responseLength: 'moderate',
          frameworkEmphasis: 'moderate'
        }
      }
    }
  ]

  const analyzeIntent = useCallback(async () => {
    if (!userInput.trim()) return

    setAnalysisLoading(true)

    try {
      const result = await GracefulDegradation.withFallback(
        // Primary operation: API-based intent analysis
        async () => {
          const response = await fetch('/api/bmad', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'analyze_intent',
              userInput: userInput.trim()
            })
          })

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const apiResult = await response.json()

          if (apiResult.success && apiResult.data.recommendation) {
            return {
              recommendedPathway: apiResult.data.recommendation.recommendedPathway,
              confidence: apiResult.data.recommendation.confidence,
              reasoning: apiResult.data.recommendation.reasoning,
              alternativePathways: apiResult.data.recommendation.alternativePathways || []
            }
          } else {
            throw new Error('Intent analysis failed')
          }
        },
        // Fallback operation: offline keyword analysis
        () => {
          const offlineRecommendation = GracefulDegradation.getOfflinePathwayRecommendation(userInput.trim())
          return {
            recommendedPathway: offlineRecommendation.recommendedPathway as PathwayType,
            confidence: offlineRecommendation.confidence / 100, // Convert to decimal
            reasoning: offlineRecommendation.reasoning,
            alternativePathways: offlineRecommendation.alternativePathways as PathwayType[]
          }
        },
        ['pathwayAnalysis']
      )

      setRecommendation(result)
      setShowRecommendation(true)
    } catch (error) {
      // Monitor error for analytics and debugging
      BmadErrorMonitor.capturePathwayError(error as Error, {
        workspaceId: _workspaceId,
        userInput: userInput.trim(),
        action: 'analyze-intent'
      })

      console.error('Error analyzing intent:', error)
      // Even if both primary and fallback fail, show a basic recommendation
      setRecommendation({
        recommendedPathway: PathwayType.NEW_IDEA,
        confidence: 0.5,
        reasoning: 'Unable to analyze input. This is a general-purpose pathway that works well for most strategic challenges.',
        alternativePathways: [PathwayType.BUSINESS_MODEL, PathwayType.STRATEGIC_OPTIMIZATION]
      })
      setShowRecommendation(true)
    } finally {
      setAnalysisLoading(false)
    }
  }, [userInput])

  // Populate input field with preserved input from Mary Chat
  useEffect(() => {
    if (preservedInput && !userInput) {
      setUserInput(preservedInput)
    }
  }, [preservedInput, userInput])

  // Auto-analyze preserved input for better user experience
  useEffect(() => {
    if (preservedInput && userInput === preservedInput && !recommendation) {
      analyzeIntent()
    }
  }, [preservedInput, userInput, recommendation, analyzeIntent])

  const handlePathwaySelect = async (pathway: PathwayType) => {
    setLoading(true)
    setSelectedPathway(pathway)
    
    try {
      await onPathwaySelected(pathway, userInput.trim() || undefined, recommendation)
    } catch (error) {
      // Monitor error for analytics and debugging
      BmadErrorMonitor.capturePathwayError(error as Error, {
        workspaceId: _workspaceId,
        pathway,
        userInput: userInput.trim() || undefined,
        action: 'select-pathway'
      })

      console.error('Error selecting pathway:', error)
      setSelectedPathway(null)
    } finally {
      setLoading(false)
    }
  }

  const getPathwayIcon = (pathwayId: PathwayType) => {
    switch (pathwayId) {
      case PathwayType.NEW_IDEA:
        return (
          <svg className="w-8 h-8 text-terracotta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )
      case PathwayType.BUSINESS_MODEL_PROBLEM:
        return (
          <svg className="w-8 h-8 text-forest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
      case PathwayType.FEATURE_REFINEMENT:
        return (
          <svg className="w-8 h-8 text-slate-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
        )
      case PathwayType.BUSINESS_MODEL:
      case PathwayType.STRATEGIC_OPTIMIZATION:
        return (
          <svg className="w-8 h-8 text-mustard" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
      default:
        return (
          <svg className="w-8 h-8 text-slate-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  const getMethodologyPreview = (pathwayId: PathwayType): string => {
    switch (pathwayId) {
      case PathwayType.NEW_IDEA:
        return 'Creative exploration → Market validation → Concept structuring → Strategic positioning'
      case PathwayType.BUSINESS_MODEL_PROBLEM:
        return 'Revenue analysis → Customer segmentation → Value mapping → Implementation planning'
      case PathwayType.FEATURE_REFINEMENT:
        return 'Feature validation → User research → Impact analysis → Prioritization framework'
      default:
        return 'Structured strategic analysis framework'
    }
  }

  if (loadingPathways) {
    return (
      <div className={`bg-white rounded-lg border border-divider p-6 ${className}`}>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-primary mb-2">Loading Strategic Pathways</h2>
          <PathwayAnalysisLoader />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="border rounded-lg p-4">
              <SkeletonLoader />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-divider p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-primary mb-2">Choose Your Strategic Pathway</h2>
        <p className="text-secondary">
          Select the pathway that best matches your current challenge, or describe your situation for a personalized recommendation.
        </p>
      </div>

      {/* Intent Analysis Input */}
      <div className="mb-6">
        <label htmlFor="intentInput" className="block text-sm font-medium text-primary mb-2">
          Describe your challenge or goal (optional)
        </label>
        <div className="flex gap-2">
          <input
            id="intentInput"
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="e.g., I have a new app idea but don't know if it's viable..."
            className="flex-1 px-4 py-2 border border-divider rounded-lg focus:border-primary focus:outline-none"
            disabled={loading || analysisLoading}
          />
          <button
            onClick={analyzeIntent}
            disabled={!userInput.trim() || loading || analysisLoading}
            className="px-4 py-2 bg-accent text-white font-medium rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {analysisLoading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </div>

      {/* AI Recommendation */}
      {showRecommendation && recommendation && (
        <div className="mb-6 p-4 bg-terracotta/5 rounded-lg border border-terracotta/20">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-terracotta rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-cream font-semibold text-sm">M</span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-ink mb-1">Mary&apos;s Recommendation</h3>
              <p className="text-ink-light text-sm mb-2">{recommendation.reasoning}</p>
              <p className="text-slate-blue text-xs">
                Confidence: {Math.round(recommendation.confidence * 100)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pathway Cards */}
      <div className="grid gap-4 sm:gap-6">
        {pathways.map((pathway) => {
          const isRecommended = recommendation?.recommendedPathway === pathway.id
          const isSelected = selectedPathway === pathway.id
          const isLoading = loading && isSelected

          return (
            <div
              key={pathway.id}
              className={`border rounded-lg p-4 sm:p-6 transition-all cursor-pointer hover:shadow-md ${
                isRecommended
                  ? 'border-terracotta/30 bg-terracotta/5'
                  : isSelected 
                    ? 'border-primary bg-primary/5' 
                    : 'border-divider hover:border-primary/50'
              } ${loading && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !loading && handlePathwaySelect(pathway.id)}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex items-center sm:items-start gap-3 sm:gap-4">
                  <div className="flex-shrink-0">
                    {getPathwayIcon(pathway.id)}
                  </div>
                  <div className="flex items-center gap-2 sm:hidden">
                    <h3 className="text-lg font-semibold text-primary">{pathway.name}</h3>
                    {isRecommended && (
                      <span className="px-2 py-1 text-xs bg-terracotta text-cream rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="hidden sm:flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-primary">{pathway.name}</h3>
                        {isRecommended && (
                          <span className="px-2 py-1 text-xs bg-terracotta text-cream rounded-full">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-secondary text-sm mb-4">{pathway.description}</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-secondary">Target User:</span>
                          <p className="text-foreground">{pathway.targetUser}</p>
                        </div>
                        <div>
                          <span className="text-secondary">Duration:</span>
                          <p className="text-foreground">{pathway.timeCommitment} minutes</p>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <span className="text-secondary text-sm">Expected Outcome:</span>
                        <p className="text-foreground text-sm">{pathway.expectedOutcome}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-divider/50">
                        <span className="text-secondary text-sm">Methodology:</span>
                        <p className="text-foreground text-sm font-mono mt-1 text-xs leading-relaxed">
                          {getMethodologyPreview(pathway.id)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 hidden sm:block">
                      {isLoading ? (
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  
                  {/* Mobile action indicator */}
                  <div className="flex justify-center mt-4 sm:hidden">
                    {isLoading ? (
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {loading && (
        <div className="mt-4">
          <SessionCreationLoader />
        </div>
      )}
    </div>
  )
}