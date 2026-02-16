'use client'

import { useState } from 'react'

export interface BranchDialogProps {
  isOpen: boolean
  onClose: () => void
  messageId: string
  messageContent: string
  conversationTitle?: string
  onCreateBranch: (options: BranchCreateOptions) => void
  className?: string
}

export interface BranchCreateOptions {
  title: string
  description?: string
  alternativeDirection?: string
  preserveContext: boolean
}

const ALTERNATIVE_DIRECTIONS = [
  {
    value: 'different_approach',
    label: 'Different Approach',
    description: 'Explore a completely different strategy or methodology'
  },
  {
    value: 'deeper_analysis',
    label: 'Deeper Analysis',
    description: 'Dive deeper into this specific topic or area'
  },
  {
    value: 'alternative_solution',
    label: 'Alternative Solution',
    description: 'Consider alternative solutions to the same problem'
  },
  {
    value: 'what_if_scenario',
    label: 'What-If Scenario',
    description: 'Explore hypothetical scenarios or edge cases'
  },
  {
    value: 'different_perspective',
    label: 'Different Perspective',
    description: 'Approach from a different stakeholder or viewpoint'
  },
  {
    value: 'simplified_approach',
    label: 'Simplified Approach',
    description: 'Focus on simpler, more pragmatic solutions'
  }
]

export default function BranchDialog({
  isOpen,
  onClose,
  messageId,
  messageContent,
  conversationTitle,
  onCreateBranch,
  className = ''
}: BranchDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedDirection, setSelectedDirection] = useState('')
  const [preserveContext, setPreserveContext] = useState(true)
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    if (!title.trim()) {
      return
    }

    try {
      setCreating(true)

      const options: BranchCreateOptions = {
        title: title.trim(),
        description: description.trim() || undefined,
        alternativeDirection: selectedDirection || undefined,
        preserveContext
      }

      await onCreateBranch(options)
      onClose()
      
      // Reset form
      setTitle('')
      setDescription('')
      setSelectedDirection('')
      setPreserveContext(true)

    } catch (error) {
      console.error('Failed to create branch:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleCancel = () => {
    setTitle('')
    setDescription('')
    setSelectedDirection('')
    setPreserveContext(true)
    onClose()
  }

  const truncateMessage = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  if (!isOpen) return null

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-divider">
          <h2 className="text-xl font-semibold text-primary">Create Conversation Branch</h2>
          <button
            onClick={handleCancel}
            className="text-secondary hover:text-primary transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Branch Point Info */}
          <div className="bg-terracotta/5 border border-terracotta/20 rounded-lg p-4">
            <h4 className="font-medium text-ink mb-2">Branch Point</h4>
            <p className="text-sm text-ink mb-2">
              From: <span className="font-medium">{conversationTitle || 'Untitled Conversation'}</span>
            </p>
            <div className="bg-white border rounded p-3">
              <p className="text-sm text-ink-light leading-relaxed">
                {truncateMessage(messageContent)}
              </p>
            </div>
            <p className="text-xs text-terracotta mt-2">
              This will create a new conversation starting from this message, allowing you to explore alternative directions.
            </p>
          </div>

          {/* Branch Title */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Branch Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Alternative Strategy Analysis"
              className="w-full px-4 py-2 border border-divider rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-transparent"
              maxLength={100}
            />
            <p className="text-xs text-secondary mt-1">
              Give this branch a descriptive title that explains the alternative direction
            </p>
          </div>

          {/* Direction Selection */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Alternative Direction
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ALTERNATIVE_DIRECTIONS.map((direction) => (
                <div
                  key={direction.value}
                  onClick={() => setSelectedDirection(direction.value === selectedDirection ? '' : direction.value)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedDirection === direction.value
                      ? 'border-terracotta bg-terracotta/5'
                      : 'border-ink/8 hover:border-ink/20 hover:bg-parchment'
                  }`}
                >
                  <div className="font-medium text-sm text-primary mb-1">
                    {direction.label}
                  </div>
                  <p className="text-xs text-secondary">
                    {direction.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you want to explore in this branch..."
              rows={3}
              className="w-full px-4 py-2 border border-divider rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta focus:border-transparent resize-none"
              maxLength={500}
            />
            <p className="text-xs text-secondary mt-1">
              Optional: Explain the specific alternative approach you want to explore
            </p>
          </div>

          {/* Context Options */}
          <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={preserveContext}
                onChange={(e) => setPreserveContext(e.target.checked)}
                className="w-4 h-4 text-terracotta border-ink/8 rounded focus:ring-terracotta"
              />
              <div>
                <span className="text-sm font-medium text-primary">Preserve Context</span>
                <p className="text-xs text-secondary">
                  Include the conversation history up to this point in the new branch
                </p>
              </div>
            </label>
          </div>

          {/* Advanced Info */}
          <div className="bg-parchment border rounded-lg p-4">
            <h4 className="font-medium text-ink mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              How Branching Works
            </h4>
            <ul className="text-sm text-ink-light space-y-1">
              <li>• Creates a new conversation starting from the selected message</li>
              <li>• Original conversation remains unchanged</li>
              <li>• You can switch between branches anytime</li>
              <li>• Branches can be merged back into the original conversation</li>
              <li>• Perfect for exploring "what if" scenarios without losing progress</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-divider bg-parchment">
          <div className="text-sm text-secondary">
            This will create a new conversation that you can explore independently.
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={creating}
              className="px-4 py-2 text-sm text-secondary hover:text-primary border border-divider rounded hover:bg-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !title.trim()}
              className="px-4 py-2 text-sm bg-terracotta text-white rounded hover:bg-terracotta-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {creating && (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              )}
              {creating ? 'Creating Branch...' : 'Create Branch'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}