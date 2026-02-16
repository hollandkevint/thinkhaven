'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ConversationQueries } from '@/lib/supabase/conversation-queries'
import { ConversationRow, MessageRow } from '@/lib/supabase/conversation-schema'
import { createConversationSummarizer } from '@/lib/ai/conversation-summarizer'

export interface ConversationHistoryItem {
  id: string
  title: string
  lastMessage: string
  messageCount: number
  lastActivity: Date
  isActive: boolean
  bmadSessionId?: string
  pathway?: string
  phase?: string
}

export interface MessageHistoryItem {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  messageIndex: number
  conversationId?: string
  conversationTitle?: string
}

interface MessageHistorySidebarProps {
  workspaceId: string
  userId: string
  currentConversationId?: string
  onConversationSelect: (conversationId: string) => void
  onNewConversation: () => void
  className?: string
}

export default function MessageHistorySidebar({
  workspaceId,
  userId,
  currentConversationId,
  onConversationSelect,
  onNewConversation,
  className = ''
}: MessageHistorySidebarProps) {
  const [conversations, setConversations] = useState<ConversationHistoryItem[]>([])
  const [messages, setMessages] = useState<MessageHistoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<string | null>(currentConversationId || null)
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'conversations' | 'messages'>('conversations')
  const [expandedConversations, setExpandedConversations] = useState<Set<string>>(new Set())
  const [searchStats, setSearchStats] = useState<{ totalCount: number; searchTime: number } | null>(null)
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Load conversation history
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true)
      const conversationRows = await ConversationQueries.getUserConversations(
        userId,
        workspaceId,
        50
      )

      const historyItems: ConversationHistoryItem[] = conversationRows.map(conv => {
        // Extract BMad session info if available
        const bmadSession = conv.bmad_session_id ? {
          bmadSessionId: conv.bmad_session_id,
          // These would come from BMad session data if available
          pathway: undefined,
          phase: undefined
        } : {}

        return {
          id: conv.id,
          title: conv.title || 'Strategic Coaching Session',
          lastMessage: conv.context_summary || 'No messages yet',
          messageCount: conv.message_count,
          lastActivity: new Date(conv.updated_at),
          isActive: isRecentlyActive(new Date(conv.updated_at)),
          ...bmadSession
        }
      })

      setConversations(historyItems)
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setLoading(false)
    }
  }, [userId, workspaceId])

  // Load messages for a specific conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      setSearchLoading(true)
      const messageRows = await ConversationQueries.getConversationMessages(conversationId)

      const messageItems: MessageHistoryItem[] = messageRows.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at),
        messageIndex: msg.message_index
      }))

      setMessages(messageItems)
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setSearchLoading(false)
    }
  }, [])

  // Search messages across all conversations
  const searchMessages = useCallback(async (query: string) => {
    if (!query.trim()) {
      setMessages([])
      return
    }

    try {
      setSearchLoading(true)
      
      // Use the comprehensive search API
      const response = await fetch('/api/chat/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          filters: {
            workspaceId,
            resultTypes: ['message'],
            highlightMatches: true
          },
          limit: 50
        })
      })

      if (!response.ok) {
        throw new Error('Search request failed')
      }

      const data = await response.json()
      
      if (data.success && data.data.results) {
        const searchResults = data.data.results.map((result: any) => ({
          id: result.id,
          role: result.context?.messageRole || 'user',
          content: result.content,
          timestamp: new Date(result.timestamp),
          messageIndex: 0,
          conversationId: result.conversationId,
          conversationTitle: result.conversationTitle
        }))
        
        setMessages(searchResults)
        setSearchStats({
          totalCount: data.data.totalCount,
          searchTime: data.data.searchTime
        })
      } else {
        setMessages([])
        setSearchStats(null)
      }
    } catch (error) {
      console.error('Search failed:', error)
      setMessages([])
      setSearchStats(null)
    } finally {
      setSearchLoading(false)
    }
  }, [workspaceId])

  // Load search suggestions
  const loadSearchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchSuggestions([])
      return
    }

    try {
      const response = await fetch(`/api/chat/search?action=suggestions&query=${encodeURIComponent(query)}&workspaceId=${workspaceId}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data.suggestions) {
          setSearchSuggestions(data.data.suggestions)
        }
      }
    } catch (error) {
      console.error('Failed to load search suggestions:', error)
    }
  }, [workspaceId])

  // Debounced search
  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setShowSuggestions(query.length >= 2)
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Load suggestions immediately for quick response
    if (query.length >= 2) {
      loadSearchSuggestions(query)
    } else {
      setSearchSuggestions([])
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (query.trim()) {
        setViewMode('messages')
        searchMessages(query)
        setShowSuggestions(false)
      } else {
        setViewMode('conversations')
        setMessages([])
        setSearchStats(null)
        setShowSuggestions(false)
      }
    }, 300)
  }

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSuggestions(false)
    setViewMode('messages')
    searchMessages(suggestion)
  }

  // Handle input focus/blur for suggestions
  const handleInputFocus = () => {
    if (searchQuery.length >= 2 && searchSuggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicks
    setTimeout(() => setShowSuggestions(false), 200)
  }

  // Helper functions
  const isRecentlyActive = (date: Date): boolean => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    return date > oneHourAgo
  }

  const formatTimestamp = (date: Date): string => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
    if (minutes < 10080) return `${Math.floor(minutes / 1440)}d ago`
    return date.toLocaleDateString()
  }

  const truncateMessage = (content: string, maxLength: number = 80): string => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  const handleConversationClick = (conversationId: string) => {
    setSelectedConversation(conversationId)
    onConversationSelect(conversationId)
    
    // Load messages for preview
    if (expandedConversations.has(conversationId)) {
      setExpandedConversations(prev => {
        const newSet = new Set(prev)
        newSet.delete(conversationId)
        return newSet
      })
    } else {
      loadMessages(conversationId)
      setExpandedConversations(prev => new Set(prev).add(conversationId))
    }
  }

  const handleNewConversation = () => {
    setSelectedConversation(null)
    setMessages([])
    setExpandedConversations(new Set())
    onNewConversation()
  }

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // Update selected conversation when prop changes
  useEffect(() => {
    setSelectedConversation(currentConversationId || null)
  }, [currentConversationId])

  return (
    <div className={`message-history-sidebar flex flex-col h-full bg-white border-r border-divider ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-divider">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-primary">Conversations</h2>
          <button
            onClick={handleNewConversation}
            className="p-2 text-secondary hover:text-primary hover:bg-parchment rounded-lg transition-colors"
            title="New conversation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            className="w-full pl-10 pr-4 py-2 border border-divider rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-transparent"
          />
          {searchLoading && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <div className="animate-spin w-4 h-4 border-2 border-terracotta border-t-transparent rounded-full"></div>
            </div>
          )}
          
          {/* Search Suggestions Dropdown */}
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-divider rounded-lg shadow-lg z-10">
              <div className="py-1">
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="w-full px-3 py-2 text-left text-sm text-secondary hover:bg-parchment hover:text-primary transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-3 h-3 text-slate-blue/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span>{suggestion}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* View Mode Tabs */}
        <div className="flex mt-3 bg-parchment rounded-lg p-1">
          <button
            onClick={() => setViewMode('conversations')}
            className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'conversations' 
                ? 'bg-white text-primary shadow-sm' 
                : 'text-secondary hover:text-primary'
            }`}
          >
            Conversations
          </button>
          <button
            onClick={() => setViewMode('messages')}
            className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'messages' 
                ? 'bg-white text-primary shadow-sm' 
                : 'text-secondary hover:text-primary'
            }`}
          >
            Messages
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'conversations' ? (
          /* Conversations List */
          <div className="h-full overflow-y-auto">
            {loading ? (
              <div className="p-4">
                <div className="animate-pulse space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-ink/10 rounded w-3/4"></div>
                      <div className="h-3 bg-ink/10 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center">
                <div className="text-secondary text-sm">
                  <div className="mb-2">
                    <svg className="w-12 h-12 mx-auto text-ink/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p>No conversations yet</p>
                  <p className="text-xs mt-1">Start chatting with Mary to see your conversation history</p>
                </div>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {conversations.map((conversation) => (
                  <div key={conversation.id} className="space-y-1">
                    <div
                      onClick={() => handleConversationClick(conversation.id)}
                      className={`block p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedConversation === conversation.id
                          ? 'bg-terracotta/5 border border-terracotta/20'
                          : 'hover:bg-parchment border border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-medium text-primary truncate">
                              {conversation.title}
                            </h3>
                            {conversation.isActive && (
                              <div className="w-2 h-2 bg-forest rounded-full flex-shrink-0"></div>
                            )}
                          </div>
                          
                          <p className="text-xs text-secondary mb-2 line-clamp-2">
                            {truncateMessage(conversation.lastMessage)}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-secondary">
                              <span>{conversation.messageCount} messages</span>
                              {conversation.pathway && (
                                <>
                                  <span>•</span>
                                  <span className="capitalize">{conversation.pathway.replace('-', ' ')}</span>
                                </>
                              )}
                            </div>
                            <span className="text-xs text-secondary">
                              {formatTimestamp(conversation.lastActivity)}
                            </span>
                          </div>
                        </div>
                        
                        <button
                          className="ml-2 p-1 hover:bg-parchment rounded flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleConversationClick(conversation.id)
                          }}
                        >
                          <svg 
                            className={`w-4 h-4 text-secondary transition-transform ${
                              expandedConversations.has(conversation.id) ? 'rotate-90' : ''
                            }`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Expanded Message Preview */}
                    {expandedConversations.has(conversation.id) && (
                      <div className="ml-4 pl-3 border-l-2 border-ink/10 space-y-2 pb-2">
                        {messages.slice(0, 3).map((message) => (
                          <div key={message.id} className="py-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-medium ${
                                message.role === 'assistant' ? 'text-terracotta' : 'text-ink-light'
                              }`}>
                                {message.role === 'assistant' ? 'Mary' : 'You'}
                              </span>
                              <span className="text-xs text-secondary">
                                {formatTimestamp(message.timestamp)}
                              </span>
                            </div>
                            <p className="text-xs text-secondary leading-relaxed">
                              {truncateMessage(message.content, 60)}
                            </p>
                          </div>
                        ))}
                        {messages.length > 3 && (
                          <div className="text-xs text-secondary italic">
                            +{messages.length - 3} more messages
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Messages List */
          <div className="h-full flex flex-col">
            {/* Search Stats */}
            {searchStats && (
              <div className="flex-shrink-0 px-3 py-2 bg-terracotta/5 border-b border-terracotta/20 text-xs text-terracotta">
                <div className="flex items-center justify-between">
                  <span>
                    {searchStats.totalCount} result{searchStats.totalCount !== 1 ? 's' : ''} found
                  </span>
                  <span>
                    {searchStats.searchTime}ms
                  </span>
                </div>
              </div>
            )}
            
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-2 space-y-2"
            >
              {searchLoading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin w-6 h-6 border-2 border-terracotta border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-sm text-secondary">Searching messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="p-4 text-center text-sm text-secondary">
                  {searchQuery.trim() 
                    ? 'No messages found matching your search'
                    : 'Enter a search term to find messages'
                  }
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => {
                      if (message.conversationId) {
                        handleConversationClick(message.conversationId)
                      }
                    }}
                    className="p-3 rounded-lg border border-ink/8 hover:bg-parchment cursor-pointer transition-colors"
                  >
                    {/* Conversation Context Header for Search Results */}
                    {message.conversationTitle && (
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-ink/5">
                        <div className="w-4 h-4 rounded bg-terracotta/10 flex items-center justify-center">
                          <svg className="w-2 h-2 text-terracotta" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <span className="text-xs text-terracotta font-medium truncate">
                          {message.conversationTitle}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        message.role === 'assistant' 
                          ? 'bg-terracotta text-cream'
                          : 'bg-ink/10 text-ink-light'
                      }`}>
                        {message.role === 'assistant' ? 'M' : 'U'}
                      </div>
                      <span className="text-sm font-medium text-primary">
                        {message.role === 'assistant' ? 'Mary' : 'You'}
                      </span>
                      <span className="text-xs text-secondary ml-auto">
                        {formatTimestamp(message.timestamp)}
                      </span>
                    </div>
                    
                    <div 
                      className="text-sm text-secondary leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: message.content.length > 200 
                          ? `${message.content.substring(0, 200)}...`
                          : message.content
                      }}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-3 border-t border-divider bg-parchment">
        <div className="text-xs text-secondary text-center">
          {conversations.length} conversations • {messages.length} messages
        </div>
      </div>
    </div>
  )
}