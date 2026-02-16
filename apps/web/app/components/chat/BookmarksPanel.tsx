'use client'

import { useState, useEffect } from 'react'
import { BookmarkWithContext, BOOKMARK_COLORS } from '@/lib/ai/bookmark-reference-manager'

interface BookmarksPanelProps {
  workspaceId: string
  userId: string
  onNavigateToMessage: (messageId: string, conversationId: string) => void
  className?: string
}

export default function BookmarksPanel({
  workspaceId,
  userId,
  onNavigateToMessage,
  className = ''
}: BookmarksPanelProps) {
  const [bookmarks, setBookmarks] = useState<BookmarkWithContext[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<Array<{ tag: string; count: number }>>([])
  const [stats, setStats] = useState<{
    totalBookmarks: number
    totalTags: number
  } | null>(null)

  // Load bookmarks
  const loadBookmarks = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        workspaceId,
        limit: '100'
      })

      if (searchQuery || selectedTags.length > 0) {
        params.set('action', 'search')
        if (searchQuery) params.set('query', searchQuery)
        if (selectedTags.length > 0) params.set('tags', selectedTags.join(','))
      }

      const response = await fetch(`/api/bookmarks?${params}`)
      const data = await response.json()

      if (data.success) {
        setBookmarks(data.data.bookmarks || [])
      }
    } catch (error) {
      console.error('Failed to load bookmarks:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load available tags
  const loadTags = async () => {
    try {
      const response = await fetch(`/api/bookmarks?action=tags&workspaceId=${workspaceId}`)
      const data = await response.json()

      if (data.success) {
        setAvailableTags(data.data.tags || [])
      }
    } catch (error) {
      console.error('Failed to load tags:', error)
    }
  }

  // Load stats
  const loadStats = async () => {
    try {
      const response = await fetch(`/api/bookmarks?action=stats&workspaceId=${workspaceId}`)
      const data = await response.json()

      if (data.success) {
        setStats({
          totalBookmarks: data.data.totalBookmarks,
          totalTags: data.data.totalTags
        })
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  // Delete bookmark
  const deleteBookmark = async (bookmarkId: string) => {
    try {
      const response = await fetch(`/api/bookmarks?id=${bookmarkId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setBookmarks(prev => prev.filter(b => b.id !== bookmarkId))
        loadStats() // Refresh stats
      }
    } catch (error) {
      console.error('Failed to delete bookmark:', error)
    }
  }

  // Toggle tag filter
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  // Format timestamp
  const formatTimestamp = (date: string): string => {
    const now = new Date()
    const created = new Date(date)
    const diff = now.getTime() - created.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
    if (minutes < 10080) return `${Math.floor(minutes / 1440)}d ago`
    return created.toLocaleDateString()
  }

  // Truncate text
  const truncateText = (text: string, maxLength: number = 100): string => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  useEffect(() => {
    loadBookmarks()
  }, [searchQuery, selectedTags, workspaceId])

  useEffect(() => {
    loadTags()
    loadStats()
  }, [workspaceId])

  return (
    <div className={`bookmarks-panel flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-divider">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-primary">Bookmarks</h2>
          {stats && (
            <div className="text-xs text-secondary">
              {stats.totalBookmarks} bookmarks • {stats.totalTags} tags
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-divider rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-transparent"
          />
        </div>

        {/* Tag Filters */}
        {availableTags.length > 0 && (
          <div>
            <div className="text-xs font-medium text-secondary mb-2">Filter by tags:</div>
            <div className="flex flex-wrap gap-1">
              {availableTags.slice(0, 8).map(({ tag, count }) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-terracotta/10 text-ink border-terracotta/20'
                      : 'bg-parchment text-ink-light border-ink/8 hover:bg-parchment'
                  }`}
                >
                  {tag} ({count})
                </button>
              ))}
            </div>
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="mt-2 text-xs text-terracotta hover:text-ink"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bookmarks List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="border border-ink/8 rounded-lg p-3">
                  <div className="space-y-2">
                    <div className="h-4 bg-ink/10 rounded w-3/4"></div>
                    <div className="h-3 bg-ink/10 rounded w-1/2"></div>
                    <div className="h-3 bg-ink/10 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="p-4 text-center">
            <div className="text-secondary text-sm">
              <div className="mb-2">
                <svg className="w-12 h-12 mx-auto text-ink/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <p>{searchQuery || selectedTags.length > 0 ? 'No bookmarks found' : 'No bookmarks yet'}</p>
              <p className="text-xs mt-1">
                {searchQuery || selectedTags.length > 0 
                  ? 'Try adjusting your search or filters'
                  : 'Bookmark important messages to find them easily later'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className={`border rounded-lg p-3 hover:bg-parchment cursor-pointer transition-colors ${
                  BOOKMARK_COLORS[bookmark.color as keyof typeof BOOKMARK_COLORS]?.border || 'border-ink/8'
                }`}
                onClick={() => onNavigateToMessage(bookmark.message_id, bookmark.conversation.id)}
              >
                {/* Bookmark Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-primary text-sm truncate">
                      {bookmark.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-secondary">
                        {bookmark.conversation.title || 'Untitled Conversation'}
                      </span>
                      <span className="text-xs text-secondary">
                        {formatTimestamp(bookmark.created_at)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Color indicator and actions */}
                  <div className="flex items-center gap-2 ml-2">
                    <div
                      className={`w-3 h-3 rounded ${
                        BOOKMARK_COLORS[bookmark.color as keyof typeof BOOKMARK_COLORS]?.bg || 'bg-terracotta/10'
                      }`}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteBookmark(bookmark.id)
                      }}
                      className="p-1 text-slate-blue/60 hover:text-rust transition-colors"
                      title="Delete bookmark"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Description */}
                {bookmark.description && (
                  <p className="text-sm text-secondary mb-2 leading-relaxed">
                    {truncateText(bookmark.description)}
                  </p>
                )}

                {/* Message preview */}
                <div className="text-sm text-secondary bg-parchment rounded p-2 mb-2 border-l-2 border-ink/8">
                  {truncateText(bookmark.message.content, 120)}
                </div>

                {/* Tags */}
                {bookmark.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {bookmark.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`px-2 py-1 text-xs rounded ${
                          BOOKMARK_COLORS[bookmark.color as keyof typeof BOOKMARK_COLORS]?.bg || 'bg-terracotta/10'
                        } ${
                          BOOKMARK_COLORS[bookmark.color as keyof typeof BOOKMARK_COLORS]?.text || 'text-ink'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}