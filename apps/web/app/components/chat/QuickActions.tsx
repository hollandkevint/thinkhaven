'use client'

import { useState } from 'react'
import { CoachingContext } from '@/lib/ai/mary-persona'
import { maryPersona } from '@/lib/ai/mary-persona'

interface QuickActionsProps {
  onActionSelect: (action: string) => void
  coachingContext?: CoachingContext
  disabled?: boolean
  className?: string
}

interface ActionGroup {
  id: string
  label: string
  icon: React.ReactNode
  actions: string[]
}

const defaultActions = [
  "Challenge my assumptions",
  "Explore alternative approaches", 
  "Help me think this through",
  "What questions should I ask?",
  "Identify potential risks"
]

const phasedActions: Record<string, ActionGroup[]> = {
  discovery: [
    {
      id: 'exploration',
      label: 'Exploration',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      actions: [
        "Help me explore this deeper",
        "What am I missing?",
        "Challenge my assumptions"
      ]
    },
    {
      id: 'questioning',
      label: 'Strategic Questions',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      actions: [
        "What questions should I ask?",
        "How do I validate this?",
        "What data do I need?"
      ]
    }
  ],
  analysis: [
    {
      id: 'validation',
      label: 'Validation',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      actions: [
        "Validate this approach",
        "Test my hypothesis",
        "Compare alternatives"
      ]
    },
    {
      id: 'risk',
      label: 'Risk Assessment',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      actions: [
        "What are the risks?",
        "Identify blind spots",
        "Plan for contingencies"
      ]
    },
    {
      id: 'market',
      label: 'Market Analysis',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      actions: [
        "Analyze the competition",
        "Assess market opportunity",
        "Study customer needs"
      ]
    }
  ],
  planning: [
    {
      id: 'prioritization',
      label: 'Prioritization',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
      actions: [
        "Help me prioritize",
        "What's most important?",
        "Focus my efforts"
      ]
    },
    {
      id: 'execution',
      label: 'Next Steps',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      ),
      actions: [
        "What's my next step?",
        "Create an action plan",
        "Set milestones"
      ]
    },
    {
      id: 'measurement',
      label: 'Success Metrics',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      actions: [
        "How do I measure success?",
        "Define key metrics",
        "Track progress"
      ]
    }
  ]
}

export default function QuickActions({
  onActionSelect,
  coachingContext,
  disabled = false,
  className = ''
}: QuickActionsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)

  // Get contextual actions based on coaching context
  const getContextualActions = (): string[] => {
    if (coachingContext) {
      return maryPersona.generateQuickActions(coachingContext)
    }
    return defaultActions
  }

  // Get phase-specific action groups
  const getPhaseActionGroups = (): ActionGroup[] => {
    const phase = coachingContext?.currentBmadSession?.phase
    if (phase && phasedActions[phase]) {
      return phasedActions[phase]
    }
    return []
  }

  const contextualActions = getContextualActions()
  const phaseGroups = getPhaseActionGroups()
  const hasPhaseActions = phaseGroups.length > 0

  const handleActionClick = (action: string) => {
    onActionSelect(action)
    setSelectedCategory(null)
    setShowAll(false)
  }

  const allActions = hasPhaseActions 
    ? phaseGroups.flatMap(group => group.actions)
    : contextualActions

  const displayedActions = showAll ? allActions : allActions.slice(0, 4)

  return (
    <div className={`quick-actions ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-terracotta" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h3 className="text-sm font-medium text-primary">
            {hasPhaseActions ? 'Strategic Actions' : 'Quick Actions'}
          </h3>
          {coachingContext?.currentBmadSession && (
            <div className="flex items-center gap-1 px-2 py-1 bg-terracotta/10 rounded-full">
              <div className="w-2 h-2 bg-terracotta rounded-full"></div>
              <span className="text-xs text-terracotta font-medium capitalize">
                {coachingContext.currentBmadSession.phase}
              </span>
            </div>
          )}
        </div>
        
        {allActions.length > 4 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-secondary hover:text-primary transition-colors"
          >
            {showAll ? 'Show less' : `+${allActions.length - 4} more`}
          </button>
        )}
      </div>

      {/* Phase-Specific Action Groups */}
      {hasPhaseActions && !showAll ? (
        <div className="space-y-3">
          {phaseGroups.map((group) => (
            <div key={group.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="text-secondary">{group.icon}</div>
                <h4 className="text-xs font-medium text-secondary uppercase tracking-wider">
                  {group.label}
                </h4>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {group.actions.slice(0, 2).map((action, index) => (
                  <button
                    key={`${group.id}-${index}`}
                    onClick={() => handleActionClick(action)}
                    disabled={disabled}
                    className="text-left px-3 py-2 bg-white border border-ink/8 rounded-lg text-sm text-secondary hover:text-primary hover:bg-terracotta/5 hover:border-terracotta/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* All Actions Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {displayedActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleActionClick(action)}
              disabled={disabled}
              className="text-left px-3 py-2 bg-white border border-ink/8 rounded-lg text-sm text-secondary hover:text-primary hover:bg-terracotta/5 hover:border-terracotta/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="flex items-center gap-2">
                <svg className="w-3 h-3 text-slate-blue/60 group-hover:text-terracotta transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="flex-1">{action}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Coaching Context Summary */}
      {coachingContext && (
        <div className="mt-4 p-3 bg-terracotta/5 rounded-lg border border-terracotta/20">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-terracotta flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg>
            <div className="flex-1">
              <div className="text-xs text-ink space-y-1">
                {coachingContext.currentBmadSession && (
                  <div>
                    <span className="font-medium">Current session:</span>{' '}
                    <span className="capitalize">
                      {coachingContext.currentBmadSession.pathway.replace('-', ' ')}
                    </span>
                    {' • '}
                    <span className="capitalize">{coachingContext.currentBmadSession.phase}</span>
                    {' • '}
                    <span>{coachingContext.currentBmadSession.progress}% complete</span>
                  </div>
                )}
                {coachingContext.userProfile?.experienceLevel && (
                  <div>
                    <span className="font-medium">Experience:</span>{' '}
                    <span className="capitalize">{coachingContext.userProfile.experienceLevel}</span>
                    {coachingContext.userProfile.industry && (
                      <>
                        {' in '}
                        <span>{coachingContext.userProfile.industry}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tip */}
      <div className="mt-3 text-xs text-slate-blue italic">
        💡 Click any action to start a conversation with Mary, your AI strategist
      </div>
    </div>
  )
}