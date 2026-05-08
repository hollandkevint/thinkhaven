'use client'

import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ChatMessage } from '@/lib/ai/board-types'
import type { BoardMember } from '@/lib/ai/board-types'
import MermaidBlock from '@/app/components/chat/MermaidBlock'

// Static components — extracted to module level to avoid per-render allocation
const SPEAKER_MARKDOWN_COMPONENTS: Components = {
  code({ className, children }) {
    const isInline = !className
    const match = /language-(\w+)/.exec(className || '')
    if (!isInline && match?.[1] === 'mermaid') {
      return <MermaidBlock code={String(children).replace(/\n$/, '')} />
    }
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
  p: ({ children }) => (
    <p className="mb-3 leading-relaxed last:mb-0 text-ink">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-6 mb-3 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-6 mb-3 space-y-1">{children}</ol>
  ),
  li: ({ children }) => <li className="text-ink">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
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
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={SPEAKER_MARKDOWN_COMPONENTS}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
