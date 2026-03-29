'use client'

import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Users, Target, Lightbulb } from 'lucide-react'

const STORAGE_KEY = 'thinkhaven_onboarding_completed'

export function OnboardingModal() {
  // Initialize false to match SSR, then check localStorage after hydration
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setShow(true)
    }
  }, [])

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setShow(false)
  }

  return (
    <Dialog.Root open={show} onOpenChange={(open) => { if (!open) handleDismiss() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[60] data-[state=open]:animate-fadeIn" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-cream rounded-xl shadow-xl max-w-md w-full mx-4 z-[60] p-8 focus:outline-none">
          <Dialog.Title className="font-display text-xl font-semibold text-ink mb-2 text-center">
            ThinkHaven is a decision design system
          </Dialog.Title>

          <Dialog.Description className="text-sm text-muted-foreground text-center mb-6">
            Not a chatbot. Here's what makes it different.
          </Dialog.Description>

          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-terracotta/10 flex items-center justify-center">
                <Target className="w-4 h-4 text-terracotta" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink">Structured sessions, not open-ended chat</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Each session tests whether your idea is worth building through a facilitated process.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-forest/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-forest" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink">Six AI advisors challenge your thinking</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Mary facilitates. Victoria, Casey, Elaine, Omar, and Taylor each bring a different lens.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-mustard/10 flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-mustard" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink">Artifacts, not just conversation</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You get a Lean Canvas, diagrams, and structured output you can act on.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="w-full py-3 rounded-lg font-display font-medium text-sm bg-terracotta text-cream hover:bg-terracotta-hover transition-colors"
          >
            Got it
          </button>

          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 text-ink/40 hover:text-ink transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/** Re-trigger onboarding by clearing the localStorage flag */
export function resetOnboarding() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY)
  }
}
