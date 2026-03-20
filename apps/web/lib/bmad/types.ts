// BMad Method core types and interfaces

export interface BmadTemplate {
  id: string;
  name: string;
  description: string;
  version: string;
  pathway: string;
  totalDuration: number; // minutes
  phases: BmadPhase[];
  outputs: TemplateOutput[];
  metadata: TemplateMetadata;
  dependencies?: string[];
}

export interface TemplateMetadata {
  author: string;
  createdAt: Date;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface BmadPhase {
  id: string;
  name: string;
  description: string;
  timeAllocation: number; // minutes
  prompts?: BmadPrompt[];
  elicitation?: ElicitationConfig;
  outputs?: PhaseOutput[];
  nextPhaseLogic?: PhaseTransition[];
}

export interface BmadPrompt {
  id: string;
  text: string;
  type: 'open-ended' | 'structured' | 'multiple-choice';
  required: boolean;
  helpText?: string;
  options?: string[];
  structure?: {
    fields: string[];
  };
}

export enum ElicitationType {
  NUMBERED_OPTIONS = 'numbered-options',
  GUIDED_QUESTIONS = 'guided-questions',
  FRAMEWORK_CANVAS = 'framework-canvas'
}

export interface ElicitationConfig {
  type: ElicitationType;
  prompt: string;
  options: NumberedOption[];
}

export interface PhaseOutput {
  id: string;
  name: string;
  type: 'text' | 'list' | 'matrix' | 'canvas' | 'document';
  required: boolean;
  validationRules?: ValidationRule[];
}

export interface TemplateOutput {
  id: string;
  name: string;
  type: 'document' | 'framework' | 'analysis' | 'plan';
  template: string;
  includePhases: string[];
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value: string | number | boolean | RegExp;
  errorMessage: string;
}

export interface PhaseTransition {
  condition: TransitionCondition;
  nextPhase: string;
  skipConditions?: SkipCondition[];
}

export interface TransitionCondition {
  type: 'completion' | 'time' | 'user_choice' | 'quality_threshold';
  value: string | number | boolean;
}

// Session-related types
export enum PathwayType {
  NEW_IDEA = 'new-idea',
  BUSINESS_MODEL = 'business-model',
  BUSINESS_MODEL_PROBLEM = 'business-model-problem',
  FEATURE_REFINEMENT = 'feature-refinement',
  STRATEGIC_OPTIMIZATION = 'strategic-optimization',
  EXPLORE = 'explore',
}

export interface BmadPathway {
  id: PathwayType;
  name: string;
  description: string;
  targetUser: string;
  expectedOutcome: string;
  timeCommitment: number;
  templateSequence: string[];
  maryPersonaConfig: PersonaConfiguration;
}

export interface PersonaConfiguration {
  primaryPersona: 'analyst' | 'advisor' | 'coach';
  adaptationTriggers: AdaptationTrigger[];
  communicationStyle: CommunicationStyle;
}

export interface AdaptationTrigger {
  condition: string;
  targetPersona: 'analyst' | 'advisor' | 'coach';
  reason: string;
}

export interface CommunicationStyle {
  questioningStyle: 'curious' | 'challenging' | 'supportive';
  responseLength: 'concise' | 'moderate' | 'detailed';
  frameworkEmphasis: 'light' | 'moderate' | 'heavy';
}

// Session management types
export interface BmadSession {
  id: string;
  userId: string;
  workspaceId: string;
  pathway: PathwayType;
  templates: string[];
  currentPhase: string;
  currentTemplate: string;
  progress: SessionProgress;
  startTime: Date;
  timeAllocations: PhaseTimeAllocation[];
  context: SessionContext;
  outputs: SessionOutputs;
  metadata: SessionMetadata;
}

export interface SessionProgress {
  overallCompletion: number;
  phaseCompletion: { [phaseId: string]: number };
  templateCompletion: { [templateId: string]: number };
  currentStep: string;
  nextSteps: string[];
}

export interface UserResponse {
  text?: string;
  data?: Record<string, unknown>;
  elicitationChoice?: number;
  timestamp: Date;
}

export interface SessionContext {
  userResponses: { [key: string]: UserResponse };
  elicitationHistory: ElicitationHistory[];
  personaEvolution: PersonaEvolution[];
  knowledgeReferences: KnowledgeReference[];
}

export interface SessionOutputs {
  phaseOutputs: { [phaseId: string]: Record<string, unknown> };
  templateOutputs: { [templateId: string]: Record<string, unknown> };
  finalDocuments: GeneratedDocument[];
  actionItems: ActionItem[];
}

export interface ElicitationHistory {
  phaseId: string;
  timestamp: Date;
  options: NumberedOption[];
  userSelection: number | string;
  result: ElicitationResult;
}

export interface NumberedOption {
  number: number;
  text: string;
  category: string;
  estimatedTime: number;
}

export interface ElicitationResult {
  selectedPath: string;
  generatedContext: Record<string, unknown>;
  nextPhaseHint?: string;
}

// Knowledge base types
export interface KnowledgeReference {
  entryId: string;
  title: string;
  relevanceScore: number;
  appliedInPhase: string;
  timestamp: Date;
}

export interface BmadKnowledgeEntry {
  id: string;
  type: 'framework' | 'technique' | 'template' | 'case_study';
  title: string;
  content: string;
  tags: string[];
  applicablePhases: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  vector?: number[]; // for semantic search
  createdAt: Date;
  updatedAt: Date;
}

// Error handling
export class BmadMethodError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'BmadMethodError';
  }
}

export class TemplateValidationError extends BmadMethodError {
  constructor(message: string, public templateId: string, public validation: Record<string, unknown>) {
    super(message, 'TEMPLATE_VALIDATION_ERROR', { templateId, validation });
  }
}

export class SessionStateError extends BmadMethodError {
  constructor(message: string, public sessionId: string) {
    super(message, 'SESSION_STATE_ERROR', { sessionId });
  }
}

// Additional types for database integration
export interface PhaseTimeAllocation {
  phaseId: string;
  templateId: string;
  allocatedMinutes: number;
  usedMinutes: number;
  startTime?: Date;
  endTime?: Date;
}

export interface PersonaEvolution {
  phaseId: string;
  previousPersona: 'analyst' | 'advisor' | 'coach';
  newPersona: 'analyst' | 'advisor' | 'coach';
  triggerCondition: string;
  reasoning: string;
  confidenceScore: number;
  timestamp: Date;
}

export interface GeneratedDocument {
  id: string;
  name: string;
  type: string;
  content: string;
  format: 'markdown' | 'html' | 'pdf' | 'docx';
  filePath?: string;
  createdAt: Date;
}

export interface ActionItem {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionMetadata {
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  createdAt: Date;
  updatedAt: Date;
  endTime?: Date;
}

export type SessionPhaseStatus = 'pending' | 'active' | 'completed' | 'skipped';

export interface SkipCondition {
  type: string;
  value: string | number | boolean;
}

export interface PhaseResult {
  phaseComplete: boolean;
  outputs: Record<string, unknown>;
  errors?: string[];
  warnings?: string[];
  nextPhaseRecommendation?: string;
}

export interface DatabaseSessionData {
  id: string;
  user_id: string;
  workspace_id: string;
  pathway_type: PathwayType;
  current_phase: string;
  started_at: string;
  session_config: {
    templates: string[];
    timeAllocations: PhaseTimeAllocation[];
  };
  progress: SessionProgress;
  context: SessionContext;
  outputs: SessionOutputs;
  metadata: SessionMetadata;
}

export interface InputAnalysis {
  intent: string;
  complexity: number;
  keywords: string[];
  suggestions: string[];
}

// New Idea pathway specific types
export interface NewIdeaSessionData {
  rawIdea?: string;
  ideationInsights: string[];
  marketOpportunities: MarketOpportunity[];
  uniqueValueProps: string[];
  competitiveLandscape: CompetitorAnalysis[];
  targetAudience?: TargetAudience;
  businessModelElements?: BusinessModelElements;
  conceptDocument?: BusinessConcept;
  marketAnalysis?: MarketAnalysisReport;
  actionRoadmap?: ActionRoadmap;
}

export interface MarketOpportunity {
  id: string;
  description: string;
  marketSize: string;
  growthPotential: 'low' | 'medium' | 'high';
  confidence: number;
  insights: string[];
}

export interface CompetitorAnalysis {
  name: string;
  strengths: string[];
  weaknesses: string[];
  marketPosition: string;
  differentiators: string[];
}

export interface TargetAudience {
  primarySegment: string;
  demographics: string[];
  psychographics: string[];
  painPoints: string[];
  desiredOutcomes: string[];
}

export interface BusinessModelElements {
  revenueStreams: string[];
  costStructure: string[];
  keyActivities: string[];
  keyResources: string[];
  channels: string[];
  customerRelationships: string[];
}

export interface BusinessConcept {
  title: string;
  executiveSummary: string;
  problemStatement: string;
  solution: string;
  uniqueValueProposition: string;
  targetMarket: TargetAudience;
  competitiveAdvantage: string;
  businessModel: BusinessModelElements;
  marketOpportunity: MarketOpportunity[];
  nextSteps: string[];
  risks: string[];
  successMetrics: string[];
}

export interface MarketAnalysisReport {
  marketSize: string;
  competitiveLandscape: CompetitorAnalysis[];
  opportunities: MarketOpportunity[];
  targetSegments: TargetAudience;
  entryBarriers: string[];
  recommendations: string[];
}

export interface ActionRoadmap {
  immediate: string[];
  shortTerm: string[];
  longTerm: string[];
  milestones: Array<{milestone: string, timeframe: string}>;
  resources: string[];
}

// Feature Refinement pathway specific types
export interface FeatureInputData {
  feature_description: string;
  target_users?: string;
  current_problems?: string;
  success_definition?: string;
  analysis_questions: string[];
  input_timestamp: Date;
}

export interface PriorityScoring {
  effort_score: number; // 1-10
  impact_score: number; // 1-10
  calculated_priority: number; // impact/effort ratio
  priority_category: 'Critical' | 'High' | 'Medium' | 'Low';
  quadrant: 'Quick Wins' | 'Major Projects' | 'Fill-ins' | 'Time Wasters';
  scoring_timestamp: Date;
}

export interface PriorityMatrix {
  quadrants: {
    quickWins: { minImpact: 7, maxEffort: 4 };
    majorProjects: { minImpact: 7, minEffort: 5 };
    fillIns: { maxImpact: 6, maxEffort: 4 };
    timeWasters: { maxImpact: 6, minEffort: 5 };
  };
}

// Feature Brief types (Story 2.4c)
export interface FeatureBrief {
  id: string;
  title: string;
  description: string;
  userStories: string[];
  acceptanceCriteria: string[];
  successMetrics: string[];
  implementationNotes: string[];
  priorityContext: {
    score: number;
    category: string;
    quadrant: string;
  };
  generatedAt: Date;
  lastEditedAt: Date;
  version: number;
}

export interface FeatureSessionData {
  featureInput: FeatureInputData;
  priorityScoring: PriorityScoring;
  featureBrief?: FeatureBrief;
}

export interface ExportFormat {
  format: 'markdown' | 'text' | 'pdf';
  content: string;
  filename: string;
}

export interface BriefGenerationRequest {
  sessionId: string;
  regenerate?: boolean;
}

export interface BriefUpdateRequest {
  sessionId: string;
  briefId: string;
  updates: Partial<FeatureBrief>;
}

export interface BriefQualityValidation {
  isValid: boolean;
  qualityScore: number;
  errors: string[];
  warnings: string[];
}