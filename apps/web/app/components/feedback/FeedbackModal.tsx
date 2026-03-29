'use client'

import { useState, useRef, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useFeedbackStore } from '@/lib/stores/feedbackStore'

const LIKERT_OPTIONS = [1, 2, 3, 4, 5] as const

export function FeedbackModal() {
  const { isOpen, sessionId, close } = useFeedbackStore()
  const [usefulness, setUsefulness] = useState<number | null>(null)
  const [returnLikelihood, setReturnLikelihood] = useState<number | null>(null)
  const [freeText, setFreeText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current)
    }
  }, [])

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setUsefulness(null)
      setReturnLikelihood(null)
      setFreeText('')
      setSubmitted(false)
    }
  }, [isOpen])

  const handleSubmit = async () => {
    if (!usefulness || !returnLikelihood || submitting) return

    setSubmitting(true)

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision_usefulness: usefulness,
          return_likelihood: returnLikelihood,
          free_text: freeText.trim() || undefined,
          session_id: sessionId ?? undefined,
          source: 'manual',
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to submit')
      }

      setSubmitted(true)
      successTimeoutRef.current = setTimeout(() => close(), 2000)
    } catch (error) {
      console.error('Feedback submit failed:', error)
      alert('Failed to submit feedback. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) close() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 data-[state=open]:animate-fadeIn" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-cream rounded-lg shadow-xl max-w-lg w-full mx-4 z-50 p-6 focus:outline-none">
          <Dialog.Title className="font-display text-lg font-semibold text-ink mb-1">
            {submitted ? 'Thank you!' : 'How was your session?'}
          </Dialog.Title>

          {submitted ? (
            <div className="text-center py-8">
              <p className="text-ink-light">Your feedback helps shape ThinkHaven.</p>
            </div>
          ) : (
            <>
              <Dialog.Description className="text-sm text-muted-foreground mb-6">
                Your feedback helps us build a better product.
              </Dialog.Description>

              {/* Q1: Decision usefulness */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-ink mb-2">
                  How useful was this for your decision?
                </label>
                <div className="flex gap-2">
                  {LIKERT_OPTIONS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setUsefulness(value)}
                      className={`w-12 h-12 rounded-lg border-2 text-sm font-medium transition-colors ${
                        usefulness === value
                          ? 'border-terracotta bg-terracotta/10 text-terracotta'
                          : 'border-ink/10 hover:border-ink/20 text-ink'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">1 = Not useful, 5 = Extremely useful</p>
              </div>

              {/* Q2: Return likelihood */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-ink mb-2">
                  How likely are you to use ThinkHaven again?
                </label>
                <div className="flex gap-2">
                  {LIKERT_OPTIONS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setReturnLikelihood(value)}
                      className={`w-12 h-12 rounded-lg border-2 text-sm font-medium transition-colors ${
                        returnLikelihood === value
                          ? 'border-forest bg-forest/10 text-forest'
                          : 'border-ink/10 hover:border-ink/20 text-ink'
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">1 = Unlikely, 5 = Very likely</p>
              </div>

              {/* Free text */}
              <div className="mb-6">
                <label htmlFor="feedback-text" className="block text-sm font-medium text-ink mb-2">
                  What would make ThinkHaven more valuable? <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <textarea
                  id="feedback-text"
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  placeholder="Your thoughts, suggestions, or concerns..."
                  className="w-full px-3 py-2 border border-ink/10 rounded-lg text-sm focus:ring-2 focus:ring-terracotta focus:border-transparent bg-parchment resize-none"
                  rows={3}
                  maxLength={2000}
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!usefulness || !returnLikelihood || submitting}
                className="w-full py-3 rounded-lg font-display font-medium text-sm bg-terracotta text-cream hover:bg-terracotta-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </>
          )}

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
