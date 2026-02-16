'use client'

import { useState, useEffect, useCallback } from 'react'
import { PathwayType, UserResponse, NumberedOption } from '@/lib/bmad/types'
import { useBmadSession } from './useBmadSession'
import PathwaySelector from './PathwaySelector'
import SessionManager from './SessionManager'
import EnhancedSessionManager from './EnhancedSessionManager'
import SessionHistoryManager from './SessionHistoryManager'
import ElicitationPanel from './ElicitationPanel'
import { SkeletonLoader } from './LoadingIndicator'
import ErrorBoundary from './ErrorBoundary'
import NewIdeaPathway from './pathways/NewIdeaPathway'

interface BmadInterfaceProps {
  workspaceId: string
  className?: string
  preservedInput?: string
  onInputConsumed?: () => void
}

type BMadStep = 'pathway-selection' | 'session-active' | 'session-completed'

export default function BmadInterface({ workspaceId, className = '', preservedInput, onInputConsumed }: BmadInterfaceProps) {
  const [currentStep, setCurrentStep] = useState<BMadStep>('pathway-selection')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showContinuationGuidance, setShowContinuationGuidance] = useState(false)
  const [continuationSessionInfo, setContinuationSessionInfo] = useState<{
    pathway: string
    timeElapsed: string
    lastActivity: string
    progress: number
  } | null>(null)
  const [mockElicitationData, setMockElicitationData] = useState<{
    options: NumberedOption[]
    phaseTitle: string
    prompt: string
  } | null>(null)

  const {
    currentSession,
    isLoading,
    error,
    createSession,
    advanceSession,
    getSession,
    pauseSession,
    resumeSession,
    exitSession
  } = useBmadSession()

  // Helper functions for session continuation guidance
  const formatTimeElapsed = useCallback((milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    } else {
      return 'Just now'
    }
  }, [])

  const formatLastActivity = useCallback((timestamp: string): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    
    return formatTimeElapsed(diffMs)
  }, [formatTimeElapsed])

  const getPathwayDisplayName = useCallback((pathway: string): string => {
    const pathwayNames: Record<string, string> = {
      'NEW_IDEA': 'New Idea Creative Expansion',
      'new-idea': 'New Idea Creative Expansion',
      'business-model': 'Business Model Analysis',
      'business-model-problem': 'Business Model Problem Analysis',
      'feature-refinement': 'Feature Refinement & User-Centered Design',
      'strategic-optimization': 'Strategic Optimization'
    }
    
    return pathwayNames[pathway] || pathway.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }, [])

  const checkForActiveSessions = useCallback(async () => {
    try {
      const response = await fetch(`/api/bmad?action=sessions&workspaceId=${workspaceId}`)
      
      if (response.ok) {
        const result = await response.json()
        
        if (result.success && result.data.sessions) {
          const allSessions = result.data.sessions
          const activeSessions = allSessions.filter((s: { status: string }) => s.status === 'active')
          
          if (activeSessions.length > 0) {
            // Load the most recent active session
            const activeSession = activeSessions[0]
            
            // Calculate session continuation info
            const createdAt = new Date(activeSession.createdAt)
            const now = new Date()
            const timeElapsed = formatTimeElapsed(now.getTime() - createdAt.getTime())
            const lastActivity = formatLastActivity(activeSession.lastActivityAt || activeSession.createdAt)
            
            setContinuationSessionInfo({
              pathway: getPathwayDisplayName(activeSession.pathway),
              timeElapsed,
              lastActivity,
              progress: Math.round(activeSession.progress?.overallCompletion || 0)
            })
            
            setShowContinuationGuidance(true)
            
            await getSession(activeSession.id)
            setCurrentStep('session-active')
            generateMockElicitationData()
          } else if (allSessions.length === 0) {
            // First-time user - show onboarding
            setShowOnboarding(true)
          }
        }
      }
    } catch (error) {
      console.error('Error checking for active sessions:', error)
      // On error, assume first-time user and show onboarding
      setShowOnboarding(true)
    }
  }, [workspaceId, getSession, formatTimeElapsed, formatLastActivity, getPathwayDisplayName])

  // Check for existing active sessions on mount
  useEffect(() => {
    checkForActiveSessions()
  }, [workspaceId, checkForActiveSessions])


  const handlePathwaySelected = async (
    pathway: PathwayType, 
    userInput?: string, 
    recommendation?: {
      recommendedPathway: PathwayType;
      confidence: number;
      reasoning: string;
      alternativePathways: PathwayType[];
    }
  ) => {
    try {
      await createSession(workspaceId, pathway, userInput, recommendation)
      setCurrentStep('session-active')
      generateMockElicitationData()
      
      // Clear preserved input since it has been consumed
      if (onInputConsumed) {
        onInputConsumed()
      }
    } catch (error) {
      console.error('Error creating session:', error)
      // Error handling is done in the hook
    }
  }

  const handleSessionExit = () => {
    exitSession()
    setCurrentStep('pathway-selection')
    setMockElicitationData(null)
    
    // Clear any preserved input when returning to workspace
    if (onInputConsumed) {
      onInputConsumed()
    }
  }

  const handleElicitationSubmit = async (response: UserResponse) => {
    if (!currentSession) return

    try {
      const userInput = response.text || `Selected option ${response.elicitationChoice}`
      await advanceSession(currentSession.id, userInput)
      
      // Generate new mock data for next phase
      generateMockElicitationData()
      
      // Check if session is completed
      if (currentSession.progress.overallCompletion >= 100) {
        setCurrentStep('session-completed')
      }
    } catch (error) {
      console.error('Error advancing session:', error)
    }
  }

  // Generate mock elicitation data since backend may not be fully ready
  const generateMockElicitationData = () => {
    const mockOptions: NumberedOption[] = [
      {
        number: 1,
        text: "Focus on market research and competitive analysis to understand the landscape",
        category: "analysis",
        estimatedTime: 15
      },
      {
        number: 2, 
        text: "Develop a minimum viable product (MVP) to test core assumptions",
        category: "validation",
        estimatedTime: 30
      },
      {
        number: 3,
        text: "Create detailed user personas and journey maps",
        category: "strategy",
        estimatedTime: 20
      },
      {
        number: 4,
        text: "Build financial models and revenue projections",
        category: "analysis",
        estimatedTime: 25
      },
      {
        number: 5,
        text: "Design a strategic partnership framework",
        category: "strategy", 
        estimatedTime: 18
      },
      {
        number: 6,
        text: "Establish key performance indicators (KPIs) and success metrics",
        category: "optimization",
        estimatedTime: 12
      },
      {
        number: 7,
        text: "Conduct stakeholder interviews and feedback sessions",
        category: "validation",
        estimatedTime: 35
      },
      {
        number: 8,
        text: "Develop a comprehensive go-to-market strategy",
        category: "execution",
        estimatedTime: 28
      },
      {
        number: 9,
        text: "Create a risk assessment and mitigation plan",
        category: "analysis",
        estimatedTime: 22
      }
    ]

    setMockElicitationData({
      options: mockOptions,
      phaseTitle: "Strategic Direction Setting",
      prompt: "Based on your pathway selection, what would be the most valuable next step to move your initiative forward? Choose the approach that best aligns with your current priorities and available resources."
    })
  }

  const renderBreadcrumbs = () => {
    const steps = [
      { key: 'pathway-selection', label: 'Choose Pathway', isActive: currentStep === 'pathway-selection' },
      { key: 'session-active', label: currentSession ? getPathwayDisplayName(currentSession.pathway) : 'Strategic Session', isActive: currentStep === 'session-active' },
      { key: 'session-completed', label: 'Completed', isActive: currentStep === 'session-completed' }
    ]

    return (
      <div className="flex items-center space-x-2 mb-6 p-4 bg-white/50 rounded-lg border border-divider/30">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div className={`flex items-center ${step.isActive ? 'text-primary font-medium' : 'text-secondary'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2 ${
                step.isActive 
                  ? 'bg-primary text-white' 
                  : currentStep === 'session-completed' && index < 2
                    ? 'bg-forest text-white'
                    : 'bg-ink/10 text-ink-light'
              }`}>
                {currentStep === 'session-completed' && index < 2 ? (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span className="text-sm">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div className="mx-4 w-8 h-px bg-divider"></div>
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'pathway-selection':
        return (
          <div className="space-y-6">
            <ErrorBoundary component="PathwaySelector">
              <PathwaySelector
                workspaceId={workspaceId}
                onPathwaySelected={handlePathwaySelected}
                className="w-full"
                preservedInput={preservedInput}
              />
            </ErrorBoundary>
            
            {/* Session History and Resumption */}
            <ErrorBoundary component="SessionHistoryManager">
              <SessionHistoryManager
                workspaceId={workspaceId}
                onResumeSession={async (sessionId) => {
                  try {
                    await getSession(sessionId)
                    setCurrentStep('session-active')
                    generateMockElicitationData()
                  } catch (error) {
                    console.error('Error resuming session:', error)
                  }
                }}
                className="w-full"
              />
            </ErrorBoundary>
            
            {error && (
              <div className="bg-error/5 border border-error/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-error" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <span className="text-error font-medium">Error</span>
                </div>
                <p className="text-error text-sm">{error}</p>
              </div>
            )}
          </div>
        )

      case 'session-active':
        if (!currentSession) {
          return (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-divider p-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-primary mb-2">Loading Your Session</h3>
                  <p className="text-secondary text-sm">Preparing your strategic thinking workspace...</p>
                </div>
                <SkeletonLoader />
              </div>
              <div className="bg-white rounded-lg border border-divider p-6">
                <SkeletonLoader />
              </div>
            </div>
          )
        }

        // Check if this is a New Idea pathway and render accordingly
        if (currentSession.pathway === PathwayType.NEW_IDEA) {
          return (
            <div className="space-y-6">
              <ErrorBoundary component="NewIdeaPathway">
                <NewIdeaPathway
                  sessionId={currentSession.id}
                  onSessionComplete={(sessionData) => {
                    setCurrentStep('session-completed')
                  }}
                  onError={(error) => {
                    console.error('New Idea pathway error:', error)
                  }}
                />
              </ErrorBoundary>
            </div>
          )
        }

        return (
          <div className="space-y-6">
            <ErrorBoundary component="SessionManager">
              <EnhancedSessionManager
                session={currentSession}
                onPause={pauseSession}
                onResume={resumeSession}
                onExit={handleSessionExit}
                className="w-full"
              />
            </ErrorBoundary>

            {mockElicitationData && (
              <ErrorBoundary component="ElicitationPanel">
                <ElicitationPanel
                  sessionId={currentSession.id}
                  phaseId={currentSession.currentPhase}
                  phaseTitle={mockElicitationData.phaseTitle}
                  prompt={mockElicitationData.prompt}
                  options={mockElicitationData.options}
                  onSubmit={handleElicitationSubmit}
                  className="w-full"
                />
              </ErrorBoundary>
            )}

            {/* Session History during active session */}
            <ErrorBoundary component="SessionHistoryManager">
              <SessionHistoryManager
                workspaceId={workspaceId}
                currentSession={currentSession}
                onResumeSession={async (sessionId) => {
                  if (sessionId !== currentSession.id) {
                    try {
                      await getSession(sessionId)
                      generateMockElicitationData()
                    } catch (error) {
                      console.error('Error switching session:', error)
                    }
                  }
                }}
                className="w-full"
              />
            </ErrorBoundary>

            {error && (
              <div className="bg-error/5 border border-error/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-error" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                  <span className="text-error font-medium">Session Error</span>
                </div>
                <p className="text-error text-sm">{error}</p>
              </div>
            )}
          </div>
        )

      case 'session-completed':
        return (
          <div className="bg-white rounded-lg border border-divider p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-success" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-primary mb-2">Session Completed!</h2>
              <p className="text-secondary">
                Your strategic session has been completed successfully. Your insights and outputs have been saved.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  setCurrentStep('pathway-selection')
                  // Clear preserved input for fresh start
                  if (onInputConsumed) {
                    onInputConsumed()
                  }
                }}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
              >
                Start New Session
              </button>
              <button
                onClick={handleSessionExit}
                className="px-6 py-3 border border-divider text-secondary rounded-lg hover:bg-primary/5 transition-colors"
              >
                Return to Workspace
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      {/* Onboarding Modal */}
      {showOnboarding && (
        <ErrorBoundary
          component="OnboardingModal"
          fallback={() => (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl max-w-md w-full p-6">
                <h2 className="text-xl font-bold text-primary mb-4">Unable to Load Onboarding</h2>
                <p className="text-secondary mb-4">
                  There was an issue loading the onboarding content. You can still continue to your session.
                </p>
                <button
                  onClick={() => setShowOnboarding(false)}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                >
                  Continue to Session
                </button>
              </div>
            </div>
          )}
        >
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-divider">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-terracotta rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">B</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-primary">Welcome to ThinkHaven</h2>
                  <p className="text-secondary">Strategic frameworks for breakthrough thinking</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Introduction */}
              <div>
                <h3 className="text-lg font-semibold text-primary mb-3">How It Works</h3>
                <p className="text-secondary leading-relaxed">
                  ThinkHaven provides a structured approach to strategic thinking that guides you through proven frameworks
                  to develop ideas, analyze business models, and optimize strategies. Each session is designed to take
                  25-45 minutes and produces actionable insights.
                </p>
              </div>

              {/* Three Pathways */}
              <div>
                <h3 className="text-lg font-semibold text-primary mb-4">Choose Your Strategic Journey</h3>
                <div className="grid gap-4">
                  <div className="flex items-start gap-3 p-4 bg-terracotta/5 rounded-lg border border-terracotta/20">
                    <div className="w-8 h-8 text-terracotta flex-shrink-0">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-ink mb-1">New Idea Development</h4>
                      <p className="text-ink text-sm">Transform early-stage concepts into validated business opportunities through structured brainstorming and market analysis.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 bg-forest/5 rounded-lg border border-forest/20">
                    <div className="w-8 h-8 text-forest flex-shrink-0">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-ink mb-1">Business Model Analysis</h4>
                      <p className="text-forest text-sm">Deep dive into revenue models and business strategy using systematic market research and competitive analysis.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-4 bg-terracotta/5 rounded-lg border border-terracotta/20">
                    <div className="w-8 h-8 text-terracotta flex-shrink-0">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-ink mb-1">Strategic Optimization</h4>
                      <p className="text-terracotta text-sm">Refine existing strategies and features using data-driven analysis and competitive positioning frameworks.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* How it Works */}
              <div>
                <h3 className="text-lg font-semibold text-primary mb-3">How It Works</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="w-10 h-10 bg-terracotta/10 text-terracotta rounded-full flex items-center justify-center mx-auto mb-2 font-semibold">1</div>
                    <h4 className="font-medium text-primary mb-1">Select Pathway</h4>
                    <p className="text-secondary text-sm">Choose the strategic approach that best fits your current challenge</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 bg-forest/10 text-forest rounded-full flex items-center justify-center mx-auto mb-2 font-semibold">2</div>
                    <h4 className="font-medium text-primary mb-1">Guided Session</h4>
                    <p className="text-secondary text-sm">Work through structured phases with strategic frameworks and tools</p>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 bg-terracotta/10 text-terracotta rounded-full flex items-center justify-center mx-auto mb-2 font-semibold">3</div>
                    <h4 className="font-medium text-primary mb-1">Actionable Results</h4>
                    <p className="text-secondary text-sm">Get specific next steps and a strategic framework to guide your decisions</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-divider bg-parchment">
              <div className="flex items-center justify-between">
                <div className="text-sm text-secondary">
                  Ready to begin your strategic thinking journey?
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowOnboarding(false)}
                    className="px-4 py-2 text-secondary hover:text-primary transition-colors"
                  >
                    Skip intro
                  </button>
                  <button
                    onClick={() => setShowOnboarding(false)}
                    className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        </ErrorBoundary>
      )}

      <div className={`bmad-interface ${className}`}>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-terracotta rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">BMad Method</h1>
              <p className="text-secondary text-sm">Strategic frameworks for breakthrough thinking</p>
            </div>
          </div>
        </div>

      {/* Enhanced Breadcrumb Navigation */}
      {renderBreadcrumbs()}

      {/* Session Continuation Guidance */}
      {showContinuationGuidance && continuationSessionInfo && (
        <ErrorBoundary
          component="ContinuationGuidance"
          fallback={() => (
            <div className="mb-6 bg-rust/5 rounded-lg border border-rust/20 p-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-rust/50 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-xs">!</span>
                </div>
                <div>
                  <h3 className="font-semibold text-ink mb-2">Session Guidance Unavailable</h3>
                  <p className="text-rust text-sm mb-3">
                    Unable to display session continuation guidance, but your session is still available.
                  </p>
                  <button
                    onClick={() => setShowContinuationGuidance(false)}
                    className="px-4 py-2 bg-rust text-white text-sm rounded-lg hover:bg-rust/80 transition-colors"
                  >
                    Continue Anyway
                  </button>
                </div>
              </div>
            </div>
          )}
        >
        <div className="mb-6 bg-cream rounded-lg border border-terracotta/20 p-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-terracotta rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-primary mb-2">
                Welcome back to your strategic session!
              </h3>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-secondary">Pathway:</span>
                    <span className="font-medium text-primary">{continuationSessionInfo.pathway}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-secondary">Started:</span>
                    <span className="text-primary">{continuationSessionInfo.timeElapsed}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-secondary">Progress:</span>
                    <span className="text-primary font-medium">{continuationSessionInfo.progress}% complete</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-secondary">Last activity:</span>
                    <span className="text-primary">{continuationSessionInfo.lastActivity}</span>
                  </div>
                </div>
              </div>
              <div className="bg-terracotta/10 rounded-lg p-3 mb-4">
                <p className="text-ink text-sm">
                  <strong>💡 Your session is ready to continue.</strong> We&apos;ve saved your progress and you can pick up right where you left off. 
                  The next strategic phase is waiting for your input below.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowContinuationGuidance(false)}
                  className="text-xs text-secondary hover:text-primary transition-colors"
                >
                  Dismiss guidance
                </button>
                <span className="text-divider text-xs">•</span>
                <button
                  onClick={() => {
                    setShowContinuationGuidance(false)
                    handleSessionExit()
                  }}
                  className="text-xs text-secondary hover:text-primary transition-colors"
                >
                  Start fresh session
                </button>
              </div>
            </div>
          </div>
        </div>
        </ErrorBoundary>
      )}

        {/* Main Content */}
        <ErrorBoundary
          component="MainContent"
          fallback={() => (
            <div className="bg-rust/5 rounded-lg border border-rust/20 p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-rust/50 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold">!</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-ink mb-2">Session Unavailable</h2>
                  <p className="text-rust mb-4">
                    There was an error loading the strategic thinking interface. This might be a temporary issue.
                  </p>
                  
                  <div className="space-y-3 mb-4">
                    <h3 className="font-semibold text-ink">What you can do:</h3>
                    <ul className="text-rust text-sm space-y-1 ml-4">
                      <li>• Refresh the page to try again</li>
                      <li>• Check your internet connection</li>
                      <li>• Try again in a few minutes</li>
                    </ul>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-rust text-white rounded-lg hover:bg-rust/80 transition-colors"
                    >
                      Refresh Page
                    </button>
                    <button
                      onClick={() => setCurrentStep('pathway-selection')}
                      className="px-4 py-2 border border-rust/40 text-rust rounded-lg hover:bg-rust/10 transition-colors"
                    >
                      Reset Session
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        >
        <div className={isLoading ? 'opacity-50' : ''}>
          {renderCurrentStep()}
        </div>
        </ErrorBoundary>
      </div>
    </>
  )
}