/**
 * Pathway Definitions for ThinkHaven Session Types
 *
 * Each pathway represents a distinct session approach with its own
 * duration, message limits, and visual identity.
 */

export interface PathwayDefinition {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon: string;
  bgColor: string;
  accentColor: string;
  phase: string;
  messageLimit: number;
  activatesBoard: boolean;
}

export const PATHWAYS: PathwayDefinition[] = [
  {
    id: 'quick-decision',
    title: 'Quick Decision',
    description:
      'Cut through noise with a focused, rapid-fire session. Best for straightforward choices.',
    duration: '5\u201310 min',
    icon: 'Zap',
    bgColor: 'bg-pathway-warm',
    accentColor: 'text-terracotta',
    phase: 'discovery',
    messageLimit: 10,
    activatesBoard: false,
  },
  {
    id: 'deep-analysis',
    title: 'Deep Analysis',
    description:
      'Methodically examine every angle. Ideal for high-stakes decisions where thorough exploration matters.',
    duration: '20\u201330 min',
    icon: 'Search',
    bgColor: 'bg-pathway-teal',
    accentColor: 'text-forest',
    phase: 'discovery',
    messageLimit: 30,
    activatesBoard: false,
  },
  {
    id: 'board-of-directors',
    title: 'Board of Directors',
    description:
      'Convene a panel of AI advisors with diverse expertise. Multiple perspectives on one decision.',
    duration: '30\u201345 min',
    icon: 'Users',
    bgColor: 'bg-pathway-slate',
    accentColor: 'text-slate-blue',
    phase: 'discovery',
    messageLimit: 40,
    activatesBoard: true,
  },
  {
    id: 'strategy-sprint',
    title: 'Strategy Sprint',
    description:
      'Time-boxed, action-oriented session. Walk away with a concrete plan and next steps.',
    duration: '15\u201320 min',
    icon: 'Rocket',
    bgColor: 'bg-pathway-sage',
    accentColor: 'text-rust',
    phase: 'discovery',
    messageLimit: 20,
    activatesBoard: false,
  },
];

export function getPathway(id: string): PathwayDefinition | undefined {
  return PATHWAYS.find((p) => p.id === id);
}
