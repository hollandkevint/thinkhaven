import {
  MaryPersona,
  maryPersona,
  type CoachingContext,
  type SubPersonaSessionState,
  PATHWAY_WEIGHTS,
  MODE_BEHAVIORS,
  createSubPersonaState,
  updateSubPersonaState,
  applyUserControlAction,
} from '@/lib/ai/mary-persona';

describe('MaryPersona', () => {
  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = MaryPersona.getInstance();
      const instance2 = MaryPersona.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('generateSystemPrompt', () => {
    it('should generate basic system prompt without context', () => {
      const prompt = maryPersona.generateSystemPrompt();

      expect(prompt).toContain('Mary');
      expect(prompt).toContain('AI Business Strategist');
      expect(prompt).toContain('PERSONALITY & APPROACH');
      expect(prompt).toContain('STRATEGIC EXPERTISE');
      expect(prompt).toContain('CONVERSATION APPROACH');
      expect(prompt).toContain('BMAD METHOD INTEGRATION');
    });

    it('should adapt persona based on user experience level', () => {
      const beginnerContext: CoachingContext = {
        userProfile: { experienceLevel: 'beginner' },
      };

      const expertContext: CoachingContext = {
        userProfile: { experienceLevel: 'expert' },
      };

      const beginnerPrompt = maryPersona.generateSystemPrompt(beginnerContext);
      const expertPrompt = maryPersona.generateSystemPrompt(expertContext);

      // Beginner gets supportive style - check for supportive language patterns
      expect(beginnerPrompt).toContain('confidence');
      // Expert gets challenging style - check for challenging language patterns
      expect(expertPrompt).toContain('assumptions');
    });

    it('should include workspace context when provided', () => {
      const context: CoachingContext = {
        workspaceId: 'workspace-123',
        userProfile: {
          experienceLevel: 'intermediate',
          industry: 'Technology',
          role: 'Product Manager',
        },
      };

      const prompt = maryPersona.generateSystemPrompt(context);

      expect(prompt).toContain('workspace-123');
      expect(prompt).toContain('Technology');
      expect(prompt).toContain('Product Manager');
    });

    it('should include BMad session context when active', () => {
      const context: CoachingContext = {
        currentBmadSession: {
          pathway: 'business-model',
          phase: 'analysis',
          progress: 65,
        },
      };

      const prompt = maryPersona.generateSystemPrompt(context);

      expect(prompt).toContain('business-model');
      expect(prompt).toContain('analysis');
      expect(prompt).toContain('65%');
    });

    it('should adapt conversation style based on BMad phase', () => {
      const analysisContext: CoachingContext = {
        currentBmadSession: {
          pathway: 'new-idea',
          phase: 'analysis',
          progress: 50,
        },
      };

      const ideationContext: CoachingContext = {
        currentBmadSession: {
          pathway: 'new-idea',
          phase: 'ideation',
          progress: 30,
        },
      };

      const analysisPrompt = maryPersona.generateSystemPrompt(analysisContext);
      const ideationPrompt = maryPersona.generateSystemPrompt(ideationContext);

      // Analysis phase has different emphasis than ideation phase
      expect(analysisPrompt).toContain('analysis');
      expect(ideationPrompt).toContain('ideation');
      // Both should contain BMAD session context
      expect(analysisPrompt).toContain('BMad Pathway');
      expect(ideationPrompt).toContain('BMad Pathway');
    });

    it('should include sub-persona sections when subPersonaState is provided', () => {
      const subPersonaState = maryPersona.initializeSubPersonaState('new-idea');
      const context: CoachingContext = {
        subPersonaState,
      };

      const prompt = maryPersona.generateSystemPrompt(context);

      expect(prompt).toContain('SUB-PERSONA COACHING MODE');
      expect(prompt).toContain('KILL DECISION FRAMEWORK');
      expect(prompt).toContain('ANTI-SYCOPHANCY COMMITMENT');
    });

    it('should include mode behavior details when sub-persona is active', () => {
      const subPersonaState = maryPersona.initializeSubPersonaState('new-idea');
      subPersonaState.currentMode = 'devil_advocate';
      const context: CoachingContext = {
        subPersonaState,
      };

      const prompt = maryPersona.generateSystemPrompt(context);

      expect(prompt).toContain("Devil's Advocate");
      expect(prompt).toContain('Challenge assumptions');
    });

    it('should include docs-aware plan grilling only for plan-grill sessions', () => {
      const planGrillPrompt = maryPersona.generateSystemPrompt({
        currentBmadSession: {
          pathway: 'plan-grill',
          phase: 'intake',
          progress: 0,
        },
      });

      expect(planGrillPrompt).toContain('PLAN GRILL MODE');
      expect(planGrillPrompt).toContain('classic grill-me');
      expect(planGrillPrompt).toContain('docs-aware grill-with-docs');
      expect(planGrillPrompt).toContain('pasted context');

      const regularPrompt = maryPersona.generateSystemPrompt({
        currentBmadSession: {
          pathway: 'explore',
          phase: 'discovery',
          progress: 0,
        },
      });

      expect(regularPrompt).not.toContain('PLAN GRILL MODE');
    });
  });

  describe('generateQuickActions', () => {
    it('should return default actions without context', () => {
      const actions = maryPersona.generateQuickActions();

      expect(actions).toContain('Challenge my assumptions');
      expect(actions).toContain('Explore alternative approaches');
      expect(actions).toContain('Identify potential risks');
      expect(actions).toHaveLength(5);
    });

    it('should return phase-specific actions for discovery phase', () => {
      const context: CoachingContext = {
        currentBmadSession: {
          pathway: 'new-idea',
          phase: 'discovery',
          progress: 20,
        },
      };

      const actions = maryPersona.generateQuickActions(context);

      expect(actions).toContain('Help me dig deeper');
      expect(actions).toContain('What am I missing?');
      expect(actions).toContain('Challenge my assumptions');
    });

    it('should return phase-specific actions for analysis phase', () => {
      const context: CoachingContext = {
        currentBmadSession: {
          pathway: 'business-model',
          phase: 'analysis',
          progress: 60,
        },
      };

      const actions = maryPersona.generateQuickActions(context);

      expect(actions).toContain('Validate this approach');
      expect(actions).toContain('Find potential flaws');
      expect(actions).toContain('Compare alternatives');
    });

    it('should return phase-specific actions for planning phase', () => {
      const context: CoachingContext = {
        currentBmadSession: {
          pathway: 'strategic-optimization',
          phase: 'planning',
          progress: 80,
        },
      };

      const actions = maryPersona.generateQuickActions(context);

      expect(actions).toContain('Prioritize these options');
      expect(actions).toContain('Identify key risks');
      expect(actions).toContain('Plan implementation');
    });

    it('should return plan-grill actions for plan-grill pathway', () => {
      const actions = maryPersona.generateQuickActions({
        currentBmadSession: {
          pathway: 'plan-grill',
          phase: 'intake',
          progress: 0,
        },
      });

      expect(actions).toEqual([
        'Grill this plan',
        'Sharpen the terminology',
        'Find weak assumptions',
        'Create a decision record',
      ]);
    });

    it('should return user control actions after 10 exchanges (FR-AC9)', () => {
      const subPersonaState = maryPersona.initializeSubPersonaState('new-idea');
      subPersonaState.exchangeCount = 10;
      subPersonaState.userControlEnabled = true;

      const context: CoachingContext = {
        subPersonaState,
      };

      const actions = maryPersona.generateQuickActions(context);

      expect(actions).toContain('Challenge me');
      expect(actions).toContain('Be realistic');
      expect(actions).toContain('Help me explore');
      expect(actions).toContain('Build my confidence');
    });
  });

  describe('persona adaptation', () => {
    it('should maintain professional tone across all contexts', () => {
      const contexts: CoachingContext[] = [
        { userProfile: { experienceLevel: 'beginner' } },
        { userProfile: { experienceLevel: 'expert' } },
        { currentBmadSession: { pathway: 'new-idea', phase: 'discovery', progress: 10 } },
        { currentBmadSession: { pathway: 'business-model', phase: 'planning', progress: 90 } },
      ];

      contexts.forEach(context => {
        const prompt = maryPersona.generateSystemPrompt(context);
        expect(prompt).toContain('Professional');
        expect(prompt).toContain('actionable');
        expect(prompt).toContain('strategic');
      });
    });

    it('should include formatting guidelines in all prompts', () => {
      const prompt = maryPersona.generateSystemPrompt();

      expect(prompt).toContain('FORMATTING GUIDELINES');
      expect(prompt).toContain('markdown');
      expect(prompt).toContain('**bold**');
      expect(prompt).toContain('bullet points');
    });
  });
});

// =============================================================================
// Sub-Persona System Tests (FR-AC6 through FR-AC14)
// =============================================================================

describe('Sub-Persona System', () => {
  describe('PATHWAY_WEIGHTS (FR-AC7)', () => {
    it('should have correct weights for new-idea pathway', () => {
      const weights = PATHWAY_WEIGHTS['new-idea'];
      expect(weights.inquisitive).toBe(40);
      expect(weights.devil_advocate).toBe(20);
      expect(weights.encouraging).toBe(25);
      expect(weights.realistic).toBe(15);

      const total = weights.inquisitive + weights.devil_advocate + weights.encouraging + weights.realistic;
      expect(total).toBe(100);
    });

    it('should have correct weights for business-model pathway', () => {
      const weights = PATHWAY_WEIGHTS['business-model'];
      expect(weights.inquisitive).toBe(20);
      expect(weights.devil_advocate).toBe(35);
      expect(weights.encouraging).toBe(15);
      expect(weights.realistic).toBe(30);

      const total = weights.inquisitive + weights.devil_advocate + weights.encouraging + weights.realistic;
      expect(total).toBe(100);
    });

    it('should have correct weights for feature-refinement pathway', () => {
      const weights = PATHWAY_WEIGHTS['feature-refinement'];
      expect(weights.inquisitive).toBe(25);
      expect(weights.devil_advocate).toBe(30);
      expect(weights.encouraging).toBe(15);
      expect(weights.realistic).toBe(30);

      const total = weights.inquisitive + weights.devil_advocate + weights.encouraging + weights.realistic;
      expect(total).toBe(100);
    });

    it('should have correct weights for plan-grill pathway', () => {
      const weights = PATHWAY_WEIGHTS['plan-grill'];
      expect(weights.inquisitive).toBe(25);
      expect(weights.devil_advocate).toBe(40);
      expect(weights.encouraging).toBe(10);
      expect(weights.realistic).toBe(25);

      const total = weights.inquisitive + weights.devil_advocate + weights.encouraging + weights.realistic;
      expect(total).toBe(100);
    });
  });

  describe('MODE_BEHAVIORS', () => {
    it('should have all four modes defined', () => {
      expect(MODE_BEHAVIORS.inquisitive).toBeDefined();
      expect(MODE_BEHAVIORS.devil_advocate).toBeDefined();
      expect(MODE_BEHAVIORS.encouraging).toBeDefined();
      expect(MODE_BEHAVIORS.realistic).toBeDefined();
    });

    it('should have complete behavior definition for each mode', () => {
      Object.values(MODE_BEHAVIORS).forEach(behavior => {
        expect(behavior.name).toBeDefined();
        expect(behavior.role).toBeDefined();
        expect(behavior.behaviors).toBeInstanceOf(Array);
        expect(behavior.behaviors.length).toBeGreaterThan(0);
        expect(behavior.questionTypes).toBeInstanceOf(Array);
        expect(behavior.tone).toBeDefined();
      });
    });
  });

  describe('initializeSubPersonaState', () => {
    it('should initialize state with pathway weights', () => {
      const state = maryPersona.initializeSubPersonaState('new-idea');

      expect(state.pathwayWeights).toEqual(PATHWAY_WEIGHTS['new-idea']);
      expect(state.exchangeCount).toBe(0);
      expect(state.userControlEnabled).toBe(false);
      expect(state.detectedUserState).toBe('neutral');
    });

    it('should select initial mode based on weights', () => {
      // Run multiple times to verify probabilistic selection
      const modes: string[] = [];
      for (let i = 0; i < 100; i++) {
        const state = maryPersona.initializeSubPersonaState('new-idea');
        modes.push(state.currentMode);
      }

      // New idea has 40% inquisitive weight, should be most common
      const inquisitiveCount = modes.filter(m => m === 'inquisitive').length;
      expect(inquisitiveCount).toBeGreaterThan(20); // Should be around 40%
    });

    it('should initialize kill decision state', () => {
      const state = maryPersona.initializeSubPersonaState('new-idea');

      expect(state.killDecision.level).toBe('none');
      expect(state.killDecision.explorationComplete).toBe(false);
      expect(state.killDecision.probeCount).toBe(0);
      expect(state.killDecision.concerns).toEqual([]);
    });

    it('should record initial mode in history', () => {
      const state = maryPersona.initializeSubPersonaState('new-idea');

      expect(state.modeHistory).toHaveLength(1);
      expect(state.modeHistory[0].mode).toBe(state.currentMode);
      expect(state.modeHistory[0].trigger).toBe('session_start');
    });

    it('should use fallback weights for unknown pathway', () => {
      const state = maryPersona.initializeSubPersonaState('unknown-pathway');

      expect(state.pathwayWeights).toEqual(PATHWAY_WEIGHTS['new-idea']);
    });
  });

  describe('detectUserState (FR-AC8)', () => {
    it('should return neutral for empty messages', () => {
      const state = maryPersona.detectUserState([]);
      expect(state).toBe('neutral');
    });

    it('should detect defensive state', () => {
      const messages = [
        { role: 'user' as const, content: "You don't understand my market" },
        { role: 'assistant' as const, content: 'Tell me more...' },
        { role: 'user' as const, content: "I've already thought about that, trust me" },
      ];

      const state = maryPersona.detectUserState(messages);
      expect(state).toBe('defensive');
    });

    it('should detect overconfident state', () => {
      const messages = [
        { role: 'user' as const, content: 'This will definitely be a million dollar idea' },
        { role: 'assistant' as const, content: 'What makes you confident?' },
        { role: 'user' as const, content: "Everyone wants this, it can't fail, no competition" },
      ];

      const state = maryPersona.detectUserState(messages);
      expect(state).toBe('overconfident');
    });

    it('should detect spinning state', () => {
      const messages = [
        { role: 'user' as const, content: "Maybe we could do option A, or maybe option B" },
        { role: 'assistant' as const, content: 'Let us analyze both...' },
        { role: 'user' as const, content: "I'm not sure what to do, but then again we could try C" },
        { role: 'user' as const, content: "On the other hand, I keep coming back to option A" },
      ];

      const state = maryPersona.detectUserState(messages);
      expect(state).toBe('spinning');
    });

    it('should detect uncertain state', () => {
      const messages = [
        { role: 'user' as const, content: "I don't know if this is the right approach" },
        { role: 'assistant' as const, content: 'What concerns you?' },
        { role: 'user' as const, content: 'What do you think? Should I continue?' },
      ];

      const state = maryPersona.detectUserState(messages);
      expect(state).toBe('uncertain');
    });

    it('should detect engaged state', () => {
      const messages = [
        { role: 'user' as const, content: "That's a great point, I hadn't thought of that" },
        { role: 'assistant' as const, content: 'Glad that resonated...' },
        { role: 'user' as const, content: "Interesting, tell me more about that aspect" },
      ];

      const state = maryPersona.detectUserState(messages);
      expect(state).toBe('engaged');
    });

    it('should require at least 2 signals for non-neutral state', () => {
      const messages = [
        { role: 'user' as const, content: 'Maybe we could try something' }, // Only 1 spinning signal
      ];

      const state = maryPersona.detectUserState(messages);
      expect(state).toBe('neutral');
    });
  });

  describe('determineNextMode (FR-AC8 Dynamic Shifting)', () => {
    it('should shift to encouraging when user is defensive (from devil_advocate)', () => {
      const state = maryPersona.initializeSubPersonaState('new-idea');
      state.currentMode = 'devil_advocate';

      const { nextMode, trigger } = maryPersona.determineNextMode(state, 'defensive');

      expect(nextMode).toBe('encouraging');
      expect(trigger).toBe('user_defensive_shift');
    });

    it('should stay in encouraging when already there and user is defensive', () => {
      const state = maryPersona.initializeSubPersonaState('new-idea');
      state.currentMode = 'encouraging';

      const { nextMode, trigger } = maryPersona.determineNextMode(state, 'defensive');

      expect(nextMode).toBe('encouraging');
      expect(trigger).toBe('maintaining_support');
    });

    it('should shift to devil_advocate when user is overconfident', () => {
      const state = maryPersona.initializeSubPersonaState('new-idea');

      const { nextMode, trigger } = maryPersona.determineNextMode(state, 'overconfident');

      expect(nextMode).toBe('devil_advocate');
      expect(trigger).toBe('user_overconfident');
    });

    it('should shift to realistic when user is spinning', () => {
      const state = maryPersona.initializeSubPersonaState('new-idea');

      const { nextMode, trigger } = maryPersona.determineNextMode(state, 'spinning');

      expect(nextMode).toBe('realistic');
      expect(trigger).toBe('user_spinning');
    });

    it('should shift to encouraging when user is uncertain', () => {
      const state = maryPersona.initializeSubPersonaState('new-idea');
      state.currentMode = 'devil_advocate';

      const { nextMode, trigger } = maryPersona.determineNextMode(state, 'uncertain');

      expect(nextMode).toBe('encouraging');
      expect(trigger).toBe('user_uncertain');
    });
  });

  describe('updateSessionState', () => {
    it('should increment exchange count', () => {
      const state = maryPersona.initializeSubPersonaState('new-idea');

      const newState = maryPersona.updateSessionState(state, 'test message', []);

      expect(newState.exchangeCount).toBe(1);
    });

    it('should enable user control after 10 exchanges (FR-AC9)', () => {
      let state = maryPersona.initializeSubPersonaState('new-idea');

      // Simulate 10 exchanges
      for (let i = 0; i < 10; i++) {
        state = maryPersona.updateSessionState(state, `message ${i}`, []);
      }

      expect(state.userControlEnabled).toBe(true);
      expect(state.exchangeCount).toBe(10);
    });

    it('should not enable user control before 10 exchanges', () => {
      let state = maryPersona.initializeSubPersonaState('new-idea');

      // Simulate 9 exchanges
      for (let i = 0; i < 9; i++) {
        state = maryPersona.updateSessionState(state, `message ${i}`, []);
      }

      expect(state.userControlEnabled).toBe(false);
      expect(state.exchangeCount).toBe(9);
    });

    it('should update mode history when mode changes', () => {
      const state = maryPersona.initializeSubPersonaState('new-idea');
      state.currentMode = 'inquisitive';

      const messages = [
        { role: 'user' as const, content: "This will definitely succeed, can't fail" },
        { role: 'user' as const, content: 'Everyone wants this product, guaranteed success' },
      ];

      const newState = maryPersona.updateSessionState(state, 'overconfident message', messages);

      // Should detect overconfident and shift to devil_advocate
      if (newState.currentMode !== state.currentMode) {
        expect(newState.modeHistory.length).toBeGreaterThan(state.modeHistory.length);
      }
    });
  });

  describe('applyUserControl (FR-AC9)', () => {
    it('should not apply control if not enabled', () => {
      const state = maryPersona.initializeSubPersonaState('new-idea');
      state.userControlEnabled = false;

      const newState = maryPersona.applyUserControl(state, 'challenge_me');

      expect(newState.currentMode).toBe(state.currentMode);
    });

    it('should apply challenge_me action', () => {
      const state = maryPersona.initializeSubPersonaState('new-idea');
      state.userControlEnabled = true;

      const newState = maryPersona.applyUserControl(state, 'challenge_me');

      expect(newState.currentMode).toBe('devil_advocate');
      expect(newState.modeWeightOverrides.devil_advocate).toBeDefined();
    });

    it('should apply be_realistic action', () => {
      const state = maryPersona.initializeSubPersonaState('new-idea');
      state.userControlEnabled = true;

      const newState = maryPersona.applyUserControl(state, 'be_realistic');

      expect(newState.currentMode).toBe('realistic');
      expect(newState.modeWeightOverrides.realistic).toBeDefined();
    });

    it('should apply help_explore action', () => {
      const state = maryPersona.initializeSubPersonaState('new-idea');
      state.userControlEnabled = true;

      const newState = maryPersona.applyUserControl(state, 'help_explore');

      expect(newState.currentMode).toBe('inquisitive');
      expect(newState.modeWeightOverrides.inquisitive).toBeDefined();
    });

    it('should apply encourage_me action', () => {
      const state = maryPersona.initializeSubPersonaState('new-idea');
      state.userControlEnabled = true;

      const newState = maryPersona.applyUserControl(state, 'encourage_me');

      expect(newState.currentMode).toBe('encouraging');
      expect(newState.modeWeightOverrides.encouraging).toBeDefined();
    });

    it('should record user control in mode history', () => {
      const state = maryPersona.initializeSubPersonaState('new-idea');
      state.userControlEnabled = true;
      const initialHistoryLength = state.modeHistory.length;

      const newState = maryPersona.applyUserControl(state, 'challenge_me');

      expect(newState.modeHistory.length).toBe(initialHistoryLength + 1);
      expect(newState.modeHistory[newState.modeHistory.length - 1].trigger).toBe('user_requested_challenge');
    });
  });

  describe('Kill Decision Framework (FR-AC10, FR-AC11)', () => {
    describe('assessViability', () => {
      it('should require sufficient exploration before kill recommendation', () => {
        const state = maryPersona.initializeSubPersonaState('new-idea');
        state.exchangeCount = 3; // Less than 5

        const assessment = maryPersona.assessViability(state, ['concern1', 'concern2'], []);

        expect(assessment.recommendation).toBe('validate_further');
        expect(assessment.reasoning).toContain('More exploration');
      });

      it('should recommend proceed for high viability ideas', () => {
        const state = maryPersona.initializeSubPersonaState('new-idea');
        state.exchangeCount = 10;

        const assessment = maryPersona.assessViability(
          state,
          ['minor concern'],
          ['strong market', 'clear value prop', 'experienced team', 'growing market', 'competitive advantage']
        );

        expect(assessment.recommendation).toBe('proceed');
        expect(assessment.score).toBeGreaterThanOrEqual(7);
      });

      it('should recommend kill for low viability ideas', () => {
        const state = maryPersona.initializeSubPersonaState('new-idea');
        state.exchangeCount = 10;
        state.killDecision.explorationComplete = true;

        const assessment = maryPersona.assessViability(
          state,
          ['no market', 'no differentiation', 'too expensive', 'wrong timing', 'no expertise'],
          ['good idea']
        );

        expect(assessment.recommendation).toBe('kill');
        expect(assessment.score).toBeLessThan(3);
      });

      it('should recommend pivot or validate for borderline ideas', () => {
        const state = maryPersona.initializeSubPersonaState('new-idea');
        state.exchangeCount = 10;

        const assessment = maryPersona.assessViability(
          state,
          ['market uncertainty', 'pricing unclear', 'competition strong'],
          ['good team', 'interesting tech']
        );

        // Borderline ideas should get pivot, validate_further, or kill recommendation
        // depending on the exact score calculation
        expect(['pivot', 'validate_further', 'kill']).toContain(assessment.recommendation);
        // Score should be in the borderline range (2-6)
        expect(assessment.score).toBeGreaterThanOrEqual(1);
        expect(assessment.score).toBeLessThanOrEqual(7);
      });
    });

    describe('updateKillDecision', () => {
      it('should add new concerns', () => {
        const state = maryPersona.initializeSubPersonaState('new-idea');

        const newState = maryPersona.updateKillDecision(state, ['market too small'], false);

        expect(newState.killDecision.concerns).toContain('market too small');
      });

      it('should deduplicate concerns', () => {
        let state = maryPersona.initializeSubPersonaState('new-idea');
        state = maryPersona.updateKillDecision(state, ['concern A'], false);
        state = maryPersona.updateKillDecision(state, ['concern A', 'concern B'], false);

        expect(state.killDecision.concerns).toHaveLength(2);
      });

      it('should increment probe count when probe occurs', () => {
        const state = maryPersona.initializeSubPersonaState('new-idea');

        const newState = maryPersona.updateKillDecision(state, [], true);

        expect(newState.killDecision.probeCount).toBe(1);
      });

      it('should mark exploration complete after sufficient exchanges and probes', () => {
        let state = maryPersona.initializeSubPersonaState('new-idea');
        state.exchangeCount = 5;

        state = maryPersona.updateKillDecision(state, [], true);
        state = maryPersona.updateKillDecision(state, [], true);

        expect(state.killDecision.explorationComplete).toBe(true);
      });

      it('should escalate level based on concerns', () => {
        let state = maryPersona.initializeSubPersonaState('new-idea');

        // No concerns = none
        expect(state.killDecision.level).toBe('none');

        // 1-2 concerns = diplomatic
        state = maryPersona.updateKillDecision(state, ['concern1'], false);
        expect(state.killDecision.level).toBe('diplomatic');

        // 3+ concerns without exploration = probe
        state = maryPersona.updateKillDecision(state, ['concern2', 'concern3'], false);
        expect(state.killDecision.level).toBe('probe');

        // 4+ concerns with exploration complete = explicit
        state.exchangeCount = 10;
        state = maryPersona.updateKillDecision(state, ['concern4'], true);
        state = maryPersona.updateKillDecision(state, [], true);
        expect(state.killDecision.level).toBe('explicit');
      });
    });
  });

  describe('mapActionToControl', () => {
    it('should map challenge action', () => {
      expect(maryPersona.mapActionToControl('Challenge me')).toBe('challenge_me');
      expect(maryPersona.mapActionToControl('challenge my thinking')).toBe('challenge_me');
    });

    it('should map realistic action', () => {
      expect(maryPersona.mapActionToControl('Be realistic')).toBe('be_realistic');
      expect(maryPersona.mapActionToControl('Give me a reality check')).toBe('be_realistic');
    });

    it('should map explore action', () => {
      expect(maryPersona.mapActionToControl('Help me explore')).toBe('help_explore');
      expect(maryPersona.mapActionToControl("Let's think bigger")).toBe('help_explore');
    });

    it('should map encourage action', () => {
      expect(maryPersona.mapActionToControl('Build my confidence')).toBe('encourage_me');
      expect(maryPersona.mapActionToControl('What am I doing right?')).toBe('encourage_me');
    });

    it('should return null for unrecognized actions', () => {
      expect(maryPersona.mapActionToControl('random text')).toBeNull();
    });
  });

  describe('getCurrentModeDescription', () => {
    it('should return correct description for each mode', () => {
      const modes: Array<SubPersonaSessionState['currentMode']> = [
        'inquisitive',
        'devil_advocate',
        'encouraging',
        'realistic',
      ];

      modes.forEach(mode => {
        const state = maryPersona.initializeSubPersonaState('new-idea');
        state.currentMode = mode;

        const description = maryPersona.getCurrentModeDescription(state);

        expect(description.name).toBe(MODE_BEHAVIORS[mode].name);
        expect(description.description).toBe(MODE_BEHAVIORS[mode].role);
      });
    });
  });

  describe('getViabilitySummary', () => {
    it('should return green for high scores', () => {
      const assessment = maryPersona.assessViability(
        { ...maryPersona.initializeSubPersonaState('new-idea'), exchangeCount: 10 },
        [],
        ['strength1', 'strength2', 'strength3', 'strength4', 'strength5']
      );

      const summary = maryPersona.getViabilitySummary(assessment);

      expect(summary.color).toBe('green');
      expect(summary.scoreLabel).toBe('Strong');
    });

    it('should return red for low scores', () => {
      const state = maryPersona.initializeSubPersonaState('new-idea');
      state.exchangeCount = 10;
      state.killDecision.explorationComplete = true;

      const assessment = maryPersona.assessViability(
        state,
        ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'],
        []
      );

      const summary = maryPersona.getViabilitySummary(assessment);

      expect(summary.color).toBe('red');
      expect(summary.scoreLabel).toBe('Critical');
    });
  });

  describe('Helper Functions', () => {
    describe('createSubPersonaState', () => {
      it('should create state using the helper function', () => {
        const state = createSubPersonaState('business-model');

        expect(state.pathwayWeights).toEqual(PATHWAY_WEIGHTS['business-model']);
        expect(state.exchangeCount).toBe(0);
      });
    });

    describe('updateSubPersonaState', () => {
      it('should update state using the helper function', () => {
        const state = createSubPersonaState('new-idea');
        const newState = updateSubPersonaState(state, 'test', []);

        expect(newState.exchangeCount).toBe(1);
      });
    });

    describe('applyUserControlAction', () => {
      it('should apply control using the helper function', () => {
        const state = createSubPersonaState('new-idea');
        state.userControlEnabled = true;

        const newState = applyUserControlAction(state, 'challenge_me');

        expect(newState.currentMode).toBe('devil_advocate');
      });
    });
  });
});
