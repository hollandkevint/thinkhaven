import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  hasOwnedSession,
  insertFeedback,
  insertTrialFeedback,
} from '@/lib/db/repositories/feedback-repository'

const query = vi.fn()
const pool = { query } as never

describe('feedback repository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('checks session ownership with actor-scoped parameters', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'session-1' }] })
    await expect(hasOwnedSession('session-1', 'user-1', pool)).resolves.toBe(true)

    expect(query).toHaveBeenCalledWith(
      expect.stringMatching(/where "id" = \$1\s+and "user_id" = \$2/),
      ['session-1', 'user-1'],
    )

    query.mockResolvedValueOnce({ rows: [] })
    await expect(hasOwnedSession('session-1', 'user-2', pool)).resolves.toBe(false)
  })

  it('inserts in-app feedback without accepting a caller user id', async () => {
    query.mockResolvedValueOnce({})

    await insertFeedback({
      userId: 'user-1',
      sessionId: 'session-1',
      feedbackType: 'bug',
      freeText: 'The answer was too vague.',
      source: 'manual',
      wouldRecommend: false,
      disappearAlternative: 'A sharper next step.',
    }, pool)

    expect(query).toHaveBeenCalledWith(
      expect.stringMatching(/insert into "public"\."feedback"/),
      ['user-1', 'session-1', 'bug', 'The answer was too vague.', 'manual', false, 'A sharper next step.'],
    )
  })

  it('inserts trial feedback with the authenticated email and submitted time', async () => {
    query.mockResolvedValueOnce({})

    await insertTrialFeedback({
      userId: 'user-1',
      rating: 4,
      wouldPay: true,
      feedback: 'Useful session.',
      userEmail: 'person@example.com',
      submittedAt: '2026-09-19T12:00:00.000Z',
    }, pool)

    expect(query).toHaveBeenCalledWith(
      expect.stringMatching(/insert into "public"\."trial_feedback"/),
      ['user-1', 4, true, 'Useful session.', 'person@example.com', '2026-09-19T12:00:00.000Z'],
    )
  })
})
