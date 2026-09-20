/**
 * RED-GREEN TDD: Migration Double-Count Fix (Task 1.3)
 *
 * Guest migration should count only user messages, not user+assistant.
 * Without the fix, a guest with 5 user messages migrates with message_count: 10.
 */

import { describe, it, expect, vi } from 'vitest'
import { migrateGuestSession } from '@/lib/db/repositories/guest-session-repository'

describe('Task 1.3: Guest migration message count', () => {
  it('persists only user messages in the database message_count', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ id: 'session-1' }] })
    const db = { query } as never
    const messages = [
      ...Array.from({ length: 5 }, (_, index) => ({
        id: 'user-' + index,
        role: 'user',
        content: 'User message ' + index,
      })),
      ...Array.from({ length: 5 }, (_, index) => ({
        id: 'assistant-' + index,
        role: 'assistant',
        content: 'Assistant message ' + index,
      })),
    ]

    await migrateGuestSession('user-1', {
      sessionId: 'guest-1',
      messages,
    }, db)

    const [sql, params] = query.mock.calls[0]
    expect(sql).toMatch(/message_count/i)
    expect(params[5]).toBe(5)
  })
})
