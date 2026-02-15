'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ChatMessage } from '@/lib/ai/board-types'
import type { BoardMember } from '@/lib/ai/board-types'

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
              components={{
                code({ inline, className, children, ...props }: any) {
                  return inline ? (
                    <code
                      className="px-1.5 py-0.5 rounded text-sm"
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.05)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {children}
                    </code>
                  ) : (
                    <pre
                      className="p-4 rounded-lg overflow-x-auto"
                      style={{ backgroundColor: '#f9f9f9' }}
                    >
                      <code style={{ fontFamily: 'var(--font-mono)' }}>
                        {children}
                      </code>
                    </pre>
                  )
                },
                p: ({ children }) => (
                  <p
                    className="mb-3 leading-relaxed last:mb-0"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-6 mb-3 space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-6 mb-3 space-y-1">{children}</ol>
                ),
                li: ({ children }) => (
                  <li style={{ color: 'var(--foreground)' }}>{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold">{children}</strong>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}
