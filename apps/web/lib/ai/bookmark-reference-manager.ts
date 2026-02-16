import { ConversationQueries } from '@/lib/supabase/conversation-queries'
import { 
  MessageBookmarkRow, 
  MessageBookmarkInsert, 
  MessageBookmarkUpdate,
  MessageReferenceRow,
  MessageReferenceInsert,
  MessageRow,
  ConversationRow
} from '@/lib/supabase/conversation-schema'

export interface BookmarkWithContext extends MessageBookmarkRow {
  message: MessageRow
  conversation: ConversationRow
}

export interface ReferenceWithContext extends MessageReferenceRow {
  from_message?: MessageRow
  to_message?: MessageRow
  from_conversation?: ConversationRow
  to_conversation?: ConversationRow
}

export interface BookmarkCreateData {
  messageId: string
  title: string
  description?: string
  tags?: string[]
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'pink' | 'indigo'
}

export interface ReferenceCreateData {
  fromMessageId: string
  toMessageId: string
  referenceType: 'follow_up' | 'related' | 'contradiction' | 'builds_on' | 'question' | 'answer'
  description?: string
}

export class BookmarkReferenceManager {
  constructor(private userId: string) {}

  // Bookmark Management
  async createBookmark(data: BookmarkCreateData): Promise<MessageBookmarkRow> {
    const bookmarkData: MessageBookmarkInsert = {
      message_id: data.messageId,
      user_id: this.userId,
      title: data.title,
      description: data.description,
      tags: data.tags || [],
      color: data.color || 'blue'
    }

    return ConversationQueries.createBookmark(bookmarkData)
  }

  async getBookmarks(workspaceId?: string, limit = 50): Promise<BookmarkWithContext[]> {
    return ConversationQueries.getUserBookmarks(this.userId, workspaceId, limit)
  }

  async getMessageBookmarks(messageId: string): Promise<MessageBookmarkRow[]> {
    return ConversationQueries.getMessageBookmarks(messageId)
  }

  async updateBookmark(bookmarkId: string, updates: Partial<BookmarkCreateData>): Promise<MessageBookmarkRow> {
    const updateData: MessageBookmarkUpdate = {
      title: updates.title,
      description: updates.description,
      tags: updates.tags,
      color: updates.color
    }

    return ConversationQueries.updateBookmark(bookmarkId, updateData)
  }

  async deleteBookmark(bookmarkId: string): Promise<void> {
    return ConversationQueries.deleteBookmark(bookmarkId, this.userId)
  }

  async searchBookmarks(query: string, tags?: string[], limit = 20): Promise<BookmarkWithContext[]> {
    return ConversationQueries.searchBookmarks(this.userId, query, tags, limit)
  }

  async getBookmarkTags(workspaceId?: string): Promise<Array<{ tag: string; count: number }>> {
    return ConversationQueries.getAllBookmarkTags(this.userId, workspaceId)
  }

  // Reference Management
  async createReference(data: ReferenceCreateData): Promise<MessageReferenceRow> {
    const referenceData: MessageReferenceInsert = {
      from_message_id: data.fromMessageId,
      to_message_id: data.toMessageId,
      user_id: this.userId,
      reference_type: data.referenceType,
      description: data.description
    }

    return ConversationQueries.createReference(referenceData)
  }

  async getMessageReferences(
    messageId: string, 
    direction: 'from' | 'to' | 'both' = 'both'
  ): Promise<ReferenceWithContext[]> {
    return ConversationQueries.getMessageReferences(messageId, direction)
  }

  async getConversationReferences(conversationId: string): Promise<ReferenceWithContext[]> {
    return ConversationQueries.getConversationReferences(conversationId, this.userId)
  }

  async deleteReference(referenceId: string): Promise<void> {
    return ConversationQueries.deleteReference(referenceId, this.userId)
  }

  // Utility Methods
  async isMessageBookmarked(messageId: string): Promise<boolean> {
    const bookmarks = await this.getMessageBookmarks(messageId)
    return bookmarks.length > 0
  }

  async getBookmarksByTag(tag: string, workspaceId?: string): Promise<BookmarkWithContext[]> {
    return this.searchBookmarks('', [tag])
  }

  async getRelatedMessages(messageId: string): Promise<{
    references: ReferenceWithContext[]
    bookmarks: MessageBookmarkRow[]
    relatedBookmarks: BookmarkWithContext[]
  }> {
    // Get direct references
    const references = await this.getMessageReferences(messageId)
    
    // Get bookmarks for this message
    const bookmarks = await this.getMessageBookmarks(messageId)
    
    // Get messages with similar tags if this message is bookmarked
    let relatedBookmarks: BookmarkWithContext[] = []
    if (bookmarks.length > 0) {
      const allTags = bookmarks.flatMap(b => b.tags)
      if (allTags.length > 0) {
        relatedBookmarks = await this.searchBookmarks('', allTags.slice(0, 3))
        // Remove the current message's bookmarks from related
        relatedBookmarks = relatedBookmarks.filter(b => b.message_id !== messageId)
      }
    }

    return {
      references,
      bookmarks,
      relatedBookmarks: relatedBookmarks.slice(0, 10) // Limit related bookmarks
    }
  }

  async getBookmarkStats(workspaceId?: string): Promise<{
    totalBookmarks: number
    totalTags: number
    topTags: Array<{ tag: string; count: number }>
    recentBookmarks: BookmarkWithContext[]
  }> {
    const [bookmarks, tags] = await Promise.all([
      this.getBookmarks(workspaceId, 100),
      this.getBookmarkTags(workspaceId)
    ])

    return {
      totalBookmarks: bookmarks.length,
      totalTags: tags.length,
      topTags: tags.slice(0, 10),
      recentBookmarks: bookmarks.slice(0, 5)
    }
  }

  // Smart suggestions for bookmark creation
  async suggestBookmarkData(messageId: string, messageContent: string): Promise<{
    suggestedTitle: string
    suggestedTags: string[]
    suggestedColor: string
  }> {
    // Simple content-based suggestions (could be enhanced with AI)
    const contentWords = messageContent
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)

    // Common strategic keywords that might appear in coaching conversations
    const strategicKeywords = {
      'strategy': 'blue',
      'market': 'green',
      'customer': 'purple',
      'product': 'indigo',
      'revenue': 'yellow',
      'growth': 'green',
      'risk': 'red',
      'opportunity': 'blue',
      'competitive': 'red',
      'innovation': 'purple',
      'decision': 'yellow',
      'analysis': 'blue',
      'insight': 'green',
      'action': 'yellow'
    }

    const suggestedTags: string[] = []
    let suggestedColor = 'blue'

    // Extract relevant keywords as tags
    for (const word of contentWords.slice(0, 20)) {
      if (strategicKeywords[word]) {
        suggestedTags.push(word)
        suggestedColor = strategicKeywords[word]
      }
    }

    // Generate a title from the first part of the content
    const suggestedTitle = messageContent
      .substring(0, 50)
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/[^\w\s-]/g, '')
      .substring(0, 40) + (messageContent.length > 50 ? '...' : '')

    return {
      suggestedTitle: suggestedTitle || 'Important Message',
      suggestedTags: [...new Set(suggestedTags)].slice(0, 5), // Remove duplicates and limit
      suggestedColor
    }
  }

  // Export bookmarks for backup or sharing
  async exportBookmarks(workspaceId?: string): Promise<{
    bookmarks: Array<{
      id: string
      title: string
      description?: string
      tags: string[]
      color: string
      created_at: string
      message_content: string
      conversation_title: string
      conversation_id: string
    }>
    metadata: {
      exported_at: string
      user_id: string
      workspace_id?: string
      total_count: number
    }
  }> {
    const bookmarks = await this.getBookmarks(workspaceId, 1000)

    return {
      bookmarks: bookmarks.map(bookmark => ({
        id: bookmark.id,
        title: bookmark.title,
        description: bookmark.description,
        tags: bookmark.tags,
        color: bookmark.color,
        created_at: bookmark.created_at,
        message_content: bookmark.message.content,
        conversation_title: bookmark.conversation.title || 'Untitled Conversation',
        conversation_id: bookmark.conversation.id
      })),
      metadata: {
        exported_at: new Date().toISOString(),
        user_id: this.userId,
        workspace_id: workspaceId,
        total_count: bookmarks.length
      }
    }
  }
}

// Utility functions for colors and reference types
export const BOOKMARK_COLORS = {
  blue: { bg: 'bg-terracotta/10', text: 'text-terracotta', border: 'border-terracotta/20' },
  green: { bg: 'bg-forest/10', text: 'text-forest', border: 'border-forest/20' },
  yellow: { bg: 'bg-mustard/10', text: 'text-mustard', border: 'border-mustard/20' },
  red: { bg: 'bg-rust/10', text: 'text-rust', border: 'border-rust/20' },
  purple: { bg: 'bg-dusty-rose/20', text: 'text-ink', border: 'border-dusty-rose/30' },
  pink: { bg: 'bg-dusty-rose/10', text: 'text-ink', border: 'border-dusty-rose/20' },
  indigo: { bg: 'bg-slate-blue/10', text: 'text-slate-blue', border: 'border-slate-blue/20' }
} as const

export const REFERENCE_TYPES = {
  follow_up: { label: 'Follow Up', icon: '↗️', description: 'This message follows up on the referenced message' },
  related: { label: 'Related', icon: '🔗', description: 'This message is related to the referenced message' },
  contradiction: { label: 'Contradiction', icon: '❌', description: 'This message contradicts the referenced message' },
  builds_on: { label: 'Builds On', icon: '🏗️', description: 'This message builds upon the referenced message' },
  question: { label: 'Question', icon: '❓', description: 'This message asks about the referenced message' },
  answer: { label: 'Answer', icon: '✅', description: 'This message answers the referenced message' }
} as const

/**
 * Factory function for creating bookmark and reference managers
 */
export function createBookmarkReferenceManager(userId: string): BookmarkReferenceManager {
  return new BookmarkReferenceManager(userId)
}