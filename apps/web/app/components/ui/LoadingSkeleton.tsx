'use client'

import { cn } from '@/lib/utils'

/**
 * Loading Skeleton Components
 *
 * ThinkHaven design system loading states using the Wes Anderson-inspired palette.
 * Base color: parchment (#F5F0E6)
 * Animation: subtle opacity shift
 */

// ============================================================================
// Skeleton Primitives
// ============================================================================

interface SkeletonBaseProps {
  className?: string
}

/**
 * Base skeleton with pulse animation
 */
function SkeletonBase({ className }: SkeletonBaseProps) {
  return (
    <div
      className={cn(
        'bg-parchment animate-pulse rounded',
        className
      )}
    />
  )
}

interface SkeletonTextProps {
  width?: string
  className?: string
}

/**
 * Text line skeleton
 * @param width - Tailwind width class (e.g., 'w-32', 'w-full', 'w-3/4')
 */
export function SkeletonText({ width = 'w-full', className }: SkeletonTextProps) {
  return (
    <SkeletonBase
      className={cn('h-4', width, className)}
    />
  )
}

interface SkeletonCardProps {
  className?: string
}

/**
 * Card skeleton with border
 */
export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'bg-parchment/50 border border-parchment rounded-lg p-4',
        className
      )}
    >
      <div className="space-y-3">
        <SkeletonBase className="h-5 w-3/4" />
        <SkeletonBase className="h-4 w-full" />
        <SkeletonBase className="h-4 w-5/6" />
      </div>
    </div>
  )
}

interface SkeletonAvatarProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Avatar/profile picture skeleton
 */
export function SkeletonAvatar({ size = 'md', className }: SkeletonAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  }

  return (
    <SkeletonBase
      className={cn('rounded-full', sizeClasses[size], className)}
    />
  )
}

interface SkeletonButtonProps {
  className?: string
}

/**
 * Button skeleton
 */
export function SkeletonButton({ className }: SkeletonButtonProps) {
  return (
    <SkeletonBase
      className={cn('h-10 w-24 rounded-md', className)}
    />
  )
}

// ============================================================================
// Pre-built Skeletons
// ============================================================================

/**
 * Session card skeleton for dashboard
 */
export function SessionCardSkeleton() {
  return (
    <div className="bg-cream border border-parchment rounded-lg p-4 space-y-3">
      {/* Header row with title and status */}
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <SkeletonBase className="h-5 w-2/3" />
          <SkeletonBase className="h-3 w-1/3" />
        </div>
        <SkeletonBase className="h-6 w-16 rounded-full" />
      </div>

      {/* Description lines */}
      <div className="space-y-2 pt-2">
        <SkeletonBase className="h-4 w-full" />
        <SkeletonBase className="h-4 w-4/5" />
      </div>

      {/* Footer with date and action */}
      <div className="flex items-center justify-between pt-2">
        <SkeletonBase className="h-3 w-24" />
        <SkeletonBase className="h-8 w-20 rounded-md" />
      </div>
    </div>
  )
}

/**
 * Chat message skeleton
 */
export function MessageSkeleton({ isUser = false }: { isUser?: boolean }) {
  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <SkeletonAvatar size="sm" />
      <div className={cn('space-y-2 max-w-[70%]', isUser ? 'items-end' : 'items-start')}>
        <SkeletonBase className="h-4 w-48" />
        <SkeletonBase className="h-4 w-64" />
        <SkeletonBase className="h-4 w-32" />
      </div>
    </div>
  )
}

/**
 * Sidebar navigation skeleton
 */
export function SidebarSkeleton() {
  return (
    <div className="w-64 bg-cream border-r border-parchment p-4 space-y-6">
      {/* Logo area */}
      <div className="flex items-center gap-3 pb-4 border-b border-parchment">
        <SkeletonBase className="h-8 w-8 rounded" />
        <SkeletonBase className="h-5 w-28" />
      </div>

      {/* Navigation items */}
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <SkeletonBase className="h-5 w-5 rounded" />
            <SkeletonBase className="h-4 w-24" />
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-parchment" />

      {/* Recent sessions */}
      <div className="space-y-2">
        <SkeletonBase className="h-3 w-20 mb-3" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-2 p-2">
            <SkeletonBase className="h-4 w-4 rounded" />
            <SkeletonBase className="h-4 w-32" />
          </div>
        ))}
      </div>

      {/* User area at bottom */}
      <div className="mt-auto pt-4 border-t border-parchment">
        <div className="flex items-center gap-3">
          <SkeletonAvatar size="sm" />
          <div className="space-y-1">
            <SkeletonBase className="h-4 w-24" />
            <SkeletonBase className="h-3 w-16" />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Full dashboard layout skeleton
 */
export function DashboardSkeleton() {
  return (
    <div className="flex h-screen bg-cream">
      {/* Sidebar */}
      <SidebarSkeleton />

      {/* Main content */}
      <div className="flex-1 p-6 space-y-6 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <SkeletonBase className="h-8 w-48" />
            <SkeletonBase className="h-4 w-64" />
          </div>
          <SkeletonButton className="w-32" />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-parchment/30 border border-parchment rounded-lg p-4">
              <SkeletonBase className="h-4 w-20 mb-2" />
              <SkeletonBase className="h-8 w-16" />
            </div>
          ))}
        </div>

        {/* Session grid */}
        <div className="space-y-4">
          <SkeletonBase className="h-6 w-32" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <SessionCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Chat interface skeleton
 */
export function ChatSkeleton() {
  return (
    <div className="flex flex-col h-full bg-cream">
      {/* Messages area */}
      <div className="flex-1 p-4 space-y-6 overflow-auto">
        <MessageSkeleton isUser={false} />
        <MessageSkeleton isUser={true} />
        <MessageSkeleton isUser={false} />
        <MessageSkeleton isUser={true} />
        <MessageSkeleton isUser={false} />
      </div>

      {/* Input area */}
      <div className="border-t border-parchment p-4">
        <div className="flex items-center gap-3">
          <SkeletonBase className="flex-1 h-12 rounded-lg" />
          <SkeletonButton className="w-12 h-12" />
        </div>
      </div>
    </div>
  )
}

/**
 * Navigation bar skeleton
 */
export function NavSkeleton() {
  return (
    <nav className="flex items-center justify-between p-4 bg-cream border-b border-parchment">
      <SkeletonBase className="h-6 w-28" />
      <SkeletonBase className="w-8 h-8 rounded-full" />
    </nav>
  )
}
