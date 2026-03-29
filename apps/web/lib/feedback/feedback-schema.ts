import { z } from 'zod'

export const FeedbackSchema = z.object({
  decision_usefulness: z.number().int().min(1).max(5),
  return_likelihood: z.number().int().min(1).max(5),
  free_text: z.string().max(2000).optional(),
  session_id: z.string().uuid().optional(),
  source: z.enum(['manual', 'auto_limit']),
})

export type FeedbackPayload = z.infer<typeof FeedbackSchema>
