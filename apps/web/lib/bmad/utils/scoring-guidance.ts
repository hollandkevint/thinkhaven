export interface ScoringGuidance {
  title: string;
  scale: string;
  examples: Array<{
    score: number;
    label: string;
    description: string;
  }>;
}

export const EFFORT_SCORING_GUIDANCE: ScoringGuidance = {
  title: "Development Effort Assessment",
  scale: "Rate the development complexity and time required (1-10)",
  examples: [
    {
      score: 1,
      label: "Trivial",
      description: "Few hours of work, simple configuration changes"
    },
    {
      score: 3,
      label: "Simple",
      description: "1-2 days, straightforward implementation"
    },
    {
      score: 5,
      label: "Moderate",
      description: "1-2 weeks, some complexity or new integrations"
    },
    {
      score: 7,
      label: "Complex",
      description: "1-2 months, significant engineering effort"
    },
    {
      score: 10,
      label: "Massive",
      description: "Multiple quarters, major system changes"
    }
  ]
};

export const IMPACT_SCORING_GUIDANCE: ScoringGuidance = {
  title: "User & Business Impact Assessment",
  scale: "Rate the potential user and business value (1-10)",
  examples: [
    {
      score: 1,
      label: "Minimal",
      description: "Minor improvement, affects few users"
    },
    {
      score: 3,
      label: "Modest",
      description: "Noticeable improvement for specific user group"
    },
    {
      score: 5,
      label: "Significant",
      description: "Clear user benefit, measurable business impact"
    },
    {
      score: 7,
      label: "Major",
      description: "High user value, strong business outcomes"
    },
    {
      score: 10,
      label: "Game-changing",
      description: "Transformative impact, competitive advantage"
    }
  ]
};

export const QUADRANT_GUIDANCE = {
  quickWins: {
    label: "Quick Wins",
    description: "High impact, low effort - prioritize immediately",
    color: "green",
    recommendation: "Do these first! Maximum value for minimal investment."
  },
  majorProjects: {
    label: "Major Projects",
    description: "High impact, high effort - plan carefully",
    color: "blue",
    recommendation: "Important initiatives that need proper planning and resources."
  },
  fillIns: {
    label: "Fill-ins",
    description: "Low impact, low effort - do when you have time",
    color: "yellow",
    recommendation: "Nice-to-have improvements for when capacity allows."
  },
  timeWasters: {
    label: "Time Wasters",
    description: "Low impact, high effort - avoid or deprioritize",
    color: "red",
    recommendation: "Question whether these are worth doing at all."
  }
};

export function getScoreLabel(score: number): string {
  if (score <= 2) return "Very Low";
  if (score <= 4) return "Low";
  if (score <= 6) return "Medium";
  if (score <= 8) return "High";
  return "Very High";
}

export function getScoreColor(score: number): string {
  if (score <= 2) return "text-rust";
  if (score <= 4) return "text-mustard";
  if (score <= 6) return "text-mustard";
  if (score <= 8) return "text-slate-blue";
  return "text-forest";
}