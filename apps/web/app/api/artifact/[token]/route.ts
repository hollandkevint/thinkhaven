import { createAdminClient } from '@/lib/supabase/admin'
import { summarizeRecord, toPlainText } from '@/lib/artifact/record-summary'

/**
 * Public decision-record reference lookup.
 *
 * Backs the artifact-aware /try arrival: a visitor who clicks a share-page CTA lands
 * with ?ref=<token>, and the new session opens against the record they just read.
 *
 * Deliberately narrower than /share/[token]: title plus two derived lines, never the
 * full record body and never the captured lead email. Sourcing the copy from the DB
 * (instead of the query string) keeps a crafted link from injecting text into Mary's
 * opening message.
 */

const TOKEN_RE = /^[a-f0-9]{16,64}$/

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  if (!TOKEN_RE.test(token)) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const admin = createAdminClient()
  if (!admin) return Response.json({ error: 'Unavailable' }, { status: 503 })

  const { data } = await admin
    .from('public_artifacts')
    .select('title, content')
    .eq('token', token)
    .maybeSingle()

  if (!data) return Response.json({ error: 'Not found' }, { status: 404 })

  const record = data as { title: string; content: string }
  const { decision, weakestAssumption } = summarizeRecord(record.content)

  // The title is attacker-authored too, and lands in the same markdown-rendered opener.
  return Response.json(
    { title: toPlainText(record.title, 120), decision, weakestAssumption },
    { headers: { 'Cache-Control': 'private, max-age=60' } }
  )
}
