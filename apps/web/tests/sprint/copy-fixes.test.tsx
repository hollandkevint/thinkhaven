/**
 * RED-GREEN TDD: Copy Fixes (Tasks 1.1, 1.2)
 *
 * 1.1: Landing page should say "10 messages", not "5 messages"
 * 1.2: SignupPromptModal should NOT promise "unlimited"
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock modules needed by SignupPromptModal
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

import { track } from '@/lib/analytics/events'

vi.mock('@/lib/analytics/events', () => ({
  track: vi.fn(),
}))

vi.mock('@/lib/guest/session-migration', () => ({
  SessionMigration: {
    generateSessionSummary: () => 'Test summary',
  },
}))

import SignupPromptModal from '@/app/components/guest/SignupPromptModal'

describe('Task 1.1: Landing page "10 messages" copy', () => {
  it('page.tsx contains "10 messages", not "5 messages"', async () => {
    // Read the actual file content to verify the copy
    const fs = await import('fs')
    const path = await import('path')
    const pageContent = fs.readFileSync(
      path.resolve(__dirname, '../../app/page.tsx'),
      'utf-8'
    )

    expect(pageContent).toContain('10 messages')
    expect(pageContent).not.toMatch(/\b5 messages\b/)
  })
})

describe('Task 1.2: SignupPromptModal honest copy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does NOT contain "unlimited" anywhere', () => {
    render(
      <SignupPromptModal isOpen={true} onClose={() => {}} />
    )

    // Get all text content from the rendered modal
    const modalText = document.body.textContent?.toLowerCase() || ''
    expect(modalText).not.toContain('unlimited')
  })

  it('mentions "5 free sessions"', () => {
    render(
      <SignupPromptModal isOpen={true} onClose={() => {}} />
    )

    const modalText = document.body.textContent || ''
    expect(modalText).toMatch(/5 free sessions/i)
  })

  it('mentions board member names', () => {
    render(
      <SignupPromptModal isOpen={true} onClose={() => {}} />
    )

    const modalText = document.body.textContent || ''
    // Should mention actual board members
    expect(modalText).toMatch(/victoria/i)
    expect(modalText).toMatch(/casey/i)
    expect(modalText).toMatch(/omar/i)
  })

  it('fires signup_prompt_shown event when opened', () => {
    render(
      <SignupPromptModal isOpen={true} onClose={() => {}} trigger="board_tease" />
    )

    expect(vi.mocked(track)).toHaveBeenCalledWith({
      event: 'signup_prompt_shown',
      properties: { trigger: 'board_tease' },
    })
  })
})
