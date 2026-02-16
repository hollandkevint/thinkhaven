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

export default function SessionManager({
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
  // const [isAdvancing, setIsAdvancing] = useState(false) // Future feature
  
  // Timer effect
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
      }, 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [session, isPaused])

  const handlePause = () => {
    setIsPaused(true)
    onPause?.()
  }

  const handleResume = () => {
    setIsPaused(false)
    onResume?.()
  }

  const handleExit = () => {
    if (window.confirm('Are you sure you want to exit this session? Your progress will be saved.')) {
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

  return (
    <div className={`bg-white rounded-lg border border-divider ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-divider">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-primary">
              {getPathwayName(session.pathway)}
            </h3>
            <p className="text-sm text-secondary">Session ID: {session.id.slice(-8)}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(session.metadata.status)}`}>
              {isPaused ? 'Paused' : session.metadata.status.charAt(0).toUpperCase() + session.metadata.status.slice(1)}
            </span>
            
            <div className="text-right">
              <div className="text-sm font-medium text-foreground">
                {formatTime(timeElapsed)}
              </div>
              <div className="text-xs text-secondary">Total Time</div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="p-4">
        {/* Overall Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-primary">Overall Progress</span>
            <span className="text-secondary">{Math.round(session.progress.overallCompletion)}%</span>
          </div>
          <div className="w-full bg-ink/10 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${session.progress.overallCompletion}%` }}
            ></div>
          </div>
        </div>

        {/* Current Phase Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-terracotta/5 p-3 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-ink">Current Phase</h4>
              <span className="text-xs text-terracotta">{Math.round(phaseProgress)}%</span>
            </div>
            <p className="text-ink text-sm mb-2">
              {session.currentPhase.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </p>
            <div className="w-full bg-terracotta/20 rounded-full h-1.5">
              <div 
                className="bg-terracotta h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${phaseProgress}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-forest/5 p-3 rounded-lg">
            <h4 className="font-medium text-ink mb-2">Phase Time</h4>
            <div className="flex justify-between text-sm">
              <div>
                <div className="text-forest font-medium">{formatTime(currentPhaseTime)}</div>
                <div className="text-forest text-xs">Elapsed</div>
              </div>
              {currentAllocation && (
                <div className="text-right">
                  <div className="text-forest font-medium">
                    {currentAllocation.allocatedMinutes}m
                  </div>
                  <div className="text-forest text-xs">Allocated</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Next Steps */}
        {session.progress.nextSteps.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-primary mb-2">Next Steps</h4>
            <div className="space-y-1">
              {session.progress.nextSteps.slice(0, 3).map((step, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
                  <span className="text-secondary">{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Step Indicator */}
        <div className="bg-parchment p-3 rounded-lg mb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-primary">Current Step</span>
          </div>
          <p className="text-sm text-secondary">{session.progress.currentStep}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 border-t border-divider">
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            {session.metadata.status === 'active' && !isPaused && (
              <button
                onClick={handlePause}
                className="px-3 py-2 text-sm border border-warning text-warning rounded-lg hover:bg-warning/5 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                  </svg>
                  Pause
                </div>
              </button>
            )}
            
            {isPaused && (
              <button
                onClick={handleResume}
                className="px-3 py-2 text-sm border border-success text-success rounded-lg hover:bg-success/5 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  Resume
                </div>
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExit}
              className="px-3 py-2 text-sm border border-error text-error rounded-lg hover:bg-error/5 transition-colors"
            >
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Exit Session
              </div>
            </button>

            {session.metadata.status === 'completed' && (
              <button className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors">
                View Results
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}