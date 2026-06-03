import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Public Artifact Share API
 *
 * The harness seam: turns artifact markdown into a public, read-only link at /share/<token>.
 * Callable from the browser (guest/authed artifact UI) AND from a CLI/skill (server-to-server),
 * so it is public (no cookie auth), CORS-enabled, rate-limited, and length-capped.
 *
 * Inserts run through the service-role admin client (RLS has no anon INSERT policy).
 */

const SHARE_RATE_LIMIT = 20; // shares per window per IP
const SHARE_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const shareRateLimits = new Map<string, { count: number; resetAt: number }>();

const MAX_CONTENT_CHARS = 50000;
const MAX_TITLE_CHARS = 200;
const ALLOWED_SOURCES = new Set(['guest', 'session', 'cli']);
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const TOKEN_RE = /^[a-f0-9]{16,64}$/;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function checkShareRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = shareRateLimits.get(ip);
  if (!entry || now >= entry.resetAt) {
    shareRateLimits.set(ip, { count: 1, resetAt: now + SHARE_RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= SHARE_RATE_LIMIT) return false;
  entry.count++;
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of shareRateLimits) {
    if (now >= entry.resetAt) shareRateLimits.delete(ip);
  }
}, 5 * 60 * 1000);

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

async function captureLead(admin: ReturnType<typeof createAdminClient>, email: string) {
  if (!admin) return;
  try {
    // Only add a new lead row if this email is not already tracked.
    const { data: existing } = await admin
      .from('beta_access')
      .select('id')
      .eq('email', email)
      .limit(1)
      .maybeSingle();
    if (!existing) {
      await admin.from('beta_access').insert({ email, source: 'plan_grill_artifact' });
    }
  } catch (error) {
    console.error('[Artifact Share] Lead capture failed (non-fatal):', error);
  }
}

async function sendShareEmail(email: string, title: string, url: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!apiKey || !from) return; // Email send is feature-flagged; on-screen link is the guaranteed path.
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to: email,
      subject: `Your decision record: ${title}`,
      text: `Here is the decision record you built with ThinkHaven:\n\n${url}\n\nThinkHaven stages board-style pressure tests that turn a vague idea into a defensible recommendation. Grill your next plan at ${new URL(url).origin}/try?mode=plan-grill`,
    });
  } catch (error) {
    console.error('[Artifact Share] Email send failed (non-fatal):', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    if (!checkShareRateLimit(ip)) {
      return json({ error: 'Rate limit exceeded', message: 'Too many share links created. Try again later.' }, 429);
    }

    const body = await request.json();
    const title = typeof body?.title === 'string' ? body.title.trim().slice(0, MAX_TITLE_CHARS) : '';
    const content = typeof body?.content === 'string' ? body.content : '';
    const pathway = typeof body?.pathway === 'string' ? body.pathway.slice(0, 64) : null;
    const source = ALLOWED_SOURCES.has(body?.source) ? body.source : 'guest';
    const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : null;
    const emailRaw = typeof body?.email === 'string' ? body.email.trim() : '';
    const email = emailRaw && EMAIL_RE.test(emailRaw) ? emailRaw.slice(0, 320) : null;
    // When the client passes back a token from a prior share, reuse that row instead of inserting a new one.
    const reuseToken = typeof body?.token === 'string' && TOKEN_RE.test(body.token) ? body.token : null;

    if (!content.trim()) {
      return json({ error: 'Artifact content is required' }, 400);
    }
    if (content.length > MAX_CONTENT_CHARS) {
      return json({ error: 'Artifact content is too large to share' }, 413);
    }

    const admin = createAdminClient();
    if (!admin) {
      return json({ error: 'Sharing is temporarily unavailable' }, 503);
    }

    const token = reuseToken || `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, '').slice(0, 22);

    if (!reuseToken) {
      const { error: insertError } = await admin.from('public_artifacts').insert({
        token,
        title: title || 'Decision Record',
        content,
        pathway,
        source,
        session_id: sessionId,
        email,
      });

      if (insertError) {
        console.error('[Artifact Share] Insert failed:', insertError.message);
        return json({ error: 'Could not create share link' }, 500);
      }
    }

    const url = `/share/${token}`;
    // Absolute URL so non-browser callers (CLI/skill) get a usable link, not a bare path.
    // Prefer the browser Origin header; fall back to the request URL's origin for server-to-server callers.
    const origin = request.headers.get('origin') || new URL(request.url).origin;
    const absoluteUrl = `${origin}${url}`;

    if (email) {
      await captureLead(admin, email);
      // Best-effort send (feature-flagged on RESEND_API_KEY).
      await sendShareEmail(email, title || 'Decision Record', absoluteUrl);
    }

    return json({ token, url, absoluteUrl }, 200);
  } catch (error) {
    console.error('[Artifact Share] Error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
    return json({ error: 'Failed to create share link' }, 500);
  }
}
