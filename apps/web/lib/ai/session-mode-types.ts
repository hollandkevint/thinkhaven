/**
 * Session Mode Types
 *
 * Two orthogonal mode dimensions:
 * - SessionMode: controls AI posture and output format
 * - Tone (SubPersonaMode): controls Mary's conversational style
 *
 * These are independent — 12 valid combinations.
 */

export type SessionMode = 'assessment' | 'stress-test' | 'executive-prep';

export interface SessionModeConfig {
  id: SessionMode;
  label: string;
  subtitle: string;
  description: string;
  accentColor: string;
  icon: string;
  /** Locked for guest users */
  guestLocked: boolean;
  /** Requires executive tier */
  requiresExecutive: boolean;
}

export const SESSION_MODES: SessionModeConfig[] = [
  {
    id: 'assessment',
    label: 'Assessment',
    subtitle: 'Structured evaluation',
    description: 'Walk through your decision systematically. Best for early-stage thinking.',
    accentColor: '#C4785C', // terracotta
    icon: '◉',
    guestLocked: false,
    requiresExecutive: false,
  },
  {
    id: 'stress-test',
    label: 'Stress-Test',
    subtitle: 'Pressure-test your logic',
    description: 'Push back on weak reasoning and surface blind spots. Best before high-stakes meetings.',
    accentColor: '#8B4D3B', // rust
    icon: '⚡',
    guestLocked: true,
    requiresExecutive: false,
  },
  {
    id: 'executive-prep',
    label: 'Executive Prep',
    subtitle: 'Board-ready thinking',
    description: 'Structured challenge + polished output artifacts. Premium tier.',
    accentColor: '#2C2416', // ink
    icon: '◆',
    guestLocked: true,
    requiresExecutive: true,
  },
];

export function getSessionModeConfig(mode: SessionMode): SessionModeConfig {
  return SESSION_MODES.find(m => m.id === mode) ?? SESSION_MODES[0];
}

/** Tone display labels — maps SubPersonaMode to user-facing names */
export const TONE_LABELS: Record<string, { label: string; color: string }> = {
  inquisitive: { label: 'Curious Explorer', color: '#D4A84B' },
  devil_advocate: { label: "Devil's Advocate", color: '#8B4D3B' },
  encouraging: { label: 'Supportive Coach', color: '#C9A9A6' },
  realistic: { label: 'Pragmatic Realist', color: '#6B7B8C' },
};

export const TONE_OPTIONS = Object.entries(TONE_LABELS).map(([id, config]) => ({
  id,
  ...config,
}));
