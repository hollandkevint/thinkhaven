'use client';

import React, { useState } from 'react';
import { NewIdeaPhaseData } from '@/lib/bmad/templates/new-idea-templates';

interface IdeationPhaseProps {
  sessionData: NewIdeaPhaseData;
  onPhaseComplete: (data: Partial<NewIdeaPhaseData>) => void;
  isLoading: boolean;
}

export default function IdeationPhase({
  sessionData,
  onPhaseComplete,
  isLoading
}: IdeationPhaseProps) {
  const [rawIdea, setRawIdea] = useState(sessionData.rawIdea || '');
  const [insights, setInsights] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = () => {
    if (!rawIdea.trim()) return;

    // Generate insights from the raw idea
    const generatedInsights = [
      `Core problem: ${rawIdea.split(' ').slice(0, 10).join(' ')}...`,
      'Market opportunity identified through user needs analysis',
      'Potential for scalable solution architecture',
      'Initial validation through problem-solution fit assessment'
    ];

    const phaseData = {
      rawIdea: rawIdea.trim(),
      ideationInsights: generatedInsights
    };

    onPhaseComplete(phaseData);
  };

  const addCustomInsight = (insight: string) => {
    if (insight.trim()) {
      setInsights(prev => [...prev, insight.trim()]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Phase Description */}
      <div className="bg-terracotta/5 border border-terracotta/20 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-ink mb-2">
          Creative Expansion Phase
        </h3>
        <p className="text-ink-light text-sm">
          Explore and expand your raw business idea through structured ideation.
          Describe your concept in detail and we'll help you uncover opportunities and variations.
        </p>
      </div>

      {/* Main Input */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink-light mb-2">
            Describe your business idea in detail *
          </label>
          <textarea
            data-testid="user-input"
            value={rawIdea}
            onChange={(e) => setRawIdea(e.target.value)}
            className="w-full p-4 border border-ink/15 rounded-lg focus:ring-terracotta focus:border-terracotta min-h-[120px]"
            placeholder="What problem does your idea solve? Who would use it? What inspired this concept? Be as specific as possible about your vision..."
            disabled={isLoading}
          />
          <div className="mt-2 text-sm text-slate-blue">
            Minimum 50 characters recommended for best analysis
          </div>
        </div>

        {/* Guided Questions */}
        <div className="bg-parchment rounded-lg p-4">
          <h4 className="font-medium text-ink mb-3">💡 Guided Questions</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-start space-x-2">
              <span className="text-terracotta font-bold">1.</span>
              <span>What specific problem are you solving?</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-terracotta font-bold">2.</span>
              <span>Who experiences this problem most acutely?</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-terracotta font-bold">3.</span>
              <span>What inspired this idea?</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-terracotta font-bold">4.</span>
              <span>How are people currently solving this problem?</span>
            </div>
          </div>
        </div>

        {/* Advanced Options */}
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-terracotta hover:text-terracotta-hover flex items-center"
          >
            {showAdvanced ? '▼' : '▶'} Advanced ideation options
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4 bg-parchment p-4 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-ink-light mb-2">
                  Additional insights or variations
                </label>
                <div className="space-y-2">
                  {insights.map((insight, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <span className="w-2 h-2 bg-terracotta/60 rounded-full"></span>
                      <span>{insight}</span>
                    </div>
                  ))}
                  <input
                    type="text"
                    placeholder="Add your own insight..."
                    className="w-full p-2 border border-ink/15 rounded text-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addCustomInsight(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="text-sm text-slate-blue">
          Phase 1 of 4 • ~8 minutes
        </div>

        <button
          data-testid="submit-response"
          onClick={handleSubmit}
          disabled={isLoading || rawIdea.trim().length < 10}
          className="px-6 py-2 bg-terracotta text-cream rounded-lg hover:bg-terracotta-hover disabled:bg-ink/15 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Analyzing...</span>
            </div>
          ) : (
            'Continue to Market Analysis'
          )}
        </button>
      </div>

      {/* Real-time Feedback */}
      {rawIdea.length > 0 && (
        <div className="bg-terracotta/5 border border-terracotta/20 rounded-lg p-3">
          <div className="text-sm text-ink">
            <strong>Quick feedback:</strong> {
              rawIdea.length < 50
                ? 'Add more detail for better analysis'
                : rawIdea.length < 100
                ? 'Good start! Consider adding more context'
                : 'Excellent detail level for comprehensive analysis'
            }
          </div>
        </div>
      )}
    </div>
  );
}