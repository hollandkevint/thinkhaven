'use client'

import { useState, useRef, useCallback } from 'react'

interface MessageInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (message: string) => void
  placeholder?: string
  disabled?: boolean
  maxLength?: number
  className?: string
}

interface FormatAction {
  id: string
  icon: React.ReactNode
  label: string
  shortcut?: string
  action: (textarea: HTMLTextAreaElement) => void
}

export default function MessageInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Ask Mary for strategic guidance...",
  disabled = false,
  maxLength = 4000,
  className = ''
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showToolbar, setShowToolbar] = useState(false)

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    if (newValue.length <= maxLength) {
      onChange(newValue)
      adjustTextareaHeight()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !disabled) {
        onSubmit(value.trim())
      }
    }

    // Keyboard shortcuts for formatting
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault()
          applyFormat('bold')
          break
        case 'i':
          e.preventDefault()
          applyFormat('italic')
          break
        case 'u':
          e.preventDefault()
          applyFormat('underline')
          break
      }
    }
  }

  const insertAtCursor = (before: string, after: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    
    const newValue = value.substring(0, start) + before + selectedText + after + value.substring(end)
    onChange(newValue)

    // Move cursor to the right position
    setTimeout(() => {
      const newCursorPos = start + before.length + selectedText.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
      textarea.focus()
    }, 0)
  }

  const applyFormat = (format: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)

    switch (format) {
      case 'bold':
        insertAtCursor('**', '**')
        break
      case 'italic':
        insertAtCursor('*', '*')
        break
      case 'underline':
        insertAtCursor('_', '_')
        break
      case 'code':
        if (selectedText.includes('\n')) {
          insertAtCursor('```\n', '\n```')
        } else {
          insertAtCursor('`', '`')
        }
        break
      case 'quote':
        const lines = selectedText.split('\n')
        const quotedLines = lines.map(line => `> ${line}`).join('\n')
        const newValue = value.substring(0, start) + quotedLines + value.substring(end)
        onChange(newValue)
        break
      case 'list':
        insertAtCursor('- ', '')
        break
      case 'numbered':
        insertAtCursor('1. ', '')
        break
      case 'heading':
        insertAtCursor('## ', '')
        break
    }

    adjustTextareaHeight()
  }

  const formatActions: FormatAction[] = [
    {
      id: 'bold',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6V4zm0 8h9a4 4 0 014 4 4 4 0 01-4 4H6v-8z" />
        </svg>
      ),
      label: 'Bold',
      shortcut: 'Ctrl+B',
      action: () => applyFormat('bold')
    },
    {
      id: 'italic',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4l4 16" />
        </svg>
      ),
      label: 'Italic',
      shortcut: 'Ctrl+I',
      action: () => applyFormat('italic')
    },
    {
      id: 'code',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      label: 'Code',
      action: () => applyFormat('code')
    },
    {
      id: 'quote',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
        </svg>
      ),
      label: 'Quote',
      action: () => applyFormat('quote')
    },
    {
      id: 'list',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      ),
      label: 'List',
      action: () => applyFormat('list')
    },
    {
      id: 'numbered',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M3 12h18m-9 8h9" />
        </svg>
      ),
      label: 'Numbered List',
      action: () => applyFormat('numbered')
    },
    {
      id: 'heading',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
      label: 'Heading',
      action: () => applyFormat('heading')
    }
  ]

  const handleSubmit = () => {
    if (value.trim() && !disabled) {
      onSubmit(value.trim())
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Formatting Toolbar */}
      {showToolbar && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-divider rounded-lg shadow-lg p-2 flex items-center gap-1 z-10">
          {formatActions.map((action) => (
            <button
              key={action.id}
              onClick={action.action}
              className="p-2 text-secondary hover:text-primary hover:bg-parchment rounded transition-colors"
              title={`${action.label}${action.shortcut ? ` (${action.shortcut})` : ''}`}
              type="button"
            >
              {action.icon}
            </button>
          ))}
          <div className="h-6 w-px bg-divider mx-1"></div>
          <button
            onClick={() => setShowToolbar(false)}
            className="p-2 text-secondary hover:text-primary hover:bg-gray-50 rounded transition-colors"
            title="Hide toolbar"
            type="button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Input Container */}
      <div className="relative bg-white border border-divider rounded-lg focus-within:ring-2 focus-within:ring-terracotta/20 focus-within:border-terracotta/30 transition-colors">
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => adjustTextareaHeight()}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="w-full px-4 py-3 pr-20 resize-none bg-transparent border-none outline-none text-secondary placeholder:text-slate-blue/60 min-h-[50px] max-h-[200px]"
          style={{ 
            scrollbarWidth: 'thin',
            scrollbarColor: '#CBD5E1 transparent'
          }}
        />

        {/* Bottom Bar */}
        <div className="flex items-center justify-between px-4 pb-3">
          <div className="flex items-center gap-2">
            {/* Formatting Toggle */}
            <button
              onClick={() => setShowToolbar(!showToolbar)}
              className={`p-1.5 rounded transition-colors ${
                showToolbar
                  ? 'text-primary bg-terracotta/10'
                  : 'text-slate-blue/60 hover:text-secondary hover:bg-parchment'
              }`}
              title="Format text"
              type="button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Character Count */}
            <span className={`text-xs ${
              value.length > maxLength * 0.9 ? 'text-mustard' : 'text-slate-blue/60'
            }`}>
              {value.length}/{maxLength}
            </span>
          </div>

          {/* Send Button */}
          <button
            onClick={handleSubmit}
            disabled={!value.trim() || disabled}
            className={`p-2 rounded-lg transition-colors ${
              value.trim() && !disabled
                ? 'text-white bg-primary hover:bg-primary-hover shadow-sm' 
                : 'text-slate-blue/60 bg-parchment cursor-not-allowed'
            }`}
            title="Send message (Enter)"
            type="button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-2 text-xs text-slate-blue flex items-center gap-4">
        <span>Press Enter to send, Shift+Enter for new line</span>
        <span>•</span>
        <span>Use Ctrl+B for bold, Ctrl+I for italic</span>
        <span>•</span>
        <span>Supports Markdown formatting</span>
      </div>
    </div>
  )
}