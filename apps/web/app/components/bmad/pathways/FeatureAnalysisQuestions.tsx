'use client'

interface FeatureAnalysisQuestionsProps {
  questions: string[]
  onQuestionClick?: (question: string, index: number) => void
  className?: string
}

export default function FeatureAnalysisQuestions({
  questions,
  onQuestionClick,
  className = ''
}: FeatureAnalysisQuestionsProps) {
  if (questions.length === 0) {
    return null
  }

  return (
    <div className={`feature-analysis-questions ${className}`}>
      <div className="bg-cream rounded-lg border border-terracotta/20 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-terracotta rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-ink">
              Feature Validation Questions
            </h3>
            <p className="text-terracotta text-sm">
              These questions will help you validate and refine your feature concept
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {questions.map((question, index) => (
            <div
              key={index}
              className={`group rounded-lg border border-terracotta/20 bg-white p-4 transition-all ${
                onQuestionClick
                  ? 'cursor-pointer hover:border-terracotta/20 hover:shadow-md hover:-translate-y-0.5'
                  : ''
              }`}
              onClick={() => onQuestionClick?.(question, index)}
            >
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-terracotta text-white rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-ink leading-relaxed group-hover:text-ink transition-colors">
                    {question}
                  </p>
                  {onQuestionClick && (
                    <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs text-terracotta font-medium">
                        Click to explore this question →
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-terracotta/20">
          <div className="flex items-start gap-3 text-sm">
            <div className="w-5 h-5 text-terracotta flex-shrink-0 mt-0.5">
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div>
              <p className="text-ink font-medium mb-1">Next Steps</p>
              <p className="text-terracotta">
                Consider these questions as you move through the feature refinement process.
                They'll help guide your priority scoring and final feature specification.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}