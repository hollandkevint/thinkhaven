'use client'

import { useState, useCallback } from 'react'
import { Lock } from 'lucide-react'
import type { SessionMode, SessionModeConfig } from '@/lib/ai/session-mode-types'
import { SESSION_MODES, getSessionModeConfig } from '@/lib/ai/session-mode-types'
import { useClickOutside } from '@/lib/hooks/useClickOutside'

interface ModeIndicatorProps {
  currentMode: SessionMode
  onModeChange: (mode: SessionMode) => void
  isGuest?: boolean
  disabled?: boolean
}

export default function ModeIndicator({
  currentMode,
  onModeChange,
  isGuest = false,
  disabled = false,
}: ModeIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const config = getSessionModeConfig(currentMode)
  const close = useCallback(() => setIsOpen(false), [])
  const dropdownRef = useClickOutside<HTMLDivElement>(close, isOpen)

  function handleSelect(mode: SessionModeConfig) {
    if (isGuest && mode.guestLocked) return
    if (mode.id === currentMode) {
      setIsOpen(false)
      return
    }
    onModeChange(mode.id)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-1.5 rounded text-sm border transition-colors hover:bg-parchment disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          borderColor: config.accentColor,
          borderLeftWidth: '3px',
        }}
      >
        <span style={{ color: config.accentColor }} className="font-medium">
          {config.icon} {config.label}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-cream border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {SESSION_MODES.map((mode) => {
            const isLocked = isGuest && mode.guestLocked
            const isActive = mode.id === currentMode

            return (
              <button
                key={mode.id}
                onClick={() => handleSelect(mode)}
                disabled={isLocked}
                className={`w-full text-left px-4 py-3 transition-colors ${
                  isActive
                    ? 'bg-parchment'
                    : isLocked
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-parchment/50'
                }`}
                style={{
                  borderLeft: isActive ? `3px solid ${mode.accentColor}` : '3px solid transparent',
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span
                      className="font-medium text-sm"
                      style={{ color: mode.accentColor }}
                    >
                      {mode.icon} {mode.label}
                    </span>
                    <p className="text-xs text-ink-light mt-0.5">{mode.subtitle}</p>
                  </div>
                  {isLocked && (
                    <div className="flex items-center gap-1 text-slate-blue" title="Available after signup">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-blue mt-1">{mode.description}</p>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
