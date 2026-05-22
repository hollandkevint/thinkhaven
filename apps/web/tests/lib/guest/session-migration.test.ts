import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SessionMigration } from '@/lib/guest/session-migration'
import { GuestSessionStore } from '@/lib/guest/session-store'

function installLocalStorageMock() {
  const store = new Map<string, string>()
  const localStorageMock = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => store.clear(),
  }

  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    configurable: true,
  })
}

const mocks = vi.hoisted(() => ({
  insertedSessions: [] as Record<string, unknown>[],
}))

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table !== 'bmad_sessions') {
        throw new Error(`Unexpected table: ${table}`)
      }

      return {
        insert: vi.fn((session: Record<string, unknown>) => {
          mocks.insertedSessions.push(session)
          return {
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: { id: 'migrated-session' },
                error: null,
              })),
            })),
          }
        }),
      }
    }),
  },
}))

describe('SessionMigration', () => {
  beforeEach(() => {
    installLocalStorageMock()
    localStorage.clear()
    mocks.insertedSessions.length = 0
  })

  it('preserves plan-grill pathway settings when migrating a guest session', async () => {
    GuestSessionStore.addMessage('user', 'Grill this plan', 'plan-grill')
    GuestSessionStore.addMessage('assistant', 'What docs should I use?', 'plan-grill')

    const result = await SessionMigration.migrateToUserWorkspace('user-123')

    expect(result).toMatchObject({
      success: true,
      sessionId: 'migrated-session',
      migratedMessages: 2,
    })
    expect(mocks.insertedSessions[0]).toMatchObject({
      pathway: 'plan-grill',
      current_phase: 'intake',
      message_limit: 20,
      message_count: 1,
    })
    expect(GuestSessionStore.getSession()).toBeNull()
  })
})
