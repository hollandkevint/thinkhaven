import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { getDatabasePool } from '@/lib/db/pool'
import {
  hasOwnedSession,
  insertFeedback,
  insertTrialFeedback,
} from '@/lib/db/repositories/feedback-repository'
import { POST as postFeedback } from '@/app/api/feedback/route'
import { POST as postTrialFeedback } from '@/app/api/feedback/trial/route'
import { POST as postAssessment } from '@/app/api/assessment/submit/route'

const mocks = vi.hoisted(() => ({
  getRailwaySession: vi.fn(),
  getDatabasePool: vi.fn(),
  hasOwnedSession: vi.fn(),
  insertFeedback: vi.fn(),
  insertTrialFeedback: vi.fn(),
  query: vi.fn(),
}))

vi.mock('@/lib/auth/railway-session', () => ({
  getRailwaySession: mocks.getRailwaySession,
}))

vi.mock('@/lib/db/pool', () => ({
  getDatabasePool: mocks.getDatabasePool,
}))

vi.mock('@/lib/db/repositories/feedback-repository', () => ({
  hasOwnedSession: mocks.hasOwnedSession,
  insertFeedback: mocks.insertFeedback,
  insertTrialFeedback: mocks.insertTrialFeedback,
}))

const user = { id: 'user-1', email: 'person@example.com' }
const pool = { query: mocks.query }
const sessionId = '550e8400-e29b-41d4-a716-446655440000'

function request(path: string, body: unknown) {
  return new NextRequest(`http://test.local${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('feedback and assessment APIs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getDatabasePool.mockReturnValue(pool)
    mocks.getRailwaySession.mockResolvedValue({ user })
    mocks.hasOwnedSession.mockResolvedValue(true)
    mocks.insertFeedback.mockResolvedValue(undefined)
    mocks.insertTrialFeedback.mockResolvedValue(undefined)
    mocks.query.mockResolvedValue({})
  })

  it('stores feedback under the Railway session user and checks session ownership', async () => {
    const response = await postFeedback(request('/api/feedback', {
      user_id: 'attacker',
      feedback_type: 'bug',
      free_text: 'The answer was too vague.',
      session_id: sessionId,
      source: 'manual',
      would_recommend: false,
      disappear_alternative: 'A sharper next step.',
    }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ success: true })
    expect(hasOwnedSession).toHaveBeenCalledWith(sessionId, 'user-1', pool)
    expect(insertFeedback).toHaveBeenCalledWith({
      userId: 'user-1',
      sessionId,
      feedbackType: 'bug',
      freeText: 'The answer was too vague.',
      source: 'manual',
      wouldRecommend: false,
      disappearAlternative: 'A sharper next step.',
    }, pool)
  })

  it('denies feedback for an unowned session and preserves duplicate behavior', async () => {
    mocks.hasOwnedSession.mockResolvedValue(false)
    const notFound = await postFeedback(request('/api/feedback', {
      feedback_type: 'praise',
      free_text: 'Good.',
      session_id: sessionId,
      source: 'manual',
    }))
    expect(notFound.status).toBe(404)
    expect(insertFeedback).not.toHaveBeenCalled()

    mocks.hasOwnedSession.mockResolvedValue(true)
    const duplicate = Object.assign(new Error('duplicate'), { code: '23505' })
    mocks.insertFeedback.mockRejectedValue(duplicate)
    const conflict = await postFeedback(request('/api/feedback', {
      feedback_type: 'praise',
      free_text: 'Good.',
      session_id: sessionId,
      source: 'manual',
    }))
    expect(conflict.status).toBe(409)
    await expect(conflict.json()).resolves.toEqual({
      error: 'Feedback already submitted for this session',
    })
  })

  it('requires a Railway session for authenticated feedback routes', async () => {
    mocks.getRailwaySession.mockResolvedValue(null)

    const feedback = await postFeedback(request('/api/feedback', {
      feedback_type: 'praise',
      free_text: 'Good.',
      source: 'manual',
    }))
    const trial = await postTrialFeedback(request('/api/feedback/trial', {
      userId: 'attacker',
      rating: 4,
      wouldPay: true,
      feedback: null,
      timestamp: '2026-09-19T12:00:00.000Z',
    }))

    expect(feedback.status).toBe(401)
    expect(trial.status).toBe(401)
    expect(insertFeedback).not.toHaveBeenCalled()
    expect(insertTrialFeedback).not.toHaveBeenCalled()
  })

  it('stores trial feedback under the Railway session user', async () => {
    const response = await postTrialFeedback(request('/api/feedback/trial', {
      userId: 'attacker',
      rating: 4,
      wouldPay: true,
      feedback: 'Useful session.',
      timestamp: '2026-09-19T12:00:00.000Z',
    }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      success: true,
      message: 'Feedback submitted successfully',
    })
    expect(insertTrialFeedback).toHaveBeenCalledWith({
      userId: 'user-1',
      rating: 4,
      wouldPay: true,
      feedback: 'Useful session.',
      userEmail: 'person@example.com',
      submittedAt: '2026-09-19T12:00:00.000Z',
    }, pool)
  })

  it('keeps assessment public and falls back to local storage when its write fails', async () => {
    const body = {
      email: 'person@example.com',
      scores: { evidence: 4, framework: 3, execution: 5, overall: 4 },
      answers: { 1: 4 },
      completedAt: '2026-09-19T12:00:00.000Z',
    }

    const stored = await postAssessment(request('/api/assessment/submit', body))
    expect(stored.status).toBe(200)
    await expect(stored.json()).resolves.toEqual({ success: true, stored: true })
    expect(getDatabasePool).toHaveBeenCalled()
    expect(mocks.query).toHaveBeenCalledWith(
      expect.stringMatching(/insert into "public"\."assessment_submissions"[\s\S]+values \(\$1, \$2::jsonb, \$3::jsonb, \$4, \$5\)/),
      expect.arrayContaining([
        body.email,
        JSON.stringify(body.scores),
        JSON.stringify(body.answers),
        body.completedAt,
      ]),
    )

    mocks.query.mockRejectedValueOnce(new Error('database unavailable'))
    const fallback = await postAssessment(request('/api/assessment/submit', body))
    expect(fallback.status).toBe(200)
    await expect(fallback.json()).resolves.toEqual({
      success: true,
      stored: false,
      message: 'Assessment recorded locally',
    })
  })

  it('rejects incomplete assessments before touching PostgreSQL', async () => {
    const response = await postAssessment(request('/api/assessment/submit', {
      email: 'person@example.com',
      scores: null,
      answers: {},
    }))

    expect(response.status).toBe(400)
    expect(getDatabasePool).not.toHaveBeenCalled()
  })
})
