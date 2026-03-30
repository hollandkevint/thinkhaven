'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  ChevronRight,
  Download,
  HelpCircle,
  MessageSquare,
  MoreVertical,
  PanelRightClose,
  PanelRightOpen,
  Users,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FeedbackButton } from '@/app/components/feedback/FeedbackButton'
import { resetOnboarding } from '@/app/components/onboarding/OnboardingModal'
import ExportPanel from '@/app/components/workspace/ExportPanel'
import type { ChatMessage } from '@/lib/ai/board-types'

type SessionPhase = 'discovery' | 'analysis' | 'synthesis'

const PHASES: { id: SessionPhase; label: string }[] = [
  { id: 'discovery', label: 'Discovery' },
  { id: 'analysis', label: 'Analysis' },
  { id: 'synthesis', label: 'Synthesis' },
]

function derivePhase(messageCount: number): SessionPhase {
  if (messageCount <= 4) return 'discovery'
  if (messageCount <= 10) return 'analysis'
  return 'synthesis'
}

interface SessionHeaderProps {
  title: string
  sessionId: string
  messageCount: number
  chatContext: ChatMessage[]
  boardPanelOpen: boolean
  onToggleBoard: () => void
  userEmail: string
  onSignOut: () => void
}

export function SessionHeader({
  title,
  sessionId,
  messageCount,
  chatContext,
  boardPanelOpen,
  onToggleBoard,
  userEmail,
  onSignOut,
}: SessionHeaderProps) {
  const activePhase = derivePhase(messageCount)

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-border gap-4">
      {/* Left: Back + Title */}
      <div className="flex items-center gap-2 min-w-0 flex-shrink">
        <Link href="/app" className="text-primary hover:opacity-80 transition-opacity flex-shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-base font-semibold font-display text-foreground truncate">
          {title || 'Strategic Session'}
        </h1>
      </div>

      {/* Center: Phase Stepper */}
      <nav className="hidden md:flex items-center gap-1 flex-shrink-0" aria-label="Session phases">
        {PHASES.map((phase, i) => {
          const isActive = phase.id === activePhase
          const phaseIndex = PHASES.findIndex(p => p.id === activePhase)
          const isCompleted = i < phaseIndex

          return (
            <div key={phase.id} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="w-3 h-3 text-ink/25 flex-shrink-0" />}
              <span
                className={`px-3 py-1 rounded-full text-xs font-display font-medium transition-colors ${
                  isActive
                    ? 'bg-forest text-cream'
                    : isCompleted
                    ? 'bg-forest/15 text-forest'
                    : 'bg-parchment text-ink/40'
                }`}
              >
                {phase.label}
              </span>
            </div>
          )
        })}
      </nav>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Board toggle pill */}
        <button
          onClick={onToggleBoard}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-display font-medium transition-colors ${
            boardPanelOpen
              ? 'bg-terracotta text-cream'
              : 'bg-parchment text-ink border border-ink/8 hover:border-ink/15'
          }`}
          title={boardPanelOpen ? 'Hide board panel' : 'Show board panel'}
        >
          <Users className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Board</span>
          {boardPanelOpen
            ? <PanelRightClose className="w-3 h-3" />
            : <PanelRightOpen className="w-3 h-3" />
          }
        </button>

        {/* Export */}
        <ExportPanel
          messages={chatContext}
          workspaceName={title || 'Strategic Session'}
          workspaceId={sessionId}
        />

        {/* Feedback */}
        <FeedbackButton variant="header" sessionId={sessionId} />

        {/* Overflow menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-parchment transition-colors"
              aria-label="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/app/account" className="flex items-center gap-2 text-sm">
                Account
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => { resetOnboarding(); window.location.reload() }}
              className="flex items-center gap-2 text-sm"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              What is ThinkHaven?
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <span className="text-xs text-muted-foreground cursor-default">{userEmail}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onSignOut}
              className="text-rust"
            >
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
