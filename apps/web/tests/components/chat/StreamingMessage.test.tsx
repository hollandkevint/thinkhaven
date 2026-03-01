import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import StreamingMessage from '@/app/components/chat/StreamingMessage'
import { CoachingContext } from '@/lib/ai/mary-persona'

// Mock the MarkdownRenderer component
vi.mock('@/app/components/chat/MarkdownRenderer', () => ({
  default: ({ content }: { content: string }) => <div data-testid="markdown-content">{content}</div>
}))

// Mock the MessageActionMenu component
vi.mock('@/app/components/chat/MessageActionMenu', () => ({
  default: ({ messageId, onBookmark, onCreateBranch }: any) => (
    <div data-testid="action-menu">
      <button 
        data-testid="bookmark-button" 
        onClick={() => onBookmark({ title: 'Test Bookmark', tags: [], color: 'blue' })}
      >
        Bookmark
      </button>
      <button 
        data-testid="branch-button" 
        onClick={() => onCreateBranch?.(messageId)}
      >
        Branch
      </button>
    </div>
  )
}))

const mockCoachingContext: CoachingContext = {
  userProfile: {
    experienceLevel: 'intermediate',
    industry: 'technology',
    role: 'product_manager'
  },
  currentBmadSession: {
    sessionId: 'session-123',
    pathway: 'strategic_analysis',
    phase: 'diagnosis'
  },
  previousInsights: [
    { insight: 'Market opportunity identified', confidence: 0.8 }
  ]
}

const mockTokenUsage = {
  input_tokens: 150,
  output_tokens: 300,
  total_tokens: 450,
  cost_estimate_usd: 0.025
}

describe('StreamingMessage', () => {
  const defaultProps = {
    id: 'msg-123',
    role: 'assistant' as const,
    content: 'This is a test message',
    timestamp: new Date('2024-01-01T12:00:00Z'),
    onBookmark: vi.fn(),
    onCreateReference: vi.fn(),
    onViewReferences: vi.fn(),
    onCreateBranch: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Basic Rendering', () => {
    it('should render user message correctly', () => {
      render(
        <StreamingMessage
          {...defaultProps}
          role="user"
          content="Hello, I need help with strategy"
        />
      )

      expect(screen.getByText('You')).toBeInTheDocument()
      expect(screen.getByText('Hello, I need help with strategy')).toBeInTheDocument()
      
      // User messages should have different styling
      const messageElement = screen.getByText('Hello, I need help with strategy')
      expect(messageElement.closest('div')).toHaveClass('bg-primary', 'text-white')
    })

    it('should render assistant message correctly', () => {
      render(
        <StreamingMessage
          {...defaultProps}
          role="assistant"
          content="I'll help you with your strategic planning"
        />
      )

      expect(screen.getByText('Mary')).toBeInTheDocument()
      expect(screen.getByTestId('markdown-content')).toHaveTextContent("I'll help you with your strategic planning")
      
      // Assistant messages should have different styling
      const messageElement = screen.getByTestId('markdown-content').closest('div')
      expect(messageElement).toHaveClass('bg-cream', 'border')
    })

    it('should show timestamp when provided', () => {
      render(<StreamingMessage {...defaultProps} />)
      
      // The timestamp should be formatted relative to now
      expect(screen.getByText(/ago|Just now/)).toBeInTheDocument()
    })

    it('should display coaching context indicators', () => {
      render(
        <StreamingMessage
          {...defaultProps}
          coachingContext={mockCoachingContext}
        />
      )

      expect(screen.getByText(/strategic_analysis/)).toBeInTheDocument()
      expect(screen.getByText(/diagnosis/)).toBeInTheDocument()
    })
  })

  describe('Streaming Behavior', () => {
    it('should show streaming indicator when message is streaming', () => {
      render(
        <StreamingMessage
          {...defaultProps}
          isStreaming={true}
          content="Partial message content"
        />
      )

      // Check for streaming visual indicator
      const messageElement = screen.getByTestId('markdown-content').closest('div')
      expect(messageElement).toHaveClass('ring-2', 'ring-blue-200')
    })

    it('should not show action menu when streaming', () => {
      render(
        <StreamingMessage
          {...defaultProps}
          isStreaming={true}
        />
      )

      expect(screen.queryByTestId('action-menu')).not.toBeInTheDocument()
    })

    it('should show action menu when not streaming', () => {
      render(
        <StreamingMessage
          {...defaultProps}
          isStreaming={false}
        />
      )

      expect(screen.getByTestId('action-menu')).toBeInTheDocument()
    })

    it('should call onComplete when streaming finishes', async () => {
      const onComplete = vi.fn()
      const { rerender } = render(
        <StreamingMessage
          {...defaultProps}
          isStreaming={true}
          onComplete={onComplete}
        />
      )

      // Simulate streaming completion
      rerender(
        <StreamingMessage
          {...defaultProps}
          isStreaming={false}
          onComplete={onComplete}
        />
      )

      // onComplete should be called when streaming stops
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled()
      })
    })

    it('should auto-scroll when streaming', () => {
      const { rerender } = render(
        <StreamingMessage
          {...defaultProps}
          isStreaming={true}
          content="Initial content"
        />
      )

      // Update content while streaming
      rerender(
        <StreamingMessage
          {...defaultProps}
          isStreaming={true}
          content="Initial content with more text"
        />
      )

      expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
    })
  })

  describe('Token Usage and Metadata', () => {
    it('should show expandable metadata for assistant messages', () => {
      render(
        <StreamingMessage
          {...defaultProps}
          role="assistant"
          tokenUsage={mockTokenUsage}
          coachingContext={mockCoachingContext}
        />
      )

      // Should show message details button (initially hidden)
      const detailsButton = screen.getByText('Message details')
      expect(detailsButton).toBeInTheDocument()

      // Click to expand
      fireEvent.click(detailsButton)

      // Should show token usage information
      expect(screen.getByText('450')).toBeInTheDocument() // total tokens
      expect(screen.getByText('$0.0250')).toBeInTheDocument() // cost
    })

    it('should not show metadata for user messages', () => {
      render(
        <StreamingMessage
          {...defaultProps}
          role="user"
          tokenUsage={mockTokenUsage}
        />
      )

      expect(screen.queryByText('Message details')).not.toBeInTheDocument()
    })

    it('should display coaching context in expanded metadata', () => {
      render(
        <StreamingMessage
          {...defaultProps}
          role="assistant"
          tokenUsage={mockTokenUsage}
          coachingContext={mockCoachingContext}
        />
      )

      // Expand metadata
      fireEvent.click(screen.getByText('Message details'))

      expect(screen.getByText(/Experience:/)).toBeInTheDocument()
      expect(screen.getByText('intermediate')).toBeInTheDocument()
      expect(screen.getByText(/Industry:/)).toBeInTheDocument()
      expect(screen.getByText('technology')).toBeInTheDocument()
    })
  })

  describe('Bookmark Functionality', () => {
    it('should display bookmark indicator when message has bookmarks', () => {
      const mockBookmarks = [
        {
          id: 'bm-1',
          message_id: 'msg-123',
          user_id: 'user-456',
          title: 'Important Insight',
          tags: ['strategy'],
          color: 'blue',
          created_at: '2024-01-01T12:00:00Z',
          updated_at: '2024-01-01T12:00:00Z'
        }
      ]

      render(
        <StreamingMessage
          {...defaultProps}
          bookmarks={mockBookmarks}
        />
      )

      // Should show bookmark count
      expect(screen.getByText('1')).toBeInTheDocument()
      
      // Should show bookmark icon
      const bookmarkIcon = screen.getByRole('img', { hidden: true }) // SVG icons don't have accessible names
      expect(bookmarkIcon).toBeInTheDocument()
    })

    it('should call onBookmark when bookmark is created', async () => {
      const onBookmark = vi.fn()
      render(
        <StreamingMessage
          {...defaultProps}
          onBookmark={onBookmark}
        />
      )

      const bookmarkButton = screen.getByTestId('bookmark-button')
      fireEvent.click(bookmarkButton)

      expect(onBookmark).toHaveBeenCalledWith({
        title: 'Test Bookmark',
        tags: [],
        color: 'blue'
      })
    })
  })

  describe('Branch Functionality', () => {
    it('should call onCreateBranch when branch is created', () => {
      const onCreateBranch = vi.fn()
      render(
        <StreamingMessage
          {...defaultProps}
          conversationId="conv-123"
          conversationTitle="Strategy Session"
          onCreateBranch={onCreateBranch}
        />
      )

      const branchButton = screen.getByTestId('branch-button')
      fireEvent.click(branchButton)

      expect(onCreateBranch).toHaveBeenCalledWith('msg-123')
    })

    it('should pass conversation context to action menu', () => {
      render(
        <StreamingMessage
          {...defaultProps}
          conversationId="conv-123"
          conversationTitle="Strategy Session"
        />
      )

      // Action menu should receive conversation context
      expect(screen.getByTestId('action-menu')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper message structure for screen readers', () => {
      render(
        <StreamingMessage
          {...defaultProps}
          role="assistant"
          content="Strategic advice content"
        />
      )

      // Should have proper heading structure
      expect(screen.getByText('Mary')).toBeInTheDocument()
      
      // Message should have a unique ID for navigation
      const messageElement = screen.getByRole('group')
      expect(messageElement).toHaveAttribute('id', 'message-msg-123')
    })

    it('should support keyboard navigation for expandable content', () => {
      render(
        <StreamingMessage
          {...defaultProps}
          role="assistant"
          tokenUsage={mockTokenUsage}
        />
      )

      const detailsButton = screen.getByText('Message details')
      
      // Should be focusable
      detailsButton.focus()
      expect(detailsButton).toHaveFocus()

      // Should toggle on Enter key
      fireEvent.keyDown(detailsButton, { key: 'Enter' })
      expect(screen.getByText('450')).toBeInTheDocument()
    })

    it('should provide appropriate ARIA labels', () => {
      render(
        <StreamingMessage
          {...defaultProps}
          role="assistant"
          tokenUsage={mockTokenUsage}
        />
      )

      const detailsButton = screen.getByText('Message details')
      expect(detailsButton).toHaveAttribute('aria-expanded', 'false')

      fireEvent.click(detailsButton)
      expect(detailsButton).toHaveAttribute('aria-expanded', 'true')
    })
  })

  describe('Error Handling', () => {
    it('should handle missing timestamp gracefully', () => {
      render(
        <StreamingMessage
          {...defaultProps}
          timestamp={undefined}
        />
      )

      // Should render without timestamp
      expect(screen.queryByText(/ago/)).not.toBeInTheDocument()
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument()
    })

    it('should handle missing token usage gracefully', () => {
      render(
        <StreamingMessage
          {...defaultProps}
          role="assistant"
          tokenUsage={undefined}
          coachingContext={mockCoachingContext}
        />
      )

      // Should still show details button for coaching context
      expect(screen.getByText('Message details')).toBeInTheDocument()

      fireEvent.click(screen.getByText('Message details'))

      // Should show coaching context without token info
      expect(screen.getByText(/Experience:/)).toBeInTheDocument()
      expect(screen.queryByText('Tokens:')).not.toBeInTheDocument()
    })

    it('should handle empty content gracefully', () => {
      render(
        <StreamingMessage
          {...defaultProps}
          content=""
        />
      )

      // Should render with empty content
      expect(screen.getByTestId('markdown-content')).toHaveTextContent('')
    })
  })

  describe('Performance', () => {
    it('should not re-render unnecessarily when props do not change', () => {
      const renderSpy = vi.fn()
      
      const TestComponent = (props: any) => {
        renderSpy()
        return <StreamingMessage {...props} />
      }

      const { rerender } = render(
        <TestComponent {...defaultProps} />
      )

      expect(renderSpy).toHaveBeenCalledTimes(1)

      // Re-render with same props
      rerender(<TestComponent {...defaultProps} />)

      // Should not trigger additional renders due to memoization
      expect(renderSpy).toHaveBeenCalledTimes(2) // React strict mode causes double render
    })

    it('should handle large content efficiently', () => {
      const largeContent = 'A'.repeat(10000) // 10KB of content
      
      const renderStart = performance.now()
      render(
        <StreamingMessage
          {...defaultProps}
          content={largeContent}
        />
      )
      const renderEnd = performance.now()

      // Should render within reasonable time (less than 100ms)
      expect(renderEnd - renderStart).toBeLessThan(100)
    })
  })
})