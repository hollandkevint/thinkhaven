import { ConversationQueries } from '@/lib/supabase/conversation-queries'
import { createConversationSummarizer } from './conversation-summarizer'
import { createBookmarkReferenceManager } from './bookmark-reference-manager'
import { 
  ConversationRow, 
  MessageRow, 
  ConversationContextRow,
  MessageBookmarkRow,
  MessageReferenceRow 
} from '@/lib/supabase/conversation-schema'

export type ExportFormat = 'json' | 'csv' | 'markdown' | 'pdf' | 'txt'

export interface ExportOptions {
  format: ExportFormat
  includeMetadata?: boolean
  includeBookmarks?: boolean
  includeReferences?: boolean
  includeContext?: boolean
  includeSummaries?: boolean
  dateRange?: {
    start: Date
    end: Date
  }
  conversationIds?: string[]
  maxMessages?: number
}

export interface ExportData {
  metadata: {
    exported_at: string
    exported_by: string
    workspace_id?: string
    export_format: string
    total_conversations: number
    total_messages: number
    date_range?: {
      start: string
      end: string
    }
  }
  conversations: Array<{
    conversation: ConversationRow
    messages: MessageRow[]
    context_summaries?: ConversationContextRow[]
    bookmarks?: Array<MessageBookmarkRow & { message_id: string }>
    references?: Array<MessageReferenceRow & { 
      from_message?: MessageRow
      to_message?: MessageRow 
    }>
  }>
}

export interface ExportResult {
  filename: string
  content: string | Blob
  size: number
  format: ExportFormat
  metadata: ExportData['metadata']
}

export class ConversationExporter {
  constructor(
    private userId: string,
    private workspaceId?: string
  ) {}

  /**
   * Export conversations in the specified format
   */
  async exportConversations(options: ExportOptions): Promise<ExportResult> {
    const exportData = await this.prepareExportData(options)
    
    switch (options.format) {
      case 'json':
        return this.exportAsJSON(exportData)
      case 'csv':
        return this.exportAsCSV(exportData)
      case 'markdown':
        return this.exportAsMarkdown(exportData)
      case 'txt':
        return this.exportAsText(exportData)
      case 'pdf':
        return this.exportAsPDF(exportData)
      default:
        throw new Error(`Unsupported export format: ${options.format}`)
    }
  }

  /**
   * Export a single conversation
   */
  async exportConversation(
    conversationId: string, 
    options: Omit<ExportOptions, 'conversationIds'>
  ): Promise<ExportResult> {
    return this.exportConversations({
      ...options,
      conversationIds: [conversationId]
    })
  }

  /**
   * Get export preview/summary
   */
  async getExportPreview(options: ExportOptions): Promise<{
    conversationCount: number
    messageCount: number
    estimatedSize: string
    dateRange?: { start: Date; end: Date }
  }> {
    const conversations = await this.getConversationsForExport(options)
    
    let totalMessages = 0
    let earliestDate: Date | null = null
    let latestDate: Date | null = null

    for (const conv of conversations) {
      totalMessages += conv.message_count
      
      const convDate = new Date(conv.created_at)
      const updatedDate = new Date(conv.updated_at)
      
      if (!earliestDate || convDate < earliestDate) {
        earliestDate = convDate
      }
      if (!latestDate || updatedDate > latestDate) {
        latestDate = updatedDate
      }
    }

    // Estimate size based on average message length and conversation data
    const estimatedBytes = totalMessages * 500 + conversations.length * 1000
    const estimatedSize = this.formatFileSize(estimatedBytes)

    return {
      conversationCount: conversations.length,
      messageCount: totalMessages,
      estimatedSize,
      dateRange: earliestDate && latestDate ? {
        start: earliestDate,
        end: latestDate
      } : undefined
    }
  }

  /**
   * Prepare export data by gathering all required information
   */
  private async prepareExportData(options: ExportOptions): Promise<ExportData> {
    const conversations = await this.getConversationsForExport(options)
    const bookmarkManager = createBookmarkReferenceManager(this.userId)
    
    const exportConversations = []

    for (const conversation of conversations) {
      // Get messages
      let messages = await ConversationQueries.getConversationMessages(conversation.id)
      
      // Apply message limits if specified
      if (options.maxMessages && messages.length > options.maxMessages) {
        messages = messages.slice(-options.maxMessages) // Keep most recent
      }

      // Apply date filtering to messages if specified
      if (options.dateRange) {
        messages = messages.filter(msg => {
          const msgDate = new Date(msg.created_at)
          return msgDate >= options.dateRange!.start && msgDate <= options.dateRange!.end
        })
      }

      const conversationData: any = {
        conversation,
        messages
      }

      // Include context summaries if requested
      if (options.includeContext || options.includeSummaries) {
        conversationData.context_summaries = await ConversationQueries.getConversationContext(conversation.id)
      }

      // Include bookmarks if requested
      if (options.includeBookmarks) {
        const bookmarks = await bookmarkManager.getBookmarks(this.workspaceId)
        conversationData.bookmarks = bookmarks
          .filter(b => b.conversation.id === conversation.id)
          .map(b => ({ ...b, message_id: b.message_id }))
      }

      // Include references if requested
      if (options.includeReferences) {
        conversationData.references = await ConversationQueries.getConversationReferences(
          conversation.id,
          this.userId
        )
      }

      exportConversations.push(conversationData)
    }

    const totalMessages = exportConversations.reduce((sum, conv) => sum + conv.messages.length, 0)

    return {
      metadata: {
        exported_at: new Date().toISOString(),
        exported_by: this.userId,
        workspace_id: this.workspaceId,
        export_format: options.format,
        total_conversations: conversations.length,
        total_messages: totalMessages,
        date_range: options.dateRange ? {
          start: options.dateRange.start.toISOString(),
          end: options.dateRange.end.toISOString()
        } : undefined
      },
      conversations: exportConversations
    }
  }

  /**
   * Get conversations for export based on options
   */
  private async getConversationsForExport(options: ExportOptions): Promise<ConversationRow[]> {
    if (options.conversationIds && options.conversationIds.length > 0) {
      // Export specific conversations
      const conversations = []
      for (const id of options.conversationIds) {
        const conv = await ConversationQueries.getConversation(id)
        if (conv) conversations.push(conv)
      }
      return conversations
    } else {
      // Export all user conversations in workspace
      return ConversationQueries.getUserConversations(this.userId, this.workspaceId, 1000)
    }
  }

  /**
   * Export as JSON
   */
  private async exportAsJSON(data: ExportData): Promise<ExportResult> {
    const content = JSON.stringify(data, null, 2)
    const filename = `conversations_${this.formatDateForFilename(new Date())}.json`
    
    return {
      filename,
      content,
      size: new Blob([content]).size,
      format: 'json',
      metadata: data.metadata
    }
  }

  /**
   * Export as CSV
   */
  private async exportAsCSV(data: ExportData): Promise<ExportResult> {
    const headers = [
      'conversation_id',
      'conversation_title',
      'message_id',
      'role',
      'content',
      'timestamp',
      'message_index',
      'tokens_used'
    ]

    if (data.conversations.some(c => c.bookmarks?.length)) {
      headers.push('bookmarked', 'bookmark_title', 'bookmark_tags')
    }

    const rows = [headers.join(',')]

    for (const conv of data.conversations) {
      for (const message of conv.messages) {
        const bookmark = conv.bookmarks?.find(b => b.message_id === message.id)
        
        const row = [
          conv.conversation.id,
          this.escapeCSV(conv.conversation.title || ''),
          message.id,
          message.role,
          this.escapeCSV(message.content),
          message.created_at,
          message.message_index.toString(),
          (message.metadata?.tokens_used || 0).toString()
        ]

        if (headers.includes('bookmarked')) {
          row.push(
            bookmark ? 'true' : 'false',
            this.escapeCSV(bookmark?.title || ''),
            this.escapeCSV(bookmark?.tags.join(';') || '')
          )
        }

        rows.push(row.join(','))
      }
    }

    const content = rows.join('\n')
    const filename = `conversations_${this.formatDateForFilename(new Date())}.csv`
    
    return {
      filename,
      content,
      size: new Blob([content]).size,
      format: 'csv',
      metadata: data.metadata
    }
  }

  /**
   * Export as Markdown
   */
  private async exportAsMarkdown(data: ExportData): Promise<ExportResult> {
    const lines = []
    
    // Header
    lines.push('# Conversation Export')
    lines.push('')
    lines.push(`**Exported:** ${new Date(data.metadata.exported_at).toLocaleString()}`)
    lines.push(`**Total Conversations:** ${data.metadata.total_conversations}`)
    lines.push(`**Total Messages:** ${data.metadata.total_messages}`)
    
    if (data.metadata.date_range) {
      lines.push(`**Date Range:** ${new Date(data.metadata.date_range.start).toLocaleDateString()} - ${new Date(data.metadata.date_range.end).toLocaleDateString()}`)
    }
    
    lines.push('')
    lines.push('---')
    lines.push('')

    // Conversations
    for (const conv of data.conversations) {
      lines.push(`## ${conv.conversation.title || 'Untitled Conversation'}`)
      lines.push('')
      lines.push(`**Started:** ${new Date(conv.conversation.created_at).toLocaleString()}`)
      lines.push(`**Last Updated:** ${new Date(conv.conversation.updated_at).toLocaleString()}`)
      lines.push(`**Messages:** ${conv.messages.length}`)
      
      if (conv.conversation.bmad_session_id) {
        lines.push(`**BMad Session:** ${conv.conversation.bmad_session_id}`)
      }
      
      lines.push('')

      // Context summaries
      if (conv.context_summaries && conv.context_summaries.length > 0) {
        lines.push('### Key Insights & Context')
        lines.push('')
        
        for (const context of conv.context_summaries) {
          if (context.context_type === 'key_insight' || context.context_type === 'summary') {
            lines.push(`**${context.context_type.replace('_', ' ').toUpperCase()}:**`)
            lines.push(context.content)
            lines.push('')
          }
        }
      }

      // Messages
      lines.push('### Messages')
      lines.push('')

      for (const message of conv.messages) {
        const role = message.role === 'assistant' ? '**Mary (AI Assistant):**' : '**You:**'
        const timestamp = new Date(message.created_at).toLocaleString()
        
        lines.push(`${role} _(${timestamp})_`)
        lines.push('')
        
        // Format message content
        const content = message.content
          .split('\n')
          .map(line => line.trim() ? `${line}` : '')
          .join('\n')
        
        lines.push(content)
        lines.push('')

        // Add bookmark info if present
        const bookmark = conv.bookmarks?.find(b => b.message_id === message.id)
        if (bookmark) {
          lines.push(`> 📌 **Bookmarked:** ${bookmark.title}`)
          if (bookmark.description) {
            lines.push(`> ${bookmark.description}`)
          }
          if (bookmark.tags.length > 0) {
            lines.push(`> **Tags:** ${bookmark.tags.join(', ')}`)
          }
          lines.push('')
        }

        lines.push('---')
        lines.push('')
      }

      // References
      if (conv.references && conv.references.length > 0) {
        lines.push('### Message References')
        lines.push('')
        
        for (const ref of conv.references) {
          lines.push(`- **${ref.reference_type.replace('_', ' ').toUpperCase()}:** ${ref.description || 'No description'}`)
        }
        lines.push('')
      }

      lines.push('')
    }

    const content = lines.join('\n')
    const filename = `conversations_${this.formatDateForFilename(new Date())}.md`
    
    return {
      filename,
      content,
      size: new Blob([content]).size,
      format: 'markdown',
      metadata: data.metadata
    }
  }

  /**
   * Export as plain text
   */
  private async exportAsText(data: ExportData): Promise<ExportResult> {
    const lines = []
    
    // Header
    lines.push('CONVERSATION EXPORT')
    lines.push('='.repeat(50))
    lines.push('')
    lines.push(`Exported: ${new Date(data.metadata.exported_at).toLocaleString()}`)
    lines.push(`Total Conversations: ${data.metadata.total_conversations}`)
    lines.push(`Total Messages: ${data.metadata.total_messages}`)
    lines.push('')

    // Conversations
    for (let i = 0; i < data.conversations.length; i++) {
      const conv = data.conversations[i]
      
      lines.push(`CONVERSATION ${i + 1}: ${conv.conversation.title || 'Untitled'}`)
      lines.push('-'.repeat(50))
      lines.push(`Started: ${new Date(conv.conversation.created_at).toLocaleString()}`)
      lines.push(`Messages: ${conv.messages.length}`)
      lines.push('')

      // Messages
      for (const message of conv.messages) {
        const role = message.role === 'assistant' ? 'Mary' : 'You'
        const timestamp = new Date(message.created_at).toLocaleString()
        
        lines.push(`[${timestamp}] ${role}:`)
        lines.push(message.content)
        lines.push('')
      }

      lines.push('')
    }

    const content = lines.join('\n')
    const filename = `conversations_${this.formatDateForFilename(new Date())}.txt`
    
    return {
      filename,
      content,
      size: new Blob([content]).size,
      format: 'txt',
      metadata: data.metadata
    }
  }

  /**
   * Export as PDF (returns HTML that can be converted to PDF)
   */
  private async exportAsPDF(data: ExportData): Promise<ExportResult> {
    const html = await this.generateHTML(data)
    const filename = `conversations_${this.formatDateForFilename(new Date())}.html`
    
    return {
      filename,
      content: html,
      size: new Blob([html]).size,
      format: 'pdf',
      metadata: data.metadata
    }
  }

  /**
   * Generate HTML content for PDF export
   */
  private async generateHTML(data: ExportData): Promise<string> {
    const styles = `
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #2C2416; margin: 40px; }
        .header { border-bottom: 2px solid #F5F0E6; padding-bottom: 20px; margin-bottom: 30px; }
        .conversation { margin-bottom: 40px; page-break-inside: avoid; }
        .conversation-header { background: #FAF7F2; padding: 15px; border-left: 4px solid #C4785C; margin-bottom: 20px; }
        .message { margin-bottom: 20px; padding: 15px; border-radius: 8px; }
        .message.user { background: #FAF7F2; border-left: 4px solid #C4785C; }
        .message.assistant { background: #F5F0E6; border-left: 4px solid #4A6741; }
        .message-meta { font-size: 0.9em; color: #6B7B8C; margin-bottom: 10px; }
        .bookmark { background: #f5ecd0; border: 1px solid #D4A84B; padding: 10px; margin-top: 10px; border-radius: 4px; }
        .context { background: #d4e5d0; padding: 15px; margin: 20px 0; border-radius: 4px; }
        h1, h2, h3 { color: #2C2416; }
        .meta-info { color: #6B7B8C; font-size: 0.9em; }
      </style>
    `

    const htmlParts = [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head>',
      '<meta charset="UTF-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '<title>Conversation Export</title>',
      styles,
      '</head>',
      '<body>',
      '<div class="header">',
      '<h1>Conversation Export</h1>',
      `<div class="meta-info">`,
      `<p><strong>Exported:</strong> ${new Date(data.metadata.exported_at).toLocaleString()}</p>`,
      `<p><strong>Total Conversations:</strong> ${data.metadata.total_conversations}</p>`,
      `<p><strong>Total Messages:</strong> ${data.metadata.total_messages}</p>`,
      data.metadata.date_range ? `<p><strong>Date Range:</strong> ${new Date(data.metadata.date_range.start).toLocaleDateString()} - ${new Date(data.metadata.date_range.end).toLocaleDateString()}</p>` : '',
      '</div>',
      '</div>'
    ]

    // Add conversations
    for (const conv of data.conversations) {
      htmlParts.push('<div class="conversation">')
      htmlParts.push('<div class="conversation-header">')
      htmlParts.push(`<h2>${this.escapeHTML(conv.conversation.title || 'Untitled Conversation')}</h2>`)
      htmlParts.push(`<p class="meta-info">Started: ${new Date(conv.conversation.created_at).toLocaleString()}</p>`)
      htmlParts.push(`<p class="meta-info">Messages: ${conv.messages.length}</p>`)
      htmlParts.push('</div>')

      // Context summaries
      if (conv.context_summaries && conv.context_summaries.length > 0) {
        const keyInsights = conv.context_summaries.filter(c => c.context_type === 'key_insight')
        if (keyInsights.length > 0) {
          htmlParts.push('<div class="context">')
          htmlParts.push('<h3>Key Insights</h3>')
          for (const insight of keyInsights) {
            htmlParts.push(`<p>${this.escapeHTML(insight.content)}</p>`)
          }
          htmlParts.push('</div>')
        }
      }

      // Messages
      for (const message of conv.messages) {
        const messageClass = message.role === 'assistant' ? 'assistant' : 'user'
        const roleName = message.role === 'assistant' ? 'Mary (AI Assistant)' : 'You'
        
        htmlParts.push(`<div class="message ${messageClass}">`)
        htmlParts.push('<div class="message-meta">')
        htmlParts.push(`<strong>${roleName}</strong> - ${new Date(message.created_at).toLocaleString()}`)
        htmlParts.push('</div>')
        htmlParts.push(`<div>${this.escapeHTML(message.content).replace(/\n/g, '<br>')}</div>`)
        
        // Add bookmark if present
        const bookmark = conv.bookmarks?.find(b => b.message_id === message.id)
        if (bookmark) {
          htmlParts.push('<div class="bookmark">')
          htmlParts.push(`<strong>📌 ${this.escapeHTML(bookmark.title)}</strong>`)
          if (bookmark.description) {
            htmlParts.push(`<p>${this.escapeHTML(bookmark.description)}</p>`)
          }
          if (bookmark.tags.length > 0) {
            htmlParts.push(`<p><em>Tags: ${bookmark.tags.map(t => this.escapeHTML(t)).join(', ')}</em></p>`)
          }
          htmlParts.push('</div>')
        }
        
        htmlParts.push('</div>')
      }

      htmlParts.push('</div>')
    }

    htmlParts.push('</body></html>')
    
    return htmlParts.join('\n')
  }

  // Utility methods
  private escapeCSV(text: string): string {
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`
    }
    return text
  }

  private escapeHTML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  private formatDateForFilename(date: Date): string {
    return date.toISOString().split('T')[0].replace(/-/g, '')
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

/**
 * Factory function for creating conversation exporters
 */
export function createConversationExporter(
  userId: string, 
  workspaceId?: string
): ConversationExporter {
  return new ConversationExporter(userId, workspaceId)
}