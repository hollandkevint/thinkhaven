'use client'

import { useState, useEffect } from 'react'
import { BmadSession, PathwayType } from '@/lib/bmad/types'

interface SessionManagerProps {
  session: BmadSession
  onPause?: () => void
  onResume?: () => void
  onExit?: () => void
  onAdvance?: (userInput: string) => void
  className?: string
}

interface SessionHistoryEntry {
  timestamp: Date
  action: string
  phase: string
  progress: number
}

interface PhaseInfo {
  title: string
  description: string
  color: string
}

export default function EnhancedSessionManager({
  session,
  onPause,
  onResume,
  onExit,
  onAdvance: _onAdvance,
  className = ''
}: SessionManagerProps) {
  const [isPaused, setIsPaused] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [currentPhaseTime, setCurrentPhaseTime] = useState(0)
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(0)
  const [showProgressDetails, setShowProgressDetails] = useState(false)
  const [showSessionHistory, setShowSessionHistory] = useState(false)
  const [sessionHistory, setSessionHistory] = useState<SessionHistoryEntry[]>([])
  
  // Timer effect with enhanced tracking
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (session.metadata.status === 'active' && !isPaused) {
      interval = setInterval(() => {
        const now = new Date()
        const elapsed = Math.floor((now.getTime() - new Date(session.startTime).getTime()) / 1000)
        setTimeElapsed(elapsed)
        
        // Calculate current phase time
        const currentAllocation = session.timeAllocations.find(
          allocation => allocation.phaseId === session.currentPhase
        )
        if (currentAllocation?.startTime) {
          const phaseElapsed = Math.floor((now.getTime() - new Date(currentAllocation.startTime).getTime()) / 1000)
          setCurrentPhaseTime(phaseElapsed)
        }
        
        // Update estimated time remaining
        const estimated = calculateEstimatedTimeRemaining()
        setEstimatedTimeRemaining(estimated)
      }, 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [session, isPaused])

  // Track session state changes for history
  useEffect(() => {
    if (session.metadata.status === 'active') {
      addToSessionHistory('Session activity')
    }
  }, [session.currentPhase, session.progress.overallCompletion])

  const addToSessionHistory = (action: string) => {
    const historyEntry: SessionHistoryEntry = {
      timestamp: new Date(),
      action,
      phase: session.currentPhase,
      progress: session.progress.overallCompletion
    }
    setSessionHistory(prev => [...prev.slice(-9), historyEntry]) // Keep last 10 entries
  }

  const handlePause = () => {
    setIsPaused(true)
    addToSessionHistory('Session paused')
    onPause?.()
  }

  const handleResume = () => {
    setIsPaused(false)
    addToSessionHistory('Session resumed')
    onResume?.()
  }

  const handleExit = () => {
    if (window.confirm('Are you sure you want to exit this session? Your progress will be saved.')) {
      addToSessionHistory('Session exited')
      onExit?.()
    }
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getPathwayName = (pathway: PathwayType): string => {
    switch (pathway) {
      case PathwayType.NEW_IDEA:
        return 'New Idea Development'
      case PathwayType.BUSINESS_MODEL:
        return 'Business Model Analysis'
      case PathwayType.STRATEGIC_OPTIMIZATION:
        return 'Strategic Optimization'
      default:
        return 'BMad Session'
    }
  }

  const getPhaseDescription = (phaseId: string): PhaseInfo => {
    const phaseMap: Record<string, PhaseInfo> = {
      'foundation': {
        title: 'Foundation Setting',
        description: 'Establishing core context and strategic objectives',
        color: 'blue'
      },
      'discovery': {
        title: 'Discovery & Research',
        description: 'Gathering insights and analyzing market conditions',
        color: 'green'
      },
      'ideation': {
        title: 'Ideation & Generation',
        description: 'Creating and exploring strategic options',
        color: 'purple'
      },
      'analysis': {
        title: 'Analysis & Evaluation', 
        description: 'Analyzing feasibility and strategic alignment',
        color: 'orange'
      },
      'validation': {
        title: 'Validation & Testing',
        description: 'Testing assumptions and validating approaches',
        color: 'red'
      },
      'planning': {
        title: 'Planning & Structure',
        description: 'Developing concrete implementation plans',
        color: 'indigo'
      },
      'synthesis': {
        title: 'Synthesis & Integration',
        description: 'Combining insights into coherent strategy',
        color: 'teal'
      },
      'execution': {
        title: 'Execution Planning',
        description: 'Preparing actionable next steps and timelines',
        color: 'emerald'
      }
    }
    
    return phaseMap[phaseId] || {
      title: phaseId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: 'Strategic thinking phase in progress',
      color: 'gray'
    }
  }

  const calculateEstimatedTimeRemaining = (): number => {
    const totalAllocated = session.timeAllocations.reduce((sum, allocation) => sum + allocation.allocatedMinutes, 0)
    const progressRatio = session.progress.overallCompletion / 100
    const expectedTimeUsed = totalAllocated * progressRatio
    const actualTimeUsed = timeElapsed / 60 // Convert seconds to minutes
    
    // If we're moving faster than expected, use the faster pace
    const remainingProgress = 1 - progressRatio
    const timePerProgress = actualTimeUsed / progressRatio || totalAllocated / 100
    
    return Math.max(0, Math.round(remainingProgress * timePerProgress))
  }

  const getProgressPhases = (): Array<{ 
    id: string
    title: string
    progress: number
    isActive: boolean
    color: string
    description: string
  }> => {
    return session.timeAllocations.map((allocation, index) => {
      const phaseInfo = getPhaseDescription(allocation.phaseId)
      const progress = session.progress.phaseCompletion[allocation.phaseId] || 0
      const isActive = allocation.phaseId === session.currentPhase
      
      return {
        id: allocation.phaseId,
        title: phaseInfo.title,
        description: phaseInfo.description,
        progress,
        isActive,
        color: phaseInfo.color
      }
    })
  }

  const getCurrentPhaseAllocation = () => {
    return session.timeAllocations.find(
      allocation => allocation.phaseId === session.currentPhase
    )
  }

  const getCurrentPhaseProgress = (): number => {
    const currentPhaseCompletion = session.progress.phaseCompletion[session.currentPhase]
    return currentPhaseCompletion || 0
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'text-success bg-success/10 border-success/20'
      case 'paused':
        return 'text-warning bg-warning/10 border-warning/20'
      case 'completed':
        return 'text-primary bg-primary/10 border-primary/20'
      case 'abandoned':
        return 'text-error bg-error/10 border-error/20'
      default:
        return 'text-secondary bg-secondary/10 border-secondary/20'
    }
  }

  const currentAllocation = getCurrentPhaseAllocation()
  const phaseProgress = getCurrentPhaseProgress()
  const currentPhaseInfo = getPhaseDescription(session.currentPhase)
  const progressPhases = getProgressPhases()

  return (
    <div className={`bg-white rounded-lg border border-divider shadow-sm ${className}`}>
      {/* Enhanced Header */}
      <div className="p-6 border-b border-divider">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-terracotta rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-primary">
                {getPathwayName(session.pathway)}
              </h3>
              <p className="text-sm text-secondary">Session ID: {session.id.slice(-8)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 text-sm rounded-full border ${getStatusColor(session.metadata.status)}`}>
              {isPaused ? 'Paused' : session.metadata.status.charAt(0).toUpperCase() + session.metadata.status.slice(1)}
            </span>
            
            <div className="text-right">
              <div className="text-lg font-bold text-foreground">
                {formatTime(timeElapsed)}
              </div>
              <div className="text-xs text-secondary">Total Time</div>
            </div>
          </div>
        </div>

        {/* Overall Progress with Enhanced Details */}
        <div className="mb-4">
          <div className="flex justify-between items-center text-sm mb-2">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-primary">Session Progress</span>
              <button
                onClick={() => setShowProgressDetails(!showProgressDetails)}
                className="text-xs text-secondary hover:text-primary transition-colors px-2 py-1 rounded border"
              >
                {showProgressDetails ? 'Hide details' : 'Show details'}
              </button>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-primary">{Math.round(session.progress.overallCompletion)}%</div>
              <div className="text-xs text-secondary">
                ~{estimatedTimeRemaining}m remaining
              </div>
            </div>
          </div>
          
          {/* Enhanced Progress Bar */}
          <div className="relative mb-2">
            <div className="w-full bg-ink/10 rounded-full h-4 shadow-inner">
              <div 
                className="bg-terracotta h-4 rounded-full transition-all duration-700 relative overflow-hidden"
                style={{ width: `${session.progress.overallCompletion}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white text-xs font-medium">
                  {session.progress.overallCompletion > 15 ? `${Math.round(session.progress.overallCompletion)}%` : ''}
                </div>
              </div>
            </div>
            
            {/* Progress Milestones */}
            <div className="flex justify-between text-xs text-slate-blue/60 mt-1">
              <span>Start</span>
              <span>Quarter</span>
              <span>Half</span>
              <span>Three-quarters</span>
              <span>Complete</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Enhanced Current Phase Info */}
        <div className="bg-cream border border-terracotta/20 p-5 rounded-lg">
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-12 h-12 bg-gradient-to-br from-terracotta to-terracotta rounded-full flex items-center justify-center flex-shrink-0 shadow-lg`}>
              <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-lg font-semibold text-primary">
                  {currentPhaseInfo.title}
                </h4>
                <span className="text-sm font-semibold px-3 py-1 bg-white/80 rounded-full border">
                  {Math.round(phaseProgress)}% complete
                </span>
              </div>
              <p className="text-secondary text-sm mb-4 leading-relaxed">
                {currentPhaseInfo.description}
              </p>
              
              {/* Phase Progress Bar */}
              <div className="mb-4">
                <div className="w-full bg-white/60 rounded-full h-3 shadow-inner">
                  <div 
                    className={`bg-gradient-to-r from-terracotta to-terracotta h-3 rounded-full transition-all duration-500 shadow-sm`}
                    style={{ width: `${phaseProgress}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Time Information Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="bg-white/60 p-3 rounded-lg text-center">
                  <div className="font-bold text-lg text-primary">{formatTime(currentPhaseTime)}</div>
                  <div className="text-secondary text-xs">Phase Time</div>
                </div>
                {currentAllocation && (
                  <div className="bg-white/60 p-3 rounded-lg text-center">
                    <div className="font-bold text-lg text-primary">{currentAllocation.allocatedMinutes}m</div>
                    <div className="text-secondary text-xs">Allocated</div>
                  </div>
                )}
                <div className="bg-white/60 p-3 rounded-lg text-center">
                  <div className="font-bold text-lg text-primary">{formatTime(timeElapsed)}</div>
                  <div className="text-secondary text-xs">Total Time</div>
                </div>
                <div className="bg-white/60 p-3 rounded-lg text-center">
                  <div className="font-bold text-lg text-primary">~{estimatedTimeRemaining}m</div>
                  <div className="text-secondary text-xs">Est. Remaining</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Progress View */}
        {showProgressDetails && (
          <div className="bg-parchment border border-ink/8 p-5 rounded-lg">
            <h4 className="font-semibold text-primary text-lg mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Phase-by-Phase Progress
            </h4>
            <div className="space-y-4">
              {progressPhases.map((phase, index) => (
                <div key={phase.id} className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                  phase.isActive ? 'bg-white shadow-md border-l-4 border-terracotta' : 'bg-white/50'
                }`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                    phase.isActive 
                      ? 'bg-terracotta text-white animate-pulse' 
                      : phase.progress === 100 
                        ? `bg-forest text-white` 
                        : phase.progress > 0
                          ? `bg-terracotta/10 text-terracotta border border-terracotta/20`
                          : 'bg-parchment text-slate-blue/60 border border-ink/8'
                  }`}>
                    {phase.isActive ? '▶' : phase.progress === 100 ? '✓' : index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className={`font-semibold ${
                          phase.isActive ? 'text-primary' : 'text-secondary'
                        }`}>
                          {phase.title}
                        </span>
                        {phase.isActive && (
                          <span className="ml-2 text-xs px-2 py-1 bg-terracotta/10 text-terracotta rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-primary">{Math.round(phase.progress)}%</span>
                    </div>
                    <p className="text-xs text-secondary mb-2">{phase.description}</p>
                    <div className="w-full bg-ink/10 rounded-full h-2">
                      <div 
                        className={`bg-gradient-to-r from-terracotta to-terracotta h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${phase.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Next Steps and Session Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Next Steps */}
          {session.progress.nextSteps.length > 0 && (
            <div className="bg-mustard/5 border border-mustard/20 p-5 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-mustard rounded-full flex items-center justify-center shadow-sm">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <h4 className="font-semibold text-ink">Strategic Next Steps</h4>
              </div>
              <div className="space-y-3">
                {session.progress.nextSteps.slice(0, 4).map((step, index) => (
                  <div key={index} className="flex items-start gap-3 text-sm">
                    <div className="w-6 h-6 bg-white text-mustard rounded-full flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0 shadow-sm">
                      {index + 1}
                    </div>
                    <span className="text-ink leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Session Summary */}
          <div className="bg-cream border border-terracotta/20 p-5 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-terracotta rounded-full flex items-center justify-center shadow-sm">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h4 className="font-semibold text-ink">Session Summary</h4>
            </div>
            <div className="space-y-3 text-sm text-terracotta">
              <div className="flex justify-between items-center py-2 border-b border-terracotta/20/50">
                <span>Pathway:</span>
                <span className="font-semibold">{getPathwayName(session.pathway)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-terracotta/20/50">
                <span>Phases completed:</span>
                <span className="font-semibold">
                  {Object.values(session.progress.phaseCompletion).filter(p => p === 100).length} of {session.timeAllocations.length}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-terracotta/20/50">
                <span>Time efficiency:</span>
                <span className="font-semibold">
                  {timeElapsed > 0 ? Math.round((session.progress.overallCompletion / (timeElapsed / 60)) * 10) / 10 : 0}%/min
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span>Current focus:</span>
                <span className="font-semibold text-sm">{session.progress.currentStep}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Session History */}
        <div>
          <button
            onClick={() => setShowSessionHistory(!showSessionHistory)}
            className="w-full bg-parchment hover:bg-parchment transition-colors p-4 rounded-lg border border-ink/8 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-slate-blue" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
              </svg>
              <span className="font-medium text-primary">Session Activity History</span>
              {sessionHistory.length > 0 && (
                <span className="text-xs bg-terracotta/10 text-terracotta px-2 py-1 rounded-full">
                  {sessionHistory.length} entries
                </span>
              )}
            </div>
            <svg 
              className={`w-5 h-5 text-slate-blue/60 transition-transform ${
                showSessionHistory ? 'rotate-180' : ''
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showSessionHistory && sessionHistory.length > 0 && (
            <div className="mt-4 bg-white border border-ink/8 rounded-lg p-4">
              <h5 className="font-medium text-primary mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Recent Activity
              </h5>
              <div className="space-y-3 max-h-40 overflow-y-auto">
                {sessionHistory.slice(-8).reverse().map((entry, index) => (
                  <div key={index} className="flex items-center gap-4 text-sm p-3 bg-parchment rounded-lg">
                    <div className="w-3 h-3 bg-terracotta rounded-full flex-shrink-0"></div>
                    <div className="flex-1">
                      <span className="text-primary font-medium">{entry.action}</span>
                      <span className="text-slate-blue ml-3">
                        in {getPhaseDescription(entry.phase).title}
                      </span>
                    </div>
                    <div className="text-right text-xs text-slate-blue/60">
                      <div>{entry.progress.toFixed(0)}% complete</div>
                      <div>{entry.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Controls */}
      <div className="p-6 border-t border-divider bg-parchment">
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-3">
            {session.metadata.status === 'active' && !isPaused && (
              <button
                onClick={handlePause}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-warning text-warning rounded-lg hover:bg-warning/5 transition-all duration-200 font-medium"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
                Pause Session
              </button>
            )}
            
            {isPaused && (
              <button
                onClick={handleResume}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-success text-success rounded-lg hover:bg-success/5 transition-all duration-200 font-medium"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Resume Session
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleExit}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-error text-error rounded-lg hover:bg-error/5 transition-all duration-200 font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Exit Session
            </button>

            {session.metadata.status === 'completed' && (
              <button className="flex items-center gap-2 px-6 py-2 text-sm bg-gradient-to-r from-primary to-primary-hover text-white rounded-lg hover:shadow-md transition-all duration-200 font-medium">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                View Results
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}