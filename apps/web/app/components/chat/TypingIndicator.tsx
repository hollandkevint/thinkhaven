'use client'

import { useState, useEffect } from 'react'

interface TypingIndicatorProps {
  isTyping?: boolean
  userName?: string
  className?: string
}

export default function TypingIndicator({ 
  isTyping = false, 
  userName = 'Mary',
  className = '' 
}: TypingIndicatorProps) {
  const [dots, setDots] = useState('')

  // Animate dots
  useEffect(() => {
    if (!isTyping) {
      setDots('')
      return
    }

    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '') return '.'
        if (prev === '.') return '..'
        if (prev === '..') return '...'
        return ''
      })
    }, 400)

    return () => clearInterval(interval)
  }, [isTyping])

  if (!isTyping) return null

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Avatar */}
      <div className="w-8 h-8 bg-terracotta rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-cream font-semibold text-sm font-display">M</span>
      </div>

      {/* Typing indicator */}
      <div className="bg-white border border-divider rounded-2xl rounded-bl-md px-4 py-3 shadow-sm max-w-xs">
        <div className="flex items-center gap-3">
          {/* Animated dots */}
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-terracotta rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-terracotta rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-terracotta rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          </div>
          
          {/* Status text */}
          <span className="text-sm text-secondary">
            {userName} is thinking{dots}
          </span>
        </div>
      </div>
    </div>
  )
}

// Alternative typing indicator for inline use
export function InlineTypingIndicator({ 
  isTyping = false,
  className = ''
}: { isTyping?: boolean, className?: string }) {
  if (!isTyping) return null

  return (
    <span className={`inline-flex items-center ml-1 ${className}`}>
      <span className="animate-pulse text-primary">▊</span>
    </span>
  )
}

// Typing status for message bubbles
export function MessageTypingStatus({
  isTyping = false,
  typingSpeed = 'normal',
  className = ''
}: {
  isTyping?: boolean
  typingSpeed?: 'slow' | 'normal' | 'fast'
  className?: string
}) {
  if (!isTyping) return null

  const speedIndicator = {
    slow: '⏳',
    normal: '💭',
    fast: '⚡'
  }[typingSpeed]

  return (
    <div className={`flex items-center gap-2 text-xs text-secondary ${className}`}>
      <span>{speedIndicator}</span>
      <span>Composing response...</span>
    </div>
  )
}

// Progress bar for long responses
export function StreamingProgress({
  progress = 0,
  isStreaming = false,
  estimatedTotal,
  className = ''
}: {
  progress?: number
  isStreaming?: boolean
  estimatedTotal?: number
  className?: string
}) {
  if (!isStreaming) return null

  const percentage = estimatedTotal ? Math.min(100, (progress / estimatedTotal) * 100) : undefined

  return (
    <div className={`text-xs text-secondary flex items-center gap-2 ${className}`}>
      {percentage !== undefined ? (
        <>
          <div className="w-16 h-1 bg-ink/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-terracotta transition-all duration-300 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span>{Math.round(percentage)}%</span>
        </>
      ) : (
        <>
          <div className="w-16 h-1 bg-ink/10 rounded-full overflow-hidden">
            <div className="h-full bg-terracotta animate-pulse" style={{ width: '60%' }} />
          </div>
          <span>Streaming...</span>
        </>
      )}
    </div>
  )
}