import type { Pool } from 'pg'
import { getDatabasePool } from '@/lib/db/pool'

type Queryable = Pick<Pool, 'query'>

export interface FeedbackRecordInput {
  userId: string
  sessionId: string | null
  feedbackType: string
  freeText: string
  source: string
  wouldRecommend: boolean | null
  disappearAlternative: string | null
}

export interface TrialFeedbackRecordInput {
  userId: string
  rating: number
  wouldPay: boolean
  feedback: string | null
  userEmail: string | undefined
  submittedAt: string
}

export async function hasOwnedSession(
  sessionId: string,
  userId: string,
  pool: Queryable = getDatabasePool(),
): Promise<boolean> {
  const { rows } = await pool.query<{ id: string }>(
    `
      select "id"
      from "public"."bmad_sessions"
      where "id" = $1
        and "user_id" = $2
      limit 1
    `,
    [sessionId, userId],
  )

  return Boolean(rows[0])
}

export async function insertFeedback(
  input: FeedbackRecordInput,
  pool: Queryable = getDatabasePool(),
): Promise<void> {
  await pool.query(
    `
      insert into "public"."feedback" (
        "user_id",
        "session_id",
        "feedback_type",
        "free_text",
        "source",
        "would_recommend",
        "disappear_alternative"
      )
      values ($1, $2, $3, $4, $5, $6, $7)
    `,
    [
      input.userId,
      input.sessionId,
      input.feedbackType,
      input.freeText,
      input.source,
      input.wouldRecommend,
      input.disappearAlternative,
    ],
  )
}

export async function insertTrialFeedback(
  input: TrialFeedbackRecordInput,
  pool: Queryable = getDatabasePool(),
): Promise<void> {
  await pool.query(
    `
      insert into "public"."trial_feedback" (
        "user_id",
        "rating",
        "would_pay",
        "feedback_text",
        "user_email",
        "submitted_at"
      )
      values ($1, $2, $3, $4, $5, $6)
    `,
    [
      input.userId,
      input.rating,
      input.wouldPay,
      input.feedback,
      input.userEmail,
      input.submittedAt,
    ],
  )
}
