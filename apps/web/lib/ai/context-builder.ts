/**
 * Dynamic Context Builder for Mary's System Prompt
 *
 * Implements the context.md pattern from the agent-native guide.
 * Builds rich, dynamic context that makes Mary smarter based on:
 * - Session state (phase, progress, mode)
 * - User context (history, preferences, expertise)
 * - Available capabilities (tools Mary can use)
 */

import { createClient } from '@/lib/supabase/server';
import type { SubPersonaSessionState, CoachingContext } from './mary-persona';
import { MARY_TOOLS } from './tools';

// =============================================================================
// Types
// =============================================================================

export interface SessionContext {
  sessionId: string;
  pathway: string;
  currentPhase: string;
  progress: number;
  subPersonaMode: string;
  detectedUserState: string;
  exchangeCount: number;
  recentInsights: string[];
  killDecision?: {
    level: string;
    concerns: string[];
    explorationComplete: boolean;
  };
}

export interface UserContext {
  userId: string;
  name?: string;
  experienceLevel: 'beginner' | 'intermediate' | 'expert';
  industry?: string;
  role?: string;
  previousSessionCount: number;
  lastSessionSummary?: string;
  preferences?: {
    communicationStyle?: string;
    frameworkPreference?: string;
  };
}

export interface CapabilityContext {
  availableTools: ToolCapability[];
  currentPhaseActions: string[];
  documentTypes: string[];
}

export interface ToolCapability {
  name: string;
  description: string;
  whenToUse: string;
}

export interface DynamicContext {
  session?: SessionContext;
  user?: UserContext;
  capabilities?: CapabilityContext;
  timestamp: string;
}

// =============================================================================
// Context Builder Class
// =============================================================================

export class ContextBuilder {
  /**
   * Build complete session context from database
   */
  static async buildSessionContext(sessionId: string): Promise<SessionContext | null> {
    try {
      const supabase = await createClient();

      const { data: session, error } = await supabase
        .from('bmad_sessions')
        .select(`
          id,
          pathway,
          current_phase,
          overall_completion,
          sub_persona_state,
          created_at
        `)
        .eq('id', sessionId)
        .single();

      if (error || !session) {
        console.warn('[ContextBuilder] Could not load session:', error?.message);
        return null;
      }

      const subPersonaState = session.sub_persona_state as SubPersonaSessionState | null;

      // Get recent insights from phase outputs
      const { data: insights } = await supabase
        .from('bmad_phase_outputs')
        .select('output_data')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(5);

      const recentInsights = insights?.flatMap(i => {
        const data = i.output_data as Record<string, unknown>;
        if (Array.isArray(data?.insights)) {
          return data.insights as string[];
        }
        return [];
      }).slice(0, 5) || [];

      return {
        sessionId: session.id,
        pathway: session.pathway,
        currentPhase: session.current_phase,
        progress: session.overall_completion || 0,
        subPersonaMode: subPersonaState?.currentMode || 'inquisitive',
        detectedUserState: subPersonaState?.detectedUserState || 'neutral',
        exchangeCount: subPersonaState?.exchangeCount || 0,
        recentInsights,
        killDecision: subPersonaState?.killDecision ? {
          level: subPersonaState.killDecision.level,
          concerns: subPersonaState.killDecision.concerns,
          explorationComplete: subPersonaState.killDecision.explorationComplete,
        } : undefined,
      };
    } catch (error) {
      console.error('[ContextBuilder] Error building session context:', error);
      return null;
    }
  }

  /**
   * Build user context from database and session history
   */
  static async buildUserContext(userId: string): Promise<UserContext | null> {
    try {
      const supabase = await createClient();

      // Get user's workspace data
      const { data: workspace } = await supabase
        .from('user_workspace')
        .select('workspace_state')
        .eq('user_id', userId)
        .single();

      // Count previous sessions
      const { count: sessionCount } = await supabase
        .from('bmad_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed');

      // Get last completed session summary
      const { data: lastSession } = await supabase
        .from('bmad_sessions')
        .select('pathway, current_phase, overall_completion, created_at')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const workspaceState = workspace?.workspace_state as Record<string, unknown> | null;

      // Infer experience level from session count and workspace data
      let experienceLevel: UserContext['experienceLevel'] = 'beginner';
      if ((sessionCount || 0) >= 5) {
        experienceLevel = 'expert';
      } else if ((sessionCount || 0) >= 2) {
        experienceLevel = 'intermediate';
      }

      return {
        userId,
        name: workspaceState?.userName as string | undefined,
        experienceLevel,
        industry: workspaceState?.industry as string | undefined,
        role: workspaceState?.role as string | undefined,
        previousSessionCount: sessionCount || 0,
        lastSessionSummary: lastSession
          ? `${lastSession.pathway} session (${lastSession.overall_completion}% complete)`
          : undefined,
        preferences: workspaceState?.preferences as UserContext['preferences'],
      };
    } catch (error) {
      console.error('[ContextBuilder] Error building user context:', error);
      return null;
    }
  }

  /**
   * Build capability context - what Mary can do right now
   * This prepares for Phase 3 tool calling
   */
  static buildCapabilityContext(currentPhase?: string): CapabilityContext {
    // Tool-specific usage guidance (supplements the tool descriptions passed to the API)
    const toolGuidance: Record<string, string> = {
      read_session_state: 'Before making decisions, to understand current phase, progress, and session context',
      complete_phase: 'When the user has addressed all key aspects of the current phase',
      switch_persona_mode: 'When the user\'s emotional state suggests a different coaching approach',
      switch_speaker: 'When another board member\'s expertise is relevant to the current topic',
      recommend_action: 'After thorough exploration when you have enough information to assess viability',
      generate_document: 'When the user has provided enough input for a deliverable',
      update_lean_canvas: 'When conversation reveals information that should populate canvas cells',
      update_session_context: 'To persist insights, decisions, or progress markers for future reference',
    }

    // Generate capability list from MARY_TOOLS to prevent context drift
    const availableTools: ToolCapability[] = MARY_TOOLS.map(tool => ({
      name: tool.name,
      description: tool.description ?? tool.name,
      whenToUse: toolGuidance[tool.name] ?? 'When appropriate based on conversation context',
    }));

    // Phase-specific actions
    const phaseActions: Record<string, string[]> = {
      'discovery': [
        'Ask open-ended questions to understand the full context',
        'Surface underlying assumptions',
        'Explore the problem space before solutions',
      ],
      'ideation': [
        'Generate multiple solution approaches',
        'Challenge conventional thinking',
        'Encourage creative exploration',
      ],
      'analysis': [
        'Apply strategic frameworks',
        'Assess market fit and competition',
        'Identify risks and mitigation strategies',
      ],
      'validation': [
        'Stress-test assumptions with evidence',
        'Play devil\'s advocate on weak points',
        'Determine if idea should proceed, pivot, or stop',
      ],
      'planning': [
        'Prioritize next steps',
        'Create actionable milestones',
        'Define success metrics',
      ],
    };

    const documentTypes = [
      'Lean Canvas',
      'Business Model Canvas',
      'Product Requirements Document (PRD)',
      'Feature Brief',
      'Concept Document',
      'Competitive Analysis',
    ];

    return {
      availableTools,
      currentPhaseActions: phaseActions[currentPhase || 'discovery'] || phaseActions['discovery'],
      documentTypes,
    };
  }

  /**
   * Build the complete dynamic context for Mary's system prompt
   */
  static async buildDynamicContext(
    sessionId?: string,
    userId?: string,
    currentPhase?: string
  ): Promise<DynamicContext> {
    const [session, user] = await Promise.all([
      sessionId ? this.buildSessionContext(sessionId) : Promise.resolve(null),
      userId ? this.buildUserContext(userId) : Promise.resolve(null),
    ]);

    const capabilities = this.buildCapabilityContext(
      session?.currentPhase || currentPhase
    );

    return {
      session: session || undefined,
      user: user || undefined,
      capabilities,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Format dynamic context as markdown for injection into system prompt
   * Follows the context.md pattern from agent-native guide
   */
  static formatContextAsMarkdown(context: DynamicContext): string {
    const sections: string[] = [];

    // Session State Section
    if (context.session) {
      const s = context.session;
      sections.push(`## Session State
- **Pathway**: ${s.pathway}
- **Current Phase**: ${s.currentPhase} (${s.progress}% complete)
- **Sub-Persona Mode**: ${s.subPersonaMode}
- **Detected User State**: ${s.detectedUserState}
- **Exchange Count**: ${s.exchangeCount}${s.exchangeCount >= 10 ? ' (user can now steer coaching style)' : ''}`);

      if (s.recentInsights.length > 0) {
        sections.push(`
### Recent Insights
${s.recentInsights.map(i => `- ${i}`).join('\n')}`);
      }

      if (s.killDecision && s.killDecision.level !== 'none') {
        sections.push(`
### Viability Assessment
- **Escalation Level**: ${s.killDecision.level}
- **Exploration Complete**: ${s.killDecision.explorationComplete ? 'Yes' : 'Not yet'}
- **Concerns Noted**: ${s.killDecision.concerns.length > 0 ? s.killDecision.concerns.join(', ') : 'None yet'}`);
      }
    }

    // User Context Section
    if (context.user) {
      const u = context.user;
      sections.push(`## User Context
- **Experience Level**: ${u.experienceLevel}
- **Previous Sessions**: ${u.previousSessionCount}${u.industry ? `\n- **Industry**: ${u.industry}` : ''}${u.role ? `\n- **Role**: ${u.role}` : ''}${u.lastSessionSummary ? `\n- **Last Session**: ${u.lastSessionSummary}` : ''}`);
    }

    // Available Capabilities Section
    if (context.capabilities) {
      const c = context.capabilities;
      sections.push(`## Available Capabilities

### Current Phase Actions
${c.currentPhaseActions.map(a => `- ${a}`).join('\n')}

### Document Types You Can Generate
${c.documentTypes.map(d => `- ${d}`).join('\n')}`);
    }

    return sections.join('\n\n');
  }

  /**
   * Convenience method: Build and format context in one call
   */
  static async getFormattedContext(
    sessionId?: string,
    userId?: string,
    currentPhase?: string
  ): Promise<string> {
    const context = await this.buildDynamicContext(sessionId, userId, currentPhase);
    return this.formatContextAsMarkdown(context);
  }
}

// =============================================================================
// Integration Helper
// =============================================================================

/**
 * Enhance a CoachingContext with dynamic context from database
 * Use this in API routes to enrich the context before calling Claude
 */
export async function enrichCoachingContext(
  baseContext: CoachingContext,
  sessionId?: string,
  userId?: string
): Promise<CoachingContext> {
  const dynamicContext = await ContextBuilder.buildDynamicContext(
    sessionId,
    userId,
    baseContext.currentBmadSession?.phase
  );

  // Inject formatted context into the coaching context
  return {
    ...baseContext,
    // Add dynamic context as a string that can be appended to system prompt
    dynamicContextMarkdown: ContextBuilder.formatContextAsMarkdown(dynamicContext),
  };
}

// Note: dynamicContextMarkdown is defined in CoachingContext interface in mary-persona.ts
