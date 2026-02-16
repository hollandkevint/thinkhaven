'use client'

import { useState } from 'react'
import { SessionMigration } from '@/lib/guest/session-migration'
import { useRouter } from 'next/navigation'

interface SignupPromptModalProps {
  isOpen: boolean
  onClose: () => void
  sessionSummary?: string
}

export default function SignupPromptModal({
  isOpen,
  onClose,
  sessionSummary
}: SignupPromptModalProps) {
  const router = useRouter()
  const [showSummary, setShowSummary] = useState(false)

  if (!isOpen) return null

  const handleSignup = () => {
    // Redirect to signup page
    // Session will be migrated after successful authentication
    router.push('/auth?mode=signup&from=guest')
  }

  const handleViewSummary = () => {
    setShowSummary(true)
  }

  const summary = sessionSummary || SessionMigration.generateSessionSummary()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-blue/60 hover:text-slate-blue transition-colors"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {!showSummary ? (
          <>
            {/* Main Content */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--terracotta)' }}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--cream)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--ink)' }}>
                Ready for more?
              </h2>
              <p style={{ color: 'var(--slate-blue)' }}>
                You've reached your 10 free messages. Sign up to continue your conversation with Mary and unlock unlimited strategic insights.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-forest flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-medium text-ink">Your conversation will be saved</p>
                  <p className="text-sm text-ink-light">Pick up right where you left off</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-forest flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-medium text-ink">Unlimited conversations</p>
                  <p className="text-sm text-ink-light">No more message limits</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-forest flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-medium text-ink">Access to all features</p>
                  <p className="text-sm text-ink-light">Canvas workspace, exports, and more</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleSignup}
                className="w-full font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                style={{ backgroundColor: 'var(--terracotta)', color: 'var(--cream)' }}
              >
                Sign up to continue
              </button>

              <button
                onClick={handleViewSummary}
                className="w-full bg-parchment text-ink-light font-medium py-3 px-6 rounded-lg hover:bg-cream transition-colors"
              >
                View conversation summary
              </button>
            </div>

            {/* Fine print */}
            <p className="text-xs text-slate-blue text-center mt-4">
              Free to sign up. No credit card required.
            </p>
          </>
        ) : (
          <>
            {/* Summary View */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-ink mb-4">
                Your conversation summary
              </h2>
              <div className="bg-parchment rounded-lg p-4 mb-4">
                <p className="text-ink-light whitespace-pre-line text-sm">
                  {summary}
                </p>
              </div>
              <p className="text-sm text-ink-light">
                Sign up to save this conversation and continue where you left off.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleSignup}
                className="w-full font-medium py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                style={{ backgroundColor: 'var(--terracotta)', color: 'var(--cream)' }}
              >
                Sign up to save
              </button>

              <button
                onClick={() => setShowSummary(false)}
                className="w-full bg-parchment text-ink-light font-medium py-3 px-6 rounded-lg hover:bg-cream transition-colors"
              >
                Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
