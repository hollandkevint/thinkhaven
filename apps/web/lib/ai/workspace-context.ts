import { CoachingContext, maryPersona, SubPersonaSessionState } from './mary-persona';
import { PathwayType } from '../bmad/types';

export interface WorkspaceData {
  id: string;
  name?: string;
  description?: string;
  industry?: string;
  goals?: string[];
  team_size?: number;
  stage?: 'idea' | 'prototype' | 'growth' | 'scale';
}

export interface BmadSessionData {
  id: string;
  pathway: `${PathwayType}`;
  current_phase: string;
  progress: number;
  context: Record<string, unknown>;
  insights?: string[];
  sub_persona_state?: SubPersonaSessionState | null;
}

export class WorkspaceContextBuilder {
  static async buildCoachingContext(
    workspaceId: string,
    userId?: string,
    currentSession?: BmadSessionData
  ): Promise<CoachingContext> {
    const context: CoachingContext = {
      workspaceId
    };

    try {
      // Build workspace context
      const workspaceData = await this.fetchWorkspaceData(workspaceId);
      if (workspaceData) {
        context.userProfile = {
          experienceLevel: this.inferExperienceLevel(workspaceData),
          industry: workspaceData.industry,
          role: this.inferRole(workspaceData)
        };

        context.sessionGoals = workspaceData.goals?.slice(0, 3); // Limit for context
      }

      // Add current BMad session context
      if (currentSession) {
        context.currentBmadSession = {
          pathway: currentSession.pathway,
          phase: currentSession.current_phase,
          progress: currentSession.progress
        };

        // Extract previous insights
        if (currentSession.insights) {
          context.previousInsights = currentSession.insights.slice(-5); // Last 5 insights
        }

        // Initialize or load sub-persona state
        if (currentSession.sub_persona_state) {
          // Use existing state from database
          context.subPersonaState = currentSession.sub_persona_state;
        } else {
          // Initialize new sub-persona state based on pathway
          context.subPersonaState = maryPersona.initializeSubPersonaState(currentSession.pathway);
        }
      }

      return context;
    } catch (error) {
      console.error('Failed to build coaching context:', error);
      return context; // Return minimal context
    }
  }

  private static async fetchWorkspaceData(workspaceId: string): Promise<WorkspaceData | null> {
    try {
      // This would integrate with the existing Supabase workspace queries
      // For now, return a mock structure that matches the expected interface
      
      // In real implementation, this would be:
      // const { data } = await supabase
      //   .from('workspaces')
      //   .select('*')
      //   .eq('id', workspaceId)
      //   .single();
      
      return {
        id: workspaceId,
        name: 'Strategic Thinking Workspace',
        industry: 'Technology',
        stage: 'growth',
        team_size: 5,
        goals: [
          'Develop go-to-market strategy',
          'Improve product-market fit',
          'Scale customer acquisition'
        ]
      };
    } catch (error) {
      console.error('Failed to fetch workspace data:', error);
      return null;
    }
  }

  private static inferExperienceLevel(workspace: WorkspaceData): 'beginner' | 'intermediate' | 'expert' {
    // Inference logic based on workspace characteristics
    if (workspace.stage === 'idea') return 'beginner';
    if (workspace.stage === 'scale' || workspace.team_size && workspace.team_size > 10) return 'expert';
    return 'intermediate';
  }

  private static inferRole(workspace: WorkspaceData): string {
    // Role inference based on workspace context
    if (workspace.team_size && workspace.team_size <= 2) return 'Founder/CEO';
    if (workspace.stage === 'growth' || workspace.stage === 'scale') return 'Strategic Leader';
    return 'Product Manager';
  }

  static extractQuickActionsFromContext(context: CoachingContext): string[] {
    // Generate contextual quick actions based on current state
    const actions: string[] = [];

    if (context.currentBmadSession) {
      const phase = context.currentBmadSession.phase;
      
      switch (phase) {
        case 'discovery':
          actions.push('Help me explore this deeper');
          actions.push('What questions should I ask?');
          actions.push('Challenge my assumptions');
          break;
        case 'analysis':
          actions.push('Validate this approach');
          actions.push('What are the risks?');
          actions.push('Compare alternatives');
          break;
        case 'planning':
          actions.push('Help me prioritize');
          actions.push('What\'s my next step?');
          actions.push('How do I measure success?');
          break;
        default:
          actions.push('Challenge this assumption');
          actions.push('Explore alternatives');
          actions.push('What am I missing?');
      }
    } else {
      // Default actions for general coaching
      actions.push('Challenge this assumption');
      actions.push('Explore alternative approaches');
      actions.push('Help me think this through');
      actions.push('What questions should I ask?');
    }

    return actions;
  }

  /**
   * Update sub-persona state after a user message
   * Returns the updated state for persistence to database
   */
  static updateSubPersonaState(
    context: CoachingContext,
    userMessage: string,
    recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>
  ): SubPersonaSessionState | null {
    if (!context.subPersonaState) {
      return null;
    }

    // Update state with new message context
    const updatedState = maryPersona.updateSessionState(
      context.subPersonaState,
      userMessage,
      recentMessages
    );

    // Update context in place
    context.subPersonaState = updatedState;

    return updatedState;
  }

  static generateContextSummary(context: CoachingContext): string {
    let summary = '';
    
    if (context.currentBmadSession) {
      const session = context.currentBmadSession;
      summary += `Working on ${session.pathway} pathway, currently in ${session.phase} phase (${session.progress}% complete). `;
    }
    
    if (context.userProfile?.industry) {
      summary += `Operating in ${context.userProfile.industry} industry. `;
    }
    
    if (context.sessionGoals && context.sessionGoals.length > 0) {
      summary += `Key goals: ${context.sessionGoals.join(', ')}.`;
    }
    
    return summary.trim();
  }
}

// Utility for maintaining conversation context across sessions
export class ConversationContextManager {
  private static readonly MAX_CONTEXT_TOKENS = 8000; // Conservative limit for context window
  
  static pruneConversationHistory(
    messages: Array<{role: 'user' | 'assistant', content: string}>,
    maxTokens: number = this.MAX_CONTEXT_TOKENS
  ): Array<{role: 'user' | 'assistant', content: string}> {
    // Simple token estimation: ~4 characters per token
    let totalEstimatedTokens = 0;
    const prunedMessages = [];
    
    // Process messages in reverse order (most recent first)
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      const estimatedTokens = Math.ceil(message.content.length / 4);
      
      if (totalEstimatedTokens + estimatedTokens <= maxTokens) {
        prunedMessages.unshift(message);
        totalEstimatedTokens += estimatedTokens;
      } else {
        break;
      }
    }
    
    return prunedMessages;
  }
  
  static generateConversationSummary(
    messages: Array<{role: 'user' | 'assistant', content: string}>
  ): string {
    // Generate a summary of key topics and insights from conversation
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    
    // Extract key topics (simple keyword extraction)
    const allContent = messages.map(m => m.content).join(' ');
    const keyTopics = this.extractKeyTopics(allContent);
    
    return `Previous conversation covered: ${keyTopics.join(', ')}. ${userMessages.length} user queries addressed with strategic guidance.`;
  }
  
  private static extractKeyTopics(content: string): string[] {
    // Simple keyword extraction for strategic topics
    const strategicKeywords = [
      'strategy', 'market', 'competition', 'revenue', 'growth', 'customer',
      'product', 'business model', 'pricing', 'expansion', 'risk', 'opportunity',
      'partnership', 'acquisition', 'funding', 'team', 'culture', 'innovation'
    ];
    
    const contentLower = content.toLowerCase();
    const foundTopics = strategicKeywords.filter(keyword => 
      contentLower.includes(keyword)
    );
    
    return foundTopics.slice(0, 5); // Return top 5 topics
  }
}