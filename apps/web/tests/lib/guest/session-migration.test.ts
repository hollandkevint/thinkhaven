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
  fetch: vi.fn(),
}))

describe('SessionMigration', () => {
  beforeEach(() => {
    installLocalStorageMock()
    localStorage.clear()
    mocks.fetch.mockReset()
    vi.stubGlobal('fetch', mocks.fetch)
  })

  it('preserves plan-grill pathway settings when migrating a guest session', async () => {
    GuestSessionStore.addMessage('user', 'Grill this plan', 'plan-grill')
    GuestSessionStore.addMessage('assistant', 'What docs should I use?', 'plan-grill')
    mocks.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        sessionId: 'migrated-session',
        workspaceId: 'user-123',
        migratedMessages: 2,
      }),
    })

    const result = await SessionMigration.migrateToUserWorkspace('user-123')

    expect(result).toMatchObject({
      success: true,
      sessionId: 'migrated-session',
      migratedMessages: 2,
    })
    expect(mocks.fetch).toHaveBeenCalledWith('/api/guest/migrate', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('plan-grill'),
    }))
    expect(GuestSessionStore.getSession()).toBeNull()
  })

  it('keeps the guest session when the authenticated migration fails', async () => {
    GuestSessionStore.addMessage('user', 'Keep this thread', 'new-idea')
    mocks.fetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ success: false, error: 'Failed to save migrated session' }),
    })

    await expect(SessionMigration.migrateToUserWorkspace('user-123')).resolves.toMatchObject({
      success: false,
    })
    expect(GuestSessionStore.getSession()).not.toBeNull()
  })
})
