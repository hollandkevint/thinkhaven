'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { GuestSessionStore } from '@/lib/guest/session-store'
import SignupPromptModal from './SignupPromptModal'
import StreamingMessage from '../chat/StreamingMessage'
import MessageInput from '../chat/MessageInput'
import TypingIndicator from '../chat/TypingIndicator'
import ChatErrorDisplay from '../chat/ChatErrorDisplay'
import { useRouter } from 'next/navigation'
import { track } from '@/lib/analytics/events'
import posthog from 'posthog-js'
import DecisionArtifactDialog, { type DecisionArtifact } from './DecisionArtifactDialog'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

type GuestPathway = 'new-idea' | 'plan-grill'

interface GuestChatInterfaceProps {
  pathway?: GuestPathway
}

function getWelcomeMessage(pathway: GuestPathway) {
  if (pathway === 'plan-grill') {
    return `I'm Mary. Paste a plan and I will grill the terminology, assumptions, and decisions one branch at a time.

**You have 10 free messages** - no signup required. If you have project docs, domain context, or prior decisions, paste the relevant excerpts too. If not, we will use classic grill-me.

**What plan should we grill?**`
  }

  return `I'm Mary. Bring a decision you're leaning toward and I will help pressure-test where it breaks.

**You have 10 free messages** - no signup required. After that, sign up to save the thread and continue.

**What are you trying to decide?**`
}

export default function GuestChatInterface({ pathway = 'new-idea' }: GuestChatInterfaceProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null)
  const [remainingMessages, setRemainingMessages] = useState(10)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const [activePathway, setActivePathway] = useState<GuestPathway>(pathway)
  // Sub-persona state round-tripped to API for exchange counting / board offer
  const [subPersonaState, setSubPersonaState] = useState<Record<string, unknown> | null>(null)
  // Decision-record artifact (the shareable hero output)
  const [showArtifact, setShowArtifact] = useState(false)
  const [artifact, setArtifact] = useState<DecisionArtifact | null>(null)
  const [artifactLoading, setArtifactLoading] = useState(false)
  const [artifactError, setArtifactError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const savePromptTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (savePromptTimeoutRef.current) clearTimeout(savePromptTimeoutRef.current)
    }
  }, [])

  // Load existing guest session on mount
  useEffect(() => {
    track({ event: 'session_started', properties: { source: 'guest', pathway } })
    const session = GuestSessionStore.getOrCreateSession(pathway)
    setActivePathway(session.pathway)

    if (session.messages.length > 0) {
      // Load existing messages
      const loadedMessages: Message[] = session.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp)
      }))
      setMessages(loadedMessages)
      setRemainingMessages(GuestSessionStore.getRemainingMessages())
    } else {
      // Show welcome message
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: getWelcomeMessage(session.pathway),
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }
  }, [pathway])

  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return

    // Check if limit reached
    if (GuestSessionStore.hasReachedLimit()) {
      track({ event: 'guest_limit_hit', properties: { message_count: 10 - remainingMessages } })
      setShowSignupModal(true)
      return
    }

    setError(null)

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

    // Save user message to guest session
    GuestSessionStore.addMessage('user', messageContent, activePathway)
    setRemainingMessages(GuestSessionStore.getRemainingMessages())

    // Create assistant message placeholder
    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    }

    setMessages(prev => [...prev, assistantMessage])

    try {
      // Call streaming API with guest-specific handling
      const response = await fetch('/api/chat/guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: messageContent,
          conversationHistory: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          subPersonaState,
          pathway: activePathway
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      if (!response.body) {
        throw new Error('No response body received')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

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

                // Save assistant response to guest session
                GuestSessionStore.addMessage('assistant', fullContent, activePathway)

                // Update remaining count
                setRemainingMessages(GuestSessionStore.getRemainingMessages())

                // Show save prompt after each message (except if limit reached)
                if (!GuestSessionStore.hasReachedLimit()) {
                  setShowSavePrompt(true)
                  if (savePromptTimeoutRef.current) clearTimeout(savePromptTimeoutRef.current)
                  savePromptTimeoutRef.current = setTimeout(() => setShowSavePrompt(false), 5000)
                } else {
                  // Limit reached - show signup modal
                  setShowSignupModal(true)
                }

                return
              }

              try {
                const parsed = JSON.parse(data)

                // Handle different chunk types
                switch (parsed.type) {
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

                  case 'complete': {
                    // Extract updated subPersonaState from the completion payload
                    const returnedState = parsed.additionalData?.subPersonaState
                    if (returnedState) {
                      setSubPersonaState(returnedState as Record<string, unknown>)

                      // Fire board_offered event at board offer thresholds
                      const BOARD_OFFER_EXCHANGES = [3, 8, 15]
                      const exchangeCount = (returnedState as { exchangeCount?: number }).exchangeCount
                      if (typeof exchangeCount === 'number' && BOARD_OFFER_EXCHANGES.includes(exchangeCount)) {
                        posthog.capture('board_offered', {
                          exchange_count: exchangeCount,
                          source: 'guest',
                          pathway: activePathway,
                        })
                      }
                    }
                    break
                  }

                  case 'error':
                    throw new Error(parsed.error || 'Unknown streaming error')
                }
              } catch {
                // Skip malformed JSON chunks
                continue
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    } catch (error: unknown) {
      setLastFailedMessage(messageContent)
      setError(error instanceof Error ? error.message : 'Unknown error occurred')
      // Remove the failed assistant message placeholder
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessage.id))
    } finally {
      setIsLoading(false)
    }
  }

  const handleMessageComplete = () => {
    scrollToBottom()
  }

  const retryLastMessage = () => {
    if (lastFailedMessage) {
      setError(null)
      setLastFailedMessage(null)
      sendMessage(lastFailedMessage)
    }
  }

  const handleSignupClick = () => {
    router.push('/signup?from=guest')
  }

  const buildArtifact = async () => {
    setShowArtifact(true)
    setArtifactError(null)
    setArtifact(null)
    setArtifactLoading(true)
    try {
      const transcript = messages
        .filter((m) => m.id !== 'welcome' && m.content.trim())
        .map(({ role, content }) => ({ role, content }))

      const res = await fetch('/api/chat/guest/artifact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, pathway: activePathway }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `HTTP ${res.status}`)
      }

      const data = await res.json()
      setArtifact({ title: data.title, content: data.content })
      posthog.capture('artifact_generated', { source: 'guest', pathway: activePathway })
    } catch (error) {
      setArtifactError(error instanceof Error ? error.message : 'Could not build the decision record.')
    } finally {
      setArtifactLoading(false)
    }
  }

  const hasConversation = messages.some((m) => m.role === 'user')

  return (
    <div className="chat-interface flex h-full min-w-0 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-4 bg-cream border-b border-divider md:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--terracotta)' }}>
              <span className="font-bold text-lg" style={{ color: 'var(--cream)' }}>M</span>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold leading-tight" style={{ color: 'var(--ink)' }}>Mary</h1>
                <span className="inline-flex items-center rounded-full bg-mustard/15 px-2.5 py-1 text-xs font-medium text-mustard">
                  Guest Mode
                </span>
              </div>
              <p className="text-sm" style={{ color: 'var(--slate-blue)' }}>AI Business Strategist</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
            {/* Message Counter */}
            <div
              data-testid="message-counter"
              className={`flex min-w-0 items-center gap-2 rounded-full px-3 py-1.5 ${
                remainingMessages <= 2
                  ? 'bg-rust/10'
                  : remainingMessages <= 4
                    ? 'bg-mustard/15'
                    : 'bg-forest/10'
              }`}
            >
              <span
                className="text-sm font-medium"
                style={{
                  color: remainingMessages <= 2
                    ? 'var(--rust)'
                    : remainingMessages <= 4
                      ? 'var(--mustard)'
                      : 'var(--forest)'
                }}
              >
                {remainingMessages}/10 messages
              </span>
            </div>

            {/* Build decision record (the shareable hero output) */}
            {hasConversation && (
              <button
                onClick={buildArtifact}
                disabled={artifactLoading}
                className="rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-ink/25 disabled:opacity-60 sm:px-4"
              >
                Decision record
              </button>
            )}

            {/* Sign Up Button */}
            <button
              onClick={handleSignupClick}
              className="rounded-lg bg-terracotta px-3 py-2 text-sm font-medium text-cream transition-colors hover:bg-terracotta-hover sm:px-4"
            >
              Sign up
            </button>
          </div>
        </div>
      </div>

      {/* Save Progress Banner */}
      {showSavePrompt && (
        <div className="flex-shrink-0 px-4 py-3 bg-parchment border-b border-divider sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <svg className="w-5 h-5 text-forest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-ink">
                Sign up to save this thread and continue later.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSignupClick}
                className="px-3 py-1 text-sm font-medium rounded transition-colors bg-terracotta text-cream"
              >
                Save now
              </button>
              <button
                onClick={() => setShowSavePrompt(false)}
                className="text-sm text-slate-blue"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 min-w-0 overflow-y-auto px-4 py-6 space-y-6 sm:px-6" data-ph-mask>
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

      {/* Persistent signup banner when limit reached and modal closed */}
      {GuestSessionStore.hasReachedLimit() && !showSignupModal && (
        <div className="flex-shrink-0 px-4 py-3 bg-terracotta/10 border-t border-terracotta/20 sm:px-6">
          <div className="flex max-w-4xl flex-col gap-2 mx-auto sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink">
              You&apos;ve used all 10 free messages. Walk away with your decision record.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={buildArtifact}
                disabled={artifactLoading}
                className="rounded-lg bg-terracotta px-4 py-2 text-sm font-medium text-cream transition-colors hover:bg-terracotta-hover disabled:opacity-60"
              >
                Build my decision record
              </button>
              <button
                onClick={() => setShowSignupModal(true)}
                className="text-sm font-medium text-terracotta hover:text-terracotta-hover underline"
              >
                Sign up to continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="flex-shrink-0 px-4 py-4 bg-cream border-t border-divider sm:px-6">
        <MessageInput
          value={currentInput}
          onChange={setCurrentInput}
          onSubmit={sendMessage}
          disabled={isLoading || GuestSessionStore.hasReachedLimit()}
          placeholder={
            GuestSessionStore.hasReachedLimit()
              ? 'Sign up to continue chatting...'
              : activePathway === 'plan-grill'
                ? `Paste a plan or answer Mary's question... (${remainingMessages} messages left)`
                : `Ask Mary for strategic guidance... (${remainingMessages} messages left)`
          }
          maxLength={4000}
        />
      </div>

      {/* Decision Record Artifact */}
      <DecisionArtifactDialog
        open={showArtifact}
        onOpenChange={setShowArtifact}
        artifact={artifact}
        loading={artifactLoading}
        error={artifactError}
        pathway={activePathway}
        onRetry={buildArtifact}
      />

      {/* Signup Modal */}
      <SignupPromptModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
      />
    </div>
  )
}
