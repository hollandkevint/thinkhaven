'use client'

import { useState } from 'react'
import { NumberedOption, UserResponse } from '@/lib/bmad/types'
import { ElicitationLoader } from './LoadingIndicator'
import { GracefulDegradation } from '@/lib/bmad/service-status'

interface ElicitationPanelProps {
  sessionId: string
  phaseId: string
  phaseTitle: string
  prompt: string
  options: NumberedOption[]
  onSubmit: (response: UserResponse) => void
  allowCustomInput?: boolean
  customInputPlaceholder?: string
  className?: string
}

export default function ElicitationPanel({
  sessionId,
  phaseId,
  phaseTitle,
  prompt,
  options,
  onSubmit,
  allowCustomInput = true,
  customInputPlaceholder = "Or describe your own approach...",
  className = ''
}: ElicitationPanelProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [customInput, setCustomInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [submitProgress, setSubmitProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isOfflineMode, setIsOfflineMode] = useState(false)

  const handleOptionSelect = (optionNumber: number) => {
    setSelectedOption(optionNumber)
    setShowCustomInput(false)
    setCustomInput('')
    setError(null) // Clear any previous errors
  }

  const handleCustomInputToggle = () => {
    setShowCustomInput(!showCustomInput)
    setSelectedOption(null)
    setError(null) // Clear any previous errors
  }

  const handleRetry = async () => {
    setError(null)
    setRetryCount(prev => prev + 1)
    await handleSubmit()
  }

  const handleOfflineMode = () => {
    setIsOfflineMode(true)
    setError(null)
    // Show offline options from GracefulDegradation
  }

  const handleSubmit = async () => {
    if (isSubmitting) return

    let responseData: UserResponse

    if (selectedOption !== null) {
      const selectedOptionData = options.find(opt => opt.number === selectedOption)
      responseData = {
        elicitationChoice: selectedOption,
        text: selectedOptionData?.text || '',
        data: {
          category: selectedOptionData?.category,
          estimatedTime: selectedOptionData?.estimatedTime
        },
        timestamp: new Date()
      }
    } else if (customInput.trim()) {
      responseData = {
        text: customInput.trim(),
        data: {
          customResponse: true
        },
        timestamp: new Date()
      }
    } else {
      return // No selection made
    }

    setIsSubmitting(true)
    setSubmitProgress(0)
    setError(null)
    
    let progressInterval: NodeJS.Timeout | null = null

    try {
      await GracefulDegradation.withFallback(
        // Primary operation: normal submission
        async () => {
          // Simulate progress updates for better UX
          progressInterval = setInterval(() => {
            setSubmitProgress(prev => {
              const newProgress = prev + 15
              if (newProgress >= 90) {
                return 90 // Stop at 90% until completion
              }
              return newProgress
            })
          }, 200)

          await onSubmit(responseData)
          
          if (progressInterval) {
            clearInterval(progressInterval)
            progressInterval = null
          }
          setSubmitProgress(100)
          return true
        },
        // Fallback operation: cache locally and show offline message
        () => {
          if (progressInterval) {
            clearInterval(progressInterval)
            progressInterval = null
          }
          
          // Cache the response locally
          GracefulDegradation.cacheSessionData(sessionId, {
            responseData,
            phaseId,
            timestamp: new Date(),
            offline: true
          })
          
          setIsOfflineMode(true)
          setSubmitProgress(100)
          
          // Show success message for offline mode
          setError(null)
          return true
        },
        ['sessionManagement']
      )

    } catch (error) {
      console.error('Error submitting response:', error)
      
      if (progressInterval) {
        clearInterval(progressInterval)
        progressInterval = null
      }
      
      setSubmitProgress(0)
      
      // Set user-friendly error message based on retry count
      if (retryCount === 0) {
        setError('Unable to submit your response. This might be a temporary connection issue.')
      } else if (retryCount === 1) {
        setError('Still having trouble connecting. Your response has been saved locally and will sync when connection is restored.')
      } else {
        setError('Multiple connection attempts failed. You can continue in offline mode or try again later.')
      }
    } finally {
      setTimeout(() => {
        setIsSubmitting(false)
        if (error) {
          setSubmitProgress(0)
        }
      }, 500) // Brief delay to show completion or error
    }
  }

  const canSubmit = selectedOption !== null || (showCustomInput && customInput.trim().length > 0)

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      'analysis': 'bg-terracotta/10 text-ink border-terracotta/20',
      'strategy': 'bg-terracotta/10 text-terracotta border-terracotta/20',
      'validation': 'bg-forest/10 text-forest border-forest/20',
      'optimization': 'bg-mustard/10 text-mustard border-mustard/20',
      'innovation': 'bg-pink-100 text-pink-800 border-pink-200',
      'execution': 'bg-terracotta/10 text-terracotta border-terracotta/20',
      'default': 'bg-parchment text-ink border-ink/8'
    }
    
    return colors[category.toLowerCase()] || colors.default
  }

  const formatEstimatedTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`
    } else {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
    }
  }

  const getStrategicRationale = (category: string, text: string): string => {
    const rationales: Record<string, string> = {
      'analysis': 'Best for data-driven decision making and understanding the competitive landscape',
      'strategy': 'Ideal for long-term planning and establishing clear strategic direction',
      'validation': 'Perfect for testing assumptions and reducing risk through customer feedback',
      'optimization': 'Great for improving existing processes and maximizing current resources',
      'innovation': 'Excellent for breakthrough thinking and disruptive opportunities',
      'execution': 'Essential for turning strategy into actionable plans and implementation'
    }
    
    // Fallback to analyzing the text for specific contexts
    if (rationales[category.toLowerCase()]) {
      return rationales[category.toLowerCase()]
    }
    
    if (text.toLowerCase().includes('market')) {
      return 'Provides crucial market insights for informed strategic decisions'
    } else if (text.toLowerCase().includes('user') || text.toLowerCase().includes('customer')) {
      return 'Focuses on user needs and customer validation for product-market fit'
    } else if (text.toLowerCase().includes('financial') || text.toLowerCase().includes('revenue')) {
      return 'Establishes financial foundation and sustainable business model'
    }
    
    return 'Supports systematic strategic thinking and structured analysis'
  }

  const getStrategicImpact = (category: string): string => {
    const impacts: Record<string, string> = {
      'analysis': 'High insight value',
      'strategy': 'Long-term impact',
      'validation': 'Risk reduction',
      'optimization': 'Efficiency gains', 
      'innovation': 'Breakthrough potential',
      'execution': 'Immediate progress'
    }
    
    return impacts[category.toLowerCase()] || 'Strategic value'
  }

  const getStrategicDifficulty = (estimatedTime: number): string => {
    if (estimatedTime <= 15) {
      return '⚡ Quick wins'
    } else if (estimatedTime <= 25) {
      return '🎯 Focused effort' 
    } else if (estimatedTime <= 35) {
      return '🚀 Deep dive'
    } else {
      return '📊 Comprehensive'
    }
  }

  const getPhaseContextualExplanation = (phaseId: string): { title: string; description: string; icon: string } => {
    const phaseContexts: Record<string, { title: string; description: string; icon: string }> = {
      'foundation': {
        title: 'Foundation Phase',
        description: 'Establish the core framework and baseline understanding for your strategic thinking session. This phase helps clarify objectives and set the direction.',
        icon: '🏗️'
      },
      'discovery': {
        title: 'Discovery Phase', 
        description: 'Explore and uncover key insights, opportunities, and constraints. Focus on gathering information that will inform your strategic decisions.',
        icon: '🔍'
      },
      'ideation': {
        title: 'Ideation Phase',
        description: 'Generate creative solutions and strategic alternatives. This is your opportunity to think expansively and explore different approaches.',
        icon: '💡'
      },
      'analysis': {
        title: 'Analysis Phase',
        description: 'Evaluate and assess the viability, risks, and potential of your strategic options using structured frameworks and data-driven approaches.',
        icon: '📊'
      },
      'validation': {
        title: 'Validation Phase',
        description: 'Test assumptions and validate your strategic approach through research, feedback, and preliminary market validation activities.',
        icon: '✅'
      },
      'planning': {
        title: 'Planning Phase',
        description: 'Transform insights into actionable plans with clear next steps, timelines, and resource requirements for successful execution.',
        icon: '📋'
      },
      'synthesis': {
        title: 'Synthesis Phase',
        description: 'Integrate all insights and learning into a coherent strategic framework that guides decision-making and future actions.',
        icon: '🔗'
      },
      'execution': {
        title: 'Execution Phase',
        description: 'Focus on implementation strategies, immediate next steps, and establishing systems for ongoing strategic progress.',
        icon: '🚀'
      }
    }

    // Extract phase name from phaseId (handles formats like "new_idea_foundation" or "business_model_discovery")
    const phaseName = phaseId.split('_').pop() || phaseId
    
    return phaseContexts[phaseName.toLowerCase()] || {
      title: 'Strategic Phase',
      description: 'Focus on systematic strategic thinking to develop actionable insights and clear direction for your objectives.',
      icon: '🎯'
    }
  }

  return (
    <div className={`bg-white rounded-lg border border-divider ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-divider">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-primary mb-2">{phaseTitle}</h3>
            <p className="text-secondary leading-relaxed mb-4">{prompt}</p>
            
            {/* Phase-Specific Strategic Context */}
            <div className="bg-terracotta/5 rounded-lg p-4 border-l-4 border-terracotta">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-terracotta rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm">{getPhaseContextualExplanation(phaseId).icon}</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-ink mb-1">
                    {getPhaseContextualExplanation(phaseId).title}
                  </h4>
                  <p className="text-ink text-sm mb-3">
                    {getPhaseContextualExplanation(phaseId).description}
                  </p>
                  <div className="text-xs text-terracotta bg-terracotta/10 rounded px-2 py-1 inline-block">
                    💡 Each option below represents a different strategic approach within this phase
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="ml-4 text-right">
            <div className="text-sm text-secondary">Current Phase</div>
            <div className="text-xs font-mono text-primary bg-parchment px-2 py-1 rounded">
              {phaseId.replace(/_/g, '-').toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-primary">Choose your strategic approach:</h4>
            <div className="text-sm text-secondary">
              {options.length} strategic options available
            </div>
          </div>
          
          <div className="grid gap-3">
            {options.map((option) => (
              <div
                key={option.number}
                className={`
                  border rounded-lg p-4 cursor-pointer transition-all hover:shadow-sm
                  ${selectedOption === option.number 
                    ? 'border-primary bg-primary/5 shadow-sm' 
                    : 'border-divider hover:border-primary/50'
                  }
                  ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onClick={() => !isSubmitting && handleOptionSelect(option.number)}
              >
                <div className="flex items-start gap-4">
                  {/* Number Circle */}
                  <div className={`
                    flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm
                    ${selectedOption === option.number 
                      ? 'bg-primary text-white' 
                      : 'bg-parchment text-ink-light'
                    }
                  `}>
                    {option.number}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <p className="text-foreground font-medium leading-relaxed mb-2">{option.text}</p>
                        
                        {/* Strategic Rationale */}
                        <div className="text-sm text-secondary leading-relaxed">
                          <strong>Why choose this:</strong> {getStrategicRationale(option.category, option.text)}
                        </div>
                      </div>
                      
                      {/* Time Estimate */}
                      <div className="flex-shrink-0 text-right">
                        <div className="text-xs text-secondary mb-1">Duration</div>
                        <div className="text-sm font-medium text-primary bg-parchment px-2 py-1 rounded">
                          {formatEstimatedTime(option.estimatedTime)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Category Badge with Strategic Impact */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`
                          px-3 py-1 text-xs font-medium rounded-full border
                          ${getCategoryColor(option.category)}
                        `}>
                          {option.category.charAt(0).toUpperCase() + option.category.slice(1)}
                        </span>
                        <span className="text-xs text-secondary">
                          • {getStrategicImpact(option.category)}
                        </span>
                      </div>
                      
                      {/* Strategic Difficulty */}
                      <div className="text-xs text-secondary">
                        {getStrategicDifficulty(option.estimatedTime)}
                      </div>
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  <div className="flex-shrink-0">
                    {selectedOption === option.number && (
                      <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Input Option */}
        {allowCustomInput && (
          <div className="border-t border-divider pt-6">
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={handleCustomInputToggle}
                disabled={isSubmitting}
                className={`
                  flex items-center gap-2 text-sm font-medium transition-colors
                  ${showCustomInput ? 'text-primary' : 'text-secondary hover:text-primary'}
                  ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className={`
                  w-4 h-4 rounded border flex items-center justify-center
                  ${showCustomInput ? 'bg-primary border-primary' : 'border-divider'}
                `}>
                  {showCustomInput && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4"/>
                    </svg>
                  )}
                </div>
                Custom Response
              </button>
            </div>

            {showCustomInput && (
              <div className="mt-3">
                <textarea
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder={customInputPlaceholder}
                  rows={3}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border border-divider rounded-lg focus:border-primary focus:outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="flex justify-between items-center mt-2">
                  <div className="text-xs text-secondary">
                    {customInput.length}/500 characters
                  </div>
                  {customInput.length > 500 && (
                    <div className="text-xs text-error">
                      Response too long
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Display and Recovery Options */}
        {error && (
          <div className="mt-6 pt-6 border-t border-divider">
            <div className="bg-rust/5 rounded-lg p-4 border-l-4 border-rust mb-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-rust rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-xs">!</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-ink mb-2">Connection Issue</h4>
                  <p className="text-rust text-sm mb-3">{error}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    {retryCount < 2 && (
                      <button
                        onClick={handleRetry}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-rust text-white text-sm rounded-lg hover:bg-rust/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSubmitting ? 'Retrying...' : 'Try Again'}
                      </button>
                    )}
                    
                    {retryCount >= 1 && (
                      <button
                        onClick={handleOfflineMode}
                        className="px-4 py-2 bg-terracotta text-white text-sm rounded-lg hover:bg-terracotta-hover transition-colors"
                      >
                        Continue Offline
                      </button>
                    )}
                    
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-slate-blue text-white text-sm rounded-lg hover:bg-slate-blue/80 transition-colors"
                    >
                      Refresh Page
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Offline Mode Indicator */}
        {isOfflineMode && (
          <div className="mt-6 pt-6 border-t border-divider">
            <div className="bg-mustard/5 rounded-lg p-4 border-l-4 border-mustard mb-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-mustard rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-xs">⚡</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-ink mb-2">Offline Mode Active</h4>
                  <p className="text-mustard text-sm mb-3">
                    Your responses are being saved locally and will be synchronized when connection is restored. 
                    You can continue working with basic recommendations.
                  </p>
                  <div className="text-xs text-mustard bg-mustard/10 rounded px-2 py-1 inline-block">
                    💾 Data saved locally • Will sync when online
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-6 pt-6 border-t border-divider">
          {/* Next Steps Preview */}
          {(selectedOption !== null || (showCustomInput && customInput.trim())) && (
            <div className="bg-forest/5 rounded-lg p-4 mb-4 border-l-4 border-forest">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-forest rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-xs">✓</span>
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-ink mb-1">Next: Strategic Analysis</h5>
                  <p className="text-forest text-sm">
                    {selectedOption !== null 
                      ? `Your choice will guide the next phase of strategic analysis. We&apos;ll build on your selected approach with tailored frameworks and actionable insights.`
                      : `Your custom response will be analyzed to provide personalized strategic guidance and next steps.`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            {/* Progress indicator */}
            <div className="text-sm text-secondary">
              {canSubmit ? (
                <span className="text-forest">✓ Ready to proceed</span>
              ) : (
                <span>Select an option to continue</span>
              )}
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting || (showCustomInput && customInput.length > 500)}
              className={`
                px-8 py-3 rounded-lg font-medium transition-all flex items-center gap-2
                ${canSubmit && !isSubmitting && !(showCustomInput && customInput.length > 500)
                  ? isOfflineMode 
                    ? 'bg-mustard text-white hover:bg-mustard/80 shadow-sm hover:shadow-md'
                    : 'bg-primary text-white hover:bg-primary-hover shadow-sm hover:shadow-md'
                  : 'bg-parchment text-slate-blue/60 cursor-not-allowed'
                }
              `}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isOfflineMode ? 'Saving Locally...' : retryCount > 0 ? 'Retrying...' : 'Analyzing...'}
                </>
              ) : (
                <>
                  {isOfflineMode ? (
                    <>
                      Continue Offline Session
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                    </>
                  ) : (
                    <>
                      Continue Strategic Session
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Processing Progress */}
        {isSubmitting && (
          <div className="mt-6 border-t border-divider pt-6">
            <ElicitationLoader progress={submitProgress} className="w-full" />
          </div>
        )}

        {/* Progress Indicator */}
        <div className="mt-4 text-center">
          <div className="text-xs text-secondary">
            Session ID: {sessionId.slice(-8)}
          </div>
        </div>
      </div>
    </div>
  )
}