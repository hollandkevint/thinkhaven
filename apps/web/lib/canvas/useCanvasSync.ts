/**
 * Canvas Synchronization Hook
 *
 * Connects conversation messages to canvas workspace
 * Provides bidirectional sync between AI responses and visual diagrams
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  VisualSuggestionParser,
  VisualSuggestion,
  filterByConfidence,
} from './visual-suggestion-parser'

export interface CanvasSyncState {
  suggestions: VisualSuggestion[]
  activeSuggestion: VisualSuggestion | null
  autoPopulateEnabled: boolean
  syncEnabled: boolean
}

export interface CanvasSyncHookReturn {
  // State
  suggestions: VisualSuggestion[]
  activeSuggestion: VisualSuggestion | null
  autoPopulateEnabled: boolean
  syncEnabled: boolean

  // Actions
  parseMessage: (messageId: string, content: string, role: 'user' | 'assistant') => void
  applySuggestion: (suggestionId: string) => void
  dismissSuggestion: (suggestionId: string) => void
  clearSuggestions: () => void
  toggleAutoPopulate: () => void
  toggleSync: () => void

  // Analytics
  totalSuggestions: number
  appliedCount: number
  dismissedCount: number
}

export interface UseCanvasSyncOptions {
  workspaceId: string
  minConfidence?: number // Minimum confidence threshold (default: 0.5)
  autoPopulate?: boolean // Auto-apply high-confidence suggestions (default: false)
  onSuggestionApplied?: (suggestion: VisualSuggestion) => void
  onSuggestionDismissed?: (suggestionId: string) => void
}

/**
 * Hook for canvas-conversation synchronization
 */
export function useCanvasSync(options: UseCanvasSyncOptions): CanvasSyncHookReturn {
  const {
    workspaceId,
    minConfidence = 0.5,
    autoPopulate = false,
    onSuggestionApplied,
    onSuggestionDismissed,
  } = options

  // State
  const [suggestions, setSuggestions] = useState<VisualSuggestion[]>([])
  const [activeSuggestion, setActiveSuggestion] = useState<VisualSuggestion | null>(null)
  const [autoPopulateEnabled, setAutoPopulateEnabled] = useState(autoPopulate)
  const [syncEnabled, setSyncEnabled] = useState(true)
  const [appliedCount, setAppliedCount] = useState(0)
  const [dismissedCount, setDismissedCount] = useState(0)

  // Track processed messages to avoid duplicates
  const processedMessages = useRef(new Set<string>())

  /**
   * Apply a suggestion to the canvas
   */
  const applySuggestion = useCallback(
    (suggestionId: string) => {
      const suggestion = suggestions.find(s => s.id === suggestionId)

      if (suggestion) {
        setActiveSuggestion(suggestion)
        setAppliedCount(prev => prev + 1)

        // Remove from suggestions list
        setSuggestions(prev => prev.filter(s => s.id !== suggestionId))

        // Callback
        onSuggestionApplied?.(suggestion)
      }
    },
    [suggestions, onSuggestionApplied]
  )

  /**
   * Parse a message and extract visual suggestions
   */
  const parseMessage = useCallback(
    (messageId: string, content: string, role: 'user' | 'assistant') => {
      // Skip if sync disabled or already processed
      if (!syncEnabled || processedMessages.current.has(messageId)) {
        return
      }

      // Mark as processed
      processedMessages.current.add(messageId)

      // Parse message
      const result = VisualSuggestionParser.parseMessage(messageId, content, role)

      if (result.hasVisualContent) {
        // Filter by confidence
        const filteredSuggestions = filterByConfidence(result.suggestions, minConfidence)

        if (filteredSuggestions.length > 0) {
          setSuggestions(prev => [...prev, ...filteredSuggestions])

          // Auto-apply high-confidence suggestions
          if (autoPopulateEnabled) {
            const highConfidenceSuggestions = filteredSuggestions.filter(s => s.confidence >= 0.8)

            if (highConfidenceSuggestions.length > 0) {
              // Apply the first high-confidence suggestion
              const suggestionToApply = highConfidenceSuggestions[0]
              applySuggestion(suggestionToApply.id)
            }
          }
        }
      }
    },
    [syncEnabled, minConfidence, autoPopulateEnabled, applySuggestion]
  )

  /**
   * Dismiss a suggestion
   */
  const dismissSuggestion = useCallback(
    (suggestionId: string) => {
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId))
      setDismissedCount(prev => prev + 1)

      // Callback
      onSuggestionDismissed?.(suggestionId)
    },
    [onSuggestionDismissed]
  )

  /**
   * Clear all suggestions
   */
  const clearSuggestions = useCallback(() => {
    setSuggestions([])
    setActiveSuggestion(null)
  }, [])

  /**
   * Toggle auto-populate
   */
  const toggleAutoPopulate = useCallback(() => {
    setAutoPopulateEnabled(prev => !prev)
  }, [])

  /**
   * Toggle sync enabled
   */
  const toggleSync = useCallback(() => {
    setSyncEnabled(prev => !prev)
  }, [])

  // Persist state to localStorage
  useEffect(() => {
    const key = `canvas-sync-${workspaceId}`
    const state = {
      autoPopulateEnabled,
      syncEnabled,
    }
    localStorage.setItem(key, JSON.stringify(state))
  }, [workspaceId, autoPopulateEnabled, syncEnabled])

  // Restore state from localStorage on mount
  useEffect(() => {
    const key = `canvas-sync-${workspaceId}`
    const stored = localStorage.getItem(key)

    if (stored) {
      try {
        const state = JSON.parse(stored)
        setAutoPopulateEnabled(state.autoPopulateEnabled ?? autoPopulate)
        setSyncEnabled(state.syncEnabled ?? true)
      } catch (e) {
        console.error('Failed to restore canvas sync state:', e)
      }
    }
  }, [workspaceId, autoPopulate])

  return {
    // State
    suggestions,
    activeSuggestion,
    autoPopulateEnabled,
    syncEnabled,

    // Actions
    parseMessage,
    applySuggestion,
    dismissSuggestion,
    clearSuggestions,
    toggleAutoPopulate,
    toggleSync,

    // Analytics
    totalSuggestions: suggestions.length,
    appliedCount,
    dismissedCount,
  }
}

/**
 * Extract diagram code from suggestion
 */
export function extractDiagramCode(suggestion: VisualSuggestion): string | null {
  return suggestion.diagramCode || null
}

/**
 * Check if suggestion is high confidence
 */
export function isHighConfidence(suggestion: VisualSuggestion, threshold: number = 0.8): boolean {
  return suggestion.confidence >= threshold
}
