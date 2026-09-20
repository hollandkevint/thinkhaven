import { getDatabasePool } from '@/lib/db/pool'
import { summarizeRecord, toPlainText } from '@/lib/artifact/record-summary'

export const runtime = 'nodejs'

/** Public decision-record reference lookup. It is intentionally exact-token-only. */
const TOKEN_RE = /^[a-f0-9]{16,64}$/

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  if (!TOKEN_RE.test(token)) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const { rows } = await getDatabasePool().query<{ title: string; content: string }>(
      `
        SELECT "title", "content"
        FROM "public"."public_artifacts"
        WHERE "token" = $1
        LIMIT 1
      `,
      [token],
    )
    const record = rows[0]

    if (!record) return Response.json({ error: 'Not found' }, { status: 404 })

    const { decision, weakestAssumption } = summarizeRecord(record.content)

    // The title is attacker-authored too, and lands in the same markdown-rendered opener.
    return Response.json(
      { title: toPlainText(record.title, 120), decision, weakestAssumption },
      { headers: { 'Cache-Control': 'private, max-age=60' } },
    )
  } catch (error) {
    console.error('[Artifact Reference] Database lookup failed:', error instanceof Error ? error.message : 'Unknown error')
    return Response.json({ error: 'Unavailable' }, { status: 503 })
  }
}
