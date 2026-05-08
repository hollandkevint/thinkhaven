'use client'

import * as Tooltip from '@radix-ui/react-tooltip'
import type { SubPersonaMode } from '@/lib/ai/mary-persona'

const MODE_LABELS: Record<SubPersonaMode, string> = {
  inquisitive: 'Inquisitive',
  devil_advocate: "Devil's Advocate",
  encouraging: 'Encouraging',
  realistic: 'Realistic',
}

const MODE_TEXT_COLORS: Record<SubPersonaMode, string> = {
  inquisitive: 'text-mode-inquisitive',
  devil_advocate: 'text-mode-advocate',
  encouraging: 'text-mode-encouraging',
  realistic: 'text-mode-realistic',
}

const MODE_DESCRIPTIONS: Record<SubPersonaMode, string> = {
  inquisitive: 'Mary is asking questions before forming a position.',
  devil_advocate: 'Mary is arguing the opposite of your stated position.',
  encouraging: "Mary is pulling for what's working in your plan.",
  realistic: "Mary is naming what's likely to fail and why.",
}

interface ModeBadgeProps {
  mode: SubPersonaMode | null | undefined
  className?: string
}

export function ModeBadge({ mode, className = '' }: ModeBadgeProps) {
  if (!mode) return null

  const label = MODE_LABELS[mode]
  const description = MODE_DESCRIPTIONS[mode]

  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <span
            className={`mode-badge bg-parchment ${MODE_TEXT_COLORS[mode]} ${className}`}
            role="status"
            aria-label={`Active mode: ${label}. ${description}`}
            tabIndex={0}
          >
            {label}
          </span>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="bottom"
            sideOffset={6}
            className="z-50 max-w-xs rounded-md bg-ink px-3 py-2 font-body text-xs leading-relaxed text-cream shadow-md"
          >
            {description}
            <Tooltip.Arrow className="fill-ink" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
