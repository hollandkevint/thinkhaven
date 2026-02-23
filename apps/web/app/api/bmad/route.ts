import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sessionOrchestrator } from '@/lib/bmad/session-orchestrator';
import { pathwayRouter } from '@/lib/bmad/pathway-router';
import { bmadKnowledgeBase } from '@/lib/bmad/knowledge-base';
import { BmadDatabase } from '@/lib/bmad/database';
import { PathwayType, FeatureInputData, PriorityScoring } from '@/lib/bmad/types';
import { RateLimiter } from '@/lib/security/rate-limiter';
import {
  validateFeatureInput,
  createFeatureAnalysisPrompt,
  analyzeFeatureInput,
  generateAnalysisId
} from '@/lib/bmad/pathways/feature-input';
import {
  selectBestQuestions,
  getFallbackQuestions,
  validateQuestions
} from '@/lib/bmad/analysis/feature-questions';
import {
  calculatePriority,
  validatePriorityScoring,
  getPriorityRecommendations,
  analyzePriority
} from '@/lib/bmad/pathways/priority-scoring';
import { FeatureBriefGenerator } from '@/lib/bmad/generators/feature-brief-generator';
import { BusinessModelPathwayOrchestrator } from '@/lib/bmad/pathways/business-model-pathway-orchestrator';

/**
 * BMad Method API Endpoints
 * Handles all BMad Method session management and strategic workflows
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // SECURITY: Rate limiting for API endpoints
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      const identifier = user?.id || getRateLimitIdentifier(request);
      const { allowed, remainingRequests, resetTime } = RateLimiter.checkRateLimit(identifier, 'bmad');

      if (!allowed) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please try again later.',
            retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': '60',
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': new Date(resetTime).toISOString()
            }
          }
        );
      }
    }
    
    // Allow test access only in non-production environments
    const referer = request.headers.get('referer') || '';
    const isTestRequest = process.env.NODE_ENV !== 'production' && referer.includes('/test-bmad-buttons');

    if ((authError || !user) && !isTestRequest) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (isTestRequest && process.env.NODE_ENV !== 'production') {
      (global as { BMAD_TEST_MODE?: boolean }).BMAD_TEST_MODE = true;
    }

    const userId = user?.id || (isTestRequest ? 'test-user-id' : '');

    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'analyze_intent':
        return await handleAnalyzeIntent(params);
        
      case 'create_session':
        return await handleCreateSession(userId, params);
        
      case 'advance_session':
        return await handleAdvanceSession(userId, params);

      case 'get_session':
        return await handleGetSession(userId, params);
        
      case 'search_knowledge':
        return await handleSearchKnowledge(params);
        
      case 'get_user_sessions':
        return await handleGetUserSessions(userId, params);

      case 'analyze_feature_input':
        return await handleAnalyzeFeatureInput(userId, params);

      case 'save_feature_input':
        return await handleSaveFeatureInput(userId, params);

      case 'calculate_priority':
        return await handleCalculatePriority(userId, params);

      case 'save_priority_scoring':
        return await handleSavePriorityScoring(userId, params);

      case 'generate_feature_brief':
        return await handleGenerateFeatureBrief(userId, params);

      case 'update_feature_brief':
        return await handleUpdateFeatureBrief(userId, params);

      case 'regenerate_feature_brief':
        return await handleRegenerateFeatureBrief(userId, params);

      case 'export_feature_brief':
        return await handleExportFeatureBrief(userId, params);

      // Universal Session State Management endpoints
      case 'switch_pathway':
        return await handleSwitchPathway(userId, params);

      case 'backup_session_state':
        return await handleBackupSessionState(userId, params);

      case 'restore_session':
        return await handleRestoreSession(userId, params);

      case 'session_analytics':
        return await handleSessionAnalytics(userId, params);

      case 'sync_session_state':
        return await handleSyncSessionState(userId, params);

      // Business Model Pathway endpoints
      case 'analyze_revenue_streams':
        return await handleAnalyzeRevenueStreams(userId, params);

      case 'segment_customers':
        return await handleSegmentCustomers(userId, params);

      case 'generate_monetization_strategy':
        return await handleGenerateMonetizationStrategy(userId, params);

      case 'generate_implementation_roadmap':
        return await handleGenerateImplementationRoadmap(userId, params);

      case 'run_business_model_pathway':
        return await handleRunBusinessModelPathway(userId, params);

      case 'generate_business_model_canvas':
        return await handleGenerateBusinessModelCanvas(userId, params);

      // Canvas Workspace endpoints
      case 'save_canvas_state':
        return await handleSaveCanvasState(userId, params);

      case 'load_canvas_state':
        return await handleLoadCanvasState(userId, params);

      case 'export_canvas':
        return await handleExportCanvas(params);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('BMad API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Internal server error', details: process.env.NODE_ENV !== 'production' ? errorMessage : undefined },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Allow test access only in non-production environments
    const referer = request.headers.get('referer') || '';
    const isTestRequest = process.env.NODE_ENV !== 'production' && referer.includes('/test-bmad-buttons');

    if ((authError || !user) && !isTestRequest) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (isTestRequest && process.env.NODE_ENV !== 'production') {
      (global as { BMAD_TEST_MODE?: boolean }).BMAD_TEST_MODE = true;
    }

    const userId = user?.id || (isTestRequest ? 'test-user-id' : '');

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'pathways':
        return await handleGetPathways();
        
      case 'knowledge':
        const query = searchParams.get('query') || '';
        return await handleSearchKnowledge({ query });
        
      case 'sessions':
        const workspaceId = searchParams.get('workspaceId') || undefined;
        return await handleGetUserSessions(userId, { workspaceId });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('BMad API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Internal server error', details: process.env.NODE_ENV !== 'production' ? errorMessage : undefined },
      { status: 500 }
    );
  }
}

/**
 * Analyze user intent and recommend pathway
 */
async function handleAnalyzeIntent(params: { userInput: string }) {
  const { userInput } = params;
  
  if (!userInput) {
    return NextResponse.json({ error: 'userInput is required' }, { status: 400 });
  }

  const pathwayRecommendation = await pathwayRouter.analyzeUserIntent(userInput);
  
  // Transform PathwayRecommendation to expected format
  const recommendation = {
    recommendedPathway: pathwayRecommendation.primary,
    confidence: pathwayRecommendation.confidence,
    reasoning: pathwayRecommendation.reasoning,
    alternativePathways: pathwayRecommendation.alternatives.map(alt => alt.pathway)
  };
  
  return NextResponse.json({
    success: true,
    data: {
      recommendation,
      availablePathways: pathwayRouter.getAllPathways()
    }
  });
}

/**
 * Create new BMad Method session
 */
async function handleCreateSession(
  userId: string, 
  params: { 
    workspaceId: string; 
    pathway: PathwayType; 
    initialContext?: Record<string, unknown>;
  }
) {
  const { workspaceId, pathway, initialContext } = params;
  
  if (!workspaceId || !pathway) {
    return NextResponse.json(
      { error: 'workspaceId and pathway are required' }, 
      { status: 400 }
    );
  }

  const session = await sessionOrchestrator.createSession({
    userId,
    workspaceId,
    pathway,
    initialContext
  });

  // Record pathway analytics if we have user input from initial context
  if (initialContext?.userInput && initialContext?.recommendation) {
    try {
      await BmadDatabase.recordPathwayAnalytics(
        userId,
        workspaceId,
        initialContext.userInput as string,
        (initialContext.recommendation as {
          recommendedPathway: PathwayType;
          confidence: number;
          reasoning: string;
          alternativePathways: PathwayType[];
        }).recommendedPathway,
        pathway,
        (initialContext.recommendation as {
          confidence: number;
        }).confidence,
        (initialContext.recommendation as {
          reasoning: string;
        }).reasoning,
        (initialContext.recommendation as {
          alternativePathways: PathwayType[];
        }).alternativePathways,
        session.id
      );
    } catch (error) {
      // Don't fail session creation if analytics fail
      console.error('Failed to record pathway analytics:', error);
    }
  }

  return NextResponse.json({
    success: true,
    data: { session }
  });
}

/**
 * Advance session with user input
 */
async function handleAdvanceSession(
  userId: string,
  params: {
    sessionId: string;
    userInput: string;
  }
) {
  const { sessionId, userInput } = params;

  if (!sessionId || !userInput) {
    return NextResponse.json(
      { error: 'sessionId and userInput are required' },
      { status: 400 }
    );
  }

  // SECURITY: Verify session ownership
  const session = await sessionOrchestrator.getSession(sessionId);
  if (!session || session.userId !== userId) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const advancement = await sessionOrchestrator.advanceSession(sessionId, userInput);

  return NextResponse.json({
    success: true,
    data: advancement
  });
}

/**
 * Get session by ID
 */
async function handleGetSession(userId: string, params: { sessionId: string }) {
  const { sessionId } = params;

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
  }

  const session = await sessionOrchestrator.getSession(sessionId);

  // SECURITY: Verify session ownership
  if (!session || session.userId !== userId) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: { session }
  });
}

/**
 * Search knowledge base
 */
async function handleSearchKnowledge(
  params: { 
    query: string;
    type?: 'framework' | 'technique' | 'template' | 'case_study';
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    phaseId?: string;
  }
) {
  const { query, type, difficulty, phaseId } = params;
  
  if (!query) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 });
  }

  let results;
  
  if (phaseId) {
    results = await bmadKnowledgeBase.getPhaseKnowledge(phaseId);
  } else {
    results = await bmadKnowledgeBase.searchKnowledge(query, {
      type,
      difficulty
    });
  }

  return NextResponse.json({
    success: true,
    data: { results }
  });
}

/**
 * Get user sessions
 */
async function handleGetUserSessions(
  userId: string,
  params: { 
    workspaceId?: string;
    status?: 'active' | 'paused' | 'completed' | 'abandoned';
  }
) {
  const { workspaceId, status } = params;

  const sessions = await BmadDatabase.getUserSessions(userId, workspaceId, status);

  return NextResponse.json({
    success: true,
    data: { sessions }
  });
}

/**
 * Get all available pathways
 */
async function handleGetPathways() {
  const pathways = pathwayRouter.getAllPathways();

  return NextResponse.json({
    success: true,
    data: { pathways }
  });
}

/**
 * Analyze feature input and generate validation questions
 */
async function handleAnalyzeFeatureInput(_userId: string, params: { featureData: FeatureInputData }) {
  const { featureData } = params;

  if (!featureData) {
    return NextResponse.json({ error: 'featureData is required' }, { status: 400 });
  }

  // Validate the input
  const validation = validateFeatureInput(featureData);
  if (!validation.isValid) {
    return NextResponse.json({
      error: 'Invalid feature input',
      details: validation.errors
    }, { status: 400 });
  }

  try {
    // Generate analysis ID
    const analysisId = generateAnalysisId();

    // Analyze the feature for insights
    const insights = analyzeFeatureInput(featureData);

    // Generate questions using AI fallback if needed
    let questions: string[] = [];

    try {
      // Try to use the best question selection logic
      questions = selectBestQuestions(featureData, 4);
    } catch (error) {
      console.warn('Question generation failed, using fallback:', error);
      questions = getFallbackQuestions(featureData);
    }

    // Validate the generated questions
    const questionValidation = validateQuestions(questions);
    if (!questionValidation.isValid) {
      console.warn('Question validation issues:', questionValidation.issues);
      // Use fallback questions if validation fails
      questions = getFallbackQuestions(featureData);
    }

    return NextResponse.json({
      success: true,
      data: {
        analysis_id: analysisId,
        questions,
        insights,
        validation: {
          warnings: validation.warnings
        }
      }
    });

  } catch (error) {
    console.error('Feature analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
    return NextResponse.json(
      { error: 'Feature analysis failed', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Save feature input data
 */
async function handleSaveFeatureInput(
  userId: string,
  params: {
    sessionId: string;
    featureData: FeatureInputData;
    analysisId?: string;
  }
) {
  const { sessionId, featureData, analysisId } = params;

  if (!sessionId || !featureData) {
    return NextResponse.json(
      { error: 'sessionId and featureData are required' },
      { status: 400 }
    );
  }

  // SECURITY: Verify session ownership
  const session = await sessionOrchestrator.getSession(sessionId);
  if (!session || session.userId !== userId) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  // Validate the input
  const validation = validateFeatureInput(featureData);
  if (!validation.isValid) {
    return NextResponse.json({
      error: 'Invalid feature input',
      details: validation.errors
    }, { status: 400 });
  }

  try {
    // Save feature input data to bmad_user_responses table
    await BmadDatabase.recordUserResponse(
      sessionId,
      'feature-input',
      'feature-input-form',
      {
        data: {
          ...featureData,
          analysis_id: analysisId || generateAnalysisId(),
          saved_at: new Date().toISOString(),
          validation_warnings: validation.warnings
        }
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        saved: true,
        session_id: sessionId,
        analysis_id: analysisId || generateAnalysisId(),
        timestamp: new Date().toISOString(),
        validation: {
          warnings: validation.warnings
        }
      }
    });

  } catch (error) {
    console.error('Save feature input error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Save failed';
    return NextResponse.json(
      { error: 'Failed to save feature input', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Calculate priority score for a feature
 */
async function handleCalculatePriority(_userId: string, params: {
  effort_score: number;
  impact_score: number;
  session_id?: string;
}) {
  const { effort_score, impact_score, session_id } = params;

  if (effort_score === undefined || impact_score === undefined) {
    return NextResponse.json(
      { error: 'effort_score and impact_score are required' },
      { status: 400 }
    );
  }

  try {
    // Validate scoring inputs
    const validation = validatePriorityScoring({ effort_score, impact_score });
    if (validation.length > 0) {
      return NextResponse.json({
        error: 'Invalid priority scoring inputs',
        details: validation
      }, { status: 400 });
    }

    // Calculate priority
    const priorityScoring = calculatePriority(impact_score, effort_score);
    const recommendations = getPriorityRecommendations(priorityScoring.quadrant);
    const analysis = analyzePriority(impact_score, effort_score);

    return NextResponse.json({
      success: true,
      data: {
        priority_score: priorityScoring.calculated_priority,
        category: priorityScoring.priority_category,
        quadrant: priorityScoring.quadrant,
        recommendations,
        analysis,
        scoring: priorityScoring
      }
    });

  } catch (error) {
    console.error('Priority calculation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Calculation failed';
    return NextResponse.json(
      { error: 'Priority calculation failed', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Save priority scoring data to session
 */
async function handleSavePriorityScoring(
  userId: string,
  params: {
    sessionId: string;
    priorityScoring: PriorityScoring;
  }
) {
  const { sessionId, priorityScoring } = params;

  if (!sessionId || !priorityScoring) {
    return NextResponse.json(
      { error: 'sessionId and priorityScoring are required' },
      { status: 400 }
    );
  }

  // SECURITY: Verify session ownership
  const session = await sessionOrchestrator.getSession(sessionId);
  if (!session || session.userId !== userId) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  try {
    // Validate priority scoring data
    const validation = validatePriorityScoring(priorityScoring);
    if (validation.length > 0) {
      return NextResponse.json({
        error: 'Invalid priority scoring data',
        details: validation
      }, { status: 400 });
    }

    // Save priority scoring data to bmad_user_responses table
    await BmadDatabase.recordUserResponse(
      sessionId,
      'priority-scoring',
      'priority-scoring-form',
      {
        data: {
          ...priorityScoring,
          saved_at: new Date().toISOString()
        }
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        saved: true,
        session_id: sessionId,
        priority_scoring: priorityScoring,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Save priority scoring error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Save failed';
    return NextResponse.json(
      { error: 'Failed to save priority scoring', details: errorMessage },
      { status: 500 }
    );
  }
}

// Feature Brief Generation Handlers

/**
 * Generate feature brief from session data
 */
async function handleGenerateFeatureBrief(
  userId: string,
  params: {
    sessionId: string;
  }
) {
  const { sessionId } = params;

  if (!sessionId) {
    return NextResponse.json(
      { error: 'sessionId is required' },
      { status: 400 }
    );
  }

  try {
    // Get feature input and priority scoring from session
    const session = await sessionOrchestrator.getSession(sessionId);

    // SECURITY: Verify session ownership
    if (!session || session.userId !== userId) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Extract feature session data from bmad_user_responses
    const featureInputResponse = await BmadDatabase.getResponsesByPhase(sessionId, 'feature-input');
    const priorityScoringResponse = await BmadDatabase.getResponsesByPhase(sessionId, 'priority-scoring');

    if (!featureInputResponse.length || !priorityScoringResponse.length) {
      return NextResponse.json(
        { error: 'Feature input and priority scoring required before generating brief' },
        { status: 400 }
      );
    }

    const featureInput = featureInputResponse[0].response_data.data as FeatureInputData;
    const priorityScoring = priorityScoringResponse[0].response_data.data as PriorityScoring;

    // Generate the brief
    const generator = new FeatureBriefGenerator();
    const brief = await generator.generate({
      featureInput,
      priorityScoring
    });

    // Validate the generated brief
    const validation = generator.validateBrief(brief);

    // Save the brief to session
    await BmadDatabase.recordUserResponse(
      sessionId,
      'feature-brief',
      'feature-brief-generator',
      {
        data: brief
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        brief,
        validation,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Generate feature brief error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Generation failed';
    return NextResponse.json(
      { error: 'Failed to generate feature brief', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Update existing feature brief
 */
async function handleUpdateFeatureBrief(
  userId: string,
  params: {
    sessionId: string;
    briefId: string;
    updates: Partial<FeatureBrief>;
  }
) {
  const { sessionId, briefId, updates } = params;

  if (!sessionId || !briefId || !updates) {
    return NextResponse.json(
      { error: 'sessionId, briefId, and updates are required' },
      { status: 400 }
    );
  }

  // SECURITY: Verify session ownership
  const session = await sessionOrchestrator.getSession(sessionId);
  if (!session || session.userId !== userId) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  try {
    const generator = new FeatureBriefGenerator();
    const updatedBrief = await generator.update(briefId, updates);

    // Validate the updated brief
    const validation = generator.validateBrief(updatedBrief);

    // Save updated brief to session
    await BmadDatabase.recordUserResponse(
      sessionId,
      'feature-brief',
      'feature-brief-update',
      {
        data: updatedBrief
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        brief: updatedBrief,
        validation,
        updated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Update feature brief error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Update failed';
    return NextResponse.json(
      { error: 'Failed to update feature brief', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Regenerate feature brief from session data
 */
async function handleRegenerateFeatureBrief(
  userId: string,
  params: {
    sessionId: string;
    briefId: string;
  }
) {
  const { sessionId, briefId } = params;

  if (!sessionId || !briefId) {
    return NextResponse.json(
      { error: 'sessionId and briefId are required' },
      { status: 400 }
    );
  }

  // SECURITY: Verify session ownership
  const session = await sessionOrchestrator.getSession(sessionId);
  if (!session || session.userId !== userId) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  try {
    // Get feature session data
    const featureInputResponse = await BmadDatabase.getResponsesByPhase(sessionId, 'feature-input');
    const priorityScoringResponse = await BmadDatabase.getResponsesByPhase(sessionId, 'priority-scoring');
    const existingBriefResponse = await BmadDatabase.getResponsesByPhase(sessionId, 'feature-brief');

    if (!featureInputResponse.length || !priorityScoringResponse.length) {
      return NextResponse.json(
        { error: 'Feature input and priority scoring required' },
        { status: 400 }
      );
    }

    const featureInput = featureInputResponse[0].response_data.data as FeatureInputData;
    const priorityScoring = priorityScoringResponse[0].response_data.data as PriorityScoring;
    const existingBrief = existingBriefResponse.length > 0
      ? existingBriefResponse[0].response_data.data as FeatureBrief
      : undefined;

    // Regenerate the brief
    const generator = new FeatureBriefGenerator();
    const newBrief = await generator.regenerate(briefId, {
      featureInput,
      priorityScoring,
      featureBrief: existingBrief
    });

    // Validate the regenerated brief
    const validation = generator.validateBrief(newBrief);

    // Save regenerated brief
    await BmadDatabase.recordUserResponse(
      sessionId,
      'feature-brief',
      'feature-brief-regeneration',
      {
        data: newBrief
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        brief: newBrief,
        validation,
        regenerated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Regenerate feature brief error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Regeneration failed';
    return NextResponse.json(
      { error: 'Failed to regenerate feature brief', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Export feature brief in specified format
 */
async function handleExportFeatureBrief(userId: string, params: {
  sessionId: string;
  format: 'markdown' | 'text' | 'pdf';
}) {
  const { sessionId, format = 'markdown' } = params;

  if (!sessionId) {
    return NextResponse.json(
      { error: 'sessionId is required' },
      { status: 400 }
    );
  }

  // SECURITY: Verify session ownership
  const session = await sessionOrchestrator.getSession(sessionId);
  if (!session || session.userId !== userId) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  try {
    // Get the brief from session
    const briefResponse = await BmadDatabase.getResponsesByPhase(sessionId, 'feature-brief');

    if (!briefResponse.length) {
      return NextResponse.json(
        { error: 'No feature brief found for this session' },
        { status: 404 }
      );
    }

    const brief = briefResponse[0].response_data.data as FeatureBrief;

    // Handle PDF export separately (binary response)
    if (format === 'pdf') {
      const { generateFeatureBriefPDF, getPDFMimeType } =
        await import('@/lib/export/pdf-generator');

      const result = await generateFeatureBriefPDF(brief, {
        branding: {
          companyName: 'ThinkHaven',
        },
      });

      if (!result.success || !result.buffer) {
        return NextResponse.json(
          { error: 'PDF generation failed', details: result.error },
          { status: 500 }
        );
      }

      // Return PDF as binary response
      return new Response(result.buffer, {
        headers: {
          'Content-Type': getPDFMimeType(),
          'Content-Disposition': `attachment; filename="${result.fileName}"`,
        },
      });
    }

    // Import text formatters for markdown and text
    const { formatBriefAsMarkdown, formatBriefAsText } =
      await import('@/lib/bmad/exports/brief-formatters');

    let content: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'markdown':
        content = formatBriefAsMarkdown(brief);
        filename = `feature-brief-${brief.id}.md`;
        mimeType = 'text/markdown';
        break;
      case 'text':
        content = formatBriefAsText(brief);
        filename = `feature-brief-${brief.id}.txt`;
        mimeType = 'text/plain';
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid export format. Use: markdown, text, or pdf' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: {
        format,
        content,
        filename,
        mimeType,
        exported_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Export feature brief error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Export failed';
    return NextResponse.json(
      { error: 'Failed to export feature brief', details: errorMessage },
      { status: 500 }
    );
  }
}

// Universal Session State Management Handlers

async function handleSwitchPathway(userId: string, params: { sessionId: string, newPathway: PathwayType, transferContext?: boolean }) {
  // SECURITY: Verify session ownership
  const session = await sessionOrchestrator.getSession(params.sessionId);
  if (!session || session.userId !== userId) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  try {
    const { universalSessionStateManager } = await import('@/lib/bmad/session/universal-state-manager');
    const { pathwaySwitcher } = await import('@/lib/bmad/session/pathway-switcher');

    const transition = await pathwaySwitcher.executePathwaySwitch(
      params.sessionId,
      params.newPathway,
      params.transferContext ?? true,
      true // User confirmed
    );

    return NextResponse.json({
      success: true,
      data: { transition, message: 'Pathway switched successfully' }
    });
  } catch (error) {
    console.error('Switch pathway error:', error);
    return NextResponse.json(
      { error: 'Failed to switch pathway', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleBackupSessionState(userId: string, params: { sessionId: string, backupType?: 'manual_save' | 'auto_backup' }) {
  // SECURITY: Verify session ownership
  const session = await sessionOrchestrator.getSession(params.sessionId);
  if (!session || session.userId !== userId) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  try {
    const { universalSessionStateManager } = await import('@/lib/bmad/session/universal-state-manager');

    const backupId = await universalSessionStateManager.createBackup(
      params.sessionId,
      params.backupType || 'manual_save'
    );

    return NextResponse.json({
      success: true,
      data: { backupId, message: 'Session backup created successfully' }
    });
  } catch (error) {
    console.error('Backup session state error:', error);
    return NextResponse.json(
      { error: 'Failed to create session backup', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleRestoreSession(userId: string, params: { sessionId: string, backupId: string }) {
  // SECURITY: Verify session ownership
  const session = await sessionOrchestrator.getSession(params.sessionId);
  if (!session || session.userId !== userId) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  try {
    const { universalSessionStateManager } = await import('@/lib/bmad/session/universal-state-manager');

    const restoredState = await universalSessionStateManager.restoreFromBackup(
      params.sessionId,
      params.backupId
    );

    return NextResponse.json({
      success: true,
      data: { state: restoredState, message: 'Session restored successfully' }
    });
  } catch (error) {
    console.error('Restore session error:', error);
    return NextResponse.json(
      { error: 'Failed to restore session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleSessionAnalytics(userId: string, params: { sessionId: string }) {
  // SECURITY: Verify session ownership
  const session = await sessionOrchestrator.getSession(params.sessionId);
  if (!session || session.userId !== userId) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  try {
    const { sessionAnalyticsEngine } = await import('@/lib/bmad/analytics/session-analytics');

    const analytics = await sessionAnalyticsEngine.getSessionAnalytics(params.sessionId);

    return NextResponse.json({
      success: true,
      data: { analytics }
    });
  } catch (error) {
    console.error('Session analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to get session analytics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleSyncSessionState(userId: string, params: { sessionId: string, partialUpdate: any }) {
  // SECURITY: Verify session ownership
  const session = await sessionOrchestrator.getSession(params.sessionId);
  if (!session || session.userId !== userId) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  try {
    const { universalSessionStateManager } = await import('@/lib/bmad/session/universal-state-manager');

    await universalSessionStateManager.syncSessionState(params.sessionId, params.partialUpdate);

    return NextResponse.json({
      success: true,
      data: { message: 'Session state synchronized successfully' }
    });
  } catch (error) {
    console.error('Sync session state error:', error);
    return NextResponse.json(
      { error: 'Failed to sync session state', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Business Model Pathway Handlers

async function handleAnalyzeRevenueStreams(userId: string, params: { sessionId: string, conversationHistory: any[], context?: any }) {
  try {
    const orchestrator = new BusinessModelPathwayOrchestrator();
    const result = await orchestrator.runPhase(
      'revenue-analysis',
      { id: params.sessionId, userId } as any,
      params.conversationHistory,
      undefined,
      params.context
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Save to session
    await BmadDatabase.saveResponse(params.sessionId, 'revenue-analysis', { data: result.data });

    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: result.metadata
    });
  } catch (error) {
    console.error('Analyze revenue streams error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze revenue streams', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleSegmentCustomers(userId: string, params: { sessionId: string, conversationHistory: any[], revenueStreams?: any[], context?: any }) {
  try {
    const orchestrator = new BusinessModelPathwayOrchestrator();

    // Get revenue analysis results
    const previousResults = await BmadDatabase.getResponsesByPhase(params.sessionId, 'revenue-analysis');
    const revenueAnalysis = previousResults.length > 0 ? previousResults[0].response_data.data : undefined;

    const result = await orchestrator.runPhase(
      'customer-segmentation',
      { id: params.sessionId, userId } as any,
      params.conversationHistory,
      { revenueAnalysis },
      params.context
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Save to session
    await BmadDatabase.saveResponse(params.sessionId, 'customer-segmentation', { data: result.data });

    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: result.metadata
    });
  } catch (error) {
    console.error('Segment customers error:', error);
    return NextResponse.json(
      { error: 'Failed to segment customers', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleGenerateMonetizationStrategy(userId: string, params: { sessionId: string, conversationHistory: any[], context?: any }) {
  try {
    const orchestrator = new BusinessModelPathwayOrchestrator();

    // Get previous analysis results
    const revenueResults = await BmadDatabase.getResponsesByPhase(params.sessionId, 'revenue-analysis');
    const customerResults = await BmadDatabase.getResponsesByPhase(params.sessionId, 'customer-segmentation');

    const previousResults = {
      revenueAnalysis: revenueResults.length > 0 ? revenueResults[0].response_data.data : undefined,
      customerAnalysis: customerResults.length > 0 ? customerResults[0].response_data.data : undefined
    };

    const result = await orchestrator.runPhase(
      'monetization-strategy',
      { id: params.sessionId, userId } as any,
      params.conversationHistory,
      previousResults,
      params.context
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Save to session
    await BmadDatabase.saveResponse(params.sessionId, 'monetization-strategy', { data: result.data });

    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: result.metadata
    });
  } catch (error) {
    console.error('Generate monetization strategy error:', error);
    return NextResponse.json(
      { error: 'Failed to generate monetization strategy', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleGenerateImplementationRoadmap(userId: string, params: { sessionId: string, conversationHistory: any[], context?: any }) {
  try {
    const orchestrator = new BusinessModelPathwayOrchestrator();

    // Get all previous analysis results
    const revenueResults = await BmadDatabase.getResponsesByPhase(params.sessionId, 'revenue-analysis');
    const customerResults = await BmadDatabase.getResponsesByPhase(params.sessionId, 'customer-segmentation');
    const strategyResults = await BmadDatabase.getResponsesByPhase(params.sessionId, 'monetization-strategy');

    const previousResults = {
      revenueAnalysis: revenueResults.length > 0 ? revenueResults[0].response_data.data : undefined,
      customerAnalysis: customerResults.length > 0 ? customerResults[0].response_data.data : undefined,
      monetizationStrategy: strategyResults.length > 0 ? strategyResults[0].response_data.data : undefined
    };

    const result = await orchestrator.runPhase(
      'implementation-roadmap',
      { id: params.sessionId, userId } as any,
      params.conversationHistory,
      previousResults,
      params.context
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Save to session
    await BmadDatabase.saveResponse(params.sessionId, 'implementation-roadmap', { data: result.data });

    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: result.metadata
    });
  } catch (error) {
    console.error('Generate implementation roadmap error:', error);
    return NextResponse.json(
      { error: 'Failed to generate implementation roadmap', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleRunBusinessModelPathway(userId: string, params: { sessionId: string, conversationHistory: any[], context?: any }) {
  try {
    const orchestrator = new BusinessModelPathwayOrchestrator();

    const result = await orchestrator.runPathway(
      { id: params.sessionId, userId } as any,
      params.conversationHistory,
      params.context
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Save all results to session
    const data = result.data!;

    if (data.revenueAnalysis) {
      await BmadDatabase.saveResponse(params.sessionId, 'revenue-analysis', { data: data.revenueAnalysis });
    }
    if (data.customerAnalysis) {
      await BmadDatabase.saveResponse(params.sessionId, 'customer-segmentation', { data: data.customerAnalysis });
    }
    if (data.monetizationStrategy) {
      await BmadDatabase.saveResponse(params.sessionId, 'monetization-strategy', { data: data.monetizationStrategy });
    }
    if (data.implementationRoadmap) {
      await BmadDatabase.saveResponse(params.sessionId, 'implementation-roadmap', { data: data.implementationRoadmap });
    }
    if (data.businessModelCanvas) {
      await BmadDatabase.saveResponse(params.sessionId, 'business-model-canvas', { data: data.businessModelCanvas });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: result.metadata
    });
  } catch (error) {
    console.error('Run business model pathway error:', error);
    return NextResponse.json(
      { error: 'Failed to run business model pathway', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleGenerateBusinessModelCanvas(userId: string, params: { sessionId: string }) {
  try {
    // Get all analysis results
    const revenueResults = await BmadDatabase.getResponsesByPhase(params.sessionId, 'revenue-analysis');
    const customerResults = await BmadDatabase.getResponsesByPhase(params.sessionId, 'customer-segmentation');
    const strategyResults = await BmadDatabase.getResponsesByPhase(params.sessionId, 'monetization-strategy');
    const roadmapResults = await BmadDatabase.getResponsesByPhase(params.sessionId, 'implementation-roadmap');

    const analysisResults = {
      revenueAnalysis: revenueResults.length > 0 ? revenueResults[0].response_data.data : undefined,
      customerAnalysis: customerResults.length > 0 ? customerResults[0].response_data.data : undefined,
      monetizationStrategy: strategyResults.length > 0 ? strategyResults[0].response_data.data : undefined,
      implementationRoadmap: roadmapResults.length > 0 ? roadmapResults[0].response_data.data : undefined
    };

    if (!analysisResults.revenueAnalysis || !analysisResults.customerAnalysis) {
      return NextResponse.json(
        { error: 'Revenue analysis and customer segmentation required to generate Business Model Canvas' },
        { status: 400 }
      );
    }

    const orchestrator = new BusinessModelPathwayOrchestrator();
    // Use private method via type assertion for canvas generation
    const canvas = (orchestrator as any).generateBusinessModelCanvas(analysisResults);

    // Save to session
    await BmadDatabase.saveResponse(params.sessionId, 'business-model-canvas', { data: canvas });

    return NextResponse.json({
      success: true,
      data: canvas
    });
  } catch (error) {
    console.error('Generate business model canvas error:', error);
    return NextResponse.json(
      { error: 'Failed to generate business model canvas', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Canvas Workspace Handlers

async function handleSaveCanvasState(userId: string, params: { sessionId?: string; workspaceId?: string; canvasState: any }) {
  try {
    // Accept either sessionId or workspaceId as identifier
    const identifier = params.sessionId || params.workspaceId;
    if (!identifier) {
      return NextResponse.json(
        { error: 'Either sessionId or workspaceId is required' },
        { status: 400 }
      );
    }

    const { canvasManager } = await import('@/lib/canvas/canvas-manager');

    await canvasManager.saveState(identifier, params.canvasState);

    return NextResponse.json({
      success: true,
      message: 'Canvas state saved successfully'
    });
  } catch (error) {
    console.error('Save canvas state error:', error);
    return NextResponse.json(
      { error: 'Failed to save canvas state', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleLoadCanvasState(userId: string, params: { sessionId?: string; workspaceId?: string }) {
  try {
    // Accept either sessionId or workspaceId as identifier
    const identifier = params.sessionId || params.workspaceId;
    if (!identifier) {
      return NextResponse.json(
        { error: 'Either sessionId or workspaceId is required' },
        { status: 404 }
      );
    }

    const { canvasManager } = await import('@/lib/canvas/canvas-manager');

    const canvasState = await canvasManager.loadState(identifier);

    return NextResponse.json({
      success: true,
      data: canvasState
    });
  } catch (error) {
    console.error('Load canvas state error:', error);
    return NextResponse.json(
      { error: 'Failed to load canvas state', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleExportCanvas(params: { sessionId: string, format: 'png' | 'svg' | 'mermaid' }) {
  try {
    const { canvasManager } = await import('@/lib/canvas/canvas-manager');

    const canvasState = await canvasManager.loadState(params.sessionId);

    if (!canvasState) {
      return NextResponse.json(
        { error: 'Canvas state not found' },
        { status: 404 }
      );
    }

    // Export logic will be implemented with canvas library integration
    // For now, return the canvas data
    return NextResponse.json({
      success: true,
      data: {
        format: params.format,
        canvasState,
        message: 'Export functionality will be implemented with canvas library'
      }
    });
  } catch (error) {
    console.error('Export canvas error:', error);
    return NextResponse.json(
      { error: 'Failed to export canvas', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Extract identifier for rate limiting from request
 */
function getRateLimitIdentifier(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Simple hash to avoid storing full user agent strings
  let hash = 0;
  const str = `${ip}:${userAgent}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `anonymous:${Math.abs(hash).toString(16)}`;
}