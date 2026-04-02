/**
 * Feedback API
 *
 * POST /api/feedback
 * Collects in-app feedback with type categorization (praise/bug/feature_request).
 * Validates via Zod, IDOR-checks session ownership, inserts to feedback table.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { FeedbackSchema } from '@/lib/feedback/feedback-schema'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = FeedbackSchema.safeParse(body)

    if (!parsed.success) {
      console.warn('Feedback validation failed:', parsed.error.issues)
      return NextResponse.json(
        { error: 'Invalid feedback data' },
        { status: 400 }
      )
    }

    const { feedback_type, free_text, session_id, source, would_recommend, disappear_alternative } = parsed.data

    // IDOR check: verify user owns the referenced session
    if (session_id) {
      const { data: session } = await supabase
        .from('bmad_sessions')
        .select('id')
        .eq('id', session_id)
        .eq('user_id', user.id)
        .single()

      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }
    }

    // Insert — always use authenticated user.id, never from request body
    const { error: insertError } = await supabase.from('feedback').insert({
      user_id: user.id,
      session_id: session_id ?? null,
      feedback_type,
      free_text,
      source,
      would_recommend: would_recommend ?? null,
      disappear_alternative: disappear_alternative ?? null,
    })

    if (insertError) {
      // UNIQUE violation = already submitted for this session
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'Feedback already submitted for this session' },
          { status: 409 }
        )
      }
      console.error('Feedback insert failed:', insertError.code)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/feedback:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
