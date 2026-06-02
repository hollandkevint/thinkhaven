import { NextRequest } from 'next/server';
import { claudeClient } from '@/lib/ai/claude-client';

/**
 * Guest Decision-Record Synthesis API
 *
 * Turns a guest plan-grill transcript into a shareable decision_record artifact.
 * No auth and no database persistence: the artifact is synthesized from the
 * transcript the client holds in localStorage and returned for download / share.
 *
 * The decision_record section shape mirrors the canonical template in
 * lib/ai/tools/document-tools.ts (DOCUMENT_TEMPLATES.decision_record). Keep them in sync.
 */

// Synthesis is a single, heavier completion, so it gets its own tighter IP limit.
const ARTIFACT_RATE_LIMIT = 8; // syntheses per window per IP
const ARTIFACT_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const artifactRateLimits = new Map<string, { count: number; resetAt: number }>();

const MAX_TRANSCRIPT_CHARS = 24000;

interface TranscriptMessage {
  role: 'user' | 'assistant';
  content: string;
}

function checkArtifactRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = artifactRateLimits.get(ip);

  if (!entry || now >= entry.resetAt) {
    artifactRateLimits.set(ip, { count: 1, resetAt: now + ARTIFACT_RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= ARTIFACT_RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of artifactRateLimits) {
    if (now >= entry.resetAt) artifactRateLimits.delete(ip);
  }
}, 5 * 60 * 1000);

const SYNTHESIS_SYSTEM_PROMPT = `You are ThinkHaven's decision-record synthesizer. You take a pressure-test conversation between a user and Mary (a skeptical strategist) and distill it into a sparse, defensible decision record the user can keep and share.

Honesty over flattery. Do not praise. Do not invent decisions, evidence, or agreement that the transcript does not support. If something was raised but never resolved, it is an open question, not a resolved decision. If a claim was asserted without evidence, record it as an assumption, not a fact.

Output GitHub-flavored Markdown only, no preamble or sign-off. Use this exact structure:

# <short decision title>

> <one or two sentence summary of the decision under review and where it currently stands>

## Resolved Decisions
## Open Questions
## Assumptions
## Risks
## ADR-Worthy Decisions
## Recommended Next Action

Rules for the sections:
- Use concise bullet points. If a section has nothing real to record, write "- None surfaced yet." rather than padding.
- ADR-Worthy Decisions: only list a decision if it is hard to reverse, surprising without context, and the result of a real trade-off. Note the trade-off in one clause.
- Recommended Next Action: one concrete, testable next move the user can take this week.
Keep the whole record tight. It is a sharpening tool, not a report.`;

function renderTranscript(transcript: TranscriptMessage[]): string {
  return transcript
    .map((m) => `${m.role === 'assistant' ? 'Mary' : 'User'}: ${m.content}`)
    .join('\n\n');
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    if (!checkArtifactRateLimit(ip)) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        message: 'Too many decision records generated. Sign up for unlimited access.',
      }), { status: 429, headers: { 'Content-Type': 'application/json' } });
    }

    const body = await request.json();
    const rawTranscript = body?.transcript;

    if (!Array.isArray(rawTranscript) || rawTranscript.length === 0) {
      return new Response(JSON.stringify({ error: 'A non-empty transcript is required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    // Sanitize and bound the transcript.
    const transcript: TranscriptMessage[] = rawTranscript
      .filter((m: unknown): m is TranscriptMessage =>
        !!m && typeof m === 'object'
        && (((m as TranscriptMessage).role === 'user') || ((m as TranscriptMessage).role === 'assistant'))
        && typeof (m as TranscriptMessage).content === 'string'
        && (m as TranscriptMessage).content.trim().length > 0
      )
      .map((m) => ({ role: m.role, content: m.content.slice(0, 6000) }));

    if (transcript.length === 0 || !transcript.some((m) => m.role === 'user')) {
      return new Response(JSON.stringify({ error: 'Transcript has no usable messages yet. Grill your plan first.' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    let rendered = renderTranscript(transcript);
    if (rendered.length > MAX_TRANSCRIPT_CHARS) {
      // Keep the most recent exchanges, where the sharpened decision lives.
      rendered = rendered.slice(-MAX_TRANSCRIPT_CHARS);
    }

    const content = await claudeClient.complete({
      system: SYNTHESIS_SYSTEM_PROMPT,
      prompt: `Here is the plan-grill transcript. Synthesize the decision record.\n\n---\n${rendered}\n---`,
      maxTokens: 2048,
      temperature: 0.4,
    });

    const trimmed = content.trim();
    if (!trimmed) {
      return new Response(JSON.stringify({ error: 'Could not synthesize a decision record. Please try again.' }), {
        status: 502, headers: { 'Content-Type': 'application/json' },
      });
    }

    // Derive a title from the first H1, falling back to a default.
    const headingMatch = trimmed.match(/^#\s+(.+)$/m);
    const title = headingMatch?.[1]?.trim().slice(0, 120) || 'Decision Record';

    return new Response(JSON.stringify({ title, content: trimmed }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Guest Artifact] Error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
    return new Response(JSON.stringify({
      error: 'Failed to generate decision record',
      details: process.env.NODE_ENV !== 'production' ? (error instanceof Error ? error.message : 'Unknown error') : undefined,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
