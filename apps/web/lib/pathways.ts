/**
 * Pathway Definitions for ThinkHaven Session Types
 *
 * Each pathway represents a distinct session approach with its own
 * duration, message limits, and visual identity.
 */

import { Zap, Search, Users, Rocket } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type PathwayId =
  | 'quick-decision'
  | 'deep-analysis'
  | 'board-of-directors'
  | 'strategy-sprint';

export interface PathwayDefinition {
  id: PathwayId;
  title: string;
  description: string;
  duration: string;
  icon: string;
  bgColor: string;
  accentColor: string;
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
    messageLimit: 20,
    activatesBoard: false,
  },
];

export const PATHWAY_ICONS: Record<string, LucideIcon> = {
  Zap,
  Search,
  Users,
  Rocket,
};

export function getPathwayIcon(iconName: string): LucideIcon {
  return PATHWAY_ICONS[iconName] ?? Zap;
}

export function getPathway(id: string): PathwayDefinition | undefined {
  return PATHWAYS.find((p) => p.id === id);
}
