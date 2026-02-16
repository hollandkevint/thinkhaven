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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta mx-auto mb-4"></div>
          <p className="text-ink-light">Confirming your purchase...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-ink mb-2">Something went wrong</h1>
            <p className="text-ink-light mb-6">
              We couldn&apos;t confirm your purchase. If you were charged, please contact support.
            </p>
            <Button onClick={() => router.push('/')}>
              Return Home
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
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-ink mb-2">
            You&apos;re all set!
          </h1>
          <p className="text-xl text-ink-light mb-6">
            Your Idea Validation session is ready.
          </p>

          <div className="bg-parchment rounded-lg p-4 mb-6 text-left">
            <h2 className="font-semibold text-ink mb-2">What happens next:</h2>
            <ul className="space-y-2 text-ink-light">
              <li className="flex items-start">
                <span className="text-forest mr-2">1.</span>
                Start your 30-minute validation session
              </li>
              <li className="flex items-start">
                <span className="text-forest mr-2">2.</span>
                Answer 10 critical questions about your idea
              </li>
              <li className="flex items-start">
                <span className="text-forest mr-2">3.</span>
                Get your validation scorecard and PDF report
              </li>
            </ul>
          </div>

          <Button
            size="lg"
            className="w-full py-6 text-lg font-bold"
            onClick={() => router.push('/app')}
          >
            Start My Validation Session
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
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta mx-auto mb-4"></div>
        <p className="text-ink-light">Loading...</p>
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
