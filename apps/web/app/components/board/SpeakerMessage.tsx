'use client'

import type { ChatMessage } from '@/lib/ai/board-types'
import type { BoardMember } from '@/lib/ai/board-types'
import ArtifactAwareContent from '@/app/components/chat/ArtifactAwareContent'

interface SpeakerMessageProps {
  message: ChatMessage
  boardMember: BoardMember
  sessionId?: string
}

export default function SpeakerMessage({ message, boardMember, sessionId }: SpeakerMessageProps) {
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
              <ArtifactAwareContent content={message.content} sessionId={sessionId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
