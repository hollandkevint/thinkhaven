'use client';

import { Timer, X } from 'lucide-react';
import type { BoardState } from '@/lib/ai/board-types';
import { BOARD_MEMBERS, getBoardMember } from '@/lib/ai/board-members';
import BoardMemberCard from './BoardMemberCard';

interface BoardOverviewProps {
  boardState: BoardState;
  currentPhase?: string;
  onClose?: () => void;
}

const PHASES = [
  { id: 'discovery', label: 'Discovery', color: '#C4785C' },
  { id: 'analysis', label: 'Analysis', color: '#D4A84B' },
  { id: 'synthesis', label: 'Synthesis', color: '#A3B18A' },
];

export default function BoardOverview({
  boardState,
  currentPhase = 'discovery',
  onClose,
}: BoardOverviewProps) {
  const activeMember = getBoardMember(boardState.activeSpeaker);
  const activePhaseIndex = PHASES.findIndex((p) => p.id === currentPhase);

  return (
    <div className="bg-cream rounded-2xl shadow-lg border border-ink/8 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="bg-parchment px-6 py-5">
        <div className="flex items-start justify-between">
          <h2 className="font-display text-xl font-semibold text-ink">
            Board Members
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded text-muted-foreground hover:text-ink hover:bg-parchment/50 transition-colors"
              aria-label="Close board panel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="font-body text-sm text-muted-foreground mt-0.5">
          Your advisory perspectives
        </p>
        <div className="flex items-center gap-2.5 mt-3">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: activeMember.color }}
          />
          <span className="font-display text-sm font-medium text-ink">
            Currently: {activeMember.name}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-ink/8" />

      {/* Member list */}
      <div className="px-4 py-3 space-y-2.5 flex-1 overflow-y-auto">
        {BOARD_MEMBERS.map((member) => {
          const isTaylor = member.id === 'taylor';
          const isTaylorDormant = isTaylor && !boardState.taylorOptedIn;

          return (
            <BoardMemberCard
              key={member.id}
              member={member}
              isActive={boardState.activeSpeaker === member.id}
              isTaylorDormant={isTaylorDormant}
            />
          );
        })}
      </div>

      {/* Divider */}
      <div className="border-t border-ink/8" />

      {/* Footer - Session Progress */}
      <div className="bg-parchment px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-display text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-light/70">
            Session Progress
          </span>
          <div className="flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5 text-terracotta" />
            <span className="font-display text-sm font-semibold text-terracotta">
              --:--
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden bg-ink/5 mb-2">
          {PHASES.map((phase, i) => (
            <div
              key={phase.id}
              className="flex-1 rounded-full transition-colors duration-300"
              style={{
                backgroundColor:
                  i <= activePhaseIndex ? phase.color : 'transparent',
              }}
            />
          ))}
        </div>

        {/* Phase labels */}
        <div className="flex justify-between">
          {PHASES.map((phase, i) => (
            <span
              key={phase.id}
              className={`font-body text-xs ${
                i <= activePhaseIndex ? 'font-semibold' : 'font-normal'
              }`}
              style={{
                color: i <= activePhaseIndex ? phase.color : '#B5B3B0',
              }}
            >
              {phase.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
