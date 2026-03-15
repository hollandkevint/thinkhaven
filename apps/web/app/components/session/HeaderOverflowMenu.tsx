'use client'

import { useState, useCallback, useEffect } from 'react'
import { MoreVertical } from 'lucide-react'
import Link from 'next/link'
import { useClickOutside } from '@/lib/hooks/useClickOutside'
import { FEEDBACK_MAILTO } from '@/app/components/feedback/FeedbackButton'

interface HeaderOverflowMenuProps {
  onExportClick: () => void
  onSignOut: () => void
}

export default function HeaderOverflowMenu({
  onExportClick,
  onSignOut,
}: HeaderOverflowMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const close = useCallback(() => setIsOpen(false), [])
  const menuRef = useClickOutside<HTMLDivElement>(close, isOpen)

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, close])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded text-muted-foreground hover:text-ink hover:bg-parchment/50 transition-colors"
        aria-label="More options"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-1 w-48 bg-cream border border-border rounded-lg shadow-lg z-50 py-1 overflow-hidden"
        >
          <button
            role="menuitem"
            onClick={() => { onExportClick(); close() }}
            className="w-full text-left px-4 py-2.5 text-sm text-ink hover:bg-parchment/50 transition-colors"
          >
            Export Chat
          </button>
          <a
            role="menuitem"
            href={FEEDBACK_MAILTO}
            className="block px-4 py-2.5 text-sm text-ink hover:bg-parchment/50 transition-colors"
          >
            Send Feedback
          </a>
          <div className="border-t border-border my-1" />
          <Link
            href="/app/account"
            role="menuitem"
            className="block px-4 py-2.5 text-sm text-ink hover:bg-parchment/50 transition-colors"
          >
            Account
          </Link>
          <button
            role="menuitem"
            onClick={() => { onSignOut(); close() }}
            className="w-full text-left px-4 py-2.5 text-sm text-rust hover:bg-parchment/50 transition-colors"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  )
}
