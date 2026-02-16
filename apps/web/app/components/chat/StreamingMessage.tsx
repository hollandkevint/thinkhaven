'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { CoachingContext } from '@/lib/ai/mary-persona'
import MarkdownRenderer from './MarkdownRenderer'
import MessageActionMenu from './MessageActionMenu'
import { MessageBookmarkRow } from '@/lib/supabase/conversation-schema'
import { hasArtifacts, parseArtifactsFromResponse, useSafeArtifacts } from '@/lib/artifact'
import { Artifact } from '@/app/components/artifact'

export interface StreamingMessageProps {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
  timestamp?: Date
  tokenUsage?: {
    input_tokens: number
    output_tokens: number
    total_tokens: number
    cost_estimate_usd: number
  }
  coachingContext?: CoachingContext
  className?: string
  bookmarks?: MessageBookmarkRow[]
  conversationId?: string
  conversationTitle?: string
  sessionId?: string
  onComplete?: () => void
  onBookmark?: (data: { title: string; description?: string; tags: string[]; color: string }) => void
  onCreateReference?: (toMessageId: string, type: string) => void
  onViewReferences?: () => void
  onCreateBranch?: (messageId: string) => void
}

interface StreamingTextProps {
  content: string
  isStreaming: boolean
  sessionId?: string
  onComplete?: () => void
  typingSpeed?: number
  onPopOutArtifact?: (id: string) => void
}

function StreamingText({ content, isStreaming, sessionId, onComplete, typingSpeed = 30, onPopOutArtifact }: StreamingTextProps) {
  const [displayedContent, setDisplayedContent] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout>()
  const indexRef = useRef(0)

  // Parse artifacts from content
  const { artifacts, cleanedContent } = useMemo(() => {
    if (!content || isStreaming) {
      return { artifacts: [], cleanedContent: content }
    }

    if (hasArtifacts(content)) {
      return parseArtifactsFromResponse(content, sessionId || 'default')
    }

    return { artifacts: [], cleanedContent: content }
  }, [content, isStreaming, sessionId])

  useEffect(() => {
    // Reset when content changes
    if (!isStreaming) {
      setDisplayedContent(cleanedContent)
      setIsTyping(false)
      indexRef.current = 0
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      return
    }

    // Start streaming animation (use original content during streaming)
    if (content && isStreaming && indexRef.current < content.length) {
      setIsTyping(true)

      intervalRef.current = setInterval(() => {
        if (indexRef.current < content.length) {
          setDisplayedContent(content.substring(0, indexRef.current + 1))
          indexRef.current++
        } else {
          setIsTyping(false)
          onComplete?.()
          clearInterval(intervalRef.current!)
        }
      }, typingSpeed)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [content, cleanedContent, isStreaming, typingSpeed, onComplete])

  return (
    <div className="relative space-y-4">
      <MarkdownRenderer content={displayedContent} />

      {/* Render artifacts inline (only when not streaming) */}
      {!isStreaming && artifacts.length > 0 && (
        <div className="space-y-3 mt-4">
          {artifacts.map((artifact) => (
            <Artifact
              key={artifact.id}
              artifact={artifact}
              onPopOut={onPopOutArtifact}
            />
          ))}
        </div>
      )}

      {/* Typing indicator */}
      {isTyping && (
        <span className="inline-flex items-center ml-1">
          <span className="animate-pulse text-primary">▊</span>
        </span>
      )}
    </div>
  )
}

export default function StreamingMessage({
  id,
  role,
  content,
  isStreaming = false,
  timestamp,
  tokenUsage,
  coachingContext,
  className = '',
  bookmarks = [],
  conversationId,
  conversationTitle,
  sessionId,
  onComplete,
  onBookmark,
  onCreateReference,
  onViewReferences,
  onCreateBranch
}: StreamingMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const messageRef = useRef<HTMLDivElement>(null)

  // Get artifact context for pop-out functionality
  // This hook is safe - it returns null if outside ArtifactProvider
  const artifactContext = useSafeArtifacts()
  const handlePopOutArtifact = artifactContext?.selectArtifact

  // Auto-scroll to message when it's streaming
  useEffect(() => {
    if (isStreaming && messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [isStreaming, content])

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  const formatCost = (cost: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4
    }).format(cost)
  }

  const isAssistant = role === 'assistant'
  const isUser = role === 'user'

  return (
    <div 
      ref={messageRef}
      className={`group flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} ${className}`}
      id={`message-${id}`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isAssistant ? (
          <div className="w-8 h-8 bg-terracotta rounded-full flex items-center justify-center">
            <span className="text-cream font-semibold text-sm font-display">M</span>
          </div>
        ) : (
          <div className="w-8 h-8 bg-ink/10 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-ink-light" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
        )}
      </div>

      {/* Message bubble */}
      <div className={`flex-1 max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Header */}
        <div className={`flex items-center gap-2 mb-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-sm font-medium text-primary">
            {isAssistant ? 'Mary' : 'You'}
          </span>
          {timestamp && (
            <span className="text-xs text-secondary">
              {formatTimestamp(timestamp)}
            </span>
          )}
          {coachingContext?.currentBmadSession && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-terracotta rounded-full"></div>
              <span className="text-xs text-terracotta font-medium">
                {coachingContext.currentBmadSession.pathway} • {coachingContext.currentBmadSession.phase}
              </span>
            </div>
          )}
          
          {/* Bookmark indicator */}
          {bookmarks.length > 0 && (
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
              </svg>
              <span className="text-xs text-yellow-600 font-medium">
                {bookmarks.length}
              </span>
            </div>
          )}
          
          {/* Action Menu */}
          {(onBookmark || onCreateReference || onViewReferences || onCreateBranch) && !isStreaming && (
            <MessageActionMenu
              messageId={id}
              messageContent={content}
              conversationId={conversationId}
              conversationTitle={conversationTitle}
              isBookmarked={bookmarks.length > 0}
              bookmarks={bookmarks}
              onBookmark={onBookmark || (() => {})}
              onCreateReference={onCreateReference || (() => {})}
              onViewReferences={onViewReferences || (() => {})}
              onCreateBranch={onCreateBranch}
            />
          )}
        </div>

        {/* Message bubble */}
        <div className={`
          rounded-2xl px-4 py-3 max-w-full break-words
          ${isUser 
            ? 'bg-primary text-white rounded-br-md' 
            : 'bg-white border border-divider rounded-bl-md'
          }
          ${isStreaming ? 'shadow-sm ring-2 ring-terracotta/20' : 'shadow-sm'}
        `}>
          {isUser ? (
            <p className="text-white leading-relaxed">{content}</p>
          ) : (
            <StreamingText
              content={content}
              isStreaming={isStreaming}
              sessionId={sessionId}
              onComplete={onComplete}
              typingSpeed={20}
              onPopOutArtifact={handlePopOutArtifact}
            />
          )}
        </div>

        {/* Metadata (only for assistant messages) */}
        {isAssistant && (tokenUsage || coachingContext) && (
          <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-secondary hover:text-primary flex items-center gap-1"
            >
              <svg 
                className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
              </svg>
              Message details
            </button>
            
            {isExpanded && (
              <div className="mt-2 p-3 bg-parchment rounded-lg border border-ink/8 text-xs space-y-2">
                {tokenUsage && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-secondary">Tokens:</span>
                      <span className="ml-1 font-mono">{tokenUsage.total_tokens.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-secondary">Cost:</span>
                      <span className="ml-1 font-mono">{formatCost(tokenUsage.cost_estimate_usd)}</span>
                    </div>
                    <div>
                      <span className="text-secondary">Input:</span>
                      <span className="ml-1 font-mono">{tokenUsage.input_tokens.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-secondary">Output:</span>
                      <span className="ml-1 font-mono">{tokenUsage.output_tokens.toLocaleString()}</span>
                    </div>
                  </div>
                )}
                
                {coachingContext?.userProfile && (
                  <div className="border-t pt-2">
                    <div className="text-secondary mb-1">Context:</div>
                    <div className="space-y-1">
                      {coachingContext.userProfile.experienceLevel && (
                        <div>Experience: <span className="text-primary capitalize">{coachingContext.userProfile.experienceLevel}</span></div>
                      )}
                      {coachingContext.userProfile.industry && (
                        <div>Industry: <span className="text-primary">{coachingContext.userProfile.industry}</span></div>
                      )}
                      {coachingContext.previousInsights && coachingContext.previousInsights.length > 0 && (
                        <div>Insights: <span className="text-primary">{coachingContext.previousInsights.length} previous</span></div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}