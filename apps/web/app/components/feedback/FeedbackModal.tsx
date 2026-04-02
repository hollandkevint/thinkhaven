'use client'

import { useState, useRef, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useFeedbackStore } from '@/lib/stores/feedbackStore'
import { FEEDBACK_TYPES, FEEDBACK_TYPE_LABELS, type FeedbackType } from '@/lib/feedback/feedback-schema'
import { track } from '@/lib/analytics/events'

export function FeedbackModal() {
  const { isOpen, sessionId, close } = useFeedbackStore()
  const [feedbackType, setFeedbackType] = useState<FeedbackType | null>(null)
  const [freeText, setFreeText] = useState('')
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null)
  const [disappearAlternative, setDisappearAlternative] = useState('')
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
      setFeedbackType(null)
      setFreeText('')
      setWouldRecommend(null)
      setDisappearAlternative('')
      setSubmitted(false)
    }
  }, [isOpen])

  const handleSubmit = async () => {
    if (!feedbackType || !freeText.trim() || submitting) return

    setSubmitting(true)

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback_type: feedbackType,
          free_text: freeText.trim(),
          session_id: sessionId ?? undefined,
          source: 'manual',
          would_recommend: wouldRecommend ?? undefined,
          disappear_alternative: disappearAlternative.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to submit')
      }

      track({
        event: 'feedback_submitted',
        properties: {
          feedback_type: feedbackType,
          ...(wouldRecommend !== null && { would_recommend: wouldRecommend }),
        },
      })

      setSubmitted(true)
      successTimeoutRef.current = setTimeout(() => close(), 2000)
    } catch (error) {
      console.error('Feedback submit failed:', error)
      alert('Failed to submit feedback. Please try again.')
      throw error
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
            {submitted ? 'Thank you!' : 'Send Feedback'}
          </Dialog.Title>

          {submitted ? (
            <div className="text-center py-8">
              <p className="text-ink-light">Your feedback helps shape ThinkHaven.</p>
            </div>
          ) : (
            <>
              <Dialog.Description className="text-sm text-muted-foreground mb-5">
                What kind of feedback do you have?
              </Dialog.Description>

              {/* Feedback type toggle */}
              <div className="flex gap-2 mb-5">
                {FEEDBACK_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFeedbackType(type)}
                    className={`flex-1 py-2.5 px-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                      feedbackType === type
                        ? type === 'praise'
                          ? 'border-forest bg-forest/10 text-forest'
                          : type === 'bug'
                          ? 'border-rust bg-rust/10 text-rust'
                          : 'border-terracotta bg-terracotta/10 text-terracotta'
                        : 'border-ink/10 hover:border-ink/20 text-ink'
                    }`}
                  >
                    {FEEDBACK_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>

              {/* Free text */}
              <div className="mb-5">
                <label htmlFor="feedback-text" className="block text-sm font-medium text-ink mb-2">
                  Tell us more
                </label>
                <textarea
                  id="feedback-text"
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  placeholder={
                    feedbackType === 'praise' ? 'What did you find most valuable?'
                    : feedbackType === 'bug' ? 'What went wrong? Steps to reproduce?'
                    : feedbackType === 'feature_request' ? 'What would make ThinkHaven more useful?'
                    : 'Select a feedback type above, then describe...'
                  }
                  className="w-full px-3 py-2 border border-ink/10 rounded-lg text-sm focus:ring-2 focus:ring-terracotta focus:border-transparent bg-parchment resize-none"
                  rows={4}
                  maxLength={2000}
                />
              </div>

              {/* Would recommend */}
              <div className="mb-5">
                <p className="text-sm font-medium text-ink mb-2">
                  Would you recommend ThinkHaven to a colleague?
                </p>
                <div className="flex gap-2">
                  {([true, false] as const).map((val) => (
                    <button
                      key={String(val)}
                      type="button"
                      onClick={() => setWouldRecommend(val)}
                      className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                        wouldRecommend === val
                          ? val
                            ? 'border-forest bg-forest/10 text-forest'
                            : 'border-rust bg-rust/10 text-rust'
                          : 'border-ink/10 hover:border-ink/20 text-ink'
                      }`}
                    >
                      {val ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Disappear alternative */}
              <div className="mb-6">
                <label htmlFor="disappear-alternative" className="block text-sm font-medium text-ink mb-2">
                  If ThinkHaven disappeared tomorrow, what would you do instead?
                </label>
                <input
                  id="disappear-alternative"
                  type="text"
                  value={disappearAlternative}
                  onChange={(e) => setDisappearAlternative(e.target.value)}
                  placeholder="e.g. go back to spreadsheets, ask a friend, nothing..."
                  className="w-full px-3 py-2 border border-ink/10 rounded-lg text-sm focus:ring-2 focus:ring-terracotta focus:border-transparent bg-parchment"
                  maxLength={500}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={close}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-ink hover:bg-parchment transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!feedbackType || !freeText.trim() || submitting}
                  className="px-6 py-2.5 rounded-lg font-display font-medium text-sm bg-terracotta text-cream hover:bg-terracotta-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Sending...' : 'Send'}
                </button>
              </div>
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
