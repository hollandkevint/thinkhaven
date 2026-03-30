import { z } from 'zod'

export const FEEDBACK_TYPES = ['praise', 'bug', 'feature_request'] as const
export type FeedbackType = (typeof FEEDBACK_TYPES)[number]

export const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  praise: 'Praise',
  bug: 'Bug',
  feature_request: 'Feature Request',
}

export const FeedbackSchema = z.object({
  feedback_type: z.enum(FEEDBACK_TYPES),
  free_text: z.string().min(1).max(2000),
  session_id: z.string().uuid().optional(),
  source: z.enum(['manual', 'auto_limit']),
})

export type FeedbackPayload = z.infer<typeof FeedbackSchema>
