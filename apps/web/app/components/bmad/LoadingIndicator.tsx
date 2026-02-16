'use client'

import { ReactNode } from 'react'

interface LoadingIndicatorProps {
  variant?: 'spinner' | 'skeleton' | 'progress' | 'dots'
  size?: 'sm' | 'md' | 'lg'
  message?: string
  progress?: number
  className?: string
  children?: ReactNode
}

export default function LoadingIndicator({ 
  variant = 'spinner',
  size = 'md', 
  message,
  progress,
  className = '',
  children
}: LoadingIndicatorProps) {
  
  const getSizeClasses = () => {
    const sizeMap = {
      sm: { spinner: 'w-4 h-4', text: 'text-sm' },
      md: { spinner: 'w-6 h-6', text: 'text-base' },
      lg: { spinner: 'w-8 h-8', text: 'text-lg' }
    }
    return sizeMap[size]
  }

  const sizeClasses = getSizeClasses()

  const renderSpinner = () => (
    <div className={`border-2 border-ink/10 border-t-primary rounded-full animate-spin ${sizeClasses.spinner}`}></div>
  )

  const renderSkeleton = () => (
    <div className="animate-pulse space-y-3">
      <div className="h-4 bg-ink/10 rounded w-3/4"></div>
      <div className="h-4 bg-ink/10 rounded w-1/2"></div>
      <div className="h-4 bg-ink/10 rounded w-2/3"></div>
    </div>
  )

  const renderProgress = () => (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        {message && <span className={`text-secondary ${sizeClasses.text}`}>{message}</span>}
        {progress !== undefined && (
          <span className={`text-primary font-medium ${sizeClasses.text}`}>
            {Math.round(progress)}%
          </span>
        )}
      </div>
      <div className="w-full bg-ink/10 rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300" 
          style={{ width: `${progress || 0}%` }}
        ></div>
      </div>
    </div>
  )

  const renderDots = () => (
    <div className="flex space-x-1">
      <div className={`bg-primary rounded-full animate-bounce ${size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'}`} style={{ animationDelay: '0ms' }}></div>
      <div className={`bg-primary rounded-full animate-bounce ${size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'}`} style={{ animationDelay: '150ms' }}></div>
      <div className={`bg-primary rounded-full animate-bounce ${size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'}`} style={{ animationDelay: '300ms' }}></div>
    </div>
  )

  const renderLoadingContent = () => {
    switch (variant) {
      case 'skeleton':
        return renderSkeleton()
      case 'progress':
        return renderProgress()
      case 'dots':
        return renderDots()
      default:
        return renderSpinner()
    }
  }

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      {renderLoadingContent()}
      
      {message && variant !== 'progress' && (
        <span className={`text-secondary ${sizeClasses.text}`}>
          {message}
        </span>
      )}
      
      {children && (
        <div className="mt-2">
          {children}
        </div>
      )}
    </div>
  )
}

// Specialized loading components for common BMad scenarios
export const SessionCreationLoader = ({ className = '' }: { className?: string }) => (
  <LoadingIndicator 
    variant="spinner"
    size="md"
    message="Creating your strategic session..."
    className={className}
  />
)

export const PathwayAnalysisLoader = ({ className = '' }: { className?: string }) => (
  <LoadingIndicator 
    variant="dots"
    size="md" 
    message="Analyzing pathway options..."
    className={className}
  />
)

export const ElicitationLoader = ({ progress, className = '' }: { progress?: number; className?: string }) => (
  <LoadingIndicator 
    variant="progress"
    size="md"
    message="Processing your response"
    progress={progress}
    className={className}
  />
)

export const SkeletonLoader = ({ className = '' }: { className?: string }) => (
  <LoadingIndicator 
    variant="skeleton"
    className={className}
  />
)