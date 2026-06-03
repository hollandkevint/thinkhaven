import Link from 'next/link'
import type { Metadata } from 'next'
import MarkdownRenderer from '@/app/components/chat/MarkdownRenderer'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Decision Record · ThinkHaven',
  description: 'A defensible decision record produced with ThinkHaven.',
}

async function getArtifact(token: string) {
  const admin = createAdminClient()
  if (!admin) return null
  const { data } = await admin
    .from('public_artifacts')
    .select('title, content, created_at')
    .eq('token', token)
    .maybeSingle()
  return data as { title: string; content: string; created_at: string } | null
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
        <main className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h1 className="font-display text-2xl font-medium text-ink">This decision record is not available</h1>
          <p className="mt-3 font-body text-sm leading-relaxed text-ink-light">
            The link may be incorrect or the record may have been removed.
          </p>
          <Link
            href="/try?mode=plan-grill"
            className="mt-8 inline-block rounded-lg bg-terracotta px-5 py-2.5 font-display text-sm font-medium text-cream transition-colors hover:bg-terracotta-hover"
          >
            Grill your own plan
          </Link>
        </main>
      </ShareShell>
    )
  }

  return (
    <ShareShell>
      <main className="mx-auto max-w-3xl px-6 py-10">
        <article className="rounded-xl border border-ink/10 bg-parchment/40 px-6 py-8 sm:px-10">
          <MarkdownRenderer content={artifact.content} />
        </article>

        <section className="mt-8 rounded-xl border border-terracotta/20 bg-terracotta/5 px-6 py-6 text-center">
          <h2 className="font-display text-lg font-medium text-ink">Built with ThinkHaven</h2>
          <p className="mx-auto mt-2 max-w-xl font-body text-sm leading-relaxed text-ink-light">
            ThinkHaven stages board-style pressure tests that turn a vague idea into a defensible
            recommendation. Bring a plan and we will grill it.
          </p>
          <Link
            href="/try?mode=plan-grill"
            className="mt-5 inline-block rounded-lg bg-terracotta px-5 py-2.5 font-display text-sm font-medium text-cream transition-colors hover:bg-terracotta-hover"
          >
            Grill your own plan
          </Link>
        </section>
      </main>
    </ShareShell>
  )
}
