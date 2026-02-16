'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageBookmarkRow } from '@/lib/supabase/conversation-schema'
import { BOOKMARK_COLORS } from '@/lib/ai/bookmark-reference-manager'

interface MessageActionMenuProps {
  messageId: string
  messageContent: string
  conversationId?: string
  conversationTitle?: string
  isBookmarked?: boolean
  bookmarks?: MessageBookmarkRow[]
  onBookmark: (data: { title: string; description?: string; tags: string[]; color: string }) => void
  onCreateReference: (toMessageId: string, type: string) => void
  onViewReferences: () => void
  onCreateBranch?: (messageId: string) => void
  className?: string
}

export default function MessageActionMenu({
  messageId,
  messageContent,
  conversationId,
  conversationTitle,
  isBookmarked = false,
  bookmarks = [],
  onBookmark,
  onCreateReference,
  onViewReferences,
  onCreateBranch,
  className = ''
}: MessageActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showBookmarkForm, setShowBookmarkForm] = useState(false)
  const [bookmarkData, setBookmarkData] = useState({
    title: '',
    description: '',
    tags: [] as string[],
    color: 'blue'
  })
  const [tagInput, setTagInput] = useState('')
  
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowBookmarkForm(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load bookmark suggestions when form opens
  useEffect(() => {
    if (showBookmarkForm && !bookmarkData.title) {
      loadBookmarkSuggestions()
    }
  }, [showBookmarkForm])

  const loadBookmarkSuggestions = async () => {
    try {
      const response = await fetch(
        `/api/bookmarks?action=suggest&messageId=${messageId}&content=${encodeURIComponent(messageContent.substring(0, 200))}`
      )
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setBookmarkData(prev => ({
            ...prev,
            title: data.data.suggestedTitle || '',
            tags: data.data.suggestedTags || [],
            color: data.data.suggestedColor || 'blue'
          }))
        }
      }
    } catch (error) {
      console.error('Failed to load bookmark suggestions:', error)
    }
  }

  const handleBookmarkSubmit = () => {
    if (!bookmarkData.title.trim()) return

    onBookmark({
      title: bookmarkData.title.trim(),
      description: bookmarkData.description.trim() || undefined,
      tags: bookmarkData.tags,
      color: bookmarkData.color
    })

    setShowBookmarkForm(false)
    setIsOpen(false)
    
    // Reset form
    setBookmarkData({
      title: '',
      description: '',
      tags: [],
      color: 'blue'
    })
  }

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !bookmarkData.tags.includes(tag)) {
      setBookmarkData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setBookmarkData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      handleAddTag()
    }
  }

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Menu Toggle Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-secondary hover:text-primary hover:bg-parchment rounded-lg transition-colors opacity-0 group-hover:opacity-100"
        title="Message actions"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 20a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>

      {/* Menu Dropdown */}
      {isOpen && (
        <div 
          ref={menuRef}
          className="absolute right-0 top-full mt-1 w-64 bg-white border border-divider rounded-lg shadow-lg z-20"
        >
          {!showBookmarkForm ? (
            /* Main Menu */
            <div className="py-2">
              {/* Bookmark Action */}
              <button
                onClick={() => {
                  if (isBookmarked) {
                    // Show existing bookmarks or bookmark management
                    console.log('Show bookmark management')
                  } else {
                    setShowBookmarkForm(true)
                  }
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-parchment flex items-center gap-3"
              >
                <div className={`w-4 h-4 rounded ${isBookmarked ? 'text-mustard' : 'text-slate-blue/60'}`}>
                  {isBookmarked ? (
                    <svg fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                    </svg>
                  ) : (
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">
                    {isBookmarked ? 'Bookmarked' : 'Add Bookmark'}
                  </div>
                  {isBookmarked && bookmarks.length > 0 && (
                    <div className="text-xs text-secondary">
                      {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </button>

              {/* Create Reference */}
              <button
                onClick={() => {
                  // This would open a reference creation modal
                  console.log('Create reference')
                  setIsOpen(false)
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-parchment flex items-center gap-3"
              >
                <svg className="w-4 h-4 text-slate-blue/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <div>
                  <div className="font-medium">Create Reference</div>
                  <div className="text-xs text-secondary">Link to another message</div>
                </div>
              </button>

              {/* View References */}
              <button
                onClick={() => {
                  onViewReferences()
                  setIsOpen(false)
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-parchment flex items-center gap-3"
              >
                <svg className="w-4 h-4 text-slate-blue/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <div className="font-medium">View References</div>
                  <div className="text-xs text-secondary">See related messages</div>
                </div>
              </button>

              {/* Create Branch */}
              {onCreateBranch && (
                <button
                  onClick={() => {
                    onCreateBranch(messageId)
                    setIsOpen(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-parchment flex items-center gap-3"
                >
                  <svg className="w-4 h-4 text-slate-blue/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="font-medium">Create Branch</div>
                    <div className="text-xs text-secondary">Explore alternative direction</div>
                  </div>
                </button>
              )}

              <hr className="my-2" />

              {/* Copy Message ID */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(messageId)
                  setIsOpen(false)
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-parchment flex items-center gap-3"
              >
                <svg className="w-4 h-4 text-slate-blue/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <div className="font-medium">Copy Message ID</div>
              </button>
            </div>
          ) : (
            /* Bookmark Form */
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-primary">Add Bookmark</h3>
                <button
                  onClick={() => setShowBookmarkForm(false)}
                  className="text-secondary hover:text-primary"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                {/* Title */}
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={bookmarkData.title}
                    onChange={(e) => setBookmarkData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-divider rounded text-sm focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-transparent"
                    placeholder="Enter bookmark title"
                    maxLength={100}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">
                    Description
                  </label>
                  <textarea
                    value={bookmarkData.description}
                    onChange={(e) => setBookmarkData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-divider rounded text-sm focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-transparent resize-none"
                    placeholder="Optional description"
                    rows={2}
                    maxLength={500}
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">
                    Tags
                  </label>
                  <div className="flex gap-1 mb-2 flex-wrap">
                    {bookmarkData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-terracotta/10 text-ink text-xs rounded"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-ink"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1 px-2 py-1 border border-divider rounded text-xs focus:outline-none focus:ring-1 focus:ring-terracotta"
                      placeholder="Add tag"
                      maxLength={20}
                    />
                    <button
                      onClick={handleAddTag}
                      disabled={!tagInput.trim()}
                      className="px-2 py-1 bg-terracotta text-white text-xs rounded hover:bg-terracotta-hover disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">
                    Color
                  </label>
                  <div className="flex gap-1 flex-wrap">
                    {Object.entries(BOOKMARK_COLORS).map(([color, classes]) => (
                      <button
                        key={color}
                        onClick={() => setBookmarkData(prev => ({ ...prev, color }))}
                        className={`w-6 h-6 rounded border-2 transition-colors ${
                          bookmarkData.color === color 
                            ? 'border-ink/20 ring-2 ring-terracotta'
                            : 'border-ink/8'
                        } ${classes.bg}`}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-2 mt-4 pt-3 border-t border-divider">
                <button
                  onClick={() => setShowBookmarkForm(false)}
                  className="flex-1 px-3 py-2 text-sm text-secondary hover:text-primary border border-divider rounded hover:bg-parchment transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBookmarkSubmit}
                  disabled={!bookmarkData.title.trim()}
                  className="flex-1 px-3 py-2 text-sm bg-terracotta text-white rounded hover:bg-terracotta-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Save Bookmark
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}