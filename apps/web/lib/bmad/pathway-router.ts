import {
  PathwayType,
  BmadPathway,
  BmadMethodError
} from './types';

/**
 * Cognitive Framework Modes (Story 2.6)
 * Maps pathways to appropriate cognitive frameworks for deeper strategic thinking
 */
export interface CognitiveMode {
  name: string;
  description: string;
  frameworks: string[];
  keyQuestions: string[];
}

export const PATHWAY_COGNITIVE_MODES: Record<PathwayType, CognitiveMode> = {
  [PathwayType.NEW_IDEA]: {
    name: 'Thinking about Value',
    description: 'Focus on understanding what value you create and for whom',
    frameworks: ['Jobs-to-be-Done', 'Value Proposition Canvas', 'Customer Development'],
    keyQuestions: [
      'What job is the customer trying to get done?',
      'What pains are they experiencing with current solutions?',
      'What gains would make their life meaningfully better?',
      'Why would someone switch from their current solution to yours?',
    ],
  },
  [PathwayType.BUSINESS_MODEL]: {
    name: 'Thinking through Constraints',
    description: 'Systematically test assumptions that could make or break your model',
    frameworks: ['Assumption Testing', 'Lean Validation', 'Risk Assessment'],
    keyQuestions: [
      'What must be true for this business model to work?',
      'Which assumptions carry the highest risk if wrong?',
      'How could you test this assumption with minimal investment?',
      'What would kill this business model fastest?',
    ],
  },
  [PathwayType.BUSINESS_MODEL_PROBLEM]: {
    name: 'Thinking through Constraints',
    description: 'Identify and address the constraints blocking your revenue model',
    frameworks: ['Constraint Analysis', 'Root Cause Analysis', 'Business Model Canvas'],
    keyQuestions: [
      'What is the real constraint preventing growth?',
      'Is this a demand problem, pricing problem, or delivery problem?',
      'What evidence do you have for the root cause?',
      'If this constraint disappeared, what would change?',
    ],
  },
  [PathwayType.FEATURE_REFINEMENT]: {
    name: 'Thinking with People',
    description: 'Co-design with users to ensure features solve real problems',
    frameworks: ['Co-Design', 'User Story Mapping', 'Design Thinking'],
    keyQuestions: [
      'How did you learn that users want this feature?',
      'What does success look like from the user\'s perspective?',
      'What would users give up to have this feature?',
      'How will you know if the feature is working?',
    ],
  },
  [PathwayType.STRATEGIC_OPTIMIZATION]: {
    name: 'Thinking about Systems',
    description: 'Understand the interconnections and optimize the whole system',
    frameworks: ['Systems Thinking', 'Impact Mapping', 'Feedback Loops'],
    keyQuestions: [
      'How does this change affect other parts of the system?',
      'What second-order effects might occur?',
      'Where are the leverage points for maximum impact?',
      'What feedback loops exist that could amplify or dampen this change?',
    ],
  },
  [PathwayType.EXPLORE]: {
    name: 'First Principles Exploration',
    description: 'Challenge assumptions and pressure-test ideas through structured loops',
    frameworks: ['First Principles', 'Assumption Reversal', 'Provocation Technique'],
    keyQuestions: [
      'What is the fundamental problem this solves?',
      'Who feels this pain most acutely?',
      'What is the riskiest assumption you are making?',
      'What would have to be true for this to work?',
    ],
  },
};

/**
 * Get cognitive mode for a pathway type
 */
export function getCognitiveMode(pathwayType: PathwayType): CognitiveMode {
  return PATHWAY_COGNITIVE_MODES[pathwayType];
}

/**
 * Pathway recommendation result
 */
export interface PathwayRecommendation {
  primary: PathwayType;
  confidence: number;
  reasoning: string;
  alternatives: {
    pathway: PathwayType;
    confidence: number;
    reasoning: string;
  }[];
}

/**
 * User intent analysis result
 */
export interface IntentAnalysis {
  keywords: string[];
  category: 'ideation' | 'validation' | 'optimization' | 'planning';
  urgency: 'low' | 'medium' | 'high';
  scope: 'feature' | 'product' | 'business' | 'market';
  confidence: number;
}

/**
 * BMad Method Pathway Router
 * Analyzes user intent and routes to appropriate strategic pathway
 */
export class PathwayRouter {
  private pathways: Map<PathwayType, BmadPathway>;
  private intentClassifier: IntentClassifier;

  constructor() {
    this.pathways = new Map();
    this.intentClassifier = new IntentClassifier();
    this.initializePathways();
  }

  /**
   * Initialize the three core BMad Method pathways
   */
  private initializePathways(): void {
    // New Idea Pathway
    this.pathways.set(PathwayType.NEW_IDEA, {
      id: PathwayType.NEW_IDEA,
      name: "New Idea Exploration",
      description: "Transform raw ideas into validated business concepts using structured BMad Method brainstorming and market analysis",
      targetUser: "Early-stage entrepreneurs, innovation teams, ideation facilitators",
      expectedOutcome: "Validated idea with market positioning and next-step validation plan",
      timeCommitment: 30,
      templateSequence: ['brainstorm-session', 'market-research', 'project-brief'],
      maryPersonaConfig: {
        primaryPersona: 'analyst',
        adaptationTriggers: [
          {
            condition: 'creative_block_detected',
            targetPersona: 'coach',
            reason: 'User needs creative breakthrough techniques'
          },
          {
            condition: 'analysis_phase_entered', 
            targetPersona: 'advisor',
            reason: 'Strategic evaluation and decision-making required'
          }
        ],
        communicationStyle: {
          questioningStyle: 'curious',
          responseLength: 'moderate',
          frameworkEmphasis: 'moderate'
        }
      }
    });

    // Business Model Pathway
    this.pathways.set(PathwayType.BUSINESS_MODEL, {
      id: PathwayType.BUSINESS_MODEL,
      name: "Business Model Analysis",
      description: "Solve revenue and business model challenges using systematic BMad Method market research and competitive analysis",
      targetUser: "SaaS founders, business development teams, strategy consultants",
      expectedOutcome: "Revenue strategy with validated market assumptions and implementation roadmap",
      timeCommitment: 30,
      templateSequence: ['business-model-canvas', 'competitive-analysis', 'market-research'],
      maryPersonaConfig: {
        primaryPersona: 'advisor',
        adaptationTriggers: [
          {
            condition: 'data_collection_needed',
            targetPersona: 'analyst',
            reason: 'Systematic data gathering and market research required'
          },
          {
            condition: 'strategic_options_evaluation',
            targetPersona: 'advisor', 
            reason: 'Strategic decision-making and trade-off analysis needed'
          }
        ],
        communicationStyle: {
          questioningStyle: 'challenging',
          responseLength: 'detailed',
          frameworkEmphasis: 'heavy'
        }
      }
    });

    // Business Model Problem Pathway
    this.pathways.set(PathwayType.BUSINESS_MODEL_PROBLEM, {
      id: PathwayType.BUSINESS_MODEL_PROBLEM,
      name: "Business Model Problem Analysis",
      description: "Systematic analysis of revenue streams, customer segments, and value propositions to solve specific business model challenges",
      targetUser: "Business owners with monetization and revenue model challenges",
      expectedOutcome: "Lean Canvas with detailed implementation roadmap and monetization strategy",
      timeCommitment: 35,
      templateSequence: ['revenue-analysis', 'customer-segmentation', 'value-proposition', 'monetization-strategy', 'implementation-planning'],
      maryPersonaConfig: {
        primaryPersona: 'analyst',
        adaptationTriggers: [
          {
            condition: 'strategic_planning_needed',
            targetPersona: 'advisor',
            reason: 'Strategic decision-making and implementation planning required'
          }
        ],
        communicationStyle: {
          questioningStyle: 'challenging',
          responseLength: 'detailed',
          frameworkEmphasis: 'heavy'
        }
      }
    });

    // Feature Refinement Pathway
    this.pathways.set(PathwayType.FEATURE_REFINEMENT, {
      id: PathwayType.FEATURE_REFINEMENT,
      name: "Feature Refinement & User-Centered Design",
      description: "Stress-test features against user needs and business goals with systematic validation, prioritization, and feature brief creation",
      targetUser: "Product managers and designers validating features",
      expectedOutcome: "Data-driven feature brief with priority matrix and measurable success metrics",
      timeCommitment: 20,
      templateSequence: ['feature-validation', 'user-analysis', 'business-impact', 'prioritization', 'brief-creation'],
      maryPersonaConfig: {
        primaryPersona: 'advisor',
        adaptationTriggers: [
          {
            condition: 'user_research_needed',
            targetPersona: 'analyst',
            reason: 'Systematic user feedback collection and analysis required'
          },
          {
            condition: 'creative_alternatives_needed',
            targetPersona: 'coach',
            reason: 'Alternative approaches and creative solutions needed'
          }
        ],
        communicationStyle: {
          questioningStyle: 'supportive',
          responseLength: 'moderate',
          frameworkEmphasis: 'moderate'
        }
      }
    });

    // Strategic Optimization Pathway (legacy - kept for backward compatibility)
    this.pathways.set(PathwayType.STRATEGIC_OPTIMIZATION, {
      id: PathwayType.STRATEGIC_OPTIMIZATION,
      name: "Strategic Optimization",
      description: "Refine and optimize existing features or concepts using data-driven BMad Method competitive analysis and user research",
      targetUser: "Product managers, strategic consultants, optimization teams",
      expectedOutcome: "Feature roadmap with competitive positioning and user-validated priorities",
      timeCommitment: 25,
      templateSequence: ['competitive-analysis', 'user-research', 'feature-prioritization'],
      maryPersonaConfig: {
        primaryPersona: 'advisor',
        adaptationTriggers: [
          {
            condition: 'user_research_needed',
            targetPersona: 'analyst',
            reason: 'Systematic user feedback collection and analysis required'
          },
          {
            condition: 'creative_alternatives_needed',
            targetPersona: 'coach',
            reason: 'Alternative approaches and creative solutions needed'
          }
        ],
        communicationStyle: {
          questioningStyle: 'challenging',
          responseLength: 'concise',
          frameworkEmphasis: 'heavy'
        }
      }
    });
  }

  /**
   * Analyze user input and recommend optimal pathway
   */
  async analyzeUserIntent(userInput: string): Promise<PathwayRecommendation> {
    try {
      // Classify user intent
      const intentAnalysis = await this.intentClassifier.analyze(userInput);
      
      // Score each pathway based on intent
      const pathwayScores = await this.scorePathways(intentAnalysis, userInput);
      
      // Generate recommendation
      return this.generateRecommendation(pathwayScores, intentAnalysis);
    } catch (error) {
      throw new BmadMethodError(
        `Failed to analyze user intent: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'INTENT_ANALYSIS_ERROR',
        { userInput, originalError: error }
      );
    }
  }

  /**
   * Score pathways based on intent analysis - Enhanced algorithm for meaningful confidence scores
   */
  private async scorePathways(
    intentAnalysis: IntentAnalysis,
    userInput: string
  ): Promise<Map<PathwayType, number>> {
    const scores = new Map<PathwayType, number>();
    
    // Calculate base scores using enhanced algorithm for all pathways
    const newIdeaScore = this.calculateEnhancedPathwayScore(userInput, intentAnalysis, PathwayType.NEW_IDEA);
    const businessModelScore = this.calculateEnhancedPathwayScore(userInput, intentAnalysis, PathwayType.BUSINESS_MODEL);
    const businessModelProblemScore = this.calculateEnhancedPathwayScore(userInput, intentAnalysis, PathwayType.BUSINESS_MODEL_PROBLEM);
    const featureRefinementScore = this.calculateEnhancedPathwayScore(userInput, intentAnalysis, PathwayType.FEATURE_REFINEMENT);
    const optimizationScore = this.calculateEnhancedPathwayScore(userInput, intentAnalysis, PathwayType.STRATEGIC_OPTIMIZATION);
    
    scores.set(PathwayType.NEW_IDEA, newIdeaScore);
    scores.set(PathwayType.BUSINESS_MODEL, businessModelScore);
    scores.set(PathwayType.BUSINESS_MODEL_PROBLEM, businessModelProblemScore);
    scores.set(PathwayType.FEATURE_REFINEMENT, featureRefinementScore);
    scores.set(PathwayType.STRATEGIC_OPTIMIZATION, optimizationScore);
    
    // Apply confidence normalization to ensure meaningful scores (>50% for good matches)
    return this.normalizeConfidenceScores(scores);
  }

  /**
   * Enhanced pathway scoring algorithm with better confidence calculation
   */
  private calculateEnhancedPathwayScore(
    userInput: string, 
    intentAnalysis: IntentAnalysis, 
    pathway: PathwayType
  ): number {
    let score = 0.5; // Start with base confidence of 50%

    // Enhanced keyword matching with weighted terms
    const keywordScore = this.calculateEnhancedKeywordScore(userInput, pathway);
    score += keywordScore * 0.3; // Up to 30% boost from keyword matching

    // Intent category alignment (stronger weighting)
    const categoryScore = this.calculateCategoryAlignment(intentAnalysis, pathway);
    score += categoryScore * 0.25; // Up to 25% boost from category alignment

    // Scope alignment
    const scopeScore = this.calculateScopeAlignment(intentAnalysis, pathway);
    score += scopeScore * 0.2; // Up to 20% boost from scope alignment

    // Context analysis (semantic understanding)
    const contextScore = this.calculateContextScore(userInput, pathway);
    score += contextScore * 0.15; // Up to 15% boost from context understanding

    // Urgency factor adjustment
    const urgencyScore = this.calculateUrgencyAlignment(intentAnalysis, pathway);
    score += urgencyScore * 0.1; // Up to 10% adjustment from urgency

    return Math.min(score, 1.0);
  }

  /**
   * Enhanced keyword scoring with weighted terms and phrase matching
   */
  private calculateEnhancedKeywordScore(userInput: string, pathway: PathwayType): number {
    const lowercaseInput = userInput.toLowerCase();
    
    const pathwayKeywords = {
      [PathwayType.NEW_IDEA]: {
        primary: ['new idea', 'startup', 'innovation', 'creative', 'concept'], // 10 points each
        secondary: ['brainstorm', 'ideation', 'opportunity', 'vision', 'invention'], // 7 points each
        contextual: ['dream', 'imagine', 'create', 'develop', 'launch'] // 5 points each
      },
      [PathwayType.BUSINESS_MODEL]: {
        primary: ['revenue', 'business model', 'monetization', 'pricing', 'profit'], // 10 points each
        secondary: ['sales', 'market', 'customers', 'value proposition', 'income'], // 7 points each
        contextual: ['competition', 'strategy', 'growth', 'scalable', 'sustainable'] // 5 points each
      },
      [PathwayType.BUSINESS_MODEL_PROBLEM]: {
        primary: ['monetization', 'revenue problem', 'business model', 'profit', 'income'], // 10 points each
        secondary: ['pricing', 'customer segments', 'value streams', 'market analysis'], // 7 points each
        contextual: ['stuck', 'struggling', 'challenge', 'problem', 'difficulty'] // 5 points each
      },
      [PathwayType.FEATURE_REFINEMENT]: {
        primary: ['feature', 'refinement', 'user-centered', 'validation', 'product'], // 10 points each
        secondary: ['prioritize', 'user needs', 'design', 'testing', 'improvement'], // 7 points each
        contextual: ['usability', 'user feedback', 'metrics', 'experience', 'interface'] // 5 points each
      },
      [PathwayType.STRATEGIC_OPTIMIZATION]: {
        primary: ['improve', 'optimize', 'enhance', 'better', 'refine'], // 10 points each
        secondary: ['fix', 'problem', 'performance', 'efficiency', 'iteration'], // 7 points each
        contextual: ['user experience', 'feature', 'process', 'workflow', 'quality'] // 5 points each
      }
    };

    const keywords = pathwayKeywords[pathway];
    let totalScore = 0;
    let maxScore = (keywords.primary.length * 10) + (keywords.secondary.length * 7) + (keywords.contextual.length * 5);

    // Score primary keywords
    keywords.primary.forEach(keyword => {
      if (lowercaseInput.includes(keyword)) totalScore += 10;
    });

    // Score secondary keywords  
    keywords.secondary.forEach(keyword => {
      if (lowercaseInput.includes(keyword)) totalScore += 7;
    });

    // Score contextual keywords
    keywords.contextual.forEach(keyword => {
      if (lowercaseInput.includes(keyword)) totalScore += 5;
    });

    return Math.min(totalScore / maxScore, 1.0);
  }

  /**
   * Calculate category alignment score
   */
  private calculateCategoryAlignment(intentAnalysis: IntentAnalysis, pathway: PathwayType): number {
    const alignmentMap = {
      [PathwayType.NEW_IDEA]: {
        'ideation': 1.0,
        'planning': 0.7,
        'validation': 0.5,
        'optimization': 0.2
      },
      [PathwayType.BUSINESS_MODEL]: {
        'validation': 1.0,
        'planning': 1.0,
        'ideation': 0.6,
        'optimization': 0.4
      },
      [PathwayType.BUSINESS_MODEL_PROBLEM]: {
        'validation': 1.0,
        'planning': 0.9,
        'optimization': 0.7,
        'ideation': 0.3
      },
      [PathwayType.FEATURE_REFINEMENT]: {
        'validation': 1.0,
        'optimization': 0.9,
        'planning': 0.7,
        'ideation': 0.4
      },
      [PathwayType.STRATEGIC_OPTIMIZATION]: {
        'optimization': 1.0,
        'validation': 0.8,
        'planning': 0.6,
        'ideation': 0.3
      }
    };

    return alignmentMap[pathway]?.[intentAnalysis.category] || 0.5;
  }

  /**
   * Calculate scope alignment score
   */
  private calculateScopeAlignment(intentAnalysis: IntentAnalysis, pathway: PathwayType): number {
    const scopeMap = {
      [PathwayType.NEW_IDEA]: {
        'business': 1.0,
        'market': 0.9,
        'product': 0.7,
        'feature': 0.3
      },
      [PathwayType.BUSINESS_MODEL]: {
        'business': 1.0,
        'market': 1.0,
        'product': 0.8,
        'feature': 0.4
      },
      [PathwayType.BUSINESS_MODEL_PROBLEM]: {
        'business': 1.0,
        'market': 0.9,
        'product': 0.7,
        'feature': 0.4
      },
      [PathwayType.FEATURE_REFINEMENT]: {
        'feature': 1.0,
        'product': 1.0,
        'business': 0.6,
        'market': 0.5
      },
      [PathwayType.STRATEGIC_OPTIMIZATION]: {
        'product': 1.0,
        'feature': 1.0,
        'business': 0.7,
        'market': 0.6
      }
    };

    return scopeMap[pathway]?.[intentAnalysis.scope] || 0.5;
  }

  /**
   * Calculate context score based on semantic analysis
   */
  private calculateContextScore(userInput: string, pathway: PathwayType): number {
    // Length-based confidence (longer inputs show more context)
    const lengthFactor = Math.min(userInput.length / 100, 1.0) * 0.3;
    
    // Specificity indicators
    const specificityScore = this.calculateSpecificity(userInput) * 0.4;
    
    // Question vs statement analysis
    const statementScore = userInput.includes('?') ? 0.2 : 0.3; // Statements show more direction
    
    return lengthFactor + specificityScore + statementScore;
  }

  /**
   * Calculate urgency alignment 
   */
  private calculateUrgencyAlignment(intentAnalysis: IntentAnalysis, pathway: PathwayType): number {
    const urgencyMap = {
      [PathwayType.NEW_IDEA]: {
        'low': 0.3,
        'medium': 0.1,
        'high': -0.1 // New ideas don't typically need high urgency
      },
      [PathwayType.BUSINESS_MODEL]: {
        'low': 0.1,
        'medium': 0.2,
        'high': 0.3 // Business model work often has urgency
      },
      [PathwayType.BUSINESS_MODEL_PROBLEM]: {
        'low': 0.0,
        'medium': 0.3,
        'high': 0.4 // Business model problems often urgent
      },
      [PathwayType.FEATURE_REFINEMENT]: {
        'low': 0.1,
        'medium': 0.3,
        'high': 0.2 // Feature work has moderate urgency alignment
      },
      [PathwayType.STRATEGIC_OPTIMIZATION]: {
        'low': -0.1,
        'medium': 0.2,
        'high': 0.3 // Optimization often driven by problems needing fixes
      }
    };

    return urgencyMap[pathway]?.[intentAnalysis.urgency] || 0;
  }

  /**
   * Calculate input specificity score
   */
  private calculateSpecificity(userInput: string): number {
    const specificityIndicators = [
      'healthcare', 'fintech', 'saas', 'mobile app', 'web app', 
      'ai', 'machine learning', 'blockchain', 'iot', 'api',
      'dashboard', 'analytics', 'crm', 'erp', 'marketplace'
    ];
    
    const lowercaseInput = userInput.toLowerCase();
    const matches = specificityIndicators.filter(indicator => 
      lowercaseInput.includes(indicator)
    ).length;
    
    return Math.min(matches / 3, 1.0); // Normalize to max of 1.0
  }

  /**
   * Normalize confidence scores to ensure meaningful percentages (>50% for good matches)
   */
  private normalizeConfidenceScores(scores: Map<PathwayType, number>): Map<PathwayType, number> {
    const normalizedScores = new Map<PathwayType, number>();
    
    // Find the highest score
    const maxScore = Math.max(...scores.values());
    
    // If the max score is too low, boost all scores proportionally
    const boostFactor = maxScore < 0.5 ? 0.5 / maxScore : 1.0;
    
    scores.forEach((score, pathway) => {
      let normalizedScore = score * boostFactor;
      
      // Ensure minimum meaningful confidence for any reasonable match
      if (normalizedScore > 0.3) {
        normalizedScore = Math.max(normalizedScore, 0.5);
      }
      
      // Cap at 95% to maintain some uncertainty
      normalizedScore = Math.min(normalizedScore, 0.95);
      
      normalizedScores.set(pathway, normalizedScore);
    });
    
    return normalizedScores;
  }

  /**
   * Calculate keyword matching score
   */
  private calculateKeywordScore(text: string, keywords: string[]): number {
    const lowercaseText = text.toLowerCase();
    const matches = keywords.filter(keyword => lowercaseText.includes(keyword.toLowerCase()));
    return matches.length / keywords.length;
  }

  /**
   * Generate pathway recommendation from scores
   */
  private generateRecommendation(
    scores: Map<PathwayType, number>,
    intentAnalysis: IntentAnalysis
  ): PathwayRecommendation {
    // Sort pathways by score
    const sortedPathways = Array.from(scores.entries())
      .sort(([,a], [,b]) => b - a);

    const [primaryPathway, primaryScore] = sortedPathways[0];
    const alternatives = sortedPathways.slice(1, 3).map(([pathway, score]) => ({
      pathway,
      confidence: score,
      reasoning: this.generateReasoningForPathway(pathway, score, intentAnalysis)
    }));

    return {
      primary: primaryPathway,
      confidence: primaryScore,
      reasoning: this.generateReasoningForPathway(primaryPathway, primaryScore, intentAnalysis),
      alternatives
    };
  }

  /**
   * Generate human-readable reasoning for pathway selection
   */
  private generateReasoningForPathway(
    pathway: PathwayType,
    score: number,
    _intentAnalysis: IntentAnalysis
  ): string {
    const pathwayInfo = this.pathways.get(pathway)!;
    const confidenceLevel = score > 0.7 ? 'high' : score > 0.4 ? 'medium' : 'low';

    let reasoning = `${pathwayInfo.name} shows ${confidenceLevel} alignment (${Math.round(score * 100)}%) `;

    switch (pathway) {
      case PathwayType.NEW_IDEA:
        reasoning += `based on ideation-focused language and early-stage exploration needs. `;
        reasoning += `Best for transforming raw concepts into validated business opportunities.`;
        break;
        
      case PathwayType.BUSINESS_MODEL:
        reasoning += `based on revenue and market-focused language. `;
        reasoning += `Optimal for solving monetization and business model challenges with systematic analysis.`;
        break;

      case PathwayType.BUSINESS_MODEL_PROBLEM:
        reasoning += `based on monetization challenges and revenue problem indicators. `;
        reasoning += `Specialized for systematic business model problem-solving with detailed analysis.`;
        break;

      case PathwayType.FEATURE_REFINEMENT:
        reasoning += `based on feature validation and user-centered design language. `;
        reasoning += `Designed for stress-testing features against user needs with prioritization frameworks.`;
        break;
        
      case PathwayType.STRATEGIC_OPTIMIZATION:
        reasoning += `based on improvement and optimization-focused language. `;
        reasoning += `Perfect for refining existing concepts with data-driven competitive analysis.`;
        break;
    }

    return reasoning;
  }

  /**
   * Get pathway configuration
   */
  getPathway(pathwayType: PathwayType): BmadPathway | null {
    return this.pathways.get(pathwayType) || null;
  }

  /**
   * List all available pathways
   */
  getAllPathways(): BmadPathway[] {
    return Array.from(this.pathways.values());
  }

  /**
   * Get pathway by template sequence
   */
  getPathwayByTemplates(templateIds: string[]): PathwayType | null {
    for (const [pathwayType, pathway] of this.pathways) {
      if (this.arraysEqual(pathway.templateSequence, templateIds)) {
        return pathwayType;
      }
    }
    return null;
  }

  private arraysEqual(a: string[], b: string[]): boolean {
    return a.length === b.length && a.every((val, i) => val === b[i]);
  }
}

/**
 * Simple intent classification system
 */
class IntentClassifier {
  async analyze(userInput: string): Promise<IntentAnalysis> {
    const lowercaseInput = userInput.toLowerCase();
    
    // Extract keywords
    const keywords = this.extractKeywords(lowercaseInput);
    
    // Classify category
    const category = this.classifyCategory(lowercaseInput);
    
    // Determine urgency
    const urgency = this.classifyUrgency(lowercaseInput);
    
    // Determine scope
    const scope = this.classifyScope(lowercaseInput);

    return {
      keywords,
      category,
      urgency,
      scope,
      confidence: 0.75 // Simple fixed confidence for now
    };
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - could be enhanced with NLP
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'am', 'is', 'are', 'was', 'were', 'be', 'been',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might'
    ]);

    return text
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.has(word))
      .slice(0, 10); // Limit to top 10 keywords
  }

  private classifyCategory(text: string): 'ideation' | 'validation' | 'optimization' | 'planning' {
    const ideationKeywords = ['idea', 'brainstorm', 'creative', 'innovation', 'concept'];
    const validationKeywords = ['validate', 'test', 'proof', 'research', 'market'];
    const optimizationKeywords = ['improve', 'optimize', 'better', 'enhance', 'fix'];
    const planningKeywords = ['plan', 'strategy', 'roadmap', 'timeline', 'execute'];

    const scores = {
      ideation: this.countKeywords(text, ideationKeywords),
      validation: this.countKeywords(text, validationKeywords),
      optimization: this.countKeywords(text, optimizationKeywords),
      planning: this.countKeywords(text, planningKeywords)
    };

    return (Object.keys(scores) as Array<keyof typeof scores>).reduce((a, b) => scores[a] > scores[b] ? a : b);
  }

  private classifyUrgency(text: string): 'low' | 'medium' | 'high' {
    const highUrgencyKeywords = ['urgent', 'asap', 'emergency', 'critical', 'deadline', 'immediately'];
    const mediumUrgencyKeywords = ['soon', 'quickly', 'fast', 'priority', 'important'];
    
    if (this.countKeywords(text, highUrgencyKeywords) > 0) return 'high';
    if (this.countKeywords(text, mediumUrgencyKeywords) > 0) return 'medium';
    return 'low';
  }

  private classifyScope(text: string): 'feature' | 'product' | 'business' | 'market' {
    const featureKeywords = ['feature', 'function', 'capability', 'component'];
    const productKeywords = ['product', 'app', 'platform', 'service', 'tool'];
    const businessKeywords = ['business', 'company', 'revenue', 'profit', 'model'];
    const marketKeywords = ['market', 'industry', 'sector', 'competitive', 'customer'];

    const scores = {
      feature: this.countKeywords(text, featureKeywords),
      product: this.countKeywords(text, productKeywords),
      business: this.countKeywords(text, businessKeywords),
      market: this.countKeywords(text, marketKeywords)
    };

    return (Object.keys(scores) as Array<keyof typeof scores>).reduce((a, b) => scores[a] > scores[b] ? a : b);
  }

  private countKeywords(text: string, keywords: string[]): number {
    return keywords.reduce((count, keyword) => 
      text.includes(keyword) ? count + 1 : count, 0);
  }
}

// Export singleton instance
export const pathwayRouter = new PathwayRouter();