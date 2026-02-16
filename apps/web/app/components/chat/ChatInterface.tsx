'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { CoachingContext } from '@/lib/ai/mary-persona'
import { WorkspaceContextBuilder } from '@/lib/ai/workspace-context'
import { StreamConnectionManager } from '@/lib/ai/streaming'
import StreamingMessage from './StreamingMessage'
import MessageInput from './MessageInput'
import QuickActions from './QuickActions'
import TypingIndicator from './TypingIndicator'
import ChatErrorDisplay from './ChatErrorDisplay'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
  tokenUsage?: {
    input_tokens: number
    output_tokens: number
    total_tokens: number
    cost_estimate_usd: number
  }
  coachingContext?: CoachingContext
}

interface ChatInterfaceProps {
  workspaceId: string
  userId?: string
  initialContext?: CoachingContext
  bmadSessionData?: any
  onContextUpdate?: (context: CoachingContext) => void
  className?: string
}

export default function ChatInterface({
  workspaceId,
  userId,
  initialContext,
  bmadSessionData,
  onContextUpdate,
  className = ''
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [coachingContext, setCoachingContext] = useState<CoachingContext | undefined>(initialContext)
  const [error, setError] = useState<string | null>(null)
  const [totalTokens, setTotalTokens] = useState(0)
  const [totalCost, setTotalCost] = useState(0)
  const [retryCount, setRetryCount] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'retrying'>('connected')
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const connectionManager = useRef(new StreamConnectionManager())
  const currentStreamRef = useRef<string | null>(null)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Build coaching context on mount or when session data changes
  useEffect(() => {
    const buildContext = async () => {
      try {
        const context = await WorkspaceContextBuilder.buildCoachingContext(
          workspaceId,
          userId,
          bmadSessionData
        )
        setCoachingContext(context)
        onContextUpdate?.(context)
      } catch (error) {
        console.error('Failed to build coaching context:', error)
      }
    }

    if (!initialContext) {
      buildContext()
    }
  }, [workspaceId, userId, bmadSessionData, initialContext, onContextUpdate])

  // Welcome message on first load
  useEffect(() => {
    if (messages.length === 0 && coachingContext) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: getWelcomeMessage(coachingContext),
        timestamp: new Date(),
        coachingContext
      }
      setMessages([welcomeMessage])
    }
  }, [coachingContext, messages.length])

  const getWelcomeMessage = (context: CoachingContext): string => {
    const hasSession = context.currentBmadSession
    const userName = context.userProfile?.role || 'there'
    
    if (hasSession) {
      const session = context.currentBmadSession!
      return `👋 Hi ${userName}! I'm Mary, your AI business strategist. I see you're working on the **${session.pathway.replace('-', ' ')}** pathway and you're currently in the **${session.phase}** phase (${session.progress}% complete).

I'm here to help you think through strategic challenges, validate your assumptions, and develop actionable insights. 

**What's on your mind today?** You can use the quick actions below or just tell me what you'd like to explore.`
    }

    return `👋 Hi ${userName}! I'm Mary, your AI business strategist. I'm here to help you think through strategic challenges, validate assumptions, and develop actionable insights.

**How can I help you today?** You can use the quick actions below to get started, or simply tell me what's on your mind.`
  }

  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return

    // Clear any existing error
    setError(null)
    setConnectionStatus('connecting')

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageContent,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setCurrentInput('')
    setIsLoading(true)

    // Create assistant message placeholder
    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
      coachingContext
    }

    setMessages(prev => [...prev, assistantMessage])
    currentStreamRef.current = assistantMessage.id

    try {
      // Use connection manager with retry logic
      await connectionManager.current.connectWithRetry(
        async (signal) => {
          setConnectionStatus('connected')
          
          // Prepare conversation history
          const conversationHistory = messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))

          // Call streaming API
          const response = await fetch('/api/chat/stream', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: messageContent,
              workspaceId,
              conversationHistory,
              coachingContext
            }),
            signal
          })

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          if (!response.body) {
            throw new Error('No response body received')
          }

          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          let fullContent = ''
          let currentMetadata: any = null

          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break

              const chunk = decoder.decode(value)
              const lines = chunk.split('\n')

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6)
                  
                  if (data === '[DONE]') {
                    // Stream completed
                    setMessages(prev => 
                      prev.map(msg => 
                        msg.id === assistantMessage.id 
                          ? { ...msg, isStreaming: false }
                          : msg
                      )
                    )
                    setIsLoading(false)
                    setConnectionStatus('connected')
                    return
                  }

                  try {
                    const parsed = JSON.parse(data)
                    
                    // Handle different chunk types
                    switch (parsed.type) {
                      case 'metadata':
                        currentMetadata = parsed.metadata
                        if (parsed.metadata?.coachingContext) {
                          setCoachingContext(parsed.metadata.coachingContext)
                        }
                        break
                        
                      case 'content':
                        if (parsed.content) {
                          fullContent += parsed.content
                          
                          // Update streaming message
                          setMessages(prev => 
                            prev.map(msg => 
                              msg.id === assistantMessage.id 
                                ? { ...msg, content: fullContent }
                                : msg
                            )
                          )
                        }
                        break
                        
                      case 'complete':
                        if (parsed.usage) {
                          // Update token usage
                          setMessages(prev => 
                            prev.map(msg => 
                              msg.id === assistantMessage.id 
                                ? { ...msg, tokenUsage: parsed.usage, isStreaming: false }
                                : msg
                            )
                          )
                          
                          setTotalTokens(prev => prev + parsed.usage.total_tokens)
                          setTotalCost(prev => prev + parsed.usage.cost_estimate_usd)
                        }
                        setIsLoading(false)
                        setConnectionStatus('connected')
                        break
                        
                      case 'error':
                        throw new Error(parsed.error || 'Unknown streaming error')
                    }
                  } catch (e) {
                    // Skip malformed JSON chunks
                    continue
                  }
                }
              }
            }
          } finally {
            reader.releaseLock()
          }
        },
        // Retry callback
        (attempt, error) => {
          setConnectionStatus('retrying')
          setRetryCount(attempt)
          console.log(`Retry attempt ${attempt}:`, error.message)
        }
      )
    } catch (error: any) {
      setConnectionStatus('disconnected')

      if (error.name === 'AbortError') {
        // Request was cancelled
        setMessages(prev => prev.filter(msg => msg.id !== assistantMessage.id))
      } else {
        // Track failed message for retry
        setLastFailedMessage(messageContent)
        setError(error.message || 'Unknown error occurred')

        // Remove the failed assistant message placeholder
        setMessages(prev => prev.filter(msg => msg.id !== assistantMessage.id))
      }
    } finally {
      setIsLoading(false)
      currentStreamRef.current = null
    }
  }

  const handleQuickAction = (action: string) => {
    sendMessage(action)
  }

  const handleMessageComplete = () => {
    // Called when streaming message completes typing animation
    scrollToBottom()
  }

  const clearConversation = () => {
    // Cancel any ongoing streams
    connectionManager.current.abort()

    setMessages([])
    setError(null)
    setLastFailedMessage(null)
    setTotalTokens(0)
    setTotalCost(0)
    setRetryCount(0)
    setConnectionStatus('connected')

    // Re-add welcome message
    if (coachingContext) {
      const welcomeMessage: Message = {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: getWelcomeMessage(coachingContext),
        timestamp: new Date(),
        coachingContext
      }
      setMessages([welcomeMessage])
    }
  }

  const retryLastMessage = () => {
    if (lastFailedMessage) {
      setError(null)
      setLastFailedMessage(null)
      sendMessage(lastFailedMessage)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      connectionManager.current.abort()
    }
  }, [])

  return (
    <div className={`chat-interface flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-b border-divider">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-terracotta rounded-full flex items-center justify-center">
              <span className="text-cream font-bold text-lg font-display">M</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">Mary</h1>
              <p className="text-sm text-secondary">AI Business Strategist</p>
            </div>
            {coachingContext?.currentBmadSession && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-terracotta/10 rounded-full">
                <div className="w-2 h-2 bg-terracotta rounded-full"></div>
                <span className="text-xs text-terracotta font-medium capitalize">
                  {coachingContext.currentBmadSession.pathway.replace('-', ' ')} • {coachingContext.currentBmadSession.phase}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-forest' :
                connectionStatus === 'connecting' ? 'bg-mustard animate-pulse' :
                connectionStatus === 'retrying' ? 'bg-mustard animate-pulse' :
                'bg-rust'
              }`} />
              <span className="text-xs text-secondary capitalize">
                {connectionStatus === 'retrying' ? `Retrying (${retryCount}/3)` : connectionStatus}
              </span>
            </div>
            
            {/* Token Usage Display */}
            {totalTokens > 0 && (
              <div className="text-xs text-secondary bg-parchment rounded-lg px-3 py-1.5">
                <span className="font-mono">{totalTokens.toLocaleString()}</span> tokens • 
                <span className="font-mono ml-1">
                  ${totalCost.toFixed(4)}
                </span>
              </div>
            )}
            
            {/* Clear Chat Button */}
            {messages.length > 1 && (
              <button
                onClick={clearConversation}
                className="text-secondary hover:text-primary p-2 rounded-lg hover:bg-parchment transition-colors"
                title="Clear conversation"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map((message) => (
          <StreamingMessage
            key={message.id}
            {...message}
            onComplete={handleMessageComplete}
          />
        ))}
        
        {/* Typing Indicator */}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <TypingIndicator 
            isTyping={isLoading}
            userName="Mary"
          />
        )}

        {/* Error Display */}
        {error && (
          <ChatErrorDisplay
            error={error}
            onRetry={lastFailedMessage ? retryLastMessage : undefined}
            onDismiss={() => {
              setError(null)
              setLastFailedMessage(null)
            }}
            isRetrying={isLoading}
          />
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="flex-shrink-0 px-6 py-4 bg-parchment border-t border-divider">
        <QuickActions
          onActionSelect={handleQuickAction}
          coachingContext={coachingContext}
          disabled={isLoading}
        />
      </div>

      {/* Message Input */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-divider">
        <MessageInput
          value={currentInput}
          onChange={setCurrentInput}
          onSubmit={sendMessage}
          disabled={isLoading}
          placeholder="Ask Mary for strategic guidance..."
          maxLength={4000}
        />
      </div>
    </div>
  )
}