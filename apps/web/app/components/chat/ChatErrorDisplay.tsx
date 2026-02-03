'use client'

import { RefreshCw, WifiOff, AlertTriangle, Clock } from 'lucide-react'

interface ChatErrorDisplayProps {
  error: string
  onRetry?: () => void
  onDismiss?: () => void
  isRetrying?: boolean
  retryCountdown?: number  // For rate limit countdown
}

export default function ChatErrorDisplay({
  error,
  onRetry,
  onDismiss,
  isRetrying = false,
  retryCountdown
}: ChatErrorDisplayProps) {
  // Categorize error
  const getErrorCategory = () => {
    const lowerError = error.toLowerCase()
    if (lowerError.includes('network') || lowerError.includes('fetch')) return 'network'
    if (lowerError.includes('429') || lowerError.includes('rate')) return 'rate-limit'
    if (lowerError.includes('401') || lowerError.includes('unauthorized')) return 'auth'
    return 'unknown'
  }

  const category = getErrorCategory()

  // Icon based on category
  const Icon = category === 'network' ? WifiOff
    : category === 'rate-limit' ? Clock
    : AlertTriangle

  // Message based on category
  const getMessage = () => {
    switch (category) {
      case 'network':
        return 'Connection lost. Check your internet and try again.'
      case 'rate-limit':
        return retryCountdown
          ? `Too many requests. Try again in ${retryCountdown}s`
          : 'Too many requests. Please wait a moment.'
      case 'auth':
        return 'Session expired. Please refresh the page.'
      default:
        return 'Something went wrong. Please try again.'
    }
  }

  const canRetry = onRetry && category !== 'auth' && !retryCountdown

  return (
    <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(139, 77, 59, 0.1)', border: '1px solid var(--rust)' }}>
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--rust)' }} />
        <div className="flex-1">
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>
            {getMessage()}
          </p>
          <p className="text-xs" style={{ color: 'var(--slate-blue)' }}>
            {error}
          </p>
          <div className="mt-3 flex items-center gap-3">
            {canRetry && (
              <button
                onClick={onRetry}
                disabled={isRetrying}
                className="px-3 py-1.5 text-sm font-medium rounded transition-colors flex items-center gap-2"
                style={{ backgroundColor: 'var(--terracotta)', color: 'var(--cream)' }}
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3" />
                    Try Again
                  </>
                )}
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-sm underline"
                style={{ color: 'var(--slate-blue)' }}
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
