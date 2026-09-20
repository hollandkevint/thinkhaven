import { NextRequest } from 'next/server'
import { getRailwaySession } from '@/lib/auth/railway-session'
import { getDatabasePool } from '@/lib/db/pool'

export const runtime = 'nodejs'

const SHARE_RATE_LIMIT = 20
const SHARE_RATE_WINDOW_MS = 60 * 60 * 1000
const shareRateLimits = new Map<string, { count: number; resetAt: number }>()

const MAX_CONTENT_CHARS = 50000
const MAX_TITLE_CHARS = 200
const ALLOWED_SOURCES = new Set(['guest', 'session', 'cli'])
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const TOKEN_RE = /^[a-f0-9]{16,64}$/

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

function checkShareRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = shareRateLimits.get(ip)
  if (!entry || now >= entry.resetAt) {
    shareRateLimits.set(ip, { count: 1, resetAt: now + SHARE_RATE_WINDOW_MS })
    return true
  }
  if (entry.count >= SHARE_RATE_LIMIT) return false
  entry.count++
  return true
}

setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of shareRateLimits) {
    if (now >= entry.resetAt) shareRateLimits.delete(ip)
  }
}, 5 * 60 * 1000)

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

type DatabasePool = ReturnType<typeof getDatabasePool>

async function captureLead(pool: DatabasePool, email: string) {
  try {
    await pool.query(
      `
        INSERT INTO "public"."beta_access" ("email", "source")
        VALUES ($1, $2)
        ON CONFLICT ("email") DO NOTHING
      `,
      [email, 'plan_grill_artifact'],
    )
  } catch (error) {
    console.error('[Artifact Share] Lead capture failed (non-fatal):', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function verifyCallerOwnsSession(
  request: NextRequest,
  pool: DatabasePool,
  source: string,
  sessionId: string | null,
): Promise<Response | null> {
  if (source !== 'session' && !sessionId) return null

  const railwaySession = await getRailwaySession(request)
  const user = railwaySession?.user
  if (!user) return json({ error: 'Unauthorized' }, 401)

  if (!sessionId) return null

  const { rows } = await pool.query<{ id: string }>(
    `
      SELECT "id"
      FROM "public"."bmad_sessions"
      WHERE "id" = $1
        AND "user_id" = $2
      LIMIT 1
    `,
    [sessionId, user.id],
  )

  return rows[0] ? null : json({ error: 'Session not found' }, 404)
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    if (!checkShareRateLimit(ip)) {
      return json({ error: 'Rate limit exceeded', message: 'Too many share links created. Try again later.' }, 429)
    }

    const body = await request.json()
    const title = typeof body?.title === 'string' ? body.title.trim().slice(0, MAX_TITLE_CHARS) : ''
    const content = typeof body?.content === 'string' ? body.content : ''
    const pathway = typeof body?.pathway === 'string' ? body.pathway.slice(0, 64) : null
    const source = ALLOWED_SOURCES.has(body?.source) ? body.source : 'guest'
    const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : null
    const emailRaw = typeof body?.email === 'string' ? body.email.trim() : ''
    const email = emailRaw && EMAIL_RE.test(emailRaw) ? emailRaw.slice(0, 320) : null
    const reuseToken = typeof body?.token === 'string' && TOKEN_RE.test(body.token) ? body.token : null

    if (!content.trim()) return json({ error: 'Artifact content is required' }, 400)
    if (content.length > MAX_CONTENT_CHARS) return json({ error: 'Artifact content is too large to share' }, 413)

    let pool: DatabasePool
    try {
      pool = getDatabasePool()
    } catch {
      return json({ error: 'Sharing is temporarily unavailable' }, 503)
    }
    const ownershipError = await verifyCallerOwnsSession(request, pool, source, sessionId)
    if (ownershipError) return ownershipError

    const token = reuseToken || `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, '').slice(0, 22)

    if (!reuseToken) {
      try {
        await pool.query(
          `
            INSERT INTO "public"."public_artifacts" (
              "token", "title", "content", "pathway", "source", "session_id", "email"
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `,
          [token, title || 'Decision Record', content, pathway, source, sessionId, email],
        )
      } catch (error) {
        console.error('[Artifact Share] Insert failed:', error instanceof Error ? error.message : 'Unknown error')
        return json({ error: 'Could not create share link' }, 500)
      }
    }

    const url = `/share/${token}`
    const origin = request.headers.get('origin') || new URL(request.url).origin
    const absoluteUrl = `${origin}${url}`

    if (email) await captureLead(pool, email)

    return json({ token, url, absoluteUrl }, 200)
  } catch (error) {
    console.error('[Artifact Share] Error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    })
    return json({ error: 'Failed to create share link' }, 500)
  }
}
