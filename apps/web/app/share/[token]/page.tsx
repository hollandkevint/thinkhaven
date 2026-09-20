import { cache } from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'
import MarkdownRenderer from '@/app/components/chat/MarkdownRenderer'
import { getDatabasePool } from '@/lib/db/pool'
import { summarizeRecord } from '@/lib/artifact/record-summary'
import ShareCta from './ShareCta'
import ShareViewTracker from './ShareViewTracker'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const TOKEN_RE = /^[a-f0-9]{16,64}$/

interface ShareArtifact {
  id: string
  title: string
  content: string
  created_at: string
  indexable: boolean
}

interface ShareArtifactRow extends Omit<ShareArtifact, 'created_at'> {
  created_at: string | Date
}

function timestamp(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value
}

// cache() dedupes the read across generateMetadata + the page render (one request).
const getArtifact = cache(async (token: string): Promise<ShareArtifact | null> => {
  if (!TOKEN_RE.test(token)) return null

  try {
    const { rows } = await getDatabasePool().query<ShareArtifactRow>(
      `
        SELECT "id", "title", "content", "created_at", "indexable"
        FROM "public"."public_artifacts"
        WHERE "token" = $1
        LIMIT 1
      `,
      [token],
    )
    const row = rows[0]
    return row ? { ...row, created_at: timestamp(row.created_at) } : null
  } catch (error) {
    console.error('[Artifact Share Page] Database lookup failed:', error instanceof Error ? error.message : 'Unknown error')
    return null
  }
})

const NOINDEX = { index: false, follow: false, nocache: true } as const

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const { token } = await params
  const artifact = await getArtifact(token)

  if (!artifact) {
    return {
      title: 'Decision Record · ThinkHaven',
      description: 'A defensible decision record produced with ThinkHaven.',
      robots: NOINDEX,
    }
  }

  const { decision, weakestAssumption } = summarizeRecord(artifact.content)
  const title = `${artifact.title} · ThinkHaven Decision Record`
  const description = [
    decision,
    weakestAssumption ? `Weakest assumption: ${weakestAssumption}` : null,
  ]
    .filter(Boolean)
    .join(' ') || 'A defensible decision record produced with ThinkHaven.'

  return {
    title,
    description,
    robots: artifact.indexable ? undefined : NOINDEX,
    openGraph: {
      type: 'article',
      title,
      description,
      siteName: 'ThinkHaven',
      publishedTime: artifact.created_at,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

function ShareShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-divider bg-cream">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-display text-lg font-semibold text-ink">
            ThinkHaven
          </Link>
          <span className="inline-flex items-center rounded-full bg-forest/10 px-2 py-0.5 font-display text-[10px] font-medium uppercase tracking-wider text-forest">
            Decision record
          </span>
        </div>
      </header>
      {children}
    </div>
  )
}

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const artifact = await getArtifact(token)

  if (!artifact) {
    return (
      <ShareShell>
        <ShareViewTracker artifactId={null} found={false} />
        <main className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h1 className="font-display text-2xl font-medium text-ink">This decision record is not available</h1>
          <p className="mt-3 font-body text-sm leading-relaxed text-ink-light">
            The link may be incorrect or the record may have been removed.
          </p>
          <div className="mt-8">
            <ShareCta artifactId={null} placement="not_found" label="Grill your own plan" />
          </div>
        </main>
      </ShareShell>
    )
  }

  const { decision, weakestAssumption } = summarizeRecord(artifact.content)

  return (
    <ShareShell>
      <ShareViewTracker artifactId={artifact.id} found />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <article className="rounded-xl border border-ink/10 bg-parchment/40 px-6 py-8 sm:px-10">
          <MarkdownRenderer content={artifact.content} />
        </article>

        <section className="mt-8 rounded-xl border border-terracotta/20 bg-terracotta/5 px-6 py-6 text-center">
          <h2 className="font-display text-lg font-medium text-ink">
            {weakestAssumption ? 'This record has a weak point' : 'Built with ThinkHaven'}
          </h2>
          <p className="mx-auto mt-2 max-w-xl font-body text-sm leading-relaxed text-ink-light">
            {weakestAssumption
              ? `It assumes: ${weakestAssumption} Bring your own plan and Mary will find where yours breaks.`
              : 'ThinkHaven stages board-style pressure tests that turn a vague idea into a defensible recommendation. Bring a plan and we will grill it.'}
          </p>
          <div className="mt-5">
            <ShareCta
              artifactId={artifact.id}
              placement="record"
              token={token}
              label={decision ? 'Grill your own plan against this one' : 'Grill your own plan'}
            />
          </div>
        </section>
      </main>
    </ShareShell>
  )
}
