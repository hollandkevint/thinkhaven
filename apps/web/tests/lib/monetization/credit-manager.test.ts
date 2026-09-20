import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { getDatabasePool } from '@/lib/db/pool'
import {
  addCredits,
  deductCredit,
  getCreditBalance,
  getCreditHistory,
  hasCredits,
} from '@/lib/monetization/credit-manager'

vi.mock('@/lib/db/pool', () => ({
  getDatabasePool: vi.fn(),
}))

const poolQuery = vi.fn()
const clientQuery = vi.fn()
const release = vi.fn()
const connect = vi.fn()
const originalCreditSystemEnabled = process.env.CREDIT_SYSTEM_ENABLED

const client = { query: clientQuery, release }

describe('credit manager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CREDIT_SYSTEM_ENABLED = 'true'
    connect.mockResolvedValue(client)
    vi.mocked(getDatabasePool).mockReturnValue({
      query: poolQuery,
      connect,
    } as never)
  })

  it('reads a balance and history through parameterized PostgreSQL queries', async () => {
    poolQuery
      .mockResolvedValueOnce({
        rows: [{
          balance: 4,
          total_granted: 5,
          total_purchased: 0,
          total_used: 1,
          created_at: new Date('2026-09-19T12:00:00.000Z'),
          updated_at: '2026-09-19T13:00:00.000Z',
        }],
      })
      .mockResolvedValueOnce({
        rows: [{
          id: 'transaction-1',
          user_id: 'user-1',
          transaction_type: 'deduct',
          amount: -1,
          balance_after: 4,
          session_id: 'session-1',
          stripe_payment_id: null,
          stripe_checkout_session_id: null,
          description: 'Credit deducted for session start',
          metadata: {},
          created_at: new Date('2026-09-19T13:00:00.000Z'),
        }],
      })

    await expect(getCreditBalance('user-1')).resolves.toMatchObject({
      balance: 4,
      created_at: '2026-09-19T12:00:00.000Z',
    })
    await expect(getCreditHistory('user-1', 10)).resolves.toMatchObject([{
      id: 'transaction-1',
      created_at: '2026-09-19T13:00:00.000Z',
    }])

    expect(poolQuery).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('WHERE "user_id" = $1'),
      ['user-1'],
    )
    expect(poolQuery).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $2'),
      ['user-1', 10],
    )
  })

  it('fails closed when balance or history queries fail', async () => {
    poolQuery.mockRejectedValue(new Error('database unavailable'))

    await expect(getCreditBalance('user-1')).resolves.toBeNull()
    await expect(getCreditHistory('user-1')).resolves.toEqual([])
    await expect(hasCredits('user-1')).resolves.toBe(false)
  })

  it('deducts atomically and commits the balance plus audit row', async () => {
    clientQuery
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ balance: 2 }] })
      .mockResolvedValueOnce({ rows: [{ balance: 1 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({})

    await expect(deductCredit('user-1', 'session-1')).resolves.toEqual({
      success: true,
      balance: 1,
      message: 'Credit deducted successfully',
    })

    expect(clientQuery.mock.calls.map(([sql]) => sql)).toEqual([
      'BEGIN',
      expect.stringContaining('FOR UPDATE'),
      expect.stringContaining('UPDATE "public"."user_credits"'),
      expect.stringContaining('INSERT INTO "public"."credit_transactions"'),
      'COMMIT',
    ])
    expect(clientQuery).toHaveBeenNthCalledWith(4, expect.any(String), [
      'user-1',
      1,
      'session-1',
    ])
    expect(release).toHaveBeenCalledOnce()
  })

  it('does not deduct when the locked balance is insufficient', async () => {
    clientQuery
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ balance: 0 }] })
      .mockResolvedValueOnce({})

    await expect(deductCredit('user-1')).resolves.toEqual({
      success: false,
      balance: 0,
      message: 'Insufficient credits',
    })

    expect(clientQuery).toHaveBeenCalledTimes(3)
    expect(clientQuery.mock.calls.map(([sql]) => sql)).toEqual([
      'BEGIN',
      expect.stringContaining('FOR UPDATE'),
      'COMMIT',
    ])
  })

  it('adds credits atomically when the user row already exists', async () => {
    clientQuery
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ balance: 5 }] })
      .mockResolvedValueOnce({ rows: [{ balance: 8 }] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})

    await expect(addCredits({
      userId: 'user-1',
      amount: 3,
      source: 'purchase',
      stripePaymentId: 'payment-1',
      description: 'Starter pack',
    })).resolves.toEqual({
      success: true,
      balance: 8,
      message: '3 credits added successfully',
    })

    expect(clientQuery.mock.calls.map(([sql]) => sql)).toEqual([
      'BEGIN',
      expect.stringContaining('ON CONFLICT ("user_id") DO NOTHING'),
      expect.stringContaining('FOR UPDATE'),
      expect.stringContaining('UPDATE "public"."user_credits"'),
      expect.stringContaining('INSERT INTO "public"."credit_transactions"'),
      'COMMIT',
    ])
    expect(clientQuery).toHaveBeenNthCalledWith(5, expect.any(String), [
      'user-1',
      'purchase',
      3,
      8,
      'payment-1',
      'Starter pack',
    ])
  })

  it('rolls back a credit add when the audit insert conflicts', async () => {
    clientQuery
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ balance: 3 }] })
      .mockResolvedValueOnce({ rows: [{ balance: 6 }] })
      .mockRejectedValueOnce(new Error('duplicate key value violates unique constraint'))
      .mockResolvedValueOnce({})

    await expect(addCredits({
      userId: 'user-1',
      amount: 3,
      source: 'purchase',
      stripePaymentId: 'payment-1',
    })).resolves.toMatchObject({
      success: false,
      balance: 0,
      message: 'duplicate key value violates unique constraint',
    })

    expect(clientQuery.mock.calls.map(([sql]) => sql)).toEqual([
      'BEGIN',
      expect.stringContaining('ON CONFLICT ("user_id") DO NOTHING'),
      expect.stringContaining('FOR UPDATE'),
      expect.stringContaining('UPDATE "public"."user_credits"'),
      expect.stringContaining('INSERT INTO "public"."credit_transactions"'),
      'ROLLBACK',
    ])
  })
})

afterAll(() => {
  if (originalCreditSystemEnabled === undefined) {
    delete process.env.CREDIT_SYSTEM_ENABLED
  } else {
    process.env.CREDIT_SYSTEM_ENABLED = originalCreditSystemEnabled
  }
})
