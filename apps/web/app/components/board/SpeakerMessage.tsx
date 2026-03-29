'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ChatMessage } from '@/lib/ai/board-types'
import type { BoardMember } from '@/lib/ai/board-types'

// Static components — extracted to module level to avoid per-render allocation
const SPEAKER_MARKDOWN_COMPONENTS = {
  code({ className, children }: any) {
    const isInline = !className
    return isInline ? (
      <code className="px-1.5 py-0.5 rounded text-sm bg-ink/5 font-mono">
        {children}
      </code>
    ) : (
      <pre className="p-4 rounded-lg overflow-x-auto bg-parchment">
        <code className="font-mono">{children}</code>
      </pre>
    )
  },
  p: ({ children }: any) => (
    <p className="mb-3 leading-relaxed last:mb-0 text-ink">{children}</p>
  ),
  ul: ({ children }: any) => (
    <ul className="list-disc pl-6 mb-3 space-y-1">{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className="list-decimal pl-6 mb-3 space-y-1">{children}</ol>
  ),
  li: ({ children }: any) => <li className="text-ink">{children}</li>,
  strong: ({ children }: any) => <strong className="font-semibold">{children}</strong>,
}

interface SpeakerMessageProps {
  message: ChatMessage
  boardMember: BoardMember
}

export default function SpeakerMessage({ message, boardMember }: SpeakerMessageProps) {
  return (
    <div className="flex justify-start">
      <div
        className="board-speaker-message"
        style={{ borderLeftColor: boardMember.color }}
      >
        <div
          className="board-speaker-avatar"
          style={{ backgroundColor: boardMember.color }}
        >
          {boardMember.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span
              className="font-display text-sm font-semibold"
              style={{ color: boardMember.color }}
            >
              {boardMember.name}
            </span>
            <span className="text-xs" style={{ color: 'var(--slate-blue)' }}>
              {boardMember.role}
            </span>
          </div>
          <div
            className="px-4 py-3 rounded-xl"
            style={{ backgroundColor: 'var(--surface, var(--parchment))' }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              className="prose prose-sm max-w-none"
              components={SPEAKER_MARKDOWN_COMPONENTS}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}
