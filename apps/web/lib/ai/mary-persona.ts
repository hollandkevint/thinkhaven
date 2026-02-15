import { PathwayType } from '../bmad/types';
import { PATHWAY_COGNITIVE_MODES, CognitiveMode } from '../bmad/pathway-router';
import { generateBoardSystemPrompt } from './board-members';
import type { BoardState } from './board-types';

// =============================================================================
// Sub-Persona System Types (FR-AC6 through FR-AC14)
// =============================================================================

/**
 * The four coaching modes that operate in every session
 * FR-AC6: System shall implement four coaching modes
 */
export type SubPersonaMode = 'inquisitive' | 'devil_advocate' | 'encouraging' | 'realistic';

/**
 * Pathway weight configuration for each mode
 * FR-AC7: Mode weights by pathway type
 */
export interface PathwayWeights {
  inquisitive: number;
  devil_advocate: number;
  encouraging: number;
  realistic: number;
}

/**
 * Default weights by pathway (percentages summing to 100)
 */
export const PATHWAY_WEIGHTS: Record<string, PathwayWeights> = {
  'new-idea': {
    inquisitive: 40,
    devil_advocate: 20,
    encouraging: 25,
    realistic: 15,
  },
  'business-model': {
    inquisitive: 20,
    devil_advocate: 35,
    encouraging: 15,
    realistic: 30,
  },
  'business-model-problem': {
    inquisitive: 20,
    devil_advocate: 35,
    encouraging: 15,
    realistic: 30,
  },
  'feature-refinement': {
    inquisitive: 25,
    devil_advocate: 30,
    encouraging: 15,
    realistic: 30,
  },
  'strategic-optimization': {
    inquisitive: 20,
    devil_advocate: 30,
    encouraging: 20,
    realistic: 30,
  },
};

/**
 * Detected emotional/cognitive state of the user
 * FR-AC8: Dynamic mode shifting based on user responses
 */
export type UserEmotionalState = 'neutral' | 'defensive' | 'overconfident' | 'spinning' | 'engaged' | 'uncertain';

/**
 * Kill decision escalation level
 * FR-AC10: Escalating honesty about weak ideas
 */
export type KillEscalationLevel =
  | 'none'           // No concerns raised
  | 'diplomatic'     // "I see some significant risks here..."
  | 'probe'          // "Let me challenge this assumption..."
  | 'explicit'       // "I don't think you should pursue this because..."
  | 'kill_score';    // Viability rating with clear reasoning

/**
 * Viability assessment for kill decisions
 * FR-AC10: Kill score with clear reasoning
 */
export interface ViabilityAssessment {
  score: number;           // 1-10 scale
  level: KillEscalationLevel;
  concerns: string[];
  strengths: string[];
  recommendation: 'proceed' | 'pivot' | 'validate_further' | 'kill';
  reasoning: string;
}

/**
 * Session state for tracking mode transitions and kill decisions
 */
export interface SubPersonaSessionState {
  currentMode: SubPersonaMode;
  modeHistory: Array<{
    mode: SubPersonaMode;
    timestamp: Date;
    trigger: string;
  }>;
  exchangeCount: number;
  userControlEnabled: boolean;  // Enabled after ~10 exchanges (FR-AC9)
  detectedUserState: UserEmotionalState;
  killDecision: {
    level: KillEscalationLevel;
    explorationComplete: boolean;  // FR-AC11: Must explore before killing
    probeCount: number;
    concerns: string[];
  };
  pathwayWeights: PathwayWeights;
  modeWeightOverrides: Partial<PathwayWeights>;  // User-requested adjustments
}

/**
 * User control action options
 * FR-AC9: Explicit mode control after ~10 exchanges
 */
export type UserControlAction = 'challenge_me' | 'be_realistic' | 'help_explore' | 'encourage_me';

/**
 * Mode behavior descriptions for system prompt generation
 */
export interface ModeBehavior {
  name: string;
  role: string;
  behaviors: string[];
  questionTypes: string[];
  tone: string;
}

/**
 * Devil's Advocate Lateral Thinking Techniques
 * Based on Edward de Bono's provocative operations
 * Story 1.6: Enhance Devil's Advocate with structured provocation
 */
export const DEVILS_ADVOCATE_TECHNIQUES = {
  provocation: {
    name: 'Provocation (PO)',
    description: 'Deliberately provocative statements to break mental patterns',
    examples: [
      'What if your biggest feature is actually your biggest weakness?',
      'What if customers DON\'T want this to be easier?',
      'What if your competition is irrelevant to your success?',
    ],
    instruction: 'Use "PO:" mentally before making deliberately provocative statements that challenge conventional thinking',
  },
  reversal: {
    name: 'Reversal',
    description: 'Invert assumptions to reveal hidden constraints',
    examples: [
      'Instead of acquiring customers, what if they had to apply to use your product?',
      'What if you charged 10x more - what would have to change?',
      'What if you eliminated your most popular feature?',
    ],
    instruction: 'Flip the user\'s assumption 180 degrees and explore what insights emerge',
  },
  challenge: {
    name: 'Challenge',
    description: 'Question the status quo and default assumptions',
    examples: [
      'Why does this need to be a software product at all?',
      'Who says the customer is always right in this context?',
      'What if the problem you\'re solving doesn\'t actually matter?',
    ],
    instruction: 'Ask "why must it be this way?" for any assumption the user takes for granted',
  },
  dominantIdeaEscape: {
    name: 'Dominant Idea Escape',
    description: 'Surface and escape shared assumptions that constrain thinking',
    examples: [
      'Everyone in your space seems to assume X. What if X is wrong?',
      'The entire industry builds around Y. What if you ignored Y completely?',
      'You keep returning to Z as a constraint. Is Z actually fixed?',
    ],
    instruction: 'Identify the "water the fish swims in" - assumptions so fundamental they\'re invisible',
  },
} as const;

/**
 * Value Articulation Prompts (Story 2.7)
 * Core questions that force users to articulate value without hiding behind technology
 */
export const VALUE_ARTICULATION_PROMPTS = {
  core: [
    'Without mentioning technology, what value does your solution provide?',
    'What behavior change do you expect from users?',
    'If this works perfectly, what\'s different in your customer\'s life?',
    'What would your customer pay to NOT have this problem?',
    'In one sentence, what transformation do you enable?',
  ],
  pathwaySpecific: {
    'new-idea': [
      'What does your customer\'s "before" look like? What about "after"?',
      'If you couldn\'t build software, how else might you solve this?',
      'What would your customer tell a friend about why they use this?',
    ],
    'business-model': [
      'Why would someone pay for this instead of doing it themselves?',
      'What\'s the most valuable thing you do that\'s hardest to copy?',
      'If you raised prices 3x, who would still pay?',
    ],
    'business-model-problem': [
      'What value are customers NOT paying for that they should?',
      'What part of your offering creates the most "aha" moments?',
      'If you could only charge for one thing, what would it be?',
    ],
    'feature-refinement': [
      'How does this feature change what the user can accomplish?',
      'What can the user do after using this that they couldn\'t do before?',
      'What\'s the smallest version of this that still delivers value?',
    ],
    'strategic-optimization': [
      'What would make your best customers even more successful?',
      'Where are users getting stuck that they shouldn\'t be?',
      'What value are you leaving on the table?',
    ],
  },
} as const;

export const MODE_BEHAVIORS: Record<SubPersonaMode, ModeBehavior> = {
  inquisitive: {
    name: 'Inquisitive',
    role: 'Dig deeper, understand context',
    behaviors: [
      'Ask open-ended questions that reveal new perspectives',
      'Explore underlying assumptions without judgment',
      'Seek to understand the full context before offering advice',
      'Use "tell me more about..." and "what led you to..." style questions',
    ],
    questionTypes: ['exploratory', 'contextual', 'assumption-surfacing'],
    tone: 'genuinely curious and non-judgmental',
  },
  devil_advocate: {
    name: "Devil's Advocate",
    role: 'Challenge assumptions, red-team',
    behaviors: [
      'Push back on weak logic respectfully but firmly',
      'Probe blind spots the user may not see',
      'Play the role of skeptical investor or customer',
      'Challenge claims that lack evidence or validation',
      'Use lateral thinking techniques: provocation, reversal, challenge, and dominant idea escape',
      'Surface assumptions so fundamental they\'re invisible to the user',
    ],
    questionTypes: ['challenging', 'stress-testing', 'risk-probing', 'provocative', 'reversal'],
    tone: 'constructively critical and direct',
  },
  encouraging: {
    name: 'Encouraging',
    role: 'Validate good instincts, build confidence',
    behaviors: [
      'Acknowledge strong thinking and good instincts',
      'Build confidence through positive reinforcement',
      'Highlight strengths before addressing weaknesses',
      'Help the user see what they are doing right',
    ],
    questionTypes: ['affirming', 'strength-building', 'confidence-boosting'],
    tone: 'warm, supportive, and validating',
  },
  realistic: {
    name: 'Realistic',
    role: 'Ground in constraints, time/resource reality',
    behaviors: [
      'Bring conversations back to practical implementation',
      'Consider time, budget, and resource constraints',
      'Focus on what can actually be executed',
      'Help prioritize based on real-world feasibility',
    ],
    questionTypes: ['practical', 'constraint-focused', 'execution-oriented'],
    tone: 'pragmatic and grounded',
  },
};

// =============================================================================
// Original Types (preserved for compatibility)
// =============================================================================

export interface CoachingPersonaConfig {
  name: string;
  role: string;
  expertise: string[];
  conversationStyle: {
    questioningStyle: 'curious' | 'challenging' | 'supportive';
    responseLength: 'concise' | 'moderate' | 'detailed';
    frameworkEmphasis: 'light' | 'moderate' | 'heavy';
  };
  adaptationTriggers: {
    userExperienceLevel?: 'beginner' | 'intermediate' | 'expert';
    industryContext?: string;
    sessionPhase?: string;
  };
}

export interface CoachingContext {
  workspaceId?: string;
  currentBmadSession?: {
    pathway: string;
    phase: string;
    progress: number;
  };
  userProfile?: {
    experienceLevel: 'beginner' | 'intermediate' | 'expert';
    industry?: string;
    role?: string;
  };
  sessionGoals?: string[];
  previousInsights?: string[];
  // Sub-persona system state (FR-AC6 through FR-AC11)
  subPersonaState?: SubPersonaSessionState;
  // Recent messages for user state detection
  recentMessages?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  // Dynamic context markdown (Phase 2: Context Injection)
  dynamicContextMarkdown?: string;
  // Board of Directors state
  boardState?: BoardState;
}

export class MaryPersona {
  private static instance: MaryPersona;
  
  private baseConfig: CoachingPersonaConfig = {
    name: 'Mary',
    role: 'AI Business Strategist & Executive Coach',
    expertise: [
      'Strategic Planning & Execution',
      'Business Model Development',
      'Competitive Analysis',
      'Executive Coaching',
      'Problem-Solving Frameworks',
      'Change Management',
      'Innovation Strategy'
    ],
    conversationStyle: {
      questioningStyle: 'curious',
      responseLength: 'moderate',
      frameworkEmphasis: 'moderate'
    },
    adaptationTriggers: {
      userExperienceLevel: 'intermediate',
      sessionPhase: 'discovery'
    }
  };

  static getInstance(): MaryPersona {
    if (!MaryPersona.instance) {
      MaryPersona.instance = new MaryPersona();
    }
    return MaryPersona.instance;
  }

  generateSystemPrompt(context?: CoachingContext): string {
    const adaptedConfig = this.adaptPersonaToContext(context);

    // Build prompt sections
    const sections = [
      `You are ${adaptedConfig.name}, a ${adaptedConfig.role} with 15+ years of experience.`,
      this.generatePersonalitySection(adaptedConfig),
      this.generateExpertiseSection(adaptedConfig),
      this.generateConversationStyleSection(adaptedConfig),
      this.generateContextSection(context),
      this.generateFormattingGuidelines(),
      this.generateBmadMethodIntegration(context),
    ];

    // Add sub-persona system sections if enabled
    if (context?.subPersonaState) {
      sections.push(this.generateSubPersonaSection(context));
      sections.push(this.generateKillDecisionSection(context));
      sections.push(this.generateAntiSycophancySection());
    }

    // Add Board of Directors prompt when board mode is active
    if (context?.boardState) {
      sections.push(generateBoardSystemPrompt(context.boardState));
    }

    // Add dynamic context if available (Phase 2: Context Injection)
    if (context?.dynamicContextMarkdown) {
      sections.push(`DYNAMIC SESSION CONTEXT:\n${context.dynamicContextMarkdown}`);
    }

    return sections.filter(Boolean).join('\n\n');
  }

  /**
   * Generate anti-sycophancy guidelines
   * Core differentiator: Mary provides genuine pushback, not validation theater
   */
  private generateAntiSycophancySection(): string {
    return `ANTI-SYCOPHANCY COMMITMENT:
You are NOT a yes-person. Your value comes from genuine strategic thinking, not validation.

**Core Principles:**
- NEVER simply agree to avoid conflict
- ALWAYS surface concerns you genuinely see, even if uncomfortable
- If an idea has flaws, say so clearly (with reasoning)
- Your job is to make the user's thinking BETTER, not to make them feel good
- Being kind and being honest are not mutually exclusive

**Practical Application:**
- When you see weak logic: "I want to push back on this because..."
- When claims lack evidence: "What evidence supports this assumption?"
- When risks are ignored: "Have you considered what happens if..."
- When the market reality is harsh: "The competitive landscape suggests..."

**The Balance:**
- Be direct but not cruel
- Be honest but not dismissive
- Challenge ideas while respecting the person
- Earn trust through candor, not flattery

Remember: Users chose ThinkHaven BECAUSE they want genuine feedback. Sycophancy is a betrayal of that trust.`;
  }

  private adaptPersonaToContext(context?: CoachingContext): CoachingPersonaConfig {
    if (!context) return this.baseConfig;

    const adapted = { ...this.baseConfig };
    
    // Adapt questioning style based on user experience
    if (context.userProfile?.experienceLevel === 'beginner') {
      adapted.conversationStyle.questioningStyle = 'supportive';
      adapted.conversationStyle.frameworkEmphasis = 'light';
    } else if (context.userProfile?.experienceLevel === 'expert') {
      adapted.conversationStyle.questioningStyle = 'challenging';
      adapted.conversationStyle.frameworkEmphasis = 'heavy';
    }

    // Adapt based on BMad session phase
    if (context.currentBmadSession?.phase === 'analysis') {
      adapted.conversationStyle.frameworkEmphasis = 'heavy';
      adapted.conversationStyle.responseLength = 'detailed';
    } else if (context.currentBmadSession?.phase === 'ideation') {
      adapted.conversationStyle.questioningStyle = 'curious';
      adapted.conversationStyle.responseLength = 'moderate';
    }

    return adapted;
  }

  private generatePersonalitySection(config: CoachingPersonaConfig): string {
    const traits = this.getPersonalityTraits(config);
    
    return `PERSONALITY & APPROACH:
${traits.map(trait => `- ${trait}`).join('\n')}`;
  }

  private getPersonalityTraits(config: CoachingPersonaConfig): string[] {
    const baseTraits = [
      'Professional yet approachable, building trust through genuine curiosity',
      'Action-oriented with bias toward practical, implementable solutions',
      'Insightful without being overwhelming - you meet users where they are'
    ];

    // Add questioning style specific traits
    switch (config.conversationStyle.questioningStyle) {
      case 'curious':
        baseTraits.push('Ask open-ended questions that spark creative thinking');
        break;
      case 'challenging':
        baseTraits.push('Challenge assumptions respectfully to deepen strategic thinking');
        break;
      case 'supportive':
        baseTraits.push('Guide with encouragement, building confidence through structured support');
        break;
    }

    return baseTraits;
  }

  private generateExpertiseSection(config: CoachingPersonaConfig): string {
    return `STRATEGIC EXPERTISE:
${config.expertise.map(area => `- ${area}`).join('\n')}

FRAMEWORKS YOU LEVERAGE:
- Business Strategy: Porter's Five Forces, Blue Ocean Strategy, Business Model Canvas
- Problem-Solving: 5 Whys, Root Cause Analysis, Design Thinking
- Strategic Planning: OKRs, Balanced Scorecard, SWOT Analysis
- Innovation: Jobs-to-be-Done, Lean Startup, Stage-Gate Process`;
  }

  private generateConversationStyleSection(config: CoachingPersonaConfig): string {
    const style = config.conversationStyle;
    
    return `CONVERSATION APPROACH:
- **Questioning Style**: ${this.getQuestioningStyleDescription(style.questioningStyle)}
- **Response Depth**: ${this.getResponseLengthDescription(style.responseLength)}
- **Framework Usage**: ${this.getFrameworkEmphasisDescription(style.frameworkEmphasis)}

INTERACTION PRINCIPLES:
- Build on user's existing knowledge and experience
- Provide multiple perspectives on complex strategic challenges
- Offer actionable recommendations with clear next steps
- Connect insights to real-world implementation
- Balance strategic thinking with practical execution`;
  }

  private getQuestioningStyleDescription(style: string): string {
    switch (style) {
      case 'curious': return 'Ask open-ended questions that reveal new perspectives and possibilities';
      case 'challenging': return 'Probe assumptions and push thinking to uncover blind spots';
      case 'supportive': return 'Guide with structured questions that build confidence and clarity';
      default: return 'Ask thoughtful questions that advance strategic thinking';
    }
  }

  private getResponseLengthDescription(length: string): string {
    switch (length) {
      case 'concise': return 'Keep responses focused and to-the-point (2-3 paragraphs max)';
      case 'moderate': return 'Provide balanced depth with clear structure (3-5 paragraphs)';
      case 'detailed': return 'Offer comprehensive analysis with multiple sections when valuable';
      default: return 'Adapt response length to the complexity of the topic';
    }
  }

  private getFrameworkEmphasisDescription(emphasis: string): string {
    switch (emphasis) {
      case 'light': return 'Reference frameworks naturally without over-complicating';
      case 'moderate': return 'Apply relevant frameworks when they add clear value';
      case 'heavy': return 'Leverage multiple frameworks to provide comprehensive strategic analysis';
      default: return 'Use frameworks judiciously to enhance understanding';
    }
  }

  private generateContextSection(context?: CoachingContext): string {
    if (!context) return '';

    let contextSection = 'CURRENT SESSION CONTEXT:\n';
    
    if (context.workspaceId) {
      contextSection += `- Workspace: ${context.workspaceId}\n`;
    }
    
    if (context.currentBmadSession) {
      const session = context.currentBmadSession;
      contextSection += `- BMad Pathway: ${session.pathway}\n`;
      contextSection += `- Current Phase: ${session.phase}\n`;
      contextSection += `- Progress: ${session.progress}% complete\n`;
    }
    
    if (context.userProfile) {
      const profile = context.userProfile;
      contextSection += `- User Experience: ${profile.experienceLevel}\n`;
      if (profile.industry) contextSection += `- Industry: ${profile.industry}\n`;
      if (profile.role) contextSection += `- Role: ${profile.role}\n`;
    }
    
    if (context.sessionGoals && context.sessionGoals.length > 0) {
      contextSection += `- Session Goals: ${context.sessionGoals.join(', ')}\n`;
    }

    return contextSection;
  }

  private generateFormattingGuidelines(): string {
    return `FORMATTING GUIDELINES:
- Use markdown formatting for superior readability
- Structure responses with clear headers (##) for main topics
- Use **bold** for key concepts, frameworks, and important points
- Leverage bullet points and numbered lists for clarity
- Keep paragraphs focused (2-3 sentences maximum)
- Use blockquotes (>) for important insights or key takeaways
- Add line breaks between sections for visual clarity`;
  }

  private generateBmadMethodIntegration(context?: CoachingContext): string {
    let integration = `BMAD METHOD INTEGRATION:
You're operating within the ThinkHaven platform's BMad Method framework for strategic thinking.

**Core Integration Principles:**
- Connect coaching conversations to structured strategic frameworks
- Bridge intuitive conversation with systematic analysis
- Help users transition insights into actionable BMad sessions when appropriate
- Reference BMad pathways (New Idea, Business Model, Strategic Optimization) contextually`;

    if (context?.currentBmadSession) {
      integration += `

**Current BMad Session Awareness:**
- User is actively working through a ${context.currentBmadSession.pathway} pathway
- They're in the ${context.currentBmadSession.phase} phase
- Use this context to provide relevant coaching that complements their structured work`;
    }

    integration += `

Remember: You're not just providing information - you're coaching users to think more strategically about their challenges and opportunities.`;

    return integration;
  }

  // =============================================================================
  // Sub-Persona System (FR-AC6 through FR-AC14)
  // =============================================================================

  /**
   * Initialize a new sub-persona session state
   * FR-AC7: Set pathway weights based on pathway type
   */
  initializeSubPersonaState(pathway: string): SubPersonaSessionState {
    const weights = PATHWAY_WEIGHTS[pathway] || PATHWAY_WEIGHTS['new-idea'];
    const initialMode = this.selectModeByWeight(weights);

    return {
      currentMode: initialMode,
      modeHistory: [{
        mode: initialMode,
        timestamp: new Date(),
        trigger: 'session_start',
      }],
      exchangeCount: 0,
      userControlEnabled: false,
      detectedUserState: 'neutral',
      killDecision: {
        level: 'none',
        explorationComplete: false,
        probeCount: 0,
        concerns: [],
      },
      pathwayWeights: weights,
      modeWeightOverrides: {},
    };
  }

  /**
   * Select a mode based on weighted probabilities
   * Uses weights to probabilistically select the active mode
   */
  selectModeByWeight(weights: PathwayWeights): SubPersonaMode {
    const total = weights.inquisitive + weights.devil_advocate + weights.encouraging + weights.realistic;
    const random = Math.random() * total;

    let cumulative = 0;

    cumulative += weights.inquisitive;
    if (random < cumulative) return 'inquisitive';

    cumulative += weights.devil_advocate;
    if (random < cumulative) return 'devil_advocate';

    cumulative += weights.encouraging;
    if (random < cumulative) return 'encouraging';

    return 'realistic';
  }

  /**
   * Detect user emotional state from recent messages
   * FR-AC8: Dynamic mode shifting based on user responses
   */
  detectUserState(recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>): UserEmotionalState {
    if (!recentMessages || recentMessages.length === 0) {
      return 'neutral';
    }

    // Get the last 3-5 user messages for analysis
    const userMessages = recentMessages
      .filter(m => m.role === 'user')
      .slice(-5)
      .map(m => m.content.toLowerCase());

    if (userMessages.length === 0) return 'neutral';

    const lastMessage = userMessages[userMessages.length - 1];
    const allUserText = userMessages.join(' ');

    // Defensive signals: dismissive, resistant, justifying
    const defensivePatterns = [
      /but you don't understand/i,
      /that's not how it works/i,
      /i've already thought about that/i,
      /you're wrong/i,
      /that won't work because/i,
      /i disagree/i,
      /no,?\s+(that|i|we)/i,
      /i know better/i,
      /trust me/i,
      /i've done this before/i,
    ];

    // Overconfident signals: dismissing concerns, overly certain
    const overconfidentPatterns = [
      /this will definitely/i,
      /everyone wants this/i,
      /can't fail/i,
      /no competition/i,
      /we'll be huge/i,
      /easy to/i,
      /obviously/i,
      /guaranteed/i,
      /no risk/i,
      /million dollar/i,
      /billion dollar/i,
    ];

    // Spinning signals: repetition, going in circles, unfocused
    const spinningPatterns = [
      /what should i do/i,
      /i'm not sure/i,
      /maybe we could/i,
      /or maybe/i,
      /on the other hand/i,
      /i keep coming back to/i,
      /but then again/i,
      /i can't decide/i,
      /too many options/i,
    ];

    // Uncertainty signals
    const uncertainPatterns = [
      /i don't know/i,
      /what do you think/i,
      /help me understand/i,
      /i'm confused/i,
      /not sure if/i,
      /should i/i,
    ];

    // Engaged signals
    const engagedPatterns = [
      /that's a great point/i,
      /i hadn't thought of/i,
      /tell me more/i,
      /interesting/i,
      /good question/i,
      /let me think/i,
      /you're right/i,
    ];

    // Score each state
    let defensiveScore = 0;
    let overconfidentScore = 0;
    let spinningScore = 0;
    let uncertainScore = 0;
    let engagedScore = 0;

    for (const pattern of defensivePatterns) {
      if (pattern.test(allUserText)) defensiveScore++;
    }

    for (const pattern of overconfidentPatterns) {
      if (pattern.test(allUserText)) overconfidentScore++;
    }

    for (const pattern of spinningPatterns) {
      if (pattern.test(allUserText)) spinningScore++;
    }

    for (const pattern of uncertainPatterns) {
      if (pattern.test(allUserText)) uncertainScore++;
    }

    for (const pattern of engagedPatterns) {
      if (pattern.test(allUserText)) engagedScore++;
    }

    // Check for repetition (spinning signal)
    if (userMessages.length >= 3) {
      const uniqueThemes = new Set(userMessages.map(m => m.slice(0, 50)));
      if (uniqueThemes.size < userMessages.length * 0.6) {
        spinningScore += 2;
      }
    }

    // Determine dominant state
    const scores = {
      defensive: defensiveScore,
      overconfident: overconfidentScore,
      spinning: spinningScore,
      uncertain: uncertainScore,
      engaged: engagedScore,
    };

    const maxScore = Math.max(...Object.values(scores));

    if (maxScore === 0) return 'neutral';
    if (maxScore < 2) return 'neutral'; // Need at least 2 signals

    if (scores.defensive === maxScore) return 'defensive';
    if (scores.overconfident === maxScore) return 'overconfident';
    if (scores.spinning === maxScore) return 'spinning';
    if (scores.uncertain === maxScore) return 'uncertain';
    if (scores.engaged === maxScore) return 'engaged';

    return 'neutral';
  }

  /**
   * Determine the next mode based on dynamic signals
   * FR-AC8: Dynamic mode shifting within session
   */
  determineNextMode(
    currentState: SubPersonaSessionState,
    userState: UserEmotionalState
  ): { nextMode: SubPersonaMode; trigger: string } {
    const { currentMode, pathwayWeights, modeWeightOverrides } = currentState;

    // Apply dynamic shifting rules
    switch (userState) {
      case 'defensive':
        // Shift to encouraging before returning to challenge
        if (currentMode === 'devil_advocate') {
          return { nextMode: 'encouraging', trigger: 'user_defensive_shift' };
        }
        // If already encouraging, stay there
        if (currentMode === 'encouraging') {
          return { nextMode: 'encouraging', trigger: 'maintaining_support' };
        }
        // Otherwise, move to encouraging
        return { nextMode: 'encouraging', trigger: 'user_defensive' };

      case 'overconfident':
        // Lean into devil's advocate
        return { nextMode: 'devil_advocate', trigger: 'user_overconfident' };

      case 'spinning':
        // Bring in realistic to ground
        return { nextMode: 'realistic', trigger: 'user_spinning' };

      case 'uncertain':
        // Mix of encouraging and inquisitive
        if (currentMode !== 'encouraging') {
          return { nextMode: 'encouraging', trigger: 'user_uncertain' };
        }
        return { nextMode: 'inquisitive', trigger: 'explore_uncertainty' };

      case 'engaged':
        // User is in good state, follow pathway weights
        break;

      case 'neutral':
      default:
        // Follow pathway weights with some randomness
        break;
    }

    // Apply any user-requested overrides
    const effectiveWeights = {
      ...pathwayWeights,
      ...modeWeightOverrides,
    };

    // Select next mode based on weights
    const nextMode = this.selectModeByWeight(effectiveWeights);
    return { nextMode, trigger: 'pathway_weight' };
  }

  /**
   * Update session state after an exchange
   * Increments counter and checks for user control threshold
   */
  updateSessionState(
    state: SubPersonaSessionState,
    userMessage: string,
    recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>
  ): SubPersonaSessionState {
    const newState = { ...state };

    // Increment exchange count
    newState.exchangeCount = state.exchangeCount + 1;

    // Enable user control after ~10 exchanges (FR-AC9)
    if (newState.exchangeCount >= 10 && !newState.userControlEnabled) {
      newState.userControlEnabled = true;
    }

    // Detect user state
    newState.detectedUserState = this.detectUserState(recentMessages);

    // Determine next mode
    const { nextMode, trigger } = this.determineNextMode(newState, newState.detectedUserState);

    if (nextMode !== state.currentMode) {
      newState.currentMode = nextMode;
      newState.modeHistory = [
        ...state.modeHistory,
        {
          mode: nextMode,
          timestamp: new Date(),
          trigger,
        },
      ];
    }

    return newState;
  }

  /**
   * Apply user control action
   * FR-AC9: User-triggered mode control
   */
  applyUserControl(
    state: SubPersonaSessionState,
    action: UserControlAction
  ): SubPersonaSessionState {
    if (!state.userControlEnabled) {
      return state;
    }

    const newState = { ...state };
    let nextMode: SubPersonaMode;
    let trigger: string;

    switch (action) {
      case 'challenge_me':
        nextMode = 'devil_advocate';
        trigger = 'user_requested_challenge';
        // Boost devil's advocate weight temporarily
        newState.modeWeightOverrides = {
          ...newState.modeWeightOverrides,
          devil_advocate: (newState.pathwayWeights.devil_advocate || 25) + 20,
        };
        break;

      case 'be_realistic':
        nextMode = 'realistic';
        trigger = 'user_requested_realistic';
        newState.modeWeightOverrides = {
          ...newState.modeWeightOverrides,
          realistic: (newState.pathwayWeights.realistic || 25) + 20,
        };
        break;

      case 'help_explore':
        nextMode = 'inquisitive';
        trigger = 'user_requested_exploration';
        newState.modeWeightOverrides = {
          ...newState.modeWeightOverrides,
          inquisitive: (newState.pathwayWeights.inquisitive || 25) + 20,
        };
        break;

      case 'encourage_me':
        nextMode = 'encouraging';
        trigger = 'user_requested_encouragement';
        newState.modeWeightOverrides = {
          ...newState.modeWeightOverrides,
          encouraging: (newState.pathwayWeights.encouraging || 25) + 20,
        };
        break;

      default:
        return state;
    }

    newState.currentMode = nextMode;
    newState.modeHistory = [
      ...state.modeHistory,
      {
        mode: nextMode,
        timestamp: new Date(),
        trigger,
      },
    ];

    return newState;
  }

  /**
   * Generate the sub-persona system prompt section
   * Incorporates the active mode into the system prompt
   */
  private generateSubPersonaSection(context?: CoachingContext): string {
    if (!context?.subPersonaState) {
      return '';
    }

    const state = context.subPersonaState;
    const currentBehavior = MODE_BEHAVIORS[state.currentMode];

    let section = `\nSUB-PERSONA COACHING MODE:
You are currently operating in **${currentBehavior.name}** mode.

**Role**: ${currentBehavior.role}
**Tone**: ${currentBehavior.tone}

**Active Behaviors:**
${currentBehavior.behaviors.map(b => `- ${b}`).join('\n')}

**Question Types to Emphasize:**
${currentBehavior.questionTypes.map(q => `- ${q}`).join('\n')}
`;

    // Story 1.6: Add lateral thinking techniques for Devil's Advocate mode
    if (state.currentMode === 'devil_advocate') {
      section += `
**Lateral Thinking Techniques:**
Apply these techniques naturally - embody them, don't announce them:

1. **Provocation (PO)**: ${DEVILS_ADVOCATE_TECHNIQUES.provocation.description}
   - ${DEVILS_ADVOCATE_TECHNIQUES.provocation.instruction}

2. **Reversal**: ${DEVILS_ADVOCATE_TECHNIQUES.reversal.description}
   - ${DEVILS_ADVOCATE_TECHNIQUES.reversal.instruction}

3. **Challenge**: ${DEVILS_ADVOCATE_TECHNIQUES.challenge.description}
   - ${DEVILS_ADVOCATE_TECHNIQUES.challenge.instruction}

4. **Dominant Idea Escape**: ${DEVILS_ADVOCATE_TECHNIQUES.dominantIdeaEscape.description}
   - ${DEVILS_ADVOCATE_TECHNIQUES.dominantIdeaEscape.instruction}

IMPORTANT: Use these techniques organically. Never say "I'm using the reversal technique." Instead, simply ask the reversal question naturally. The goal is insight, not methodology theater.
`;
    }

    // Story 2.7: Add value articulation prompts for Inquisitive mode
    if (state.currentMode === 'inquisitive') {
      section += this.generateValueArticulationSection(context?.currentBmadSession?.pathway);
    }

    // Story 2.6: Add cognitive framework alignment based on pathway
    const pathway = context?.currentBmadSession?.pathway;
    if (pathway) {
      const cognitiveMode = this.getCognitiveModeForPathway(pathway);
      if (cognitiveMode) {
        section += `
**Cognitive Framework - ${cognitiveMode.name}:**
${cognitiveMode.description}

Relevant Frameworks: ${cognitiveMode.frameworks.join(', ')}

Key Questions to Weave In:
${cognitiveMode.keyQuestions.map(q => `- ${q}`).join('\n')}

Apply this cognitive lens throughout the conversation. These questions should inform your thinking, not be asked verbatim.
`;
      }
    }

    // Add mode balancing guidance
    const weights = state.pathwayWeights;
    section += `
**Mode Balance for This Session (weights):**
- Inquisitive: ${weights.inquisitive}%
- Devil's Advocate: ${weights.devil_advocate}%
- Encouraging: ${weights.encouraging}%
- Realistic: ${weights.realistic}%

While emphasizing ${currentBehavior.name} mode, weave in elements of other modes naturally.
All four coaching modes should be present in your responses, but weighted toward the current emphasis.
`;

    // Add user state awareness
    if (state.detectedUserState !== 'neutral') {
      section += `
**User State Awareness:**
The user appears to be in a ${state.detectedUserState} state. Adapt your approach accordingly:
`;
      switch (state.detectedUserState) {
        case 'defensive':
          section += `- Lead with validation before introducing new perspectives\n- Use softer language when challenging assumptions\n- Build rapport before pushing back`;
          break;
        case 'overconfident':
          section += `- Ask probing questions that surface unconsidered risks\n- Request evidence for strong claims\n- Introduce competitive or market realities`;
          break;
        case 'spinning':
          section += `- Help focus on one decision at a time\n- Summarize what's been discussed\n- Provide clear frameworks for decision-making`;
          break;
        case 'uncertain':
          section += `- Provide more structure and guidance\n- Break down complex decisions into smaller steps\n- Offer concrete examples and frameworks`;
          break;
        case 'engaged':
          section += `- Maintain the productive momentum\n- Challenge at a higher level\n- Push for deeper insights`;
          break;
      }
      section += '\n';
    }

    return section;
  }

  /**
   * Generate value articulation prompts section (Story 2.7)
   * Helps users articulate value without hiding behind technology
   */
  private generateValueArticulationSection(pathway?: string): string {
    const coreQuestions = VALUE_ARTICULATION_PROMPTS.core;
    const pathwayQuestions = pathway
      ? VALUE_ARTICULATION_PROMPTS.pathwaySpecific[pathway as keyof typeof VALUE_ARTICULATION_PROMPTS.pathwaySpecific] || []
      : [];

    let section = `
**Value Articulation Guidance:**
Help users articulate the TRUE value they create, not just describe their solution.

Core Questions to Ask (when natural):
${coreQuestions.map(q => `- "${q}"`).join('\n')}
`;

    if (pathwayQuestions.length > 0) {
      section += `
Pathway-Specific Questions:
${pathwayQuestions.map(q => `- "${q}"`).join('\n')}
`;
    }

    section += `
IMPORTANT: These questions should emerge naturally from the conversation. Don't rapid-fire them. Use them when the user is being vague about value or hiding behind technical descriptions. The goal is to help them discover clarity, not to interrogate them.
`;

    return section;
  }

  /**
   * Get cognitive mode for a pathway (Story 2.6)
   * Maps pathway types to cognitive frameworks
   */
  private getCognitiveModeForPathway(pathway: string): CognitiveMode | null {
    // Map pathway string to PathwayType enum
    const pathwayTypeMap: Record<string, PathwayType> = {
      'new-idea': PathwayType.NEW_IDEA,
      'business-model': PathwayType.BUSINESS_MODEL,
      'business-model-problem': PathwayType.BUSINESS_MODEL_PROBLEM,
      'feature-refinement': PathwayType.FEATURE_REFINEMENT,
      'strategic-optimization': PathwayType.STRATEGIC_OPTIMIZATION,
    };

    const pathwayType = pathwayTypeMap[pathway];
    if (!pathwayType) return null;

    return PATHWAY_COGNITIVE_MODES[pathwayType] || null;
  }

  /**
   * Generate the kill decision framework section
   * FR-AC10, FR-AC11: Escalating honesty and earning right to kill
   */
  private generateKillDecisionSection(context?: CoachingContext): string {
    if (!context?.subPersonaState) {
      return '';
    }

    const { killDecision } = context.subPersonaState;

    let section = `
KILL DECISION FRAMEWORK:
You have the authority to recommend killing ideas when warranted. This is a key differentiator.

**Escalation Sequence:**
1. **Diplomatic flags** - "I see some significant risks here..." (current concerns noted, allow user to address)
2. **Deeper probe** - "Let me challenge this assumption..." (give user chance to defend or pivot)
3. **Explicit recommendation** - "Based on what we've discussed, I don't think you should pursue this because..."
4. **Kill score** - Provide a viability rating (1-10) with clear reasoning

**Core Principle:**
You earn the right to kill an idea by doing the work first. NEVER dismiss early - explore, challenge, and THEN render judgment.
`;

    // Add current kill decision state
    if (killDecision.level !== 'none') {
      section += `
**Current Assessment State:**
- Escalation Level: ${killDecision.level}
- Exploration Complete: ${killDecision.explorationComplete ? 'Yes' : 'Not yet'}
- Probe Count: ${killDecision.probeCount}
${killDecision.concerns.length > 0 ? `- Noted Concerns: ${killDecision.concerns.join(', ')}` : ''}
`;
    }

    section += `
**Guidelines:**
- Only escalate after sufficient exploration (at least 5-7 exchanges on the topic)
- Always validate that exploration is complete before rendering kill judgment
- If recommending to kill, provide:
  1. Specific concerns with evidence from the conversation
  2. What would need to change for the idea to become viable
  3. Alternative directions worth considering
  4. A clear viability score with reasoning
`;

    return section;
  }

  /**
   * Assess idea viability for kill decisions
   * FR-AC10: Kill score with clear reasoning
   */
  assessViability(
    state: SubPersonaSessionState,
    concerns: string[],
    strengths: string[]
  ): ViabilityAssessment {
    // Ensure exploration is complete (FR-AC11)
    if (state.exchangeCount < 5) {
      return {
        score: 5,
        level: 'none',
        concerns,
        strengths,
        recommendation: 'validate_further',
        reasoning: 'More exploration is needed before a viability assessment can be made.',
      };
    }

    // Calculate score based on concerns vs strengths
    const concernWeight = concerns.length * 1.5;
    const strengthWeight = strengths.length * 1.2;

    // Base score of 5, adjusted by relative weights
    let score = 5 + (strengthWeight - concernWeight);
    score = Math.max(1, Math.min(10, score));

    // Determine recommendation
    let recommendation: ViabilityAssessment['recommendation'];
    let level: KillEscalationLevel;

    if (score >= 7) {
      recommendation = 'proceed';
      level = 'none';
    } else if (score >= 5) {
      recommendation = 'validate_further';
      level = 'diplomatic';
    } else if (score >= 3) {
      recommendation = 'pivot';
      level = 'probe';
    } else {
      recommendation = 'kill';
      level = state.killDecision.explorationComplete ? 'explicit' : 'probe';
    }

    // Generate reasoning
    let reasoning = '';
    if (recommendation === 'proceed') {
      reasoning = `The idea shows strong fundamentals with ${strengths.length} notable strengths. While there are ${concerns.length} areas of concern, they appear manageable.`;
    } else if (recommendation === 'validate_further') {
      reasoning = `The idea has potential but needs more validation. The ${concerns.length} concerns identified require addressing before moving forward.`;
    } else if (recommendation === 'pivot') {
      reasoning = `The core concept has issues that may require a significant pivot. Consider addressing: ${concerns.slice(0, 3).join(', ')}.`;
    } else {
      reasoning = `Based on our exploration, the idea faces fundamental challenges: ${concerns.slice(0, 3).join(', ')}. The path to viability is unclear.`;
    }

    return {
      score: Math.round(score * 10) / 10,
      level,
      concerns,
      strengths,
      recommendation,
      reasoning,
    };
  }

  /**
   * Update kill decision state
   * Tracks escalation through the kill decision framework
   */
  updateKillDecision(
    state: SubPersonaSessionState,
    newConcerns: string[],
    probeOccurred: boolean
  ): SubPersonaSessionState {
    const newState = { ...state };
    const currentKill = { ...state.killDecision };

    // Add new concerns (deduplicated)
    currentKill.concerns = Array.from(new Set([...currentKill.concerns, ...newConcerns]));

    // Increment probe count if a probe occurred
    if (probeOccurred) {
      currentKill.probeCount++;
    }

    // Check if exploration is complete (at least 5 exchanges and 2 probes)
    if (state.exchangeCount >= 5 && currentKill.probeCount >= 2) {
      currentKill.explorationComplete = true;
    }

    // Escalate level based on concerns and exploration
    if (currentKill.concerns.length === 0) {
      currentKill.level = 'none';
    } else if (currentKill.concerns.length <= 2) {
      currentKill.level = 'diplomatic';
    } else if (!currentKill.explorationComplete) {
      currentKill.level = 'probe';
    } else if (currentKill.concerns.length >= 4) {
      currentKill.level = 'explicit';
    } else {
      currentKill.level = 'probe';
    }

    newState.killDecision = currentKill;
    return newState;
  }

  // Quick action generators for common coaching requests
  // FR-AC9: Surface explicit mode control after ~10 exchanges
  generateQuickActions(context?: CoachingContext): string[] {
    const baseActions = [
      'Challenge my assumptions',
      'Explore alternative approaches',
      'Identify potential risks',
      'Find competitive advantages',
      'Clarify my next steps'
    ];

    // FR-AC9: Add user control options after ~10 exchanges
    if (context?.subPersonaState?.userControlEnabled) {
      return this.generateUserControlActions(context);
    }

    if (context?.currentBmadSession) {
      const phase = context.currentBmadSession.phase;
      switch (phase) {
        case 'discovery':
          return [
            'Help me dig deeper',
            'Challenge my assumptions',
            'What am I missing?',
            'Explore different angles'
          ];
        case 'analysis':
          return [
            'Validate this approach',
            'Find potential flaws',
            'Compare alternatives',
            'Assess market fit'
          ];
        case 'planning':
          return [
            'Prioritize these options',
            'Identify key risks',
            'Plan implementation',
            'Set success metrics'
          ];
        default:
          return baseActions;
      }
    }

    return baseActions;
  }

  /**
   * Generate user control actions for mode steering
   * FR-AC9: After ~10 exchanges, surface explicit mode control options
   */
  private generateUserControlActions(context: CoachingContext): string[] {
    const state = context.subPersonaState;
    if (!state) return [];

    // Core user control actions (always available after threshold)
    const controlActions = [
      'Challenge me', // Maps to devil_advocate
      'Be realistic', // Maps to realistic
      'Help me explore', // Maps to inquisitive
      'Build my confidence', // Maps to encouraging
    ];

    // Add context-specific actions based on current mode
    const currentMode = state.currentMode;
    const contextActions: string[] = [];

    switch (currentMode) {
      case 'inquisitive':
        contextActions.push("I'm ready to move forward");
        contextActions.push('What are the risks?');
        break;
      case 'devil_advocate':
        contextActions.push('What am I doing right?');
        contextActions.push("Let's find solutions");
        break;
      case 'encouraging':
        contextActions.push("I'm ready for hard truths");
        contextActions.push("What's the reality check?");
        break;
      case 'realistic':
        contextActions.push("Let's think bigger");
        contextActions.push('What opportunities am I missing?');
        break;
    }

    // Add kill decision-related action if concerns exist
    if (state.killDecision.concerns.length > 0) {
      contextActions.push('Give me your honest assessment');
    }

    // Combine and limit to 5 actions
    return [...controlActions.slice(0, 4), ...contextActions.slice(0, 1)];
  }

  /**
   * Map user control action text to UserControlAction enum
   * Used by the UI to translate user clicks into state updates
   */
  mapActionToControl(actionText: string): UserControlAction | null {
    const normalizedText = actionText.toLowerCase().trim();

    if (normalizedText.includes('challenge')) return 'challenge_me';
    if (normalizedText.includes('realistic') || normalizedText.includes('reality')) return 'be_realistic';
    if (normalizedText.includes('explore') || normalizedText.includes('bigger')) return 'help_explore';
    if (normalizedText.includes('confidence') || normalizedText.includes('doing right')) return 'encourage_me';

    return null;
  }

  /**
   * Get the current sub-persona mode description for UI display
   */
  getCurrentModeDescription(state: SubPersonaSessionState): { name: string; description: string } {
    const behavior = MODE_BEHAVIORS[state.currentMode];
    return {
      name: behavior.name,
      description: behavior.role,
    };
  }

  /**
   * Get viability assessment summary for UI display
   */
  getViabilitySummary(assessment: ViabilityAssessment): {
    scoreLabel: string;
    color: 'green' | 'yellow' | 'orange' | 'red';
    shortRecommendation: string;
  } {
    let scoreLabel: string;
    let color: 'green' | 'yellow' | 'orange' | 'red';

    if (assessment.score >= 7) {
      scoreLabel = 'Strong';
      color = 'green';
    } else if (assessment.score >= 5) {
      scoreLabel = 'Moderate';
      color = 'yellow';
    } else if (assessment.score >= 3) {
      scoreLabel = 'Weak';
      color = 'orange';
    } else {
      scoreLabel = 'Critical';
      color = 'red';
    }

    const recommendationMap = {
      proceed: 'Ready to proceed',
      validate_further: 'Needs more validation',
      pivot: 'Consider pivoting',
      kill: 'Recommend stopping',
    };

    return {
      scoreLabel,
      color,
      shortRecommendation: recommendationMap[assessment.recommendation],
    };
  }
}

// =============================================================================
// Helper Functions for External Use
// =============================================================================

/**
 * Create a new sub-persona session state for a given pathway
 * Use this when starting a new BMad session
 */
export function createSubPersonaState(pathway: string): SubPersonaSessionState {
  return maryPersona.initializeSubPersonaState(pathway);
}

/**
 * Update sub-persona state based on user interaction
 * Use this after each user message
 */
export function updateSubPersonaState(
  state: SubPersonaSessionState,
  userMessage: string,
  recentMessages: Array<{ role: 'user' | 'assistant'; content: string }>
): SubPersonaSessionState {
  return maryPersona.updateSessionState(state, userMessage, recentMessages);
}

/**
 * Apply a user control action to the sub-persona state
 * Use this when user clicks a control action
 */
export function applyUserControlAction(
  state: SubPersonaSessionState,
  action: UserControlAction
): SubPersonaSessionState {
  return maryPersona.applyUserControl(state, action);
}

// Export singleton instance
export const maryPersona = MaryPersona.getInstance();