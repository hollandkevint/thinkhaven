import { beforeEach, describe, expect, it } from 'vitest'
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

describe('GuestSessionStore', () => {
  beforeEach(() => {
    installLocalStorageMock()
    localStorage.clear()
  })

  it('preserves a plan-grill pathway when the first guest message is saved', () => {
    GuestSessionStore.getOrCreateSession('plan-grill')

    GuestSessionStore.addMessage('user', 'Grill this plan')

    expect(GuestSessionStore.getSessionForMigration()?.pathway).toBe('plan-grill')
  })

  it('uses an explicitly provided pathway when adding a message to a new session', () => {
    GuestSessionStore.addMessage('user', 'Grill this plan', 'plan-grill')

    const session = GuestSessionStore.getSessionForMigration()

    expect(session?.pathway).toBe('plan-grill')
    expect(session?.messageCount).toBe(1)
  })

  it('does not rewrite a non-empty guest session when a different pathway is requested', () => {
    GuestSessionStore.addMessage('user', 'I have a decision', 'new-idea')

    const session = GuestSessionStore.getOrCreateSession('plan-grill')

    expect(session.pathway).toBe('new-idea')
  })
})
