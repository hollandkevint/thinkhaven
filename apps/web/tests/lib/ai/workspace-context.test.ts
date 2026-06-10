import { WorkspaceContextBuilder, ConversationContextManager } from '@/lib/ai/workspace-context';
import { type CoachingContext } from '@/lib/ai/mary-persona';

describe('WorkspaceContextBuilder', () => {
  describe('buildCoachingContext', () => {
    it('should build basic context with workspace ID', async () => {
      const context = await WorkspaceContextBuilder.buildCoachingContext('workspace-123');

      expect(context.workspaceId).toBe('workspace-123');
      expect(context).toHaveProperty('userProfile');
      expect(context).toHaveProperty('sessionGoals');
    });

    it('should include BMad session context when provided', async () => {
      const sessionData = {
        id: 'session-123',
        pathway: 'business-model' as const,
        current_phase: 'analysis',
        progress: 60,
        context: {},
        insights: ['Key insight 1', 'Key insight 2']
      };

      const context = await WorkspaceContextBuilder.buildCoachingContext(
        'workspace-123',
        'user-123',
        sessionData
      );

      expect(context.currentBmadSession).toEqual({
        pathway: 'business-model',
        phase: 'analysis',
        progress: 60
      });
      expect(context.previousInsights).toEqual(['Key insight 1', 'Key insight 2']);
    });

    it('should limit previous insights to 5 items', async () => {
      const sessionData = {
        id: 'session-123',
        pathway: 'new-idea' as const,
        current_phase: 'discovery',
        progress: 30,
        context: {},
        insights: ['1', '2', '3', '4', '5', '6', '7', '8']
      };

      const context = await WorkspaceContextBuilder.buildCoachingContext(
        'workspace-123',
        undefined,
        sessionData
      );

      expect(context.previousInsights).toHaveLength(5);
      expect(context.previousInsights).toEqual(['4', '5', '6', '7', '8']); // Last 5
    });

    it('should handle errors gracefully', async () => {
      // Mock a failure in fetching workspace data
      const context = await WorkspaceContextBuilder.buildCoachingContext('invalid-workspace');

      expect(context.workspaceId).toBe('invalid-workspace');
      expect(context).toBeDefined(); // Should still return basic context
    });
  });

  describe('extractQuickActionsFromContext', () => {
    it('should return discovery phase actions', () => {
      const context: CoachingContext = {
        currentBmadSession: {
          pathway: 'new-idea',
          phase: 'discovery',
          progress: 20
        }
      };

      const actions = WorkspaceContextBuilder.extractQuickActionsFromContext(context);

      expect(actions).toContain('Help me explore this deeper');
      expect(actions).toContain('Challenge my assumptions');
      expect(actions).toContain('What questions should I ask?');
    });

    it('should return analysis phase actions', () => {
      const context: CoachingContext = {
        currentBmadSession: {
          pathway: 'business-model',
          phase: 'analysis',
          progress: 50
        }
      };

      const actions = WorkspaceContextBuilder.extractQuickActionsFromContext(context);

      expect(actions).toContain('Validate this approach');
      expect(actions).toContain('What are the risks?');
      expect(actions).toContain('Compare alternatives');
    });

    it('should return planning phase actions', () => {
      const context: CoachingContext = {
        currentBmadSession: {
          pathway: 'strategic-optimization',
          phase: 'planning',
          progress: 80
        }
      };

      const actions = WorkspaceContextBuilder.extractQuickActionsFromContext(context);

      expect(actions).toContain('Help me prioritize');
      expect(actions).toContain('What\'s my next step?');
      expect(actions).toContain('How do I measure success?');
    });

    it('should return plan-grill actions from the same set Mary exposes', () => {
      const context: CoachingContext = {
        currentBmadSession: {
          pathway: 'plan-grill',
          phase: 'intake',
          progress: 0
        }
      };

      const actions = WorkspaceContextBuilder.extractQuickActionsFromContext(context);

      expect(actions).toEqual([
        'Grill this plan',
        'Sharpen the terminology',
        'Find weak assumptions',
        'Create a decision record'
      ]);
    });

    it('should return default actions when no BMad session', () => {
      const context: CoachingContext = {
        workspaceId: 'workspace-123'
      };

      const actions = WorkspaceContextBuilder.extractQuickActionsFromContext(context);

      expect(actions).toContain('Challenge this assumption');
      expect(actions).toContain('Explore alternative approaches');
      expect(actions).toContain('Help me think this through');
    });
  });

  describe('generateContextSummary', () => {
    it('should generate summary with BMad session info', () => {
      const context: CoachingContext = {
        currentBmadSession: {
          pathway: 'business-model',
          phase: 'analysis',
          progress: 65
        },
        userProfile: {
          experienceLevel: 'intermediate',
          industry: 'Healthcare'
        },
        sessionGoals: ['Improve revenue model', 'Expand market reach']
      };

      const summary = WorkspaceContextBuilder.generateContextSummary(context);

      expect(summary).toContain('business-model');
      expect(summary).toContain('analysis');
      expect(summary).toContain('65%');
      expect(summary).toContain('Healthcare');
      expect(summary).toContain('Improve revenue model');
    });

    it('should handle minimal context gracefully', () => {
      const context: CoachingContext = {
        workspaceId: 'workspace-123'
      };

      const summary = WorkspaceContextBuilder.generateContextSummary(context);

      expect(summary).toBe('');
    });
  });
});

describe('ConversationContextManager', () => {
  const mockMessages = [
    { role: 'user' as const, content: 'First message with some content' },
    { role: 'assistant' as const, content: 'First response with detailed analysis of the strategic situation' },
    { role: 'user' as const, content: 'Second message asking for more details about market strategy' },
    { role: 'assistant' as const, content: 'Second response providing comprehensive market analysis' },
    { role: 'user' as const, content: 'Third message' },
    { role: 'assistant' as const, content: 'Third response' }
  ];

  describe('pruneConversationHistory', () => {
    it('should keep all messages when under token limit', () => {
      const pruned = ConversationContextManager.pruneConversationHistory(
        mockMessages,
        10000 // Very high limit
      );

      expect(pruned).toEqual(mockMessages);
    });

    it('should prune messages when over token limit', () => {
      // The six mock messages estimate to ~63 tokens total (4 chars/token),
      // so the limit must sit below that for pruning to engage.
      const pruned = ConversationContextManager.pruneConversationHistory(
        mockMessages,
        30
      );

      expect(pruned.length).toBeLessThan(mockMessages.length);
      expect(pruned[pruned.length - 1]).toEqual(mockMessages[mockMessages.length - 1]); // Most recent kept
    });

    it('should maintain conversation order after pruning', () => {
      const pruned = ConversationContextManager.pruneConversationHistory(
        mockMessages,
        200
      );

      // Check that the order is maintained
      for (let i = 1; i < pruned.length; i++) {
        const originalIndex = mockMessages.indexOf(pruned[i]);
        const previousOriginalIndex = mockMessages.indexOf(pruned[i - 1]);
        expect(originalIndex).toBeGreaterThan(previousOriginalIndex);
      }
    });

    it('should return empty array for zero token limit', () => {
      const pruned = ConversationContextManager.pruneConversationHistory(
        mockMessages,
        0
      );

      expect(pruned).toEqual([]);
    });
  });

  describe('generateConversationSummary', () => {
    it('should generate summary with message counts', () => {
      const summary = ConversationContextManager.generateConversationSummary(mockMessages);

      expect(summary).toContain('3 user queries'); // 3 user messages
      expect(summary).toContain('strategic guidance');
    });

    it('should extract key topics from conversation', () => {
      const messagesWithTopics = [
        { role: 'user' as const, content: 'Tell me about market strategy and competition' },
        { role: 'assistant' as const, content: 'Here is analysis of your competitive strategy and revenue model' },
        { role: 'user' as const, content: 'What about customer acquisition and growth?' }
      ];

      const summary = ConversationContextManager.generateConversationSummary(messagesWithTopics);

      expect(summary).toContain('market');
      expect(summary).toContain('strategy');
    });

    it('should handle empty conversation', () => {
      const summary = ConversationContextManager.generateConversationSummary([]);

      expect(summary).toContain('0 user queries');
    });
  });

  describe('extractKeyTopics', () => {
    it('should identify strategic keywords', () => {
      // Access private method for testing
      const extractKeyTopics = (ConversationContextManager as any).extractKeyTopics;
      
      // Keyword matching is literal substring — 'competition' must appear verbatim.
      const content = 'We need to discuss market strategy, the competition, and revenue growth.';
      const topics = extractKeyTopics(content);

      expect(topics).toContain('market');
      expect(topics).toContain('strategy');
      expect(topics).toContain('competition');
      expect(topics).toContain('revenue');
      expect(topics).toContain('growth');
    });

    it('should limit topics to 5 items', () => {
      const extractKeyTopics = (ConversationContextManager as any).extractKeyTopics;
      
      const content = 'market strategy competition revenue growth customer product business pricing expansion risk opportunity partnership';
      const topics = extractKeyTopics(content);

      expect(topics.length).toBeLessThanOrEqual(5);
    });
  });
});
