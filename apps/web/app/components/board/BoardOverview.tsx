'use client'

import type { BoardState } from '@/lib/ai/board-types'
import { BOARD_MEMBERS } from '@/lib/ai/board-members'
import BoardMemberCard from './BoardMemberCard'

interface BoardOverviewProps {
  boardState: BoardState
}

export default function BoardOverview({ boardState }: BoardOverviewProps) {
  const hasSpoken = boardState.activeSpeaker !== 'mary'

  return (
    <div className="board-overview">
      <header
        className="h-14 mb-4 flex justify-between items-center"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div>
          <h2
            className="text-xl font-bold"
            style={{ color: 'var(--foreground)' }}
          >
            Board of Directors
          </h2>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Advisory perspectives
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto space-y-1">
        {BOARD_MEMBERS.map((member) => {
          const isTaylor = member.id === 'taylor'
          const isTaylorDormant = isTaylor && !boardState.taylorOptedIn

          // Hide Taylor entirely when not opted in
          if (isTaylor && !boardState.taylorOptedIn) {
            return (
              <BoardMemberCard
                key={member.id}
                member={member}
                isActive={false}
                isTaylorDormant
              />
            )
          }

          return (
            <BoardMemberCard
              key={member.id}
              member={member}
              isActive={boardState.activeSpeaker === member.id}
              isTaylorDormant={isTaylorDormant}
            />
          )
        })}
      </div>

      {!hasSpoken && (
        <div
          className="mt-4 p-4 rounded-lg text-center text-sm"
          style={{
            backgroundColor: 'rgba(44, 36, 22, 0.03)',
            color: 'var(--slate-blue)',
            fontStyle: 'italic',
          }}
        >
          Board members will share their perspectives as the conversation
          develops.
        </div>
      )}
    </div>
  )
}
