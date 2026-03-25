import Link from 'next/link'
import { Button } from '@/components/ui/button'

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
          <Button asChild>
            <Link href="/">Home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/app">Dashboard</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/try">Try It</Link>
          </Button>
        </nav>
      </div>
    </div>
  )
}
