/**
 * RED-GREEN TDD: PostHog Event Types (Task 1.5)
 *
 * Verifies all 5 new events are defined in the TrackedEvent union,
 * and that instrumentation callsites exist in the right files.
 */

import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Mock posthog for the track function import test
vi.mock('posthog-js', () => ({
  default: { capture: vi.fn() },
}))

describe('Task 1.5: PostHog event type definitions', () => {
  const eventsPath = resolve(__dirname, '../../lib/analytics/events.ts')
  const source = readFileSync(eventsPath, 'utf-8')

  it('defines board_offered event', () => {
    expect(source).toContain("'board_offered'")
    expect(source).toContain('exchange_count: number')
  })

  it('defines board_activated event', () => {
    expect(source).toContain("'board_activated'")
  })

  it('defines canvas_exported event', () => {
    expect(source).toContain("'canvas_exported'")
    expect(source).toContain('filled_boxes: number')
  })

  it('defines feedback_submitted event', () => {
    expect(source).toContain("'feedback_submitted'")
    expect(source).toContain('feedback_type: string')
  })

  it('defines signup_prompt_shown event', () => {
    expect(source).toContain("'signup_prompt_shown'")
    expect(source).toContain("'guest_limit'")
    expect(source).toContain("'board_tease'")
  })

  it('track function is exported', () => {
    expect(source).toContain('export function track')
  })
})

describe('Task 1.5: Instrumentation callsites', () => {
  it('canvas-export-md fires canvas_exported on download', () => {
    const source = readFileSync(
      resolve(__dirname, '../../lib/export/canvas-export-md.ts'),
      'utf-8'
    )
    expect(source).toContain("event: 'canvas_exported'")
    expect(source).toContain('filled_boxes')
  })

  it('tool-executor sets boardActivated flag on switch_speaker', () => {
    const source = readFileSync(
      resolve(__dirname, '../../lib/ai/tool-executor.ts'),
      'utf-8'
    )
    expect(source).toContain('boardActivated')
    expect(source).toContain('this.boardActivated = true')
  })

  it('stream route surfaces boardActivated in additionalData', () => {
    const source = readFileSync(
      resolve(__dirname, '../../app/api/chat/stream/route.ts'),
      'utf-8'
    )
    expect(source).toContain('boardActivated')
  })
})
