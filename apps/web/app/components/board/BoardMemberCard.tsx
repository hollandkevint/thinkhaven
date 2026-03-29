'use client';

import type { BoardMember } from '@/lib/ai/board-types';
import { BOARD_MEMBER_ICONS } from '@/lib/ai/board-member-icons';

interface BoardMemberCardProps {
  member: BoardMember;
  isActive: boolean;
  isTaylorDormant?: boolean;
}

export default function BoardMemberCard({
  member,
  isActive,
  isTaylorDormant,
}: BoardMemberCardProps) {
  const Icon = BOARD_MEMBER_ICONS[member.id];

  return (
    <div
      className={`relative overflow-hidden flex items-center gap-3 pl-4 pr-3 py-3 rounded-lg ${
        isActive ? 'bg-parchment border-2 animate-board-pulse' : 'bg-cream border border-ink/8'
      } ${isTaylorDormant ? 'opacity-60' : ''}`}
      style={{
        transition: 'transform 200ms ease, opacity 200ms ease, border-color 200ms ease',
        ...(isActive ? { borderColor: member.color, willChange: 'transform' } : {}),
      }}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
        style={{ backgroundColor: member.color }}
      />

      {/* Icon */}
      <div className="flex-shrink-0">
        <Icon className="w-5 h-5" style={{ color: member.color }} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-medium text-ink truncate">
            {member.name}
          </span>
          {isTaylorDormant && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-dusty-rose/20 text-slate-blue">
              Opt-in
            </span>
          )}
        </div>
        <span className="font-body text-xs text-muted-foreground">
          {member.role}
        </span>
      </div>

      {/* Radio indicator */}
      <div
        className={`flex-shrink-0 w-4 h-4 rounded-full border-2 ${
          isActive ? '' : 'border-ink/20'
        }`}
        style={{
          transition: 'border-color 150ms ease, background-color 150ms ease',
          ...(isActive ? { borderColor: member.color, backgroundColor: member.color } : {}),
        }}
      />
    </div>
  );
}
