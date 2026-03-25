import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p
          className="font-display text-[8rem] leading-none font-bold text-terracotta/20 select-none"
          aria-hidden="true"
        >
          404
        </p>

        <h1 className="font-display text-3xl font-semibold text-ink mt-2">
          Page not found
        </h1>

        <p className="font-body text-base text-ink-light mt-4 leading-relaxed">
          It seems this page wandered off the agenda. Let&apos;s get you back to
          a productive session.
        </p>

        <nav className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-terracotta px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-terracotta-hover"
          >
            Home
          </Link>
          <Link
            href="/app"
            className="inline-flex items-center justify-center rounded-md border border-terracotta px-5 py-2.5 text-sm font-medium text-terracotta transition-colors hover:bg-terracotta/5"
          >
            Dashboard
          </Link>
          <Link
            href="/try"
            className="inline-flex items-center justify-center rounded-md border border-ink/15 px-5 py-2.5 text-sm font-medium text-ink-light transition-colors hover:bg-parchment"
          >
            Try It
          </Link>
        </nav>
      </div>
    </div>
  )
}
