import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

const STRIPE_PAYMENT_LINK = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK

const includedRows = [
  {
    title: 'Artifact',
    description: 'A saved brief, scorecard, canvas, or structured analysis you can return to.',
  },
  {
    title: 'Decision',
    description: 'Mary and the board keep pressure on the choice until the tradeoffs are explicit.',
  },
  {
    title: 'Confidence',
    description: 'You leave with the strongest case and the fragile points still visible.',
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-cream">
      <main className="px-4 py-16 sm:px-6 lg:py-20">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-4 text-xs font-display font-medium uppercase tracking-wider text-terracotta">
              Public trial, beta workspace
            </p>
            <h1 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
              Choose the amount of saved decision work you need
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-ink-light">
              Start with 10 guest messages. When you need a workspace, saved sessions, and exportable artifacts, use the beta access list or a one-time session pack.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-lg border border-ink/10 bg-parchment p-6">
              <h2 className="font-display text-xl font-semibold text-ink">What each saved session is for</h2>
              <div className="mt-6 space-y-5">
                {includedRows.map((row) => (
                  <div key={row.title} className="flex gap-3">
                    <div className="mt-0.5 flex size-7 flex-shrink-0 items-center justify-center rounded-md bg-forest/10 text-forest">
                      <CheckCircle2 className="size-4" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-ink">
                        {row.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-ink-light">{row.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-6 border-t border-ink/10 pt-5 text-sm leading-relaxed text-slate-blue">
                Pricing does not change the public trial. Every visitor can test Mary before creating an account.
              </p>
            </section>

            <section className="grid gap-6 md:grid-cols-2">
              <div className="rounded-lg border border-ink/10 bg-cream p-6">
                <div className="flex min-h-24 flex-col justify-between">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-ink">Guest trial</h2>
                    <p className="mt-1 text-sm text-ink-light">For the first pressure test.</p>
                  </div>
                  <p className="mt-5 font-display text-4xl font-semibold text-ink">$0</p>
                </div>

                <ul className="mt-6 space-y-3 text-sm text-ink">
                  <li className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 flex-shrink-0 text-forest" aria-hidden="true" />
                    <span>10 messages with Mary before signup</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 flex-shrink-0 text-forest" aria-hidden="true" />
                    <span>Plan-grill mode for pasted strategy docs</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 flex-shrink-0 text-forest" aria-hidden="true" />
                    <span>Beta account path for saved sessions</span>
                  </li>
                </ul>

                <Link
                  href="/try"
                  className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-ink/20 px-4 py-3 text-sm font-semibold text-ink transition hover:bg-parchment"
                >
                  Try 10 messages
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>

              <div className="rounded-lg border border-terracotta bg-cream p-6 shadow-sm">
                <div className="flex min-h-24 flex-col justify-between">
                  <div>
                    <p className="mb-2 inline-flex rounded-full bg-terracotta/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-terracotta">
                      One-time pack
                    </p>
                    <h2 className="font-display text-lg font-semibold text-ink">Saved workspace</h2>
                    <p className="mt-1 text-sm text-ink-light">For decisions that need artifacts and history.</p>
                  </div>
                  <p className="mt-5 font-display text-4xl font-semibold text-ink">$39</p>
                </div>

                <ul className="mt-6 space-y-3 text-sm text-ink">
                  <li className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 flex-shrink-0 text-forest" aria-hidden="true" />
                    <span>10 saved sessions, one-time</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 flex-shrink-0 text-forest" aria-hidden="true" />
                    <span>Decision artifacts and markdown export</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 flex-shrink-0 text-forest" aria-hidden="true" />
                    <span>Session history for defended decisions</span>
                  </li>
                </ul>

                {STRIPE_PAYMENT_LINK ? (
                  <a
                    href={STRIPE_PAYMENT_LINK}
                    className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-terracotta px-4 py-3 text-sm font-semibold text-cream transition hover:bg-terracotta-hover"
                  >
                    Get 10 sessions
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </a>
                ) : (
                  <div className="mt-8 w-full rounded-lg bg-parchment px-4 py-3 text-center text-sm font-semibold text-ink-light">
                    Checkout opens when beta access is active
                  </div>
                )}
              </div>
            </section>
          </div>

          <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-ink-light">
            No subscriptions. Beta workspace access is reviewed separately so saved decision work stays inside the current product capacity.
          </p>
        </div>
      </main>
    </div>
  )
}
