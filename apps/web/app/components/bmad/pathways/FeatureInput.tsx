'use client'

import { useState, useEffect, useCallback } from 'react'
import { FeatureInputData } from '@/lib/bmad/types'

interface FeatureInputProps {
  sessionId: string
  onAnalysisGenerated?: (data: FeatureInputData) => void
  onNext?: () => void
  className?: string
}

export default function FeatureInput({
  sessionId,
  onAnalysisGenerated,
  onNext,
  className = ''
}: FeatureInputProps) {
  const [featureDescription, setFeatureDescription] = useState('')
  const [targetUsers, setTargetUsers] = useState('')
  const [currentProblems, setCurrentProblems] = useState('')
  const [successDefinition, setSuccessDefinition] = useState('')
  const [analysisQuestions, setAnalysisQuestions] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [validationError, setValidationError] = useState<string>('')
  const [hasGeneratedQuestions, setHasGeneratedQuestions] = useState(false)

  // Auto-save functionality (every 30 seconds)
  useEffect(() => {
    if (featureDescription.trim()) {
      const interval = setInterval(() => {
        saveToSession()
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [featureDescription, targetUsers, currentProblems, successDefinition])

  const saveToSession = useCallback(async () => {
    if (!featureDescription.trim()) return

    try {
      const data: FeatureInputData = {
        feature_description: featureDescription.trim(),
        target_users: targetUsers.trim() || undefined,
        current_problems: currentProblems.trim() || undefined,
        success_definition: successDefinition.trim() || undefined,
        analysis_questions: analysisQuestions,
        input_timestamp: new Date()
      }

      const response = await fetch('/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_feature_input',
          session_id: sessionId,
          feature_input_data: data
        })
      })

      if (!response.ok) {
        console.warn('Failed to auto-save feature input')
      }
    } catch (error) {
      console.warn('Auto-save error:', error)
    }
  }, [sessionId, featureDescription, targetUsers, currentProblems, successDefinition, analysisQuestions])

  const validateInput = () => {
    const description = featureDescription.trim()

    if (!description) {
      setValidationError('Feature description is required')
      return false
    }

    if (description.length < 50) {
      setValidationError('Feature description must be at least 50 characters')
      return false
    }

    if (description.length > 500) {
      setValidationError('Feature description must be 500 characters or less')
      return false
    }

    // Validate optional fields length
    if (targetUsers.length > 200) {
      setValidationError('Target users description must be 200 characters or less')
      return false
    }

    if (currentProblems.length > 200) {
      setValidationError('Current problems description must be 200 characters or less')
      return false
    }

    if (successDefinition.length > 200) {
      setValidationError('Success definition must be 200 characters or less')
      return false
    }

    setValidationError('')
    return true
  }

  const generateAnalysisQuestions = async () => {
    if (!validateInput()) return

    setIsGenerating(true)

    try {
      const response = await fetch('/api/bmad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_feature_input',
          feature_description: featureDescription.trim(),
          target_users: targetUsers.trim() || undefined,
          current_problems: currentProblems.trim() || undefined,
          success_definition: successDefinition.trim() || undefined,
          session_id: sessionId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate analysis questions')
      }

      const result = await response.json()

      if (result.success && result.questions) {
        setAnalysisQuestions(result.questions)
        setHasGeneratedQuestions(true)

        const data: FeatureInputData = {
          feature_description: featureDescription.trim(),
          target_users: targetUsers.trim() || undefined,
          current_problems: currentProblems.trim() || undefined,
          success_definition: successDefinition.trim() || undefined,
          analysis_questions: result.questions,
          input_timestamp: new Date()
        }

        if (onAnalysisGenerated) {
          onAnalysisGenerated(data)
        }
      } else {
        throw new Error(result.message || 'Failed to generate questions')
      }
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'Failed to generate analysis questions')
      console.error('Analysis generation error:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const canGenerateQuestions = featureDescription.trim().length >= 50

  return (
    <div className={`feature-input ${className}`}>
      {/* Progress Indicator */}
      <div className="flex items-center gap-2 mb-6 text-sm text-secondary">
        <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-medium">
          1
        </div>
        <span>Step 1 of 4: Feature Input & Validation</span>
      </div>

      <div className="bg-white rounded-lg border border-divider p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-primary mb-2">
            Describe Your Feature Concept
          </h2>
          <p className="text-secondary text-sm">
            Provide details about the feature you want to validate and refine.
            The more specific you are, the better guidance you'll receive.
          </p>
        </div>

        <div className="space-y-6">
          {/* Feature Description - Required */}
          <div>
            <label htmlFor="feature-description" className="block text-sm font-medium text-primary mb-2">
              Feature Description <span className="text-error">*</span>
            </label>
            <textarea
              id="feature-description"
              value={featureDescription}
              onChange={(e) => setFeatureDescription(e.target.value)}
              placeholder="Describe your feature idea in detail. What does it do? Who is it for? What problem does it solve? (50-500 characters)"
              rows={4}
              className="w-full px-3 py-2 border border-divider rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
            />
            <div className="flex justify-between items-center mt-1">
              <div className="text-xs text-secondary">
                {featureDescription.length < 50 ? (
                  <span className="text-mustard">
                    {50 - featureDescription.length} more characters needed
                  </span>
                ) : (
                  <span className="text-forest">✓ Minimum length met</span>
                )}
              </div>
              <div className="text-xs text-secondary">
                {featureDescription.length}/500
              </div>
            </div>
          </div>

          {/* Target Users - Optional */}
          <div>
            <label htmlFor="target-users" className="block text-sm font-medium text-primary mb-2">
              Target Users <span className="text-secondary text-xs">(optional)</span>
            </label>
            <textarea
              id="target-users"
              value={targetUsers}
              onChange={(e) => setTargetUsers(e.target.value)}
              placeholder="Who will use this feature? Describe your target user groups or personas."
              rows={2}
              className="w-full px-3 py-2 border border-divider rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
            />
            <div className="text-xs text-secondary text-right mt-1">
              {targetUsers.length}/200
            </div>
          </div>

          {/* Current Problems - Optional */}
          <div>
            <label htmlFor="current-problems" className="block text-sm font-medium text-primary mb-2">
              Current Problems <span className="text-secondary text-xs">(optional)</span>
            </label>
            <textarea
              id="current-problems"
              value={currentProblems}
              onChange={(e) => setCurrentProblems(e.target.value)}
              placeholder="What specific problems or pain points does this feature address?"
              rows={2}
              className="w-full px-3 py-2 border border-divider rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
            />
            <div className="text-xs text-secondary text-right mt-1">
              {currentProblems.length}/200
            </div>
          </div>

          {/* Success Definition - Optional */}
          <div>
            <label htmlFor="success-definition" className="block text-sm font-medium text-primary mb-2">
              Success Definition <span className="text-secondary text-xs">(optional)</span>
            </label>
            <textarea
              id="success-definition"
              value={successDefinition}
              onChange={(e) => setSuccessDefinition(e.target.value)}
              placeholder="How will you know this feature is successful? What metrics or outcomes matter?"
              rows={2}
              className="w-full px-3 py-2 border border-divider rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
            />
            <div className="text-xs text-secondary text-right mt-1">
              {successDefinition.length}/200
            </div>
          </div>

          {/* Error Display */}
          {validationError && (
            <div className="bg-error/5 border border-error/20 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-error" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                <span className="text-error text-sm">{validationError}</span>
              </div>
            </div>
          )}

          {/* Generate Analysis Button */}
          <div className="flex justify-between items-center pt-4 border-t border-divider">
            <div className="text-sm text-secondary">
              {hasGeneratedQuestions ? (
                <span className="text-forest">✓ Analysis questions generated</span>
              ) : (
                'Ready to generate validation questions'
              )}
            </div>
            <button
              onClick={generateAnalysisQuestions}
              disabled={!canGenerateQuestions || isGenerating}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Generating...
                </span>
              ) : hasGeneratedQuestions ? (
                'Regenerate Questions'
              ) : (
                'Generate Analysis Questions'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Generated Questions Display */}
      {analysisQuestions.length > 0 && (
        <div className="mt-6 bg-terracotta/5 rounded-lg border border-terracotta/20 p-6">
          <h3 className="text-lg font-semibold text-ink mb-4">
            Feature Validation Questions
          </h3>
          <div className="space-y-3">
            {analysisQuestions.map((question, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-terracotta text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <p className="text-ink text-sm leading-relaxed">{question}</p>
              </div>
            ))}
          </div>

          {onNext && (
            <div className="flex justify-end mt-6 pt-4 border-t border-terracotta/20">
              <button
                onClick={onNext}
                className="px-6 py-2 bg-terracotta text-white rounded-lg hover:bg-terracotta-hover transition-colors"
              >
                Continue to Priority Scoring →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}