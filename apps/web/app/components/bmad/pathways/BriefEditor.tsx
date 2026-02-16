'use client'

import { useState, useEffect } from 'react'
import { FeatureBrief } from '@/lib/bmad/types'

interface BriefEditorProps {
  brief: FeatureBrief
  onUpdate: (updates: Partial<FeatureBrief>) => void
  onCancel?: () => void
  className?: string
}

export default function BriefEditor({
  brief,
  onUpdate,
  onCancel,
  className = ''
}: BriefEditorProps) {
  const [editedBrief, setEditedBrief] = useState<FeatureBrief>(brief)
  const [hasChanges, setHasChanges] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    setEditedBrief(brief)
    setHasChanges(false)
  }, [brief])

  const handleFieldChange = (field: keyof FeatureBrief, value: unknown) => {
    setEditedBrief(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const updated = { ...prev }
        delete updated[field]
        return updated
      })
    }
  }

  const handleArrayItemChange = (
    field: 'userStories' | 'acceptanceCriteria' | 'successMetrics' | 'implementationNotes',
    index: number,
    value: string
  ) => {
    setEditedBrief(prev => {
      const array = [...prev[field]]
      array[index] = value
      return { ...prev, [field]: array }
    })
    setHasChanges(true)
  }

  const handleArrayItemAdd = (
    field: 'userStories' | 'acceptanceCriteria' | 'successMetrics' | 'implementationNotes'
  ) => {
    setEditedBrief(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }))
    setHasChanges(true)
  }

  const handleArrayItemRemove = (
    field: 'userStories' | 'acceptanceCriteria' | 'successMetrics' | 'implementationNotes',
    index: number
  ) => {
    setEditedBrief(prev => {
      const array = [...prev[field]]
      array.splice(index, 1)
      return { ...prev, [field]: array }
    })
    setHasChanges(true)
  }

  const validateBrief = (): boolean => {
    const errors: Record<string, string> = {}

    // Title validation
    if (!editedBrief.title || editedBrief.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters'
    } else if (editedBrief.title.length > 100) {
      errors.title = 'Title must be less than 100 characters'
    }

    // Description validation
    if (!editedBrief.description || editedBrief.description.trim().length < 50) {
      errors.description = 'Description must be at least 50 characters'
    } else if (editedBrief.description.length > 500) {
      errors.description = 'Description must be less than 500 characters'
    }

    // User stories validation
    if (editedBrief.userStories.length < 1) {
      errors.userStories = 'At least 1 user story is required'
    } else if (editedBrief.userStories.some(s => !s.trim())) {
      errors.userStories = 'All user stories must have content'
    }

    // Acceptance criteria validation
    if (editedBrief.acceptanceCriteria.length < 3) {
      errors.acceptanceCriteria = 'At least 3 acceptance criteria are required'
    } else if (editedBrief.acceptanceCriteria.some(ac => !ac.trim())) {
      errors.acceptanceCriteria = 'All acceptance criteria must have content'
    }

    // Success metrics validation
    if (editedBrief.successMetrics.length < 2) {
      errors.successMetrics = 'At least 2 success metrics are required'
    } else if (editedBrief.successMetrics.some(m => !m.trim())) {
      errors.successMetrics = 'All success metrics must have content'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = () => {
    if (!validateBrief()) {
      return
    }

    const updates: Partial<FeatureBrief> = {
      title: editedBrief.title,
      description: editedBrief.description,
      userStories: editedBrief.userStories.filter(s => s.trim()),
      acceptanceCriteria: editedBrief.acceptanceCriteria.filter(ac => ac.trim()),
      successMetrics: editedBrief.successMetrics.filter(m => m.trim()),
      implementationNotes: editedBrief.implementationNotes.filter(n => n.trim()),
      lastEditedAt: new Date()
    }

    onUpdate(updates)
    setHasChanges(false)
  }

  return (
    <div className={`brief-editor ${className}`}>
      <div className="bg-white border border-ink/8 rounded-lg">
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-ink-light mb-2">
              Feature Title *
            </label>
            <input
              type="text"
              value={editedBrief.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              className="w-full px-4 py-2 border border-ink/8 rounded-lg focus:ring-2 focus:ring-terracotta focus:border-transparent"
              placeholder="e.g., Add User Profile Customization"
            />
            {validationErrors.title && (
              <p className="text-sm text-rust mt-1">{validationErrors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-ink-light mb-2">
              Description *
            </label>
            <textarea
              value={editedBrief.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-ink/8 rounded-lg focus:ring-2 focus:ring-terracotta focus:border-transparent"
              placeholder="Describe the feature and its business value..."
            />
            <div className="flex justify-between items-center mt-1">
              {validationErrors.description ? (
                <p className="text-sm text-rust">{validationErrors.description}</p>
              ) : (
                <p className="text-sm text-slate-blue">
                  {editedBrief.description.length} characters (50-500 recommended)
                </p>
              )}
            </div>
          </div>

          {/* User Stories */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-ink-light">
                User Stories *
              </label>
              <button
                onClick={() => handleArrayItemAdd('userStories')}
                className="text-sm text-terracotta hover:text-terracotta font-medium"
              >
                + Add Story
              </button>
            </div>
            <div className="space-y-3">
              {editedBrief.userStories.map((story, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-terracotta text-white text-xs font-bold flex-shrink-0 mt-2">
                    {idx + 1}
                  </span>
                  <textarea
                    value={story}
                    onChange={(e) => handleArrayItemChange('userStories', idx, e.target.value)}
                    rows={2}
                    className="flex-1 px-3 py-2 border border-ink/8 rounded-lg focus:ring-2 focus:ring-terracotta focus:border-transparent text-sm"
                    placeholder="As a [user], I want [feature] so that [benefit]"
                  />
                  <button
                    onClick={() => handleArrayItemRemove('userStories', idx)}
                    className="text-rust hover:text-rust p-2 flex-shrink-0"
                    title="Remove story"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            {validationErrors.userStories && (
              <p className="text-sm text-rust mt-1">{validationErrors.userStories}</p>
            )}
          </div>

          {/* Acceptance Criteria */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-ink-light">
                Acceptance Criteria *
              </label>
              <button
                onClick={() => handleArrayItemAdd('acceptanceCriteria')}
                className="text-sm text-terracotta hover:text-terracotta font-medium"
              >
                + Add Criterion
              </button>
            </div>
            <div className="space-y-2">
              {editedBrief.acceptanceCriteria.map((ac, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded bg-forest/10 text-forest text-xs font-bold flex-shrink-0 mt-2">
                    ✓
                  </span>
                  <input
                    type="text"
                    value={ac}
                    onChange={(e) => handleArrayItemChange('acceptanceCriteria', idx, e.target.value)}
                    className="flex-1 px-3 py-2 border border-ink/8 rounded-lg focus:ring-2 focus:ring-terracotta focus:border-transparent text-sm"
                    placeholder="Specific, measurable acceptance criterion"
                  />
                  <button
                    onClick={() => handleArrayItemRemove('acceptanceCriteria', idx)}
                    className="text-rust hover:text-rust p-2 flex-shrink-0"
                    title="Remove criterion"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            {validationErrors.acceptanceCriteria && (
              <p className="text-sm text-rust mt-1">{validationErrors.acceptanceCriteria}</p>
            )}
          </div>

          {/* Success Metrics */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-ink-light">
                Success Metrics *
              </label>
              <button
                onClick={() => handleArrayItemAdd('successMetrics')}
                className="text-sm text-terracotta hover:text-terracotta font-medium"
              >
                + Add Metric
              </button>
            </div>
            <div className="space-y-2">
              {editedBrief.successMetrics.map((metric, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-forest text-xl flex-shrink-0">📊</span>
                  <input
                    type="text"
                    value={metric}
                    onChange={(e) => handleArrayItemChange('successMetrics', idx, e.target.value)}
                    className="flex-1 px-3 py-2 border border-ink/8 rounded-lg focus:ring-2 focus:ring-terracotta focus:border-transparent text-sm"
                    placeholder="Measurable metric with target value and timeframe"
                  />
                  <button
                    onClick={() => handleArrayItemRemove('successMetrics', idx)}
                    className="text-rust hover:text-rust p-2 flex-shrink-0"
                    title="Remove metric"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            {validationErrors.successMetrics && (
              <p className="text-sm text-rust mt-1">{validationErrors.successMetrics}</p>
            )}
          </div>

          {/* Implementation Notes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-ink-light">
                Implementation Notes
              </label>
              <button
                onClick={() => handleArrayItemAdd('implementationNotes')}
                className="text-sm text-terracotta hover:text-terracotta font-medium"
              >
                + Add Note
              </button>
            </div>
            <div className="space-y-2">
              {editedBrief.implementationNotes.map((note, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-amber-600 text-lg flex-shrink-0">💡</span>
                  <textarea
                    value={note}
                    onChange={(e) => handleArrayItemChange('implementationNotes', idx, e.target.value)}
                    rows={2}
                    className="flex-1 px-3 py-2 border border-ink/8 rounded-lg focus:ring-2 focus:ring-terracotta focus:border-transparent text-sm"
                    placeholder="Technical considerations or implementation guidance"
                  />
                  <button
                    onClick={() => handleArrayItemRemove('implementationNotes', idx)}
                    className="text-rust hover:text-rust p-2 flex-shrink-0"
                    title="Remove note"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-ink/8">
            <div className="text-sm text-ink-light">
              {hasChanges && '• Unsaved changes'}
            </div>
            <div className="flex gap-3">
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="px-4 py-2 border border-ink/8 rounded-lg text-sm font-medium text-ink-light hover:bg-parchment transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className="px-6 py-2 bg-terracotta text-white rounded-lg text-sm font-semibold hover:bg-terracotta-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}