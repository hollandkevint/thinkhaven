'use client'

import { MessageSquare } from 'lucide-react'
import { useFeedbackStore } from '@/lib/stores/feedbackStore'

interface FeedbackButtonProps {
  variant?: 'sidebar' | 'header' | 'nav'
  sessionId?: string
}

export function FeedbackButton({ variant = 'sidebar', sessionId }: FeedbackButtonProps) {
  const open = useFeedbackStore((s) => s.open)

  const handleClick = () => open(sessionId)

  if (variant === 'header') {
    return (
      <button
        onClick={handleClick}
        className="flex items-center gap-1 px-3 py-1 rounded transition-colors hover:bg-black/5"
        style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
      >
        <MessageSquare className="w-3 h-3" />
        Feedback
      </button>
    )
  }

  if (variant === 'nav') {
    return (
      <button
        onClick={handleClick}
        className="text-sm font-medium"
        style={{ color: 'var(--slate-blue)' }}
      >
        Send Feedback
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-foreground"
    >
      <MessageSquare className="w-4 h-4" />
      <span className="text-sm">Send Feedback</span>
    </button>
  )
}
