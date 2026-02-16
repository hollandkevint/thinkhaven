'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { PathwayType, BmadSession } from '@/lib/bmad/types'
import { UniversalSessionState, universalSessionStateManager } from '@/lib/bmad/session/universal-state-manager'
import { pathwaySwitcher, PathwaySwitchRecommendation } from '@/lib/bmad/session/pathway-switcher'
import { sessionAnalyticsEngine } from '@/lib/bmad/analytics/session-analytics'
import PathwaySwitcher from './PathwaySwitcher'
import SessionHistory from './SessionHistory'
import ContextTransfer from './ContextTransfer'

interface UniversalSessionManagerProps {
  sessionId: string
  currentSession: BmadSession
  onSessionStateChange: (state: UniversalSessionState) => void
  onPathwaySwitch: (newPathway: PathwayType) => void
  onError: (error: string) => void
  className?: string
}

export default function UniversalSessionManager({
  sessionId,
  currentSession,
  onSessionStateChange,
  onPathwaySwitch,
  onError,
  className = ''
}: UniversalSessionManagerProps) {
  const [universalState, setUniversalState] = useState<UniversalSessionState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [switchRecommendations, setSwitchRecommendations] = useState<PathwaySwitchRecommendation[]>([])
  const [showPathwaySwitcher, setShowPathwaySwitcher] = useState(false)
  const [showContextTransfer, setShowContextTransfer] = useState(false)
  const [lastBackupTime, setLastBackupTime] = useState<Date | null>(null)

  // Load universal session state
  const loadUniversalState = useCallback(async () => {
    try {
      setIsLoading(true)
      const state = await universalSessionStateManager.loadState(sessionId)
      setUniversalState(state)
      onSessionStateChange(state)

      // Start analytics tracking
      await sessionAnalyticsEngine.startSessionTracking(sessionId, state)

      // Get pathway switch recommendations
      const recommendations = await pathwaySwitcher.analyzePathwaySwitchOpportunities(sessionId, state)
      setSwitchRecommendations(recommendations)

    } catch (error) {
      console.error('Failed to load universal session state:', error)
      onError(`Failed to load session state: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, onSessionStateChange, onError])

  // Save universal state
  const saveUniversalState = useCallback(async (state: UniversalSessionState) => {
    try {
      await universalSessionStateManager.saveState(sessionId, state)
      setLastBackupTime(new Date())
    } catch (error) {
      console.error('Failed to save universal session state:', error)
      onError(`Failed to save session state: ${error}`)
    }
  }, [sessionId, onError])

  // Handle pathway switch
  const handlePathwaySwitch = async (
    newPathway: PathwayType,
    transferContext: boolean = true
  ): Promise<void> => {
    try {
      if (!universalState) return

      const transition = await pathwaySwitcher.executePathwaySwitch(
        sessionId,
        newPathway,
        transferContext,
        true // User confirmed
      )

      // Track the switch in analytics
      await sessionAnalyticsEngine.trackPathwaySwitch(
        sessionId,
        transition.fromPathway || PathwayType.NEW_IDEA,
        transition.toPathway,
        transition.reason
      )

      // Reload state after switch
      await loadUniversalState()
      onPathwaySwitch(newPathway)

      setShowPathwaySwitcher(false)

    } catch (error) {
      console.error('Failed to switch pathway:', error)
      onError(`Failed to switch pathway: ${error}`)
    }
  }

  // Handle manual backup
  const handleManualBackup = async (): Promise<void> => {
    try {
      await universalSessionStateManager.createBackup(sessionId, 'manual_save')
      setLastBackupTime(new Date())
    } catch (error) {
      console.error('Failed to create backup:', error)
      onError(`Failed to create backup: ${error}`)
    }
  }

  // Handle state sync
  const handleStateSync = async (partialUpdate: Partial<UniversalSessionState>): Promise<void> => {
    try {
      await universalSessionStateManager.syncSessionState(sessionId, partialUpdate)

      if (universalState) {
        const updatedState = { ...universalState, ...partialUpdate }
        setUniversalState(updatedState)
        onSessionStateChange(updatedState)
      }
    } catch (error) {
      console.error('Failed to sync session state:', error)
      onError(`Failed to sync session state: ${error}`)
    }
  }

  // Initialize on mount
  useEffect(() => {
    loadUniversalState()
  }, [loadUniversalState])

  // Periodic state synchronization
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (universalState) {
        // Update analytics
        sessionAnalyticsEngine.updateSessionMetrics(sessionId, {
          totalDuration: Date.now() - new Date(currentSession.startTime).getTime(),
          overallCompletion: currentSession.progress.overallCompletion
        })

        // Sync any local changes
        saveUniversalState(universalState)
      }
    }, 30000) // Sync every 30 seconds

    return () => clearInterval(syncInterval)
  }, [universalState, currentSession, sessionId, saveUniversalState])

  if (isLoading || !universalState) {
    return (
      <div className={`universal-session-manager ${className}`}>
        <div className="bg-white rounded-lg border border-divider p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-terracotta/10 rounded-full animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 bg-ink/10 rounded w-48 animate-pulse"></div>
              <div className="h-3 bg-ink/10 rounded w-32 animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-3 bg-ink/10 rounded animate-pulse"></div>
            <div className="h-3 bg-ink/10 rounded w-3/4 animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`universal-session-manager ${className}`}>
      {/* Session State Overview */}
      <div className="bg-white rounded-lg border border-divider p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-primary mb-1">
              Universal Session Management
            </h3>
            <p className="text-secondary text-sm">
              Cross-pathway state management and analytics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleManualBackup}
              className="px-3 py-2 text-sm border border-divider rounded-lg hover:bg-primary/5 transition-colors"
              title="Create manual backup"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </button>
            <button
              onClick={() => setShowPathwaySwitcher(true)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm"
              disabled={switchRecommendations.length === 0}
            >
              Switch Pathway
            </button>
          </div>
        </div>

        {/* State Information */}
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div className="bg-terracotta/5 rounded-lg p-3">
            <div className="text-sm text-terracotta mb-1">Current Pathway</div>
            <div className="font-semibold text-ink">
              {universalState.currentPathway.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </div>
          </div>
          <div className="bg-forest/5 rounded-lg p-3">
            <div className="text-sm text-forest mb-1">Global Progress</div>
            <div className="font-semibold text-ink">
              {Math.round(universalState.globalProgress.overallCompletion)}% Complete
            </div>
          </div>
          <div className="bg-terracotta/5 rounded-lg p-3">
            <div className="text-sm text-terracotta mb-1">Pathway Switches</div>
            <div className="font-semibold text-ink">
              {universalState.analytics.pathwaySwitches} Switches
            </div>
          </div>
        </div>

        {/* Pathway History */}
        {universalState.pathwayHistory.length > 0 && (
          <div className="border-t border-divider pt-4">
            <h4 className="text-sm font-medium text-secondary mb-3">Pathway Journey</h4>
            <div className="flex items-center gap-2 overflow-x-auto">
              {universalState.pathwayHistory.map((transition, index) => (
                <React.Fragment key={index}>
                  {transition.fromPathway && (
                    <div className="flex items-center gap-2 text-sm whitespace-nowrap">
                      <span className="px-2 py-1 bg-parchment rounded text-ink-light">
                        {transition.fromPathway.replace('-', ' ')}
                      </span>
                      <svg className="w-4 h-4 text-slate-blue/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                  {index === universalState.pathwayHistory.length - 1 && (
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm whitespace-nowrap">
                      {transition.toPathway.replace('-', ' ')}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Backup Status */}
        {lastBackupTime && (
          <div className="border-t border-divider pt-4 mt-4">
            <div className="flex items-center gap-2 text-sm text-secondary">
              <svg className="w-4 h-4 text-forest" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              Last backup: {lastBackupTime.toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>

      {/* Pathway Switch Recommendations */}
      {switchRecommendations.length > 0 && !showPathwaySwitcher && (
        <div className="bg-cream rounded-lg border border-terracotta/20 p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-terracotta rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-primary mb-2">Pathway Switch Opportunities</h4>
              <p className="text-secondary text-sm mb-3">
                Based on your current progress and insights, you might benefit from exploring:
              </p>
              <div className="space-y-2">
                {switchRecommendations.slice(0, 2).map((rec, index) => (
                  <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3">
                    <div className="flex-1">
                      <div className="font-medium text-primary mb-1">
                        {rec.recommendedPathway.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      <div className="text-sm text-secondary">{rec.reasoning}</div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className="text-sm font-medium text-terracotta">
                        {Math.round(rec.confidence * 100)}%
                      </span>
                      <button
                        onClick={() => setShowPathwaySwitcher(true)}
                        className="px-3 py-1 bg-terracotta text-white rounded text-sm hover:bg-terracotta transition-colors"
                      >
                        Consider
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pathway Switcher Modal */}
      {showPathwaySwitcher && (
        <PathwaySwitcher
          sessionId={sessionId}
          currentPathway={universalState.currentPathway}
          recommendations={switchRecommendations}
          onSwitch={handlePathwaySwitch}
          onCancel={() => setShowPathwaySwitcher(false)}
        />
      )}

      {/* Context Transfer Display */}
      {showContextTransfer && (
        <ContextTransfer
          sessionId={sessionId}
          universalState={universalState}
          onClose={() => setShowContextTransfer(false)}
        />
      )}

      {/* Session History */}
      <SessionHistory
        sessionId={sessionId}
        universalState={universalState}
        onStateUpdate={handleStateSync}
      />
    </div>
  )
}