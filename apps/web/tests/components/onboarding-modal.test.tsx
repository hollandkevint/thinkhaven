import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PostHogProvider } from '../../app/providers'

vi.mock('next/navigation', () => ({
  usePathname: () => '/login',
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(),
    capture: vi.fn(),
    config: {},
  },
}))

vi.mock('posthog-js/react', () => ({
  PostHogProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('../../app/components/feedback/FeedbackModal', () => ({
  FeedbackModal: () => null,
}))

describe('global onboarding removal', () => {
  beforeEach(() => {
    window.localStorage?.removeItem?.('thinkhaven_onboarding_completed')
  })

  it('does not show onboarding copy from the global provider', () => {
    render(
      <PostHogProvider>
        <main>
          <h1>Log in</h1>
        </main>
      </PostHogProvider>
    )

    expect(screen.getByText('Log in')).toBeInTheDocument()
    expect(screen.queryByText('ThinkHaven is a decision design system')).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
