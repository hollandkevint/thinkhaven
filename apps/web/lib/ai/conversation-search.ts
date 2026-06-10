import { ConversationQueries } from '@/lib/supabase/conversation-queries'

export interface SearchResult {
  type: 'message' | 'conversation' | 'context'
  id: string
  content: string
  conversationId: string
  conversationTitle: string
  timestamp: Date
  relevanceScore?: number
  context?: {
    beforeText?: string
    afterText?: string
    messageRole?: 'user' | 'assistant'
    contextType?: string
  }
}

export interface SearchFilters {
  workspaceId?: string
  dateRange?: {
    start: Date
    end: Date
  }
  messageRole?: 'user' | 'assistant' | 'both'
  conversationIds?: string[]
  includeContext?: boolean
  resultTypes?: Array<'message' | 'conversation' | 'context'>
}

export interface SearchOptions {
  query: string
  filters?: SearchFilters
  limit?: number
  fuzzySearch?: boolean
  highlightMatches?: boolean
}

export interface SearchResponse {
  results: SearchResult[]
  totalCount: number
  searchTime: number
  suggestions?: string[]
  facets?: {
    conversations: Array<{ id: string; title: string; count: number }>
    dateRanges: Array<{ range: string; count: number }>
    roles: Array<{ role: string; count: number }>
  }
}

export class ConversationSearchService {
  constructor(
    private userId: string,
    private workspaceId?: string
  ) {}

  /**
   * Perform comprehensive search across conversations, messages, and context
   */
  async search(options: SearchOptions): Promise<SearchResponse> {
    const startTime = Date.now()
    const { query, filters = {}, limit = 20, highlightMatches = false } = options

    if (!query.trim()) {
      return {
        results: [],
        totalCount: 0,
        searchTime: 0
      }
    }

    try {
      // Determine what to search based on filters
      const resultTypes = filters.resultTypes || ['message', 'conversation', 'context']
      const searchPromises: Promise<Awaited<ReturnType<typeof ConversationQueries.advancedSearch>>>[] = []

      // Advanced search covers all types
      searchPromises.push(
        ConversationQueries.advancedSearch(this.userId, {
          query,
          workspaceId: filters.workspaceId || this.workspaceId,
          dateRange: filters.dateRange,
          messageRole: filters.messageRole === 'both' ? undefined : filters.messageRole,
          conversationIds: filters.conversationIds,
          includeContext: filters.includeContext || resultTypes.includes('context'),
          limit
        })
      )

      const [searchResults] = await Promise.all(searchPromises)
      
      // Process and combine results
      const results: SearchResult[] = []
      
      // Add message results
      if (resultTypes.includes('message')) {
        for (const message of searchResults.messages) {
          results.push({
            type: 'message',
            id: message.id,
            content: highlightMatches ? this.highlightText(message.content, query) : message.content,
            conversationId: message.conversation_id,
            conversationTitle: message.conversation_title,
            timestamp: new Date(message.created_at),
            context: {
              messageRole: message.role
            }
          })
        }
      }

      // Add conversation results
      if (resultTypes.includes('conversation')) {
        for (const conversation of searchResults.conversations) {
          results.push({
            type: 'conversation',
            id: conversation.id,
            content: conversation.title || 'Untitled Conversation',
            conversationId: conversation.id,
            conversationTitle: conversation.title || 'Untitled Conversation',
            timestamp: new Date(conversation.updated_at)
          })
        }
      }

      // Add context results
      if (resultTypes.includes('context') && searchResults.contexts) {
        for (const context of searchResults.contexts) {
          results.push({
            type: 'context',
            id: context.id,
            content: highlightMatches ? this.highlightText(context.content, query) : context.content,
            conversationId: context.conversation_id,
            conversationTitle: context.conversation_title,
            timestamp: new Date(context.created_at),
            context: {
              contextType: context.context_type
            }
          })
        }
      }

      // Sort by relevance (timestamp for now, could be enhanced with proper scoring)
      results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

      // Generate facets for filtering
      const facets = this.generateFacets(results)

      // Generate search suggestions
      const suggestions = await this.generateSuggestions(query, results)

      const searchTime = Date.now() - startTime

      return {
        results: results.slice(0, limit),
        totalCount: results.length,
        searchTime,
        suggestions,
        facets
      }

    } catch (error) {
      console.error('Search failed:', error)
      return {
        results: [],
        totalCount: 0,
        searchTime: Date.now() - startTime
      }
    }
  }

  /**
   * Search within a specific conversation
   */
  async searchInConversation(conversationId: string, query: string, limit = 10): Promise<SearchResult[]> {
    try {
      const messages = await ConversationQueries.searchMessages(conversationId, query, limit)
      
      // Get conversation title for context
      const conversation = await ConversationQueries.getConversation(conversationId)
      const conversationTitle = conversation?.title || 'Untitled Conversation'

      return messages.map(message => ({
        type: 'message' as const,
        id: message.id,
        content: message.content,
        conversationId: message.conversation_id,
        conversationTitle,
        timestamp: new Date(message.created_at),
        context: {
          messageRole: message.role
        }
      }))
    } catch (error) {
      console.error('Conversation search failed:', error)
      return []
    }
  }

  /**
   * Get search suggestions based on user's conversation history
   */
  async getSuggestions(partialQuery: string, limit = 5): Promise<string[]> {
    if (partialQuery.length < 2) return []

    try {
      // Simple implementation - could be enhanced with ML-based suggestions
      const recentConversations = await ConversationQueries.getUserConversations(
        this.userId,
        this.workspaceId,
        10
      )

      const suggestions: Set<string> = new Set()

      // Extract common phrases from conversation titles and context
      for (const conv of recentConversations) {
        if (conv.title) {
          const words = conv.title.toLowerCase().split(/\s+/)
          for (const word of words) {
            if (word.length > 3 && word.startsWith(partialQuery.toLowerCase())) {
              suggestions.add(word)
            }
          }
        }
      }

      return Array.from(suggestions).slice(0, limit)
    } catch (error) {
      console.error('Failed to get suggestions:', error)
      return []
    }
  }

  /**
   * Highlight search matches in text
   */
  private highlightText(text: string, query: string): string {
    const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2)
    let highlightedText = text

    for (const term of searchTerms) {
      const regex = new RegExp(`(${term})`, 'gi')
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>')
    }

    return highlightedText
  }

  /**
   * Generate facets for search filtering
   */
  private generateFacets(results: SearchResult[]): SearchResponse['facets'] {
    const conversations = new Map<string, { title: string; count: number }>()
    const dateRanges = new Map<string, number>()
    const roles = new Map<string, number>()

    for (const result of results) {
      // Conversation facets
      if (!conversations.has(result.conversationId)) {
        conversations.set(result.conversationId, { 
          title: result.conversationTitle, 
          count: 0 
        })
      }
      conversations.get(result.conversationId)!.count++

      // Date range facets
      const dateRange = this.getDateRange(result.timestamp)
      dateRanges.set(dateRange, (dateRanges.get(dateRange) || 0) + 1)

      // Role facets
      if (result.context?.messageRole) {
        const role = result.context.messageRole
        roles.set(role, (roles.get(role) || 0) + 1)
      }
    }

    return {
      conversations: Array.from(conversations.entries()).map(([id, data]) => ({
        id,
        title: data.title,
        count: data.count
      })),
      dateRanges: Array.from(dateRanges.entries()).map(([range, count]) => ({
        range,
        count
      })),
      roles: Array.from(roles.entries()).map(([role, count]) => ({
        role,
        count
      }))
    }
  }

  /**
   * Get readable date range for faceting
   */
  private getDateRange(date: Date): string {
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays <= 7) return 'This week'
    if (diffDays <= 30) return 'This month'
    if (diffDays <= 90) return 'Last 3 months'
    return 'Older'
  }

  /**
   * Generate search suggestions based on results
   */
  private async generateSuggestions(query: string, results: SearchResult[]): Promise<string[]> {
    const suggestions: Set<string> = new Set()

    // Extract keywords from successful search results
    const keywords = new Set<string>()
    
    for (const result of results.slice(0, 5)) {
      const words = result.content.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3)

      words.forEach(word => keywords.add(word))
    }

    // Generate related search suggestions
    const queryWords = query.toLowerCase().split(/\s+/)
    
    for (const keyword of Array.from(keywords)) {
      if (!queryWords.includes(keyword)) {
        suggestions.add(`${query} ${keyword}`)
      }
    }

    return Array.from(suggestions).slice(0, 3)
  }
}

/**
 * Factory function for creating search service instances
 */
export function createConversationSearchService(
  userId: string, 
  workspaceId?: string
): ConversationSearchService {
  return new ConversationSearchService(userId, workspaceId)
}