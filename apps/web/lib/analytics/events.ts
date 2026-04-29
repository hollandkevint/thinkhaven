import posthog from 'posthog-js'

type TrackedEvent =
  | { event: 'session_started'; properties: { source: 'guest' | 'authenticated' } }
  | { event: 'guest_limit_hit'; properties: { message_count: number } }
  | { event: 'signup_completed'; properties: { source: 'modal' | 'page'; method: 'google' | 'email' } }
  | { event: 'board_offered'; properties: { exchange_count: number; source: 'guest' | 'authenticated' } }
  | { event: 'board_activated'; properties: { exchange_count: number } }
  | { event: 'canvas_exported'; properties: { format: 'markdown'; filled_boxes: number } }
  | { event: 'feedback_submitted'; properties: { feedback_type: string; would_recommend?: boolean } }
  | { event: 'signup_prompt_shown'; properties: { trigger: 'guest_limit' | 'board_tease' | 'manual' } }

export function track(input: TrackedEvent): void {
  if (typeof window === 'undefined') return

  // posthog.capture() no-ops before init, so the guard is just for clarity
  posthog.capture(input.event, input.properties)
}
