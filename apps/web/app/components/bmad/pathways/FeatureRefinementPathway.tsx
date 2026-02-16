'use client'

import { useState, useEffect } from 'react'
import { FeatureSessionData, FeatureInputData, PriorityScoring, FeatureBrief } from '@/lib/bmad/types'
import FeatureInput from './FeatureInput'
import FeatureAnalysisQuestions from './FeatureAnalysisQuestions'
import PriorityScoring from './PriorityScoring'
import FeatureBriefGenerator from './FeatureBriefGenerator'
import PhaseProgress from './PhaseProgress'

interface FeatureRefinementPathwayProps {
  sessionId: string
  onSessionComplete?: (sessionData: FeatureSessionData) => void
  onError?: (error: string) => void
  className?: string
}

export default function FeatureRefinementPathway({
  sessionId,
  onSessionComplete,
  onError,
  className = ''
}: FeatureRefinementPathwayProps) {
  const [currentPhase, setCurrentPhase] = useState(0)
  const [sessionData, setSessionData] = useState<FeatureSessionData>({
    featureInput: {
      feature_description: '',
      analysis_questions: [],
      input_timestamp: new Date()
    },
    priorityScoring: {
      effort_score: 5,
      impact_score: 5,
      calculated_priority: 1.0,
      priority_category: 'Medium',
      quadrant: 'Fill-ins',
      scoring_timestamp: new Date()
    }
  })
  const [isLoading, setIsLoading] = useState(false)
  const [sessionComplete, setSessionComplete] = useState(false)

  const phases = [
    { id: 'feature-input', name: 'Feature Input', duration: 5 },
    { id: 'analysis-questions', name: 'Feature Analysis', duration: 8 },
    { id: 'priority-scoring', name: 'Priority Scoring', duration: 5 },
    { id: 'brief-generation', name: 'Brief Generation', duration: 6 }
  ]

  const handleFeatureInputComplete = (featureInput: FeatureInputData) => {
    setSessionData(prev => ({
      ...prev,
      featureInput
    }))
    setCurrentPhase(1)
  }

  const handleAnalysisComplete = () => {
    setCurrentPhase(2)
  }

  const handlePriorityScoringComplete = (priorityScoring: PriorityScoring) => {
    setSessionData(prev => ({
      ...prev,
      priorityScoring
    }))
    setCurrentPhase(3)
  }

  const handleBriefComplete = () => {
    setSessionComplete(true)
    onSessionComplete?.(sessionData)
  }

  const renderCurrentPhase = () => {
    switch (currentPhase) {
      case 0:
        return (
          <FeatureInput
            sessionId={sessionId}
            onAnalysisGenerated={handleFeatureInputComplete}
            onNext={() => setCurrentPhase(1)}
          />
        )

      case 1:
        return (
          <FeatureAnalysisQuestions
            sessionId={sessionId}
            questions={sessionData.featureInput.analysis_questions}
            onComplete={handleAnalysisComplete}
          />
        )

      case 2:
        return (
          <div className="space-y-6">
            <PriorityScoring
              onScoreChange={handlePriorityScoringComplete}
            />
            <div className="flex justify-end pt-4 border-t border-ink/8">
              <button
                onClick={() => setCurrentPhase(3)}
                className="px-6 py-3 bg-terracotta text-white rounded-lg text-sm font-semibold hover:bg-terracotta-hover transition-all shadow-sm"
              >
                Continue to Brief Generation →
              </button>
            </div>
          </div>
        )

      case 3:
        return (
          <FeatureBriefGenerator
            sessionId={sessionId}
            sessionData={sessionData}
            onComplete={handleBriefComplete}
          />
        )

      default:
        return null
    }
  }

  if (sessionComplete) {
    return (
      <div className={`feature-refinement-pathway ${className}`}>
        <div className="bg-forest/5 rounded-lg border border-forest/20 p-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-forest text-white mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-ink mb-2">
              Feature Refinement Complete!
            </h2>
            <p className="text-forest">
              Your feature brief is ready for development team handoff
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/app'}
              className="w-full px-6 py-3 bg-forest text-white rounded-lg font-semibold hover:bg-forest/80 transition-colors"
            >
              Return to Dashboard
            </button>
            <button
              onClick={() => {
                setCurrentPhase(0)
                setSessionComplete(false)
                setSessionData({
                  featureInput: {
                    feature_description: '',
                    analysis_questions: [],
                    input_timestamp: new Date()
                  },
                  priorityScoring: {
                    effort_score: 5,
                    impact_score: 5,
                    calculated_priority: 1.0,
                    priority_category: 'Medium',
                    quadrant: 'Fill-ins',
                    scoring_timestamp: new Date()
                  }
                })
              }}
              className="w-full px-6 py-3 bg-white border border-forest/40 text-forest rounded-lg font-semibold hover:bg-forest/5 transition-colors"
            >
              Refine Another Feature
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`feature-refinement-pathway ${className}`}>
      {/* Pathway Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink mb-2">
          Feature Refinement Pathway
        </h1>
        <p className="text-ink-light">
          Analyze, prioritize, and document your feature for development
        </p>
      </div>

      {/* Phase Progress */}
      <PhaseProgress
        phases={phases}
        currentPhaseIndex={currentPhase}
        className="mb-8"
      />

      {/* Current Phase Content */}
      <div className="phase-content">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta"></div>
          </div>
        ) : (
          renderCurrentPhase()
        )}
      </div>

      {/* Session Metadata */}
      <div className="mt-8 pt-6 border-t border-ink/8">
        <div className="flex items-center justify-between text-sm text-slate-blue">
          <div>
            Session ID: <span className="font-mono">{sessionId.slice(0, 8)}</span>
          </div>
          <div>
            Phase {currentPhase + 1} of {phases.length}: {phases[currentPhase].name}
          </div>
          <div>
            Estimated time: ~{phases[currentPhase].duration} minutes
          </div>
        </div>
      </div>
    </div>
  )
}