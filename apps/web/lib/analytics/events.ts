import posthog from 'posthog-js'

type TrackedEvent =
  | { event: 'session_started'; properties: { source: 'guest' | 'authenticated' } }
  | { event: 'guest_limit_hit'; properties: { message_count: number } }
  | { event: 'signup_completed'; properties: { source: 'modal' | 'page'; method: 'google' | 'email' } }

export function track(input: TrackedEvent): void {
  if (typeof window === 'undefined') return
  if (!posthog.__loaded) return

  posthog.capture(input.event, input.properties)
}
