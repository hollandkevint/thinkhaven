import { supabase } from './client'
import type { 
  ConversationRow, 
  ConversationInsert, 
  ConversationUpdate,
  MessageRow,
  MessageInsert,
  ConversationContextRow,
  ConversationContextInsert,
  MessageBookmarkRow,
  MessageBookmarkInsert,
  MessageBookmarkUpdate,
  MessageReferenceRow,
  MessageReferenceInsert
} from './conversation-schema'

/** Joined conversation fields selected alongside messages/contexts. */
interface JoinedConversation {
  id: string
  title?: string
  user_id: string
  workspace_id: string
}

type MessageWithConversation = MessageRow & {
  conversation?: JoinedConversation | null
}

type ContextWithConversation = ConversationContextRow & {
  conversation?: JoinedConversation | null
}

export class ConversationQueries {
  // Conversation CRUD operations
  static async createConversation(data: ConversationInsert): Promise<ConversationRow> {
    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert(data)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create conversation: ${error.message}`)
    }

    return conversation
  }

  static async getConversation(id: string): Promise<ConversationRow | null> {
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Failed to get conversation: ${error.message}`)
    }

    return conversation
  }

  static async getUserConversations(
    userId: string, 
    workspaceId?: string,
    limit = 50
  ): Promise<ConversationRow[]> {
    let query = supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    const { data: conversations, error } = await query

    if (error) {
      throw new Error(`Failed to get user conversations: ${error.message}`)
    }

    return conversations || []
  }

  static async updateConversation(id: string, data: ConversationUpdate): Promise<ConversationRow> {
    const { data: conversation, error } = await supabase
      .from('conversations')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update conversation: ${error.message}`)
    }

    return conversation
  }

  static async deleteConversation(id: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete conversation: ${error.message}`)
    }
  }

  // Message CRUD operations
  static async addMessage(data: MessageInsert): Promise<MessageRow> {
    const { data: message, error } = await supabase
      .from('messages')
      .insert(data)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to add message: ${error.message}`)
    }

    // Update conversation message count and timestamp
    await supabase.rpc('increment_message_count', {
      conversation_id: data.conversation_id,
      token_count: data.metadata?.tokens_used || 0
    })

    return message
  }

  static async getConversationMessages(
    conversationId: string,
    limit?: number,
    beforeMessageIndex?: number
  ): Promise<MessageRow[]> {
    let query = supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('message_index', { ascending: true })

    if (limit) {
      query = query.limit(limit)
    }

    if (beforeMessageIndex !== undefined) {
      query = query.lt('message_index', beforeMessageIndex)
    }

    const { data: messages, error } = await query

    if (error) {
      throw new Error(`Failed to get conversation messages: ${error.message}`)
    }

    return messages || []
  }

  static async getRecentMessages(
    conversationId: string, 
    count = 20
  ): Promise<MessageRow[]> {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('message_index', { ascending: false })
      .limit(count)

    if (error) {
      throw new Error(`Failed to get recent messages: ${error.message}`)
    }

    return (messages || []).reverse() // Return in chronological order
  }

  static async searchMessages(
    conversationId: string,
    searchQuery: string,
    limit = 10
  ): Promise<MessageRow[]> {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .textSearch('content', searchQuery)
      .order('message_index', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to search messages: ${error.message}`)
    }

    return messages || []
  }

  // Enhanced search operations
  static async searchAllMessages(
    userId: string,
    searchQuery: string,
    workspaceId?: string,
    limit = 20
  ): Promise<Array<MessageRow & { conversation_title: string; conversation_id: string }>> {
    let query = supabase
      .from('messages')
      .select(`
        *,
        conversation:conversations!inner(
          id,
          title,
          user_id,
          workspace_id
        )
      `)
      .eq('conversation.user_id', userId)
      .textSearch('content', searchQuery)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (workspaceId) {
      query = query.eq('conversation.workspace_id', workspaceId)
    }

    const { data: results, error } = await query

    if (error) {
      throw new Error(`Failed to search all messages: ${error.message}`)
    }

    return (results || []).map((result: MessageWithConversation) => ({
      ...result,
      conversation_title: result.conversation?.title || 'Untitled Conversation',
      conversation_id: result.conversation?.id || result.conversation_id
    }))
  }

  static async searchConversations(
    userId: string,
    searchQuery: string,
    workspaceId?: string,
    limit = 10
  ): Promise<ConversationRow[]> {
    let query = supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .or(`title.ilike.%${searchQuery}%,context_summary.ilike.%${searchQuery}%`)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    const { data: conversations, error } = await query

    if (error) {
      throw new Error(`Failed to search conversations: ${error.message}`)
    }

    return conversations || []
  }

  static async advancedSearch(
    userId: string,
    options: {
      query: string
      workspaceId?: string
      dateRange?: { start: Date; end: Date }
      messageRole?: 'user' | 'assistant'
      conversationIds?: string[]
      includeContext?: boolean
      limit?: number
    }
  ): Promise<{
    messages: Array<MessageRow & { conversation_title: string; conversation_id: string }>
    conversations: ConversationRow[]
    contexts: Array<ConversationContextRow & { conversation_title: string }>
  }> {
    const { 
      query: searchQuery, 
      workspaceId, 
      dateRange, 
      messageRole, 
      conversationIds,
      includeContext = false,
      limit = 20 
    } = options

    // Search messages
    let messageQuery = supabase
      .from('messages')
      .select(`
        *,
        conversation:conversations!inner(
          id,
          title,
          user_id,
          workspace_id
        )
      `)
      .eq('conversation.user_id', userId)
      .textSearch('content', searchQuery)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (workspaceId) {
      messageQuery = messageQuery.eq('conversation.workspace_id', workspaceId)
    }

    if (dateRange) {
      messageQuery = messageQuery
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString())
    }

    if (messageRole) {
      messageQuery = messageQuery.eq('role', messageRole)
    }

    if (conversationIds && conversationIds.length > 0) {
      messageQuery = messageQuery.in('conversation_id', conversationIds)
    }

    // Search conversations
    let conversationQuery = supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .or(`title.ilike.%${searchQuery}%,context_summary.ilike.%${searchQuery}%`)
      .order('updated_at', { ascending: false })
      .limit(Math.floor(limit / 2))

    if (workspaceId) {
      conversationQuery = conversationQuery.eq('workspace_id', workspaceId)
    }

    if (dateRange) {
      conversationQuery = conversationQuery
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString())
    }

    // Execute searches in parallel
    const [messageResults, conversationResults] = await Promise.all([
      messageQuery,
      conversationQuery
    ])

    if (messageResults.error) {
      throw new Error(`Message search failed: ${messageResults.error.message}`)
    }

    if (conversationResults.error) {
      throw new Error(`Conversation search failed: ${conversationResults.error.message}`)
    }

    let contextResults: { data: ContextWithConversation[] | null; error: { message: string } | null } = { data: [], error: null }

    // Search conversation context if requested
    if (includeContext) {
      let contextQuery = supabase
        .from('conversation_context')
        .select(`
          *,
          conversation:conversations!inner(
            id,
            title,
            user_id,
            workspace_id
          )
        `)
        .eq('conversation.user_id', userId)
        .textSearch('content', searchQuery)
        .order('created_at', { ascending: false })
        .limit(Math.floor(limit / 3))

      if (workspaceId) {
        contextQuery = contextQuery.eq('conversation.workspace_id', workspaceId)
      }

      contextResults = await contextQuery
    }

    return {
      messages: (messageResults.data || []).map((result: MessageWithConversation) => ({
        ...result,
        conversation_title: result.conversation?.title || 'Untitled Conversation',
        conversation_id: result.conversation?.id || result.conversation_id
      })),
      conversations: conversationResults.data || [],
      contexts: (contextResults.data || []).map((result: ContextWithConversation) => ({
        ...result,
        conversation_title: result.conversation?.title || 'Untitled Conversation'
      }))
    }
  }

  // Context management operations
  static async addConversationContext(data: ConversationContextInsert): Promise<ConversationContextRow> {
    const { data: context, error } = await supabase
      .from('conversation_context')
      .insert(data)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to add conversation context: ${error.message}`)
    }

    return context
  }

  static async getConversationContext(
    conversationId: string,
    contextType?: string
  ): Promise<ConversationContextRow[]> {
    let query = supabase
      .from('conversation_context')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })

    if (contextType) {
      query = query.eq('context_type', contextType)
    }

    const { data: context, error } = await query

    if (error) {
      throw new Error(`Failed to get conversation context: ${error.message}`)
    }

    return context || []
  }

  // Utility methods
  static async getConversationStats(conversationId: string): Promise<{
    messageCount: number
    totalTokens: number
    contextSummaries: number
    duration: number
  }> {
    const conversation = await this.getConversation(conversationId)
    if (!conversation) {
      throw new Error('Conversation not found')
    }

    const contextSummaries = await this.getConversationContext(conversationId, 'summary')
    
    const duration = new Date(conversation.updated_at).getTime() - 
                    new Date(conversation.created_at).getTime()

    return {
      messageCount: conversation.message_count,
      totalTokens: conversation.total_tokens,
      contextSummaries: contextSummaries.length,
      duration
    }
  }

  static async cleanupOldContexts(conversationId: string, keepCount = 5): Promise<void> {
    // Keep only the most recent context summaries to prevent unbounded growth
    const { data: contexts, error } = await supabase
      .from('conversation_context')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('context_type', 'summary')
      .order('created_at', { ascending: false })
      .range(keepCount, 999) // Skip the first 'keepCount' records

    if (error) {
      throw new Error(`Failed to get old contexts: ${error.message}`)
    }

    if (contexts && contexts.length > 0) {
      const idsToDelete = contexts.map((c: { id: string }) => c.id)
      await supabase
        .from('conversation_context')
        .delete()
        .in('id', idsToDelete)
    }
  }

  // Message bookmark operations
  static async createBookmark(data: MessageBookmarkInsert): Promise<MessageBookmarkRow> {
    const { data: bookmark, error } = await supabase
      .from('message_bookmarks')
      .insert({
        ...data,
        tags: data.tags || [],
        color: data.color || 'blue'
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create bookmark: ${error.message}`)
    }

    return bookmark
  }

  static async getUserBookmarks(
    userId: string,
    workspaceId?: string,
    limit = 50
  ): Promise<Array<MessageBookmarkRow & { message: MessageRow; conversation: ConversationRow }>> {
    let query = supabase
      .from('message_bookmarks')
      .select(`
        *,
        message:messages!inner(*),
        conversation:messages.conversation_id(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (workspaceId) {
      query = query.eq('conversation.workspace_id', workspaceId)
    }

    // overrideTypes: the dotted rename syntax in the select string is not
    // understood by the postgrest-js type parser, so the result is typed here.
    const { data: bookmarks, error } = await query.overrideTypes<
      Array<MessageBookmarkRow & { message: MessageRow; conversation: ConversationRow }>,
      { merge: false }
    >()

    if (error) {
      throw new Error(`Failed to get user bookmarks: ${error.message}`)
    }

    return bookmarks || []
  }

  static async getMessageBookmarks(messageId: string): Promise<MessageBookmarkRow[]> {
    const { data: bookmarks, error } = await supabase
      .from('message_bookmarks')
      .select('*')
      .eq('message_id', messageId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get message bookmarks: ${error.message}`)
    }

    return bookmarks || []
  }

  static async updateBookmark(id: string, data: MessageBookmarkUpdate): Promise<MessageBookmarkRow> {
    const { data: bookmark, error } = await supabase
      .from('message_bookmarks')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update bookmark: ${error.message}`)
    }

    return bookmark
  }

  static async deleteBookmark(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('message_bookmarks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to delete bookmark: ${error.message}`)
    }
  }

  static async searchBookmarks(
    userId: string,
    searchQuery: string,
    tags?: string[],
    limit = 20
  ): Promise<Array<MessageBookmarkRow & { message: MessageRow; conversation: ConversationRow }>> {
    let query = supabase
      .from('message_bookmarks')
      .select(`
        *,
        message:messages!inner(*),
        conversation:messages.conversation_id(*)
      `)
      .eq('user_id', userId)
      .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (tags && tags.length > 0) {
      query = query.contains('tags', tags)
    }

    // overrideTypes: dotted rename syntax is not parseable by postgrest-js types
    const { data: bookmarks, error } = await query.overrideTypes<
      Array<MessageBookmarkRow & { message: MessageRow; conversation: ConversationRow }>,
      { merge: false }
    >()

    if (error) {
      throw new Error(`Failed to search bookmarks: ${error.message}`)
    }

    return bookmarks || []
  }

  // Message reference operations
  static async createReference(data: MessageReferenceInsert): Promise<MessageReferenceRow> {
    const { data: reference, error } = await supabase
      .from('message_references')
      .insert(data)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create reference: ${error.message}`)
    }

    return reference
  }

  static async getMessageReferences(
    messageId: string,
    direction: 'from' | 'to' | 'both' = 'both'
  ): Promise<Array<MessageReferenceRow & { 
    from_message?: MessageRow; 
    to_message?: MessageRow;
    from_conversation?: ConversationRow;
    to_conversation?: ConversationRow;
  }>> {
    let query = supabase
      .from('message_references')
      .select(`
        *,
        from_message:messages!from_message_id(*),
        to_message:messages!to_message_id(*),
        from_conversation:from_message.conversation_id(*),
        to_conversation:to_message.conversation_id(*)
      `)

    if (direction === 'from') {
      query = query.eq('from_message_id', messageId)
    } else if (direction === 'to') {
      query = query.eq('to_message_id', messageId)
    } else {
      query = query.or(`from_message_id.eq.${messageId},to_message_id.eq.${messageId}`)
    }

    // overrideTypes: dotted rename syntax is not parseable by postgrest-js types
    const { data: references, error } = await query.overrideTypes<
      Array<MessageReferenceRow & {
        from_message?: MessageRow
        to_message?: MessageRow
        from_conversation?: ConversationRow
        to_conversation?: ConversationRow
      }>,
      { merge: false }
    >()

    if (error) {
      throw new Error(`Failed to get message references: ${error.message}`)
    }

    return references || []
  }

  static async deleteReference(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('message_references')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to delete reference: ${error.message}`)
    }
  }

  static async getConversationReferences(
    conversationId: string,
    userId: string
  ): Promise<Array<MessageReferenceRow & {
    from_message?: MessageRow;
    to_message?: MessageRow;
    related_conversation?: ConversationRow;
  }>> {
    // Get all messages in the conversation
    const messages = await this.getConversationMessages(conversationId)
    const messageIds = messages.map(m => m.id)

    if (messageIds.length === 0) return []

    const { data: references, error } = await supabase
      .from('message_references')
      .select(`
        *,
        from_message:messages!from_message_id(*),
        to_message:messages!to_message_id(*),
        related_conversation:messages.conversation_id(*)
      `)
      .eq('user_id', userId)
      .or(`from_message_id.in.(${messageIds.join(',')}),to_message_id.in.(${messageIds.join(',')})`)
      // overrideTypes: dotted rename syntax is not parseable by postgrest-js types
      .overrideTypes<
        Array<MessageReferenceRow & {
          from_message?: MessageRow
          to_message?: MessageRow
          related_conversation?: ConversationRow
        }>,
        { merge: false }
      >()

    if (error) {
      throw new Error(`Failed to get conversation references: ${error.message}`)
    }

    return references || []
  }

  // Tag management for bookmarks
  static async getAllBookmarkTags(userId: string, workspaceId?: string): Promise<Array<{ tag: string; count: number }>> {
    let query = supabase
      .from('message_bookmarks')
      .select(`
        tags,
        message:messages!inner(
          conversation:conversations!inner(workspace_id)
        )
      `)
      .eq('user_id', userId)

    if (workspaceId) {
      query = query.eq('message.conversation.workspace_id', workspaceId)
    }

    const { data: bookmarks, error } = await query

    if (error) {
      throw new Error(`Failed to get bookmark tags: ${error.message}`)
    }

    // Count tag occurrences
    const tagCounts = new Map<string, number>()
    
    for (const bookmark of bookmarks || []) {
      for (const tag of bookmark.tags || []) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      }
    }

    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
  }
}

// Database functions that should be created in Supabase
export const requiredDatabaseFunctions = `
-- Function to increment message count and update timestamps
CREATE OR REPLACE FUNCTION increment_message_count(conversation_id UUID, token_count INTEGER DEFAULT 0)
RETURNS void AS $$
BEGIN
  UPDATE conversations 
  SET 
    message_count = message_count + 1,
    total_tokens = total_tokens + token_count,
    updated_at = NOW()
  WHERE id = conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Full text search configuration for messages
CREATE INDEX IF NOT EXISTS messages_content_search_idx 
ON messages USING gin(to_tsvector('english', content));
`