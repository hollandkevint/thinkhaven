import Link from 'next/link'

const STRIPE_PAYMENT_LINK = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="absolute top-8 left-8">
        <Link href="/" className="text-2xl font-bold font-display text-foreground">
          Thinkhaven
        </Link>
      </div>

      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-3xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold font-display text-ink mb-3">
              Simple pricing for clear thinking
            </h1>
            <p className="text-ink-light text-lg">
              Each session gets you a structured challenge from Mary and a filled Lean Canvas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Free Tier */}
            <div className="bg-cream border border-ink/10 rounded-xl p-8">
              <h2 className="font-display font-semibold text-lg text-ink mb-1">Free</h2>
              <p className="text-3xl font-bold font-display text-ink mb-1">$0</p>
              <p className="text-sm text-ink-light mb-6">5 sessions included</p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-sm text-ink">
                  <svg className="w-4 h-4 text-forest flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Full access to Mary
                </li>
                <li className="flex items-start gap-2 text-sm text-ink">
                  <svg className="w-4 h-4 text-forest flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Board of Directors
                </li>
                <li className="flex items-start gap-2 text-sm text-ink">
                  <svg className="w-4 h-4 text-forest flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Lean Canvas generation
                </li>
              </ul>

              <Link
                href="/signup"
                className="block w-full text-center py-3 px-6 rounded-lg border border-ink/20 text-ink font-medium hover:bg-parchment transition-colors"
              >
                Get started free
              </Link>
            </div>

            {/* Pro Tier */}
            <div className="bg-cream border-2 border-terracotta rounded-xl p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-terracotta text-cream text-xs font-semibold px-3 py-1 rounded-full">
                Most Popular
              </div>
              <h2 className="font-display font-semibold text-lg text-ink mb-1">Pro</h2>
              <p className="text-3xl font-bold font-display text-ink mb-1">$39</p>
              <p className="text-sm text-ink-light mb-6">10 sessions, one-time</p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-sm text-ink">
                  <svg className="w-4 h-4 text-forest flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Everything in Free
                </li>
                <li className="flex items-start gap-2 text-sm text-ink">
                  <svg className="w-4 h-4 text-forest flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  10 strategic sessions
                </li>
                <li className="flex items-start gap-2 text-sm text-ink">
                  <svg className="w-4 h-4 text-forest flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Canvas markdown export
                </li>
              </ul>

              {STRIPE_PAYMENT_LINK ? (
                <a
                  href={STRIPE_PAYMENT_LINK}
                  className="block w-full text-center py-3 px-6 rounded-lg bg-terracotta text-cream font-medium hover:bg-terracotta-hover transition-colors shadow-lg"
                >
                  Get 10 sessions
                </a>
              ) : (
                <div className="w-full text-center py-3 px-6 rounded-lg bg-parchment text-ink-light font-medium">
                  Coming soon
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-sm text-ink-light mt-8">
            Each session includes Mary's structured challenge loop, Board of Directors perspectives, and a progressive Lean Canvas. No subscriptions.
          </p>
        </div>
      </div>
    </div>
  )
}
