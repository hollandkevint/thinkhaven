'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getBoardMember } from '@/lib/ai/board-members'
import type { ChatMessage, BoardState } from '@/lib/ai/board-types'
import type { MessageLimitStatus } from '@/lib/bmad/message-limit-manager'

interface Workspace {
  id: string
  name: string
  description: string
  chat_context: ChatMessage[]
  canvas_elements: Array<Record<string, unknown>>
  user_id: string
}

interface UseStreamingChatReturn {
  workspace: Workspace | null
  setWorkspace: (ws: Workspace | null) => void
  messageInput: string
  setMessageInput: (input: string) => void
  sendingMessage: boolean
  limitStatus: MessageLimitStatus | null
  boardState: BoardState | null
  setBoardState: (bs: BoardState | null) => void
  handleSendMessage: (e: React.FormEvent) => Promise<void>
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => Promise<void>
}

export function useStreamingChat(initialWorkspace: Workspace | null): UseStreamingChatReturn {
  const [workspace, setWorkspace] = useState<Workspace | null>(initialWorkspace)
  const [messageInput, setMessageInput] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [limitStatus, setLimitStatus] = useState<MessageLimitStatus | null>(null)
  const [boardState, setBoardState] = useState<BoardState | null>(null)
  const workspaceRef = useRef<Workspace | null>(initialWorkspace)

  // Keep ref in sync with state for use in streaming callbacks
  useEffect(() => {
    workspaceRef.current = workspace
  }, [workspace])

  // Sync when parent provides a new workspace (e.g., after fetch)
  useEffect(() => {
    if (initialWorkspace) {
      setWorkspace(initialWorkspace)
      workspaceRef.current = initialWorkspace
    }
  }, [initialWorkspace])

  const addChatMessage = useCallback(async (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const current = workspaceRef.current
    if (!current) return

    const newMessage: ChatMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    }

    const updatedChatContext = [...current.chat_context, newMessage]

    try {
      const { error } = await supabase
        .from('user_workspace')
        .update({
          workspace_state: {
            name: current.name,
            description: current.description,
            chat_context: updatedChatContext,
            canvas_elements: current.canvas_elements,
            updated_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('user_id', current.id)

      if (error) throw error

      const updated = { ...current, chat_context: updatedChatContext }
      workspaceRef.current = updated
      setWorkspace(updated)
    } catch (error) {
      console.error('Error saving message:', error)
    }
  }, [])

  const updateStreamingMessage = useCallback((messageId: string, content: string, speaker?: string) => {
    const current = workspaceRef.current
    if (!current) return

    const updatedChatContext = [...current.chat_context]
    const existingIndex = updatedChatContext.findIndex(msg => msg.id === messageId)

    if (existingIndex >= 0) {
      updatedChatContext[existingIndex] = {
        ...updatedChatContext[existingIndex],
        content,
        metadata: {
          ...updatedChatContext[existingIndex].metadata,
          ...(speaker ? { speaker: speaker as any } : {}),
        },
      }
    } else {
      updatedChatContext.push({
        id: messageId,
        role: 'assistant',
        content,
        timestamp: new Date().toISOString(),
        metadata: speaker ? { speaker: speaker as any } : undefined,
      })
    }

    const updated = { ...current, chat_context: updatedChatContext }
    workspaceRef.current = updated
    setWorkspace(updated)
  }, [])

  const finalizeAssistantMessage = useCallback(async (content: string, messageId: string) => {
    const current = workspaceRef.current
    if (!current) return

    const existingMessageIndex = current.chat_context.findIndex(msg => msg.id === messageId)

    if (existingMessageIndex === -1) {
      console.error('[Workspace] Could not find streaming message to finalize:', messageId)
      await addChatMessage({ role: 'assistant', content })
      return
    }

    const updatedChatContext = [...current.chat_context]

    try {
      const { error } = await supabase
        .from('user_workspace')
        .update({
          workspace_state: {
            name: current.name,
            description: current.description,
            chat_context: updatedChatContext,
            canvas_elements: current.canvas_elements,
            updated_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('user_id', current.id)

      if (error) throw error
    } catch (error) {
      console.error('[Workspace] Error finalizing message:', error)
    }
  }, [addChatMessage])

  const streamClaudeResponse = useCallback(async (message: string) => {
    const current = workspaceRef.current
    if (!current) return

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          workspaceId: current.id,
          conversationHistory: current.chat_context?.slice(-10) || [],
          useTools: true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const errorMessage = errorData?.details || errorData?.error || response.statusText || 'Unknown error'
        const errorHint = errorData?.hint || 'Please try again'
        console.error('[Workspace] HTTP error:', { status: response.status, message: errorMessage, hint: errorHint })
        throw new Error(`${errorMessage} (${errorHint})`)
      }

      if (!response.body) {
        throw new Error('No response stream available')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      let assistantContent = ''
      let assistantMessageId = crypto.randomUUID()
      let currentSpeaker: string | undefined = undefined

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim()
            if (dataStr === '[DONE]') continue

            try {
              const data = JSON.parse(dataStr)

              if (data.type === 'speaker_change') {
                const newSpeaker = data.metadata?.speaker
                const handoffReason = data.metadata?.handoffReason

                if (newSpeaker && newSpeaker !== currentSpeaker) {
                  if (assistantContent.trim()) {
                    await finalizeAssistantMessage(assistantContent, assistantMessageId)
                  }

                  // Insert handoff annotation
                  if (currentSpeaker && handoffReason) {
                    const fromMember = getBoardMember(currentSpeaker as any)
                    const toMember = getBoardMember(newSpeaker as any)
                    const annotationId = crypto.randomUUID()
                    const ws = workspaceRef.current
                    if (ws) {
                      const updatedContext = [...ws.chat_context, {
                        id: annotationId,
                        role: 'system' as const,
                        content: `__handoff__${fromMember.name}__${toMember.name}__${handoffReason}`,
                        timestamp: new Date().toISOString(),
                        metadata: {
                          speaker: currentSpeaker as any,
                          handoff_reason: handoffReason,
                        },
                      }]
                      const updated = { ...ws, chat_context: updatedContext }
                      workspaceRef.current = updated
                      setWorkspace(updated)
                    }
                  }

                  currentSpeaker = newSpeaker
                  assistantContent = ''
                  assistantMessageId = crypto.randomUUID()

                  setBoardState(prev => prev
                    ? { ...prev, activeSpeaker: newSpeaker as any }
                    : { activeSpeaker: newSpeaker as any, taylorOptedIn: false }
                  )
                }
              } else if (data.type === 'content') {
                const contentSpeaker = data.metadata?.speaker
                if (contentSpeaker && !currentSpeaker) {
                  currentSpeaker = contentSpeaker
                }
                assistantContent += data.content
                updateStreamingMessage(assistantMessageId, assistantContent, currentSpeaker as any)
              } else if (data.type === 'complete') {
                if (data.limitStatus) {
                  setLimitStatus(data.limitStatus)
                }
                if (data.additionalData?.boardState) {
                  setBoardState(data.additionalData.boardState as BoardState)
                }
                await finalizeAssistantMessage(assistantContent, assistantMessageId)
              } else if (data.type === 'error') {
                console.error('[Workspace] Received error from stream:', data)
                throw new Error(data.error || 'Stream error')
              } else if (data.type === 'metadata') {
                if (data.metadata?.boardState) {
                  setBoardState(data.metadata.boardState as BoardState)
                }
              }
            } catch (parseError) {
              console.error('[Workspace] Failed to parse stream data:', {
                dataStr: dataStr.substring(0, 100),
                error: parseError instanceof Error ? parseError.message : 'Unknown error'
              })
            }
          }
        }
      }
    } catch (error) {
      console.error('[Workspace] Streaming error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      throw error
    }
  }, [finalizeAssistantMessage, updateStreamingMessage])

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || sendingMessage) return

    const userMessage = messageInput
    setSendingMessage(true)
    setMessageInput('')

    try {
      await addChatMessage({ role: 'user', content: userMessage })
      await streamClaudeResponse(userMessage)
    } catch (err) {
      console.error('[Workspace] Error sending message:', {
        error: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      })

      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      await addChatMessage({
        role: 'system',
        content: `❌ **Error:** ${errorMessage}\n\n**Troubleshooting:**\n- Check your internet connection\n- Verify you're signed in\n- Try refreshing the page\n- If the problem persists, contact support`
      })
    } finally {
      setSendingMessage(false)
    }
  }, [messageInput, sendingMessage, addChatMessage, streamClaudeResponse])

  return {
    workspace,
    setWorkspace,
    messageInput,
    setMessageInput,
    sendingMessage,
    limitStatus,
    boardState,
    setBoardState,
    handleSendMessage,
    addChatMessage,
  }
}
