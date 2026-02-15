import { MessageSquare } from 'lucide-react'

const FEEDBACK_MAILTO = 'mailto:kevin@kevintholland.com?subject=ThinkHaven%20Beta%20Feedback'

interface FeedbackButtonProps {
  variant?: 'sidebar' | 'header'
}

export function FeedbackButton({ variant = 'sidebar' }: FeedbackButtonProps) {
  if (variant === 'header') {
    return (
      <a
        href={FEEDBACK_MAILTO}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 px-3 py-1 rounded transition-colors hover:bg-black/5"
        style={{ border: '1px solid var(--border)', color: 'var(--foreground)' }}
      >
        <MessageSquare className="w-3 h-3" />
        Feedback
      </a>
    )
  }

  return (
    <a
      href={FEEDBACK_MAILTO}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-foreground"
    >
      <MessageSquare className="w-4 h-4" />
      <span className="text-sm">Send Feedback</span>
    </a>
  )
}
