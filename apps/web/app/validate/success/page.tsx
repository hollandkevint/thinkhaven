'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

function ValidateSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    if (!sessionId) {
      setStatus('error')
      return
    }
    // Payment successful - session_id confirms Stripe redirect
    setStatus('success')
  }, [sessionId])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="w-full max-w-sm rounded-lg border border-ink/10 bg-parchment p-6 text-center">
          <div className="mx-auto h-4 w-32 rounded bg-ink/10 animate-pulse" />
          <div className="mx-auto mt-4 h-8 w-52 rounded bg-ink/10 animate-pulse" />
          <p className="mt-5 text-sm text-ink-light">Confirming your purchase.</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-md bg-rust/10 text-rust">
              <span className="font-display text-xl font-semibold">!</span>
            </div>
            <h1 className="text-2xl font-bold text-ink mb-2">Payment confirmation unavailable</h1>
            <p className="text-ink-light mb-6">
              We could not confirm this purchase from the current link. If you were charged, contact support and keep the receipt email.
            </p>
            <Button onClick={() => router.push('/pricing')}>
              Return to pricing
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-4">
      <Card className="max-w-lg w-full">
        <CardContent className="p-8 text-center">
          <h1 className="text-3xl font-bold text-ink mb-2">
            Your session credits are ready
          </h1>
          <p className="text-xl text-ink-light mb-6">
            Open the workspace to start saved decision work.
          </p>

          <div className="bg-parchment rounded-lg p-4 mb-6 text-left">
            <h2 className="font-semibold text-ink mb-2">What happens next:</h2>
            <ul className="space-y-2 text-ink-light">
              <li className="flex items-start">
                <span className="text-forest mr-2">1.</span>
                Start a saved ThinkHaven session
              </li>
              <li className="flex items-start">
                <span className="text-forest mr-2">2.</span>
                Pressure-test the decision with Mary and the board
              </li>
              <li className="flex items-start">
                <span className="text-forest mr-2">3.</span>
                Export the artifact when the case is ready
              </li>
            </ul>
          </div>

          <Button
            size="lg"
            className="w-full py-6 text-lg font-bold"
            onClick={() => router.push('/app')}
          >
            Open workspace
          </Button>

          <p className="text-sm text-slate-blue mt-4">
            A receipt has been sent to your email.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="w-full max-w-sm rounded-lg border border-ink/10 bg-parchment p-6 text-center">
        <div className="mx-auto h-4 w-32 rounded bg-ink/10 animate-pulse" />
        <div className="mx-auto mt-4 h-8 w-52 rounded bg-ink/10 animate-pulse" />
        <p className="mt-5 text-sm text-ink-light">Loading payment confirmation.</p>
      </div>
    </div>
  )
}

export default function ValidateSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ValidateSuccessContent />
    </Suspense>
  )
}
