'use client'

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

interface ModeBadgeProps {
  mode: SubPersonaMode | null | undefined
  className?: string
}

export function ModeBadge({ mode, className = '' }: ModeBadgeProps) {
  if (!mode) return null

  return (
    <span
      className={`mode-badge bg-parchment ${MODE_TEXT_COLORS[mode]} ${className}`}
      role="status"
      aria-label={`Active mode: ${MODE_LABELS[mode]}`}
    >
      {MODE_LABELS[mode]}
    </span>
  )
}
