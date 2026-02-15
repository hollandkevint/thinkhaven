'use client'

import type { BoardMember } from '@/lib/ai/board-types'

interface BoardMemberCardProps {
  member: BoardMember
  isActive: boolean
  isTaylorDormant?: boolean
}

export default function BoardMemberCard({
  member,
  isActive,
  isTaylorDormant,
}: BoardMemberCardProps) {
  return (
    <div className={`board-member-card ${isActive ? 'active' : ''}`}>
      <div
        className="board-speaker-avatar"
        style={{
          backgroundColor: member.color,
          opacity: isTaylorDormant ? 0.5 : 1,
        }}
      >
        {member.name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="font-display text-sm font-semibold truncate"
            style={{ color: isActive ? member.color : 'var(--ink)' }}
          >
            {member.name}
          </span>
          {isTaylorDormant && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: 'rgba(201, 169, 166, 0.2)',
                color: 'var(--slate-blue)',
              }}
            >
              Opt-in
            </span>
          )}
        </div>
        <span className="text-xs" style={{ color: 'var(--slate-blue)' }}>
          {member.role}
        </span>
      </div>
      {isActive && (
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: member.color }}
        />
      )}
    </div>
  )
}
