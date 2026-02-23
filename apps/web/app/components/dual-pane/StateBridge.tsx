'use client'

import { useEffect, useRef } from 'react'
import { useDualPaneStore } from '../../../lib/stores/dualPaneStore'

interface StateBridgeProps {
  workspaceId: string
  className?: string
}

export default function StateBridge({ workspaceId, className = '' }: StateBridgeProps) {
  const { 
    sync, 
    chat, 
    canvas,
    syncChatToCanvas, 
    syncCanvasToChat,
    createContextBridge
  } = useDualPaneStore()
  
  const lastUpdateRef = useRef(sync.lastUpdate)
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Debounced sync handler to prevent excessive operations
  const debouncedSync = (callback: () => void) => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }
    
    syncTimeoutRef.current = setTimeout(callback, 500) // 500ms debounce
  }
  
  // Monitor chat changes and suggest canvas elements
  useEffect(() => {
    if (!sync.isAutoSyncEnabled) return
    
    if (sync.lastUpdate > lastUpdateRef.current) {
      debouncedSync(() => {
        // Find new messages that might need canvas suggestions
        const recentMessages = chat.messages.filter(msg => 
          new Date(msg.timestamp).getTime() > lastUpdateRef.current &&
          msg.role === 'user'
        )
        
        recentMessages.forEach(message => {
          // Check if this message already has associated canvas elements
          const existingBridges = sync.contextBridges.filter(
            bridge => bridge.chatMessageId === message.id
          )
          
          if (existingBridges.length === 0) {
            syncChatToCanvas(message.id)
          }
        })
      })
      
      lastUpdateRef.current = sync.lastUpdate
    }
  }, [sync.lastUpdate, sync.isAutoSyncEnabled, chat.messages, sync.contextBridges, syncChatToCanvas])
  
  // Monitor canvas changes and update chat context
  useEffect(() => {
    const newElements = canvas.elements.filter(element => 
      !sync.contextBridges.some(bridge => bridge.canvasElementId === element.id)
    )
    
    if (newElements.length > 0 && sync.isAutoSyncEnabled) {
      debouncedSync(() => {
        newElements.forEach(element => {
          if (element.sourceMessage) {
            createContextBridge(element.sourceMessage, element.id, 'generated')
          }
        })
      })
    }
  }, [canvas.elements, sync.contextBridges, sync.isAutoSyncEnabled, createContextBridge])
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [])
  
  // Sync status indicator (for debugging/development)
  const getSyncStatus = () => {
    if (!sync.isAutoSyncEnabled) return 'disabled'
    if (syncTimeoutRef.current) return 'syncing'
    return 'active'
  }
  
  return (
    <div className={`state-bridge ${className}`}>
      {/* Sync Status Indicator (hidden in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="sync-indicator">
          <div className="flex items-center gap-2 text-xs text-muted-foreground p-2">
            <div className={`w-2 h-2 rounded-full ${
              getSyncStatus() === 'active' ? 'bg-success' :
              getSyncStatus() === 'syncing' ? 'bg-warning animate-pulse' :
              'bg-error'
            }`} />
            <span>Sync: {getSyncStatus()}</span>
            <span>•</span>
            <span>Bridges: {sync.contextBridges.length}</span>
            <span>•</span>
            <span>Messages: {chat.messages.length}</span>
            <span>•</span>
            <span>Elements: {canvas.elements.length}</span>
          </div>
        </div>
      )}
      
      {/* Context Bridge Visualizations (development only) */}
      {process.env.NODE_ENV === 'development' && sync.contextBridges.length > 0 && (
        <details className="mt-2 text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-primary">
            Context Bridges ({sync.contextBridges.length})
          </summary>
          <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
            {sync.contextBridges.map(bridge => {
              const message = chat.messages.find(m => m.id === bridge.chatMessageId)
              const element = canvas.elements.find(e => e.id === bridge.canvasElementId)
              
              return (
                <div key={bridge.id} className="flex items-center gap-2 p-1 bg-primary/5 rounded text-xs">
                  <span className={`px-1 py-0.5 rounded text-xs ${
                    bridge.bridgeType === 'suggestion' ? 'bg-slate-blue/10 text-slate-blue' :
                    bridge.bridgeType === 'generated' ? 'bg-forest/10 text-forest' :
                    'bg-ink/10 text-ink'
                  }`}>
                    {bridge.bridgeType}
                  </span>
                  <span title={message?.content}>
                    {message?.content.slice(0, 20)}...
                  </span>
                  <span>→</span>
                  <span title={element?.properties.title as string}>
                    {(element?.properties.title as string) || element?.type}
                  </span>
                </div>
              )
            })}
          </div>
        </details>
      )}
    </div>
  )
}

// Export hook for manual sync operations
export const useStateBridge = () => {
  return {
    syncChatToCanvas: useDualPaneStore(state => state.syncChatToCanvas),
    syncCanvasToChat: useDualPaneStore(state => state.syncCanvasToChat),
    createContextBridge: useDualPaneStore(state => state.createContextBridge),
    toggleAutoSync: useDualPaneStore(state => state.toggleAutoSync),
    isAutoSyncEnabled: useDualPaneStore(state => state.sync.isAutoSyncEnabled),
    contextBridges: useDualPaneStore(state => state.sync.contextBridges)
  }
}