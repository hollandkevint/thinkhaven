'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { GuestSessionStore, GuestMessage } from '@/lib/guest/session-store'
import SignupPromptModal from './SignupPromptModal'
import StreamingMessage from '../chat/StreamingMessage'
import MessageInput from '../chat/MessageInput'
import TypingIndicator from '../chat/TypingIndicator'
import ChatErrorDisplay from '../chat/ChatErrorDisplay'
import { useRouter } from 'next/navigation'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
}

export default function GuestChatInterface() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null)
  const [remainingMessages, setRemainingMessages] = useState(5)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [showSavePrompt, setShowSavePrompt] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Load existing guest session on mount
  useEffect(() => {
    const session = GuestSessionStore.getOrCreateSession()

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
        content: `Hey there! I'm Mary, your AI business strategist. I'm here to help you think through business challenges, validate ideas, and develop strategic insights.

**Try me out with 10 free messages** - no signup required. After that, you can sign up to continue our conversation and unlock unlimited access.

**What would you like to explore today?**`,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }
  }, [])

  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return

    // Check if limit reached
    if (GuestSessionStore.hasReachedLimit()) {
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
    GuestSessionStore.addMessage('user', messageContent)
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
          }))
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
                GuestSessionStore.addMessage('assistant', fullContent)

                // Update remaining count
                setRemainingMessages(GuestSessionStore.getRemainingMessages())

                // Show save prompt after each message (except if limit reached)
                if (!GuestSessionStore.hasReachedLimit()) {
                  setShowSavePrompt(true)
                  // Auto-hide after 5 seconds
                  setTimeout(() => setShowSavePrompt(false), 5000)
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
    } catch (error: any) {
      setLastFailedMessage(messageContent)
      setError(error.message || 'Unknown error occurred')
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
    router.push('/auth?mode=signup&from=guest')
  }

  return (
    <div className="chat-interface flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-b border-divider">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--terracotta)' }}>
              <span className="font-bold text-lg" style={{ color: 'var(--cream)' }}>M</span>
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>Mary</h1>
              <p className="text-sm" style={{ color: 'var(--slate-blue)' }}>AI Business Strategist</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(212, 168, 75, 0.15)' }}>
              <span className="text-xs font-medium" style={{ color: 'var(--mustard)' }}>
                Guest Mode
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Message Counter */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{
                backgroundColor: remainingMessages <= 2
                  ? 'rgba(139, 77, 59, 0.1)'
                  : remainingMessages <= 4
                    ? 'rgba(212, 168, 75, 0.15)'
                    : 'rgba(74, 103, 65, 0.1)'
              }}
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

            {/* Sign Up Button */}
            <button
              onClick={handleSignupClick}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200"
              style={{
                backgroundColor: 'var(--terracotta)',
                color: 'var(--cream)'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--terracotta-hover)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--terracotta)'}
            >
              Sign up
            </button>
          </div>
        </div>
      </div>

      {/* Save Progress Banner */}
      {showSavePrompt && (
        <div className="flex-shrink-0 px-6 py-3" style={{ backgroundColor: 'var(--parchment)', borderBottom: '1px solid var(--divider)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--forest)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm" style={{ color: 'var(--ink)' }}>
                <strong>Great conversation!</strong> Sign up to save your progress and continue later.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSignupClick}
                className="px-3 py-1 text-sm font-medium rounded transition-colors"
                style={{ backgroundColor: 'var(--terracotta)', color: 'var(--cream)' }}
              >
                Save now
              </button>
              <button
                onClick={() => setShowSavePrompt(false)}
                className="text-sm"
                style={{ color: 'var(--slate-blue)' }}
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

      {/* Message Input */}
      <div className="flex-shrink-0 px-6 py-4 bg-white border-t border-divider">
        <MessageInput
          value={currentInput}
          onChange={setCurrentInput}
          onSubmit={sendMessage}
          disabled={isLoading || GuestSessionStore.hasReachedLimit()}
          placeholder={
            GuestSessionStore.hasReachedLimit()
              ? 'Sign up to continue chatting...'
              : `Ask Mary for strategic guidance... (${remainingMessages} messages left)`
          }
          maxLength={4000}
        />
      </div>

      {/* Signup Modal */}
      <SignupPromptModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
      />
    </div>
  )
}
