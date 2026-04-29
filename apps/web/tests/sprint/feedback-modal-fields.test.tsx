/**
 * RED-GREEN TDD: FeedbackModal New Fields (Task 1.6)
 *
 * Tests that would_recommend toggle and disappear_alternative text field
 * exist in FeedbackModal, are optional, and submit correctly.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FeedbackModal } from '@/app/components/feedback/FeedbackModal'
import { FeedbackSchema } from '@/lib/feedback/feedback-schema'

// Mock Radix Dialog portal to render inline
vi.mock('@radix-ui/react-dialog', async () => {
  const actual = await vi.importActual('@radix-ui/react-dialog')
  return {
    ...actual,
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})

// Mock the feedback store
const mockClose = vi.fn()
vi.mock('@/lib/stores/feedbackStore', () => ({
  useFeedbackStore: () => ({
    isOpen: true,
    sessionId: 'test-session-id',
    close: mockClose,
  }),
}))

vi.mock('@/lib/analytics/events', () => ({
  track: vi.fn(),
}))

describe('Task 1.6: FeedbackModal new fields', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders "Would you recommend" question with Yes/No toggles', () => {
    render(<FeedbackModal />)

    expect(screen.getByText(/would you recommend/i)).toBeDefined()
    expect(screen.getByText('Yes')).toBeDefined()
    expect(screen.getByText('No')).toBeDefined()
  })

  it('renders "disappeared tomorrow" question with text input', () => {
    render(<FeedbackModal />)

    expect(screen.getByText(/disappeared tomorrow/i)).toBeDefined()
    expect(screen.getByPlaceholderText(/spreadsheets|friend|nothing/i)).toBeDefined()
  })

  it('both fields are optional (form submits without them)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })

    render(<FeedbackModal />)

    const user = userEvent.setup()

    // Select feedback type (required)
    await user.click(screen.getByText('Praise'))

    // Fill required free_text
    const textarea = screen.getByPlaceholderText(/what did you find most valuable/i)
    await user.type(textarea, 'Great product!')

    // Do NOT fill would_recommend or disappear_alternative
    // Click submit
    await user.click(screen.getByText('Send'))

    // Should have called fetch (form is valid without optional fields)
    expect(global.fetch).toHaveBeenCalledTimes(1)

    const fetchBody = JSON.parse((global.fetch as any).mock.calls[0][1].body)
    expect(fetchBody.feedback_type).toBe('praise')
    expect(fetchBody.free_text).toBe('Great product!')
    // Optional fields should be undefined (not sent) or null
    expect(fetchBody.would_recommend).toBeUndefined()
  })
})

describe('Task 1.6: Feedback Zod schema', () => {
  it('accepts would_recommend as optional boolean', () => {
    const result = FeedbackSchema.safeParse({
      feedback_type: 'praise',
      free_text: 'Great!',
      source: 'manual',
      would_recommend: true,
    })
    expect(result.success).toBe(true)

    const withoutRecommend = FeedbackSchema.safeParse({
      feedback_type: 'praise',
      free_text: 'Great!',
      source: 'manual',
    })
    expect(withoutRecommend.success).toBe(true)
  })

  it('accepts disappear_alternative as optional string', () => {
    const result = FeedbackSchema.safeParse({
      feedback_type: 'bug',
      free_text: 'Broken button',
      source: 'manual',
      disappear_alternative: 'Use spreadsheets instead',
    })
    expect(result.success).toBe(true)
  })

  it('rejects disappear_alternative over 500 chars', () => {
    const result = FeedbackSchema.safeParse({
      feedback_type: 'praise',
      free_text: 'Nice!',
      source: 'manual',
      disappear_alternative: 'a'.repeat(501),
    })
    expect(result.success).toBe(false)
  })
})

describe('Task 1.6: Migration file exists', () => {
  it('030_feedback_recommend_fields.sql exists with correct columns', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const migrationPath = path.resolve(
      __dirname,
      '../../supabase/migrations/030_feedback_recommend_fields.sql'
    )

    const exists = fs.existsSync(migrationPath)
    expect(exists).toBe(true)

    const content = fs.readFileSync(migrationPath, 'utf-8')
    expect(content).toContain('would_recommend')
    expect(content).toContain('disappear_alternative')
    expect(content.toUpperCase()).toContain('BOOLEAN')
    expect(content.toUpperCase()).toContain('TEXT')
  })
})
