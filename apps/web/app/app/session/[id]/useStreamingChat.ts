'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getBoardMember } from '@/lib/ai/board-members'
import type { ChatMessage, BoardState } from '@/lib/ai/board-types'
import type { MessageLimitStatus } from '@/lib/bmad/message-limit-manager'
import type { LeanCanvas } from '@/lib/canvas/lean-canvas-schema'

/**
 * Session data loaded from bmad_sessions.
 * Replaces the old Workspace interface that read from user_workspace.
 */
export interface SessionData {
  id: string
  user_id: string
  chat_context: ChatMessage[]
  title: string | null
  pathway: string
  current_phase: string
  message_count: number
  message_limit: number
  sub_persona_state: Record<string, unknown> | null
  session_mode: string | null
  lean_canvas: LeanCanvas | null
}

const VALID_ROLES = ['user', 'assistant', 'system'] as const

/**
 * Validates JSONB chat_context from Supabase (typed as Json | null).
 * Guards against malformed data (e.g., guest migration wrapping).
 * Checks value types, not just key existence.
 */
export function parseChatContext(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((msg): msg is ChatMessage =>
    typeof msg === 'object' && msg !== null &&
    typeof (msg as any).id === 'string' &&
    typeof (msg as any).content === 'string' &&
    typeof (msg as any).timestamp === 'string' &&
    VALID_ROLES.includes((msg as any).role)
  )
}

interface UseStreamingChatReturn {
  session: SessionData | null
  messageInput: string
  setMessageInput: (input: string) => void
  sendingMessage: boolean
  limitStatus: MessageLimitStatus | null
  boardState: BoardState | null
  streamError: string | null
  dismissError: () => void
  handleSendMessage: (e: React.FormEvent) => Promise<void>
}

export function useStreamingChat(
  initialSession: SessionData | null,
  userId: string | undefined
): UseStreamingChatReturn {
  const [session, setSession] = useState<SessionData | null>(initialSession)
  const [messageInput, setMessageInput] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [streamError, setStreamError] = useState<string | null>(null)
  const [limitStatus, setLimitStatus] = useState<MessageLimitStatus | null>(null)
  const [boardState, setBoardState] = useState<BoardState | null>(() => {
    const sps = initialSession?.sub_persona_state
    if (sps && 'activeSpeaker' in sps) return sps as unknown as BoardState
    return null
  })
  const sessionRef = useRef<SessionData | null>(initialSession)

  // Keep ref in sync with state
  useEffect(() => {
    sessionRef.current = session
  }, [session])

  // Sync when parent provides new session data
  useEffect(() => {
    if (initialSession) {
      setSession(initialSession)
      sessionRef.current = initialSession
      const sps = initialSession.sub_persona_state
      if (sps && 'activeSpeaker' in sps) {
        setBoardState(sps as unknown as BoardState)
      }
    }
  }, [initialSession])

  /**
   * Append a message using the atomic RPC (no read-modify-write race).
   * Also updates local state optimistically.
   */
  const addChatMessage = useCallback(async (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const current = sessionRef.current
    if (!current) return

    const newMessage: ChatMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    }

    // Optimistic local update
    const updatedChatContext = [...current.chat_context, newMessage]
    const updated = { ...current, chat_context: updatedChatContext }
    sessionRef.current = updated
    setSession(updated)

    try {
      // Atomic append via RPC (server-side, race-free, uses auth.uid() for ownership)
      const { data: success, error } = await supabase.rpc('append_chat_message', {
        p_session_id: current.id,
        p_message: newMessage as unknown as Record<string, unknown>,
      })

      if (error) throw error
      if (success === false) {
        console.error('Message append failed: session not found or ownership mismatch')
      }
    } catch (error) {
      console.error('Error saving message:', error)
    }
  }, [])

  const updateStreamingMessage = useCallback((messageId: string, content: string, speaker?: string) => {
    const current = sessionRef.current
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
    sessionRef.current = updated
    setSession(updated)
  }, [])

  /**
   * Finalize an assistant message by persisting via atomic RPC append.
   * The streaming message is already in local state from updateStreamingMessage.
   * We append the finalized version to the DB (the streaming updates were local-only).
   */
  const finalizeAssistantMessage = useCallback(async (content: string, messageId: string) => {
    const current = sessionRef.current
    if (!current) return

    const existingMessage = current.chat_context.find(msg => msg.id === messageId)

    if (!existingMessage) {
      console.error('[Session] Could not find streaming message to finalize:', messageId)
      await addChatMessage({ role: 'assistant', content })
      return
    }

    try {
      const finalMessage = {
        id: existingMessage.id,
        role: existingMessage.role,
        content,
        timestamp: existingMessage.timestamp,
        metadata: existingMessage.metadata,
      }

      const { error } = await supabase.rpc('append_chat_message', {
        p_session_id: current.id,
        p_message: finalMessage as unknown as Record<string, unknown>,
      })

      if (error) throw error
    } catch (error) {
      console.error('[Session] Error finalizing message:', error)
    }
  }, [addChatMessage])

  const streamClaudeResponse = useCallback(async (message: string) => {
    const current = sessionRef.current
    if (!current) return

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          sessionId: current.id,
          conversationHistory: current.chat_context?.slice(-10) || [],
          useTools: true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const errorMessage = errorData?.details || errorData?.error || response.statusText || 'Unknown error'
        const errorHint = errorData?.hint || 'Please try again'
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

                  // Insert handoff annotation (persisted via RPC)
                  if (currentSpeaker && handoffReason) {
                    const fromMember = getBoardMember(currentSpeaker as any)
                    const toMember = getBoardMember(newSpeaker as any)
                    await addChatMessage({
                      role: 'system',
                      content: `__handoff__${fromMember.name}__${toMember.name}__${handoffReason}`,
                      metadata: {
                        speaker: currentSpeaker as any,
                        handoff_reason: handoffReason,
                      },
                    })
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
                if (data.additionalData?.leanCanvas) {
                  setSession(prev => {
                    if (!prev) return prev
                    const updated = { ...prev, lean_canvas: data.additionalData.leanCanvas as LeanCanvas }
                    sessionRef.current = updated
                    return updated
                  })
                }
                await finalizeAssistantMessage(assistantContent, assistantMessageId)
              } else if (data.type === 'error') {
                throw new Error(data.error || 'Stream error')
              } else if (data.type === 'metadata') {
                if (data.metadata?.boardState) {
                  setBoardState(data.metadata.boardState as BoardState)
                }
              }
            } catch (parseError) {
              if (parseError instanceof Error && parseError.message !== 'Stream error') {
                console.error('[Session] Failed to parse stream data:', dataStr.substring(0, 100))
              } else {
                throw parseError
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('[Session] Streaming error:', error instanceof Error ? error.message : 'Unknown')
      throw error
    }
  }, [finalizeAssistantMessage, updateStreamingMessage, addChatMessage])

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || sendingMessage) return

    const userMessage = messageInput
    setSendingMessage(true)
    setMessageInput('')
    setStreamError(null)

    try {
      await addChatMessage({ role: 'user', content: userMessage })
      await streamClaudeResponse(userMessage)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      // Show ephemeral error (local-only, NOT persisted to Supabase)
      setStreamError(`Error: ${errorMessage}. Try again or refresh the page.`)
    } finally {
      setSendingMessage(false)
    }
  }, [messageInput, sendingMessage, addChatMessage, streamClaudeResponse])

  const dismissError = useCallback(() => setStreamError(null), [])

  return {
    session,
    messageInput,
    setMessageInput,
    sendingMessage,
    limitStatus,
    boardState,
    streamError,
    dismissError,
    handleSendMessage,
  }
}
