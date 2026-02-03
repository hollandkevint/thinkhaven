'use client'

import { useState, useEffect } from 'react'

interface AnimatedLoaderProps {
  messages?: string[]
  className?: string
}

const defaultMessages = [
  'Preparing your workspace...',
  'Loading strategic frameworks...',
  'Configuring your session...',
  'Almost ready...',
]

export default function AnimatedLoader({
  messages = defaultMessages,
  className = '',
}: AnimatedLoaderProps) {
  const [messageIndex, setMessageIndex] = useState(0)
  const [dots, setDots] = useState('')

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length)
    }, 2500)

    return () => clearInterval(messageInterval)
  }, [messages.length])

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'))
    }, 400)

    return () => clearInterval(dotInterval)
  }, [])

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Animated Logo/Icon */}
      <div className="relative mb-8">
        {/* Outer ring */}
        <div className="w-20 h-20 rounded-full border-4 border-parchment animate-pulse" />

        {/* Spinning ring */}
        <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-terracotta animate-spin" />

        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-terracotta"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-64 h-1.5 bg-parchment rounded-full overflow-hidden mb-6">
        <div className="h-full bg-gradient-to-r from-terracotta to-forest rounded-full animate-progress" />
      </div>

      {/* Animated message */}
      <p className="text-lg text-ink font-medium min-h-[28px] transition-opacity duration-300">
        {messages[messageIndex]}
        <span className="inline-block w-6 text-left">{dots}</span>
      </p>

      {/* Subtitle */}
      <p className="text-sm text-ink-light mt-2">
        This usually takes just a moment
      </p>

      {/* Custom animation styles */}
      <style jsx>{`
        @keyframes progress {
          0% {
            width: 0%;
            margin-left: 0%;
          }
          50% {
            width: 60%;
            margin-left: 20%;
          }
          100% {
            width: 0%;
            margin-left: 100%;
          }
        }
        .animate-progress {
          animation: progress 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
