'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '../auth/AuthContext'
import { supabase } from '../supabase/client'

interface WorkspaceState {
  chat_context: ChatMessage[]
  canvas_elements: CanvasElement[]
  last_session_progress: number
  initialized: boolean
  created_at: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    tokens_used?: number
    strategic_tags?: string[]
  }
}

interface CanvasElement {
  id: string
  type: 'excalidraw' | 'mermaid'
  data: Record<string, unknown>
  position: { x: number; y: number }
  created_at: Date
}

interface WorkspaceContextType {
  workspaceState: WorkspaceState | null
  loading: boolean
  error: string | null
  updateWorkspace: (updates: Partial<WorkspaceState>) => Promise<void>
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => Promise<void>
  addCanvasElement: (element: Omit<CanvasElement, 'id' | 'created_at'>) => Promise<void>
  clearError: () => void
  saveWorkspace: () => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const workspaceStateRef = useRef<WorkspaceState | null>(null)

  const createInitialWorkspace = useCallback(async () => {
    const initialState: WorkspaceState = {
      chat_context: [{
        id: 'welcome-message',
        role: 'assistant',
        content: "Welcome to your strategic thinking workspace! I'm Mary, your AI business analyst. What strategic challenge would you like to explore today?",
        timestamp: new Date()
      }],
      canvas_elements: [],
      last_session_progress: 0,
      initialized: true,
      created_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('user_workspace')
      .insert({
        user_id: user!.id,
        workspace_state: initialState
      })

    if (error) {
      throw error
    }

    setWorkspaceState(initialState)
  }, [user])

  const loadWorkspace = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('user_workspace')
        .select('workspace_state, updated_at')
        .eq('user_id', user!.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No workspace exists, create one
          await createInitialWorkspace()
        } else {
          throw error
        }
      } else {
        setWorkspaceState(data.workspace_state)
      }
    } catch (err) {
      console.error('Error loading workspace:', err)
      setError('Failed to load workspace')
    } finally {
      setLoading(false)
    }
  }, [user, createInitialWorkspace])

  // Keep ref in sync with state (avoids stale closures in debounced save)
  useEffect(() => {
    workspaceStateRef.current = workspaceState
  }, [workspaceState])

  // Cleanup: flush pending save on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])

  // Load workspace state when user is authenticated
  useEffect(() => {
    if (authLoading) return
    
    if (user) {
      loadWorkspace()
    } else {
      setWorkspaceState(null)
      setLoading(false)
    }
  }, [user, authLoading, loadWorkspace])

  const saveWorkspace = useCallback(async () => {
    const currentState = workspaceStateRef.current
    if (!user || !currentState) return

    try {
      const { error } = await supabase
        .from('user_workspace')
        .update({
          workspace_state: currentState,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (error) {
        throw error
      }
    } catch (err) {
      console.error('Error saving workspace:', err)
      setError('Failed to save workspace')
    }
  }, [user])

  // Debounced auto-save function
  const debouncedSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      saveWorkspace()
    }, 2000)
  }, [saveWorkspace])

  const updateWorkspace = async (updates: Partial<WorkspaceState>) => {
    if (!workspaceState) return

    const newState = { ...workspaceState, ...updates }
    setWorkspaceState(newState)
    debouncedSave()
  }

  const addChatMessage = async (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    if (!workspaceState) return

    const newMessage: ChatMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    }

    const updatedMessages = [...workspaceState.chat_context, newMessage]
    await updateWorkspace({ 
      chat_context: updatedMessages,
      last_session_progress: workspaceState.last_session_progress + 1
    })
  }

  const addCanvasElement = async (element: Omit<CanvasElement, 'id' | 'created_at'>) => {
    if (!workspaceState) return

    const newElement: CanvasElement = {
      ...element,
      id: `canvas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date()
    }

    const updatedElements = [...workspaceState.canvas_elements, newElement]
    await updateWorkspace({ canvas_elements: updatedElements })
  }

  const clearError = () => {
    setError(null)
  }

  const value = {
    workspaceState,
    loading,
    error,
    updateWorkspace,
    addChatMessage,
    addCanvasElement,
    clearError,
    saveWorkspace
  }

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}