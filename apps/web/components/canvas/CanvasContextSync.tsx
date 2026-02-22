/**
 * Canvas Context Synchronization Component
 *
 * Bidirectional sync between canvas and conversation:
 * - AI → Canvas: Parse messages for visual suggestions
 * - Canvas → AI: Share canvas state with conversation context
 */

'use client'

import { useEffect, useCallback, useRef } from 'react'
import { VisualSuggestion } from '@/lib/canvas/visual-suggestion-parser'
import { useCanvasSync } from '@/lib/canvas/useCanvasSync'
import VisualSuggestionIndicator from './VisualSuggestionIndicator'

export interface CanvasState {
  mode: 'draw' | 'diagram'
  diagramCode?: string
  diagramType?: string
  drawingSnapshot?: string // tldraw snapshot JSON
  lastModified: Date
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface CanvasContextSyncProps {
  workspaceId: string
  messages: Message[]
  canvasState: CanvasState | null
  onCanvasUpdate?: (diagramCode: string, type: string) => void
  onContextShare?: (context: string) => void
  onScrollToCanvas?: (suggestionId: string) => void
  autoPopulate?: boolean
  autoDismissDelay?: number // Auto-dismiss notification after N milliseconds
  className?: string
}

/**
 * Main synchronization component
 */
export default function CanvasContextSync({
  workspaceId,
  messages,
  canvasState,
  onCanvasUpdate,
  onContextShare,
  onScrollToCanvas,
  autoPopulate = false,
  autoDismissDelay = 8000, // 8 seconds default
  className = '',
}: CanvasContextSyncProps) {
  const lastProcessedMessageId = useRef<string | null>(null)
  const canvasUpdateDebounce = useRef<NodeJS.Timeout | null>(null)
  const dismissTimeout = useRef<NodeJS.Timeout | null>(null)

  // Canvas sync hook
  const {
    suggestions,
    activeSuggestion,
    autoPopulateEnabled,
    syncEnabled,
    parseMessage,
    applySuggestion,
    dismissSuggestion,
    toggleAutoPopulate,
    toggleSync,
  } = useCanvasSync({
    workspaceId,
    minConfidence: 0.5,
    autoPopulate,
    onSuggestionApplied: handleSuggestionApplied,
  })

  /**
   * DIRECTION 1: AI → Canvas
   * Parse new assistant messages for visual suggestions
   */
  useEffect(() => {
    if (!syncEnabled || messages.length === 0) return

    // Get the latest message
    const latestMessage = messages[messages.length - 1]

    // Only process if:
    // 1. It's a new message (different from last processed)
    // 2. It's from the assistant
    if (
      latestMessage.id !== lastProcessedMessageId.current &&
      latestMessage.role === 'assistant'
    ) {
      parseMessage(latestMessage.id, latestMessage.content, latestMessage.role)
      lastProcessedMessageId.current = latestMessage.id
    }
  }, [messages, syncEnabled, parseMessage])

  /**
   * DIRECTION 2: Canvas → AI
   * Share canvas state changes with conversation context
   */
  useEffect(() => {
    if (!syncEnabled || !canvasState || !onContextShare) return

    // Debounce canvas updates (only share every 5 seconds)
    if (canvasUpdateDebounce.current) {
      clearTimeout(canvasUpdateDebounce.current)
    }

    canvasUpdateDebounce.current = setTimeout(() => {
      const context = buildCanvasContext(canvasState)
      onContextShare(context)
    }, 5000)

    return () => {
      if (canvasUpdateDebounce.current) {
        clearTimeout(canvasUpdateDebounce.current)
      }
    }
  }, [canvasState, syncEnabled, onContextShare])

  /**
   * Auto-dismiss success notification after delay
   */
  useEffect(() => {
    if (activeSuggestion && autoDismissDelay > 0) {
      // Clear any existing timeout
      if (dismissTimeout.current) {
        clearTimeout(dismissTimeout.current)
      }

      // Set new timeout to dismiss
      dismissTimeout.current = setTimeout(() => {
        // Find the suggestion ID and dismiss it
        if (activeSuggestion.id) {
          dismissSuggestion(activeSuggestion.id)
        }
      }, autoDismissDelay)

      return () => {
        if (dismissTimeout.current) {
          clearTimeout(dismissTimeout.current)
        }
      }
    }
  }, [activeSuggestion, autoDismissDelay, dismissSuggestion])

  /**
   * Handle suggestion application
   */
  function handleSuggestionApplied(suggestion: VisualSuggestion) {
    if (suggestion.diagramCode && onCanvasUpdate) {
      onCanvasUpdate(suggestion.diagramCode, suggestion.type)
    }
  }

  /**
   * Handle apply button click
   */
  const handleApply = useCallback(
    (suggestionId: string) => {
      applySuggestion(suggestionId)
    },
    [applySuggestion]
  )

  /**
   * Handle dismiss button click
   */
  const handleDismiss = useCallback(
    (suggestionId: string) => {
      dismissSuggestion(suggestionId)
    },
    [dismissSuggestion]
  )

  return (
    <div className={`canvas-context-sync ${className}`}>
      {/* Sync Controls */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              syncEnabled ? 'bg-forest' : 'bg-slate-blue'
            }`}
            title={syncEnabled ? 'Sync enabled' : 'Sync disabled'}
          />
          <span className="text-xs text-secondary">
            Canvas Sync {syncEnabled ? 'On' : 'Off'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto-populate toggle */}
          <button
            onClick={toggleAutoPopulate}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              autoPopulateEnabled
                ? 'bg-terracotta/10 text-terracotta hover:bg-terracotta/20'
                : 'bg-parchment text-ink-light hover:bg-cream'
            }`}
            title="Auto-apply high-confidence suggestions"
          >
            ✨ Auto-apply
          </button>

          {/* Sync toggle */}
          <button
            onClick={toggleSync}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              syncEnabled
                ? 'bg-forest/10 text-forest hover:bg-forest/20'
                : 'bg-parchment text-ink-light hover:bg-cream'
            }`}
            title="Toggle canvas synchronization"
          >
            {syncEnabled ? '🔗 Synced' : '🔌 Sync Off'}
          </button>
        </div>
      </div>

      {/* Visual Suggestions */}
      {suggestions.length > 0 && (
        <VisualSuggestionIndicator
          suggestions={suggestions}
          onApply={handleApply}
          onDismiss={handleDismiss}
        />
      )}

      {/* Active Suggestion Indicator - Enhanced */}
      {activeSuggestion && (
        <div className="mt-2 p-3 bg-forest/5 border-l-4 border-forest rounded shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium text-forest">
                <span className="flex-shrink-0">✅</span>
                <span className="truncate">Added to Canvas</span>
              </div>
              <div className="mt-1 text-xs text-forest leading-relaxed">
                "{activeSuggestion.title}" was added to your canvas workspace
              </div>
              <div className="mt-1 text-xs text-forest">
                Type: {activeSuggestion.type.replace('-', ' ')} •
                Confidence: {Math.round(activeSuggestion.confidence * 100)}%
              </div>
            </div>
            <button
              onClick={() => {
                if (onScrollToCanvas) {
                  onScrollToCanvas(activeSuggestion.id);
                }
              }}
              className="flex-shrink-0 px-3 py-1.5 bg-forest hover:bg-forest/90 text-white text-xs font-medium rounded-md transition-colors shadow-sm hover:shadow"
              title="Scroll to and highlight the canvas element"
            >
              View on Canvas →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Build canvas context string for AI
 */
function buildCanvasContext(canvasState: CanvasState): string {
  const parts: string[] = []

  // Mode
  parts.push(`Canvas Mode: ${canvasState.mode}`)

  // Diagram info
  if (canvasState.mode === 'diagram' && canvasState.diagramCode) {
    parts.push(`Diagram Type: ${canvasState.diagramType || 'unknown'}`)
    parts.push(`Diagram Code:\n\`\`\`mermaid\n${canvasState.diagramCode}\n\`\`\``)
  }

  // Drawing info
  if (canvasState.mode === 'draw' && canvasState.drawingSnapshot) {
    const snapshot = JSON.parse(canvasState.drawingSnapshot)
    const shapeCount = snapshot.shapes?.length || 0
    parts.push(`Drawing Elements: ${shapeCount} shapes`)
  }

  // Last modified
  parts.push(`Last Modified: ${canvasState.lastModified.toLocaleString()}`)

  return parts.join('\n')
}

/**
 * Lightweight version for inline display
 */
export function CanvasSyncIndicator({ syncEnabled }: { syncEnabled: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-secondary">
      <div
        className={`w-1.5 h-1.5 rounded-full ${
          syncEnabled ? 'bg-forest animate-pulse' : 'bg-slate-blue'
        }`}
      />
      <span>{syncEnabled ? 'Canvas synced' : 'Canvas sync off'}</span>
    </div>
  )
}
