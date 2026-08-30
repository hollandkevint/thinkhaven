import posthog from 'posthog-js'

import type { UtmProperties } from './utm'

type TrackedEvent =
  | { event: 'session_started'; properties: { source: 'guest' | 'authenticated'; pathway?: string } }
  | { event: 'guest_limit_hit'; properties: { message_count: number } }
  | { event: 'signup_completed'; properties: { source: 'modal' | 'page'; method: 'google' | 'email' } }
  | { event: 'board_offered'; properties: { exchange_count: number; source: 'guest' | 'authenticated' } }
  | { event: 'board_activated'; properties: { exchange_count: number } }
  | { event: 'canvas_exported'; properties: { format: 'markdown'; filled_boxes: number; session_id?: string } }
  | { event: 'feedback_submitted'; properties: { feedback_type: string; would_recommend?: boolean } }
  | { event: 'signup_prompt_shown'; properties: { trigger: 'guest_limit' | 'board_tease' | 'manual' } }
  // Share loop: view -> CTA click -> /try arrival. artifact_id (not the share token)
  // is the join key, so the record's access secret stays out of analytics properties.
  | { event: 'share_page_viewed'; properties: { artifact_id: string | null; found: boolean } }
  | { event: 'share_cta_clicked'; properties: { artifact_id: string | null; placement: 'record' | 'not_found' } }
  | { event: 'try_arrived'; properties: { mode: 'plan-grill' | 'new-idea'; from_share: boolean } & UtmProperties }

export function track(input: TrackedEvent): void {
  if (typeof window === 'undefined') return

  // posthog.capture() no-ops before init, so the guard is just for clarity
  posthog.capture(input.event, input.properties)
}
