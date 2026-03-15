'use client'

import { useState, useCallback } from 'react'
import { TONE_OPTIONS } from '@/lib/ai/session-mode-types'
import type { SubPersonaMode } from '@/lib/ai/mary-persona'
import { useClickOutside } from '@/lib/hooks/useClickOutside'

interface ToneSelectorProps {
  currentTone: SubPersonaMode
  onToneChange: (tone: SubPersonaMode) => void
  disabled?: boolean
}

export default function ToneSelector({
  currentTone,
  onToneChange,
  disabled = false,
}: ToneSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const current = TONE_OPTIONS.find(t => t.id === currentTone) ?? TONE_OPTIONS[0]
  const close = useCallback(() => setIsOpen(false), [])
  const dropdownRef = useClickOutside<HTMLDivElement>(close, isOpen)

  function handleSelect(toneId: SubPersonaMode) {
    if (toneId === currentTone) {
      setIsOpen(false)
      return
    }
    onToneChange(toneId)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors hover:bg-parchment disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: current.color }}
        />
        <span className="text-ink-light">{current.label}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-cream border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {TONE_OPTIONS.map((tone) => {
            const isActive = tone.id === currentTone

            return (
              <button
                key={tone.id}
                onClick={() => handleSelect(tone.id as SubPersonaMode)}
                className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-colors text-sm ${
                  isActive ? 'bg-parchment' : 'hover:bg-parchment/50'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: tone.color }}
                />
                <span className={isActive ? 'font-medium text-ink' : 'text-ink-light'}>
                  {tone.label}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
