'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('ThinkHaven error boundary:', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-full bg-terracotta/10 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-terracotta" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-2xl font-semibold text-ink">
            Something went wrong
          </h1>
          <p className="text-ink-light font-body leading-relaxed">
            We hit an unexpected snag. This is on us, not you. Try again or head
            back to familiar ground.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={reset} className="w-full">
            Try Again
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/app">Back to Dashboard</Link>
          </Button>
          <Button variant="ghost" asChild className="w-full text-sm">
            <Link href="/">Go Home</Link>
          </Button>
        </div>

        {error.digest && (
          <p className="text-xs text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
