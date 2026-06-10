import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ConversationExporter } from '@/lib/ai/conversation-export'
import { ConversationQueries } from '@/lib/supabase/conversation-queries'

// The exporter reads through static ConversationQueries methods and the bookmark
// manager factory — those are the seams to mock (it takes no injected client).
vi.mock('@/lib/supabase/conversation-queries', () => ({
  ConversationQueries: {
    getUserConversations: vi.fn(),
    getConversation: vi.fn(),
    getConversationMessages: vi.fn(),
    getConversationContext: vi.fn(),
    getConversationReferences: vi.fn()
  }
}))

const mockGetBookmarks = vi.fn()
vi.mock('@/lib/ai/bookmark-reference-manager', () => ({
  createBookmarkReferenceManager: () => ({ getBookmarks: mockGetBookmarks })
}))

vi.mock('@/lib/ai/conversation-summarizer', () => ({
  createConversationSummarizer: vi.fn()
}))

const mockQueries = vi.mocked(ConversationQueries)

const mockConversation = {
  id: '1',
  title: 'Strategic Planning Session',
  message_count: 2,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T01:00:00Z'
}

const mockMessages = [
  {
    id: 'msg-1',
    conversation_id: '1',
    role: 'user',
    content: 'How can I improve my business strategy?',
    created_at: '2024-01-01T00:00:00Z',
    message_index: 0,
    metadata: { tokens_used: 10 }
  },
  {
    id: 'msg-2',
    conversation_id: '1',
    role: 'assistant',
    content: 'Let me help you explore strategic improvements...',
    created_at: '2024-01-01T00:05:00Z',
    message_index: 1,
    metadata: { tokens_used: 65 }
  }
]

const mockBookmarks = [
  {
    id: 'bm-1',
    message_id: 'msg-2',
    title: 'Key Strategic Insight',
    description: 'Important strategic framework discussion',
    tags: ['strategy', 'framework'],
    color: 'blue',
    conversation: { id: '1' }
  }
]

describe('ConversationExporter', () => {
  let exporter: ConversationExporter

  beforeEach(() => {
    vi.clearAllMocks()
    exporter = new ConversationExporter('user-123', 'workspace-456')

    mockQueries.getUserConversations.mockResolvedValue([mockConversation] as never)
    mockQueries.getConversation.mockResolvedValue(mockConversation as never)
    mockQueries.getConversationMessages.mockResolvedValue(mockMessages as never)
    mockQueries.getConversationContext.mockResolvedValue([] as never)
    mockQueries.getConversationReferences.mockResolvedValue([] as never)
    mockGetBookmarks.mockResolvedValue(mockBookmarks)
  })

  describe('JSON Export', () => {
    it('should export conversations as JSON with all metadata', async () => {
      const result = await exporter.exportConversations({
        format: 'json',
        includeMetadata: true,
        includeBookmarks: true,
        includeReferences: true,
        includeContext: true
      })

      expect(result.format).toBe('json')
      expect(result.filename).toMatch(/conversations_\d+\.json/)

      const content = JSON.parse(result.content as string)
      expect(content.conversations).toHaveLength(1)
      expect(content.conversations[0].conversation.id).toBe('1')
      expect(content.conversations[0].messages).toHaveLength(2)
      expect(content.conversations[0].bookmarks).toHaveLength(1)
      expect(content.metadata.total_conversations).toBe(1)
      expect(content.metadata.total_messages).toBe(2)
      expect(content.metadata.exported_by).toBe('user-123')
      expect(content.metadata.workspace_id).toBe('workspace-456')
    })

    it('should handle empty conversation data gracefully', async () => {
      mockQueries.getUserConversations.mockResolvedValue([] as never)

      const result = await exporter.exportConversations({ format: 'json' })

      const content = JSON.parse(result.content as string)
      expect(content.conversations).toHaveLength(0)
      expect(content.metadata.total_conversations).toBe(0)
      expect(content.metadata.total_messages).toBe(0)
    })
  })

  describe('CSV Export', () => {
    it('should export conversations as CSV with proper formatting', async () => {
      const result = await exporter.exportConversations({ format: 'csv' })

      const lines = (result.content as string).split('\n')
      expect(lines[0]).toBe(
        'conversation_id,conversation_title,message_id,role,content,timestamp,message_index,tokens_used'
      )
      expect(lines).toHaveLength(3) // header + 2 message rows
      expect(lines[1]).toContain('msg-1')
      expect(lines[1]).toContain('user')
      expect(lines[2]).toContain('msg-2')
      expect(lines[2]).toContain('assistant')
    })

    it('should properly escape CSV special characters', async () => {
      mockQueries.getConversationMessages.mockResolvedValue([
        {
          ...mockMessages[0],
          content: 'Contains, commas and "quotes" here'
        }
      ] as never)

      const result = await exporter.exportConversations({ format: 'csv' })

      expect(result.content as string).toContain('"Contains, commas and ""quotes"" here"')
    })
  })

  describe('Markdown Export', () => {
    it('should export conversations as properly formatted Markdown', async () => {
      const result = await exporter.exportConversations({
        format: 'markdown',
        includeBookmarks: true
      })

      const content = result.content as string
      expect(content).toContain('# Conversation Export')
      expect(content).toContain('## Strategic Planning Session')
      expect(content).toContain('**You:**')
      expect(content).toContain('**Mary (AI Assistant):**')
      expect(content).toContain('📌 **Bookmarked:** Key Strategic Insight')
      expect(result.filename).toMatch(/conversations_\d+\.md/)
    })
  })

  describe('Export Preview', () => {
    it('should generate accurate export preview statistics', async () => {
      const preview = await exporter.getExportPreview({ format: 'json' })

      expect(preview.conversationCount).toBe(1)
      expect(preview.messageCount).toBe(2) // from conversation.message_count
      expect(preview.dateRange?.start).toEqual(new Date('2024-01-01T00:00:00Z'))
      expect(preview.dateRange?.end).toEqual(new Date('2024-01-01T01:00:00Z'))
    })

    it('should calculate estimated file sizes accurately', async () => {
      const preview = await exporter.getExportPreview({ format: 'json' })

      // 2 messages * 500 + 1 conversation * 1000 = 2000 bytes -> "1.95 KB"
      expect(preview.estimatedSize).toBe('1.95 KB')
    })
  })

  describe('Date Range Filtering', () => {
    it('should filter conversations by date range', async () => {
      const result = await exporter.exportConversations({
        format: 'json',
        dateRange: {
          start: new Date('2024-01-01T00:03:00Z'),
          end: new Date('2024-01-01T02:00:00Z')
        }
      })

      const content = JSON.parse(result.content as string)
      // Only msg-2 (00:05) falls inside the range; msg-1 (00:00) is filtered out.
      expect(content.conversations[0].messages).toHaveLength(1)
      expect(content.conversations[0].messages[0].id).toBe('msg-2')
      expect(content.metadata.date_range).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockQueries.getUserConversations.mockRejectedValue(
        new Error('Failed to get user conversations')
      )

      await expect(exporter.exportConversations({ format: 'json' })).rejects.toThrow(
        'Failed to get user conversations'
      )
    })

    it('should validate export options', async () => {
      await expect(
        exporter.exportConversations({ format: 'docx' as never })
      ).rejects.toThrow('Unsupported export format: docx')
    })

    it('should handle missing conversation data', async () => {
      mockQueries.getConversationMessages.mockResolvedValue([] as never)

      const result = await exporter.exportConversations({ format: 'json' })

      const content = JSON.parse(result.content as string)
      expect(content.conversations[0].messages).toHaveLength(0)
      expect(content.metadata.total_messages).toBe(0)
    })
  })
})
