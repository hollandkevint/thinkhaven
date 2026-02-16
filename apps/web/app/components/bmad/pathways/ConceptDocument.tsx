'use client';

import React from 'react';
import { BusinessConcept, MarketOpportunity, TargetAudience } from '@/lib/bmad/types';

interface ConceptDocumentProps {
  concept: BusinessConcept;
  onExport?: () => void;
  showExportButton?: boolean;
}

export default function ConceptDocument({
  concept,
  onExport,
  showExportButton = true
}: ConceptDocumentProps) {
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 space-y-8">
      {/* Header */}
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold text-ink mb-2">
          {concept.title}
        </h1>
        <p className="text-lg text-ink-light">
          Business Concept Document
        </p>
        {showExportButton && (
          <button
            onClick={onExport}
            className="mt-4 px-4 py-2 bg-terracotta text-white rounded-md hover:bg-terracotta-hover transition-colors"
          >
            Export Document
          </button>
        )}
      </div>

      {/* Executive Summary */}
      <section>
        <h2 className="text-2xl font-semibold text-ink mb-4">
          Executive Summary
        </h2>
        <p className="text-ink-light leading-relaxed">
          {concept.executiveSummary}
        </p>
      </section>

      {/* Problem & Solution */}
      <div className="grid md:grid-cols-2 gap-8">
        <section>
          <h2 className="text-2xl font-semibold text-ink mb-4">
            Problem Statement
          </h2>
          <p className="text-ink-light leading-relaxed">
            {concept.problemStatement}
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-ink mb-4">
            Solution
          </h2>
          <p className="text-ink-light leading-relaxed">
            {concept.solution}
          </p>
        </section>
      </div>

      {/* Unique Value Proposition */}
      <section className="bg-terracotta/5 rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-ink mb-4">
          Unique Value Proposition
        </h2>
        <p className="text-lg text-ink font-medium">
          {concept.uniqueValueProposition}
        </p>
      </section>

      {/* Target Market */}
      <section>
        <h2 className="text-2xl font-semibold text-ink mb-4">
          Target Market
        </h2>
        <TargetMarketSection targetMarket={concept.targetMarket} />
      </section>

      {/* Market Opportunities */}
      <section>
        <h2 className="text-2xl font-semibold text-ink mb-4">
          Market Opportunities
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {concept.marketOpportunity.map((opportunity, index) => (
            <MarketOpportunityCard key={index} opportunity={opportunity} />
          ))}
        </div>
      </section>

      {/* Business Model */}
      <section>
        <h2 className="text-2xl font-semibold text-ink mb-4">
          Business Model
        </h2>
        <BusinessModelCanvas businessModel={concept.businessModel} />
      </section>

      {/* Competitive Advantage */}
      <section className="bg-forest/5 rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-ink mb-4">
          Competitive Advantage
        </h2>
        <p className="text-ink leading-relaxed">
          {concept.competitiveAdvantage}
        </p>
      </section>

      {/* Next Steps & Action Plan */}
      <section>
        <h2 className="text-2xl font-semibold text-ink mb-4">
          Next Steps
        </h2>
        <ol className="list-decimal list-inside space-y-2">
          {concept.nextSteps.map((step, index) => (
            <li key={index} className="text-ink-light">
              {step}
            </li>
          ))}
        </ol>
      </section>

      {/* Risks & Success Metrics */}
      <div className="grid md:grid-cols-2 gap-8">
        <section>
          <h2 className="text-2xl font-semibold text-ink mb-4">
            Key Risks
          </h2>
          <ul className="list-disc list-inside space-y-2">
            {concept.risks.map((risk, index) => (
              <li key={index} className="text-ink-light">
                {risk}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-ink mb-4">
            Success Metrics
          </h2>
          <ul className="list-disc list-inside space-y-2">
            {concept.successMetrics.map((metric, index) => (
              <li key={index} className="text-ink-light">
                {metric}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

// Sub-components

function TargetMarketSection({ targetMarket }: { targetMarket: TargetAudience }) {
  return (
    <div className="bg-parchment rounded-lg p-6 space-y-4">
      <div>
        <h3 className="font-semibold text-ink mb-2">Primary Segment</h3>
        <p className="text-ink-light">{targetMarket.primarySegment}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-ink mb-2">Demographics</h4>
          <ul className="list-disc list-inside text-sm text-ink-light space-y-1">
            {targetMarket.demographics.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-medium text-ink mb-2">Psychographics</h4>
          <ul className="list-disc list-inside text-sm text-ink-light space-y-1">
            {targetMarket.psychographics.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-ink mb-2">Pain Points</h4>
          <ul className="list-disc list-inside text-sm text-ink-light space-y-1">
            {targetMarket.painPoints.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-medium text-ink mb-2">Desired Outcomes</h4>
          <ul className="list-disc list-inside text-sm text-ink-light space-y-1">
            {targetMarket.desiredOutcomes.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function MarketOpportunityCard({ opportunity }: { opportunity: MarketOpportunity }) {
  const getGrowthColor = (growth: string) => {
    switch (growth) {
      case 'high': return 'text-forest bg-forest/10';
      case 'medium': return 'text-mustard bg-mustard/10';
      case 'low': return 'text-rust bg-rust/10';
      default: return 'text-ink-light bg-parchment';
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-start">
        <h4 className="font-medium text-ink">{opportunity.description}</h4>
        <span className={`px-2 py-1 rounded text-xs font-medium ${getGrowthColor(opportunity.growthPotential)}`}>
          {opportunity.growthPotential} growth
        </span>
      </div>

      <div className="text-sm text-ink-light">
        <p><span className="font-medium">Market Size:</span> {opportunity.marketSize}</p>
        <p><span className="font-medium">Confidence:</span> {Math.round(opportunity.confidence * 100)}%</p>
      </div>

      {opportunity.insights.length > 0 && (
        <div>
          <h5 className="text-sm font-medium text-ink mb-1">Key Insights</h5>
          <ul className="text-xs text-ink-light space-y-1">
            {opportunity.insights.map((insight, index) => (
              <li key={index}>• {insight}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function BusinessModelCanvas({ businessModel }: { businessModel: any }) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="space-y-4">
        <ModelSection
          title="Revenue Streams"
          items={businessModel.revenueStreams || []}
          bgColor="bg-forest/5"
        />
        <ModelSection
          title="Cost Structure"
          items={businessModel.costStructure || []}
          bgColor="bg-rust/5"
        />
      </div>

      <div className="space-y-4">
        <ModelSection
          title="Key Activities"
          items={businessModel.keyActivities || []}
          bgColor="bg-terracotta/5"
        />
        <ModelSection
          title="Key Resources"
          items={businessModel.keyResources || []}
          bgColor="bg-terracotta/5"
        />
      </div>

      <div className="space-y-4">
        <ModelSection
          title="Channels"
          items={businessModel.channels || []}
          bgColor="bg-mustard/5"
        />
        <ModelSection
          title="Customer Relationships"
          items={businessModel.customerRelationships || []}
          bgColor="bg-pink-50"
        />
      </div>
    </div>
  );
}

function ModelSection({
  title,
  items,
  bgColor
}: {
  title: string;
  items: string[];
  bgColor: string;
}) {
  return (
    <div className={`${bgColor} rounded-lg p-4`}>
      <h4 className="font-medium text-ink mb-2">{title}</h4>
      <ul className="text-sm text-ink-light space-y-1">
        {items.map((item, index) => (
          <li key={index}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}