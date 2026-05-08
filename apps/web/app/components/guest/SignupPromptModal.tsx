'use client'

import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { SessionMigration } from '@/lib/guest/session-migration'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, FileText, Save, X } from 'lucide-react'

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

  useEffect(() => {
    if (!isOpen) {
      setShowSummary(false)
    }
  }, [isOpen])

  const handleSignup = () => {
    // Redirect to signup page
    // Session will be migrated after successful authentication
    router.push('/signup?from=guest')
  }

  const handleViewSummary = () => {
    setShowSummary(true)
  }

  const summary = sessionSummary || SessionMigration.generateSessionSummary()

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-ink/50 z-50 data-[state=open]:animate-fadeIn" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg bg-cream p-6 shadow-lg focus:outline-none md:p-8">
          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 text-ink/40 hover:text-ink transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </Dialog.Close>

          {!showSummary ? (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 bg-terracotta/10">
                  <Save className="w-6 h-6 text-terracotta" />
                </div>
                <Dialog.Title className="font-display text-2xl font-medium mb-2 text-ink">
                  Save the thread before it disappears
                </Dialog.Title>
                <Dialog.Description className="text-sm text-ink-light leading-relaxed">
                  You&apos;ve used your 10 free messages. Sign up to keep this decision thread and continue the pressure test with Mary.
                </Dialog.Description>
              </div>

              <div className="space-y-3 mb-6">
                {[
                  ['Your conversation will be saved', 'Pick up right where you left off'],
                  ['Unlimited conversations', 'No more message limits'],
                  ['Workspace access', 'Canvas, exports, and session history'],
                ].map(([title, description]) => (
                  <div key={title} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-forest flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-ink">{title}</p>
                      <p className="text-sm text-ink-light">{description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleSignup}
                  className="w-full font-display font-medium py-3 px-6 rounded-lg transition-colors bg-terracotta hover:bg-terracotta-hover text-cream"
                >
                  Sign up to continue
                </button>

                <button
                  onClick={handleViewSummary}
                  className="w-full bg-parchment text-ink font-display font-medium py-3 px-6 rounded-lg hover:bg-ink/5 transition-colors flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  View conversation summary
                </button>
              </div>

              {/* Sign in link + fine print */}
              <p className="text-sm text-center mt-4">
                <span className="text-slate-blue">Already have an account? </span>
                <Link href="/login" className="font-semibold text-terracotta hover:text-terracotta-hover">
                  Sign in
                </Link>
              </p>
              <p className="text-xs text-slate-blue text-center mt-2">
                Free to sign up. No credit card required.
              </p>
            </>
          ) : (
            <>
              <div className="mb-6">
                <Dialog.Title className="font-display text-2xl font-medium text-ink mb-4">
                  Your conversation summary
                </Dialog.Title>
                <Dialog.Description className="sr-only">
                  Review the guest conversation summary before signing up.
                </Dialog.Description>
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
                  className="w-full font-display font-medium py-3 px-6 rounded-lg transition-colors bg-terracotta hover:bg-terracotta-hover text-cream"
                >
                  Sign up to save
                </button>

                <button
                  onClick={() => setShowSummary(false)}
                  className="w-full bg-parchment text-ink font-display font-medium py-3 px-6 rounded-lg hover:bg-ink/5 transition-colors"
                >
                  Back
                </button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
