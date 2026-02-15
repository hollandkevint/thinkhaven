import { NextRequest } from 'next/server';
import { claudeClient, type ConversationMessage } from '@/lib/ai/claude-client';
import { StreamEncoder, createStreamHeaders } from '@/lib/ai/streaming';
import { createClient } from '@/lib/supabase/server';
import { CoachingContext, SubPersonaSessionState } from '@/lib/ai/mary-persona';
import { WorkspaceContextBuilder, ConversationContextManager, BmadSessionData } from '@/lib/ai/workspace-context';
import { ContextBuilder } from '@/lib/ai/context-builder';
import {
  incrementMessageCount,
  checkMessageLimit,
  getLimitReachedMessage,
} from '@/lib/bmad/message-limit-manager';
import { ToolExecutor, type ToolCall } from '@/lib/ai/tool-executor';
import type { ContentBlock } from '@anthropic-ai/sdk/resources/messages';
import type { BoardMemberId } from '@/lib/ai/board-types';

/** A segment of text attributed to a specific speaker */
interface SpeakerSegment {
  speaker: BoardMemberId;
  content: string;
  handoffReason?: string;
}

// Maximum number of tool execution rounds to prevent infinite loops
const MAX_TOOL_ROUNDS = 5;

/**
 * Execute the agentic tool loop.
 * Sends message, executes any tool calls, continues until end_turn.
 */
async function executeAgenticLoop(
  message: string,
  conversationHistory: ConversationMessage[],
  coachingContext: CoachingContext | undefined,
  sessionId: string,
  userId: string
): Promise<{
  finalText: string;
  toolsExecuted: Array<{ name: string; success: boolean }>;
  rounds: number;
  segments: SpeakerSegment[];
}> {
  const toolExecutor = new ToolExecutor({ sessionId, userId });
  const toolsExecuted: Array<{ name: string; success: boolean }> = [];
  let rounds = 0;
  let accumulatedText = '';
  const segments: SpeakerSegment[] = [];
  let currentSpeaker: BoardMemberId = 'mary';

  // Build conversation for multi-turn tool use
  const conversation: Array<{
    role: 'user' | 'assistant';
    content: string | ContentBlock[];
  }> = conversationHistory.map(msg => ({
    role: msg.role,
    content: msg.content
  }));

  // Add initial user message
  conversation.push({ role: 'user', content: message });

  // Initial call with tools
  let response = await claudeClient.sendMessageWithTools(
    message,
    conversationHistory,
    coachingContext
  );

  accumulatedText += response.textContent;

  // Attribute initial text to Mary (facilitator)
  if (response.textContent) {
    segments.push({
      speaker: 'mary',
      content: response.textContent,
    });
  }

  // Agentic loop: keep going while Claude wants to use tools
  while (response.stopReason === 'tool_use' && rounds < MAX_TOOL_ROUNDS) {
    rounds++;

    console.log('[Agentic Loop] Round', rounds, 'processing', response.toolUses.length, 'tool calls');

    // Convert tool uses to ToolCall format
    const toolCalls: ToolCall[] = response.toolUses.map(tu => ({
      id: tu.id,
      name: tu.name,
      input: tu.input
    }));

    // Execute all tools
    const results = await toolExecutor.executeAll(toolCalls);

    // Track what was executed and detect speaker changes
    results.forEach(result => {
      toolsExecuted.push({
        name: result.toolName,
        success: result.result.success
      });

      // Track speaker switches from switch_speaker tool
      if (result.toolName === 'switch_speaker' && result.result.success && result.result.data) {
        const speakerData = result.result.data as {
          newSpeaker: string;
          handoffReason: string;
        };
        currentSpeaker = speakerData.newSpeaker as BoardMemberId;
      }
    });

    // Format results for Claude
    const toolResultsForClaude = ToolExecutor.formatResultsForClaude(results);

    // Add assistant's response (with tool use) to conversation
    // We need to reconstruct the content blocks
    const assistantContent: ContentBlock[] = [];
    if (response.textContent) {
      assistantContent.push({
        type: 'text',
        text: response.textContent
      } as ContentBlock);
    }
    response.toolUses.forEach(tu => {
      assistantContent.push({
        type: 'tool_use',
        id: tu.id,
        name: tu.name,
        input: tu.input
      } as ContentBlock);
    });
    conversation.push({ role: 'assistant', content: assistantContent });

    // Continue the conversation with tool results
    response = await claudeClient.continueWithToolResults(
      conversation,
      toolResultsForClaude,
      coachingContext
    );

    // Attribute text from this round to the current speaker
    if (response.textContent) {
      // Find the handoff reason from the most recent switch_speaker in this round
      const lastSwitch = results.find(r => r.toolName === 'switch_speaker' && r.result.success);
      const handoffReason = lastSwitch?.result.data
        ? (lastSwitch.result.data as { handoffReason: string }).handoffReason
        : undefined;

      segments.push({
        speaker: currentSpeaker,
        content: response.textContent,
        handoffReason,
      });
    }

    accumulatedText += response.textContent;
  }

  if (rounds >= MAX_TOOL_ROUNDS && response.stopReason === 'tool_use') {
    console.warn('[Agentic Loop] Hit max rounds limit, stopping');
    accumulatedText += '\n\n(I reached my processing limit for this turn. Let me know if you need me to continue.)';
  }

  return {
    finalText: accumulatedText,
    toolsExecuted,
    rounds,
    segments,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { message, workspaceId, conversationHistory, coachingContext, useTools } = await request.json();

    // Log incoming request (sanitized)
    console.log('[Chat Stream] Incoming request:', {
      messageLength: message?.length || 0,
      workspaceId,
      historyLength: conversationHistory?.length || 0,
      hasCoachingContext: !!coachingContext,
      useTools: !!useTools,
      timestamp: new Date().toISOString()
    });

    // Validate request
    if (!message || !workspaceId) {
      console.error('[Chat Stream] Validation failed:', { hasMessage: !!message, hasWorkspaceId: !!workspaceId });
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user context
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[Chat Stream] Authentication failed:', {
        error: authError?.message || 'No user',
        timestamp: new Date().toISOString()
      });
      return new Response(JSON.stringify({ error: 'Unauthorized', details: authError?.message }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('[Chat Stream] User authenticated:', {
      userId: user.id,
      userEmail: user.email
    });

    // Verify workspace access - using user_workspace table
    console.log('[Chat Stream] Looking up workspace:', {
      queryUserId: user.id,
      requestWorkspaceId: workspaceId
    });

    const { data: workspace, error: workspaceError } = await supabase
      .from('user_workspace')
      .select('user_id, workspace_state')
      .eq('user_id', user.id)
      .single();

    if (workspaceError || !workspace) {
      console.error('[Chat Stream] Workspace lookup error:', {
        error: workspaceError?.message || 'No workspace found',
        code: workspaceError?.code,
        details: workspaceError?.details,
        hint: workspaceError?.hint,
        userId: user.id
      });
      return new Response(JSON.stringify({
        error: 'Workspace not found',
        details: workspaceError?.message,
        hint: 'Make sure you have created a workspace. Try signing out and back in.'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('[Chat Stream] Workspace found:', {
      workspaceUserId: workspace.user_id,
      hasState: !!workspace.workspace_state
    });

    // ADMIN BYPASS CHECK: Kevin gets unlimited messages (check BEFORE any message limit logic)
    const isAdmin = user.email?.toLowerCase() === 'kholland7@gmail.com';

    // Get or create BMad session for message limit tracking
    let sessionId: string | null = null;
    let limitStatus: any = null;

    try {
      const { data: bmadSession } = await supabase
        .from('bmad_sessions')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      sessionId = bmadSession?.id || null;

      // If no session exists, auto-create one for message limit tracking
      if (!sessionId) {
        console.log('[Chat Stream] No BMad session found, creating one for message tracking');

        const { data: newSession, error: createError } = await supabase
          .from('bmad_sessions')
          .insert({
            user_id: user.id,
            workspace_id: workspaceId,
            pathway: 'new-idea', // Default pathway for tracking purposes
            templates: [],
            current_phase: 'discovery',
            current_template: 'general',
            current_step: 'chat',
            next_steps: [],
            status: 'active',
            overall_completion: 0,
            message_count: 0,
            message_limit: 10, // Use 10-message limit as per current code standard
          })
          .select('id')
          .single();

        if (createError) {
          console.error('[Chat Stream] Failed to create tracking session:', createError);
          // Don't fail the request - continue without tracking (fail open for session creation)
        } else {
          sessionId = newSession?.id || null;
          console.log('[Chat Stream] Created tracking session:', { sessionId });
        }
      }
    } catch (error) {
      console.warn('Could not find/create BMad session for message limit tracking:', error);
    }

    // ATOMIC: Increment message count FIRST to prevent race conditions
    // Skip entirely for admin users to avoid DB state drift
    if (sessionId && !isAdmin) {
      const incrementResult = await incrementMessageCount(sessionId);

      // Fail closed: If tracking fails, reject the request
      if (!incrementResult) {
        console.error('[Chat Stream] Message tracking failed - rejecting request');
        return new Response(JSON.stringify({
          error: 'MESSAGE_TRACKING_ERROR',
          message: 'Unable to track message count. Please try again.',
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Check if THIS increment pushed us over the limit (simplified check)
      if (incrementResult.limitReached) {
        console.log('[Chat Stream] Message limit exceeded:', {
          sessionId,
          newCount: incrementResult.newCount,
          limit: incrementResult.messageLimit
        });

        // Get current status for error response
        limitStatus = await checkMessageLimit(sessionId);

        return new Response(JSON.stringify({
          error: 'MESSAGE_LIMIT_REACHED',
          message: getLimitReachedMessage(),
          limitStatus,
        }), {
          status: 429, // Too Many Requests
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Update limitStatus for later use in response
      limitStatus = await checkMessageLimit(sessionId);

      console.log('[Chat Stream] Message count pre-incremented:', {
        sessionId,
        newCount: incrementResult.newCount,
        remaining: limitStatus?.remaining,
      });
    } else if (isAdmin) {
      // Admin: Skip increment, set limitStatus to look unlimited so UI doesn't warn
      console.log('[Chat Stream] Admin bypass: Skipping message limit tracking for', user.email);
      limitStatus = {
        currentCount: 0,
        messageLimit: -1,
        remaining: 9999,
        limitReached: false,
        warningThreshold: false,
      };
    }

    // Build or use provided coaching context
    let finalCoachingContext: CoachingContext | undefined = coachingContext;
    let bmadSessionForUpdate: BmadSessionData | null = null;

    if (!finalCoachingContext) {
      try {
        // Try to get current BMad session data (including sub_persona_state)
        const { data: bmadSession } = await supabase
          .from('bmad_sessions')
          .select('id, pathway, current_phase, overall_completion, sub_persona_state, board_state')
          .eq('workspace_id', workspaceId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (bmadSession) {
          // Map to BmadSessionData interface
          bmadSessionForUpdate = {
            id: bmadSession.id,
            pathway: bmadSession.pathway,
            current_phase: bmadSession.current_phase,
            progress: bmadSession.overall_completion || 0,
            context: {},
            sub_persona_state: bmadSession.sub_persona_state as SubPersonaSessionState | null,
          };
        }

        // Pass board state to coaching context if present
        if (bmadSession?.board_state) {
          if (!finalCoachingContext) {
            finalCoachingContext = {};
          }
          finalCoachingContext.boardState = bmadSession.board_state as {
            activeSpeaker: BoardMemberId;
            taylorOptedIn: boolean;
          };
        }

        finalCoachingContext = await WorkspaceContextBuilder.buildCoachingContext(
          workspaceId,
          user.id,
          bmadSessionForUpdate || undefined
        );

        // Phase 2: Enrich with dynamic context from database
        if (bmadSessionForUpdate?.id) {
          const dynamicContextMarkdown = await ContextBuilder.getFormattedContext(
            bmadSessionForUpdate.id,
            user.id,
            bmadSessionForUpdate.current_phase
          );
          finalCoachingContext.dynamicContextMarkdown = dynamicContextMarkdown;
        }
      } catch (error) {
        console.warn('Could not build coaching context:', error);
        // Continue without context
      }
    }

    // Prepare conversation context management
    const historyWithContext = conversationHistory || [];
    const managedHistory = ConversationContextManager.pruneConversationHistory(
      historyWithContext,
      6000 // Leave room for response
    );

    // Update sub-persona state based on user message (dynamic mode shifting)
    let updatedSubPersonaState: SubPersonaSessionState | null = null;
    if (finalCoachingContext?.subPersonaState) {
      // Include recent messages for user state detection
      finalCoachingContext.recentMessages = managedHistory.slice(-10);

      // Update state (detects user emotional state and may shift mode)
      updatedSubPersonaState = WorkspaceContextBuilder.updateSubPersonaState(
        finalCoachingContext,
        message,
        managedHistory
      );

      console.log('[Chat Stream] Sub-persona state updated:', {
        currentMode: updatedSubPersonaState?.currentMode,
        detectedUserState: updatedSubPersonaState?.detectedUserState,
        exchangeCount: updatedSubPersonaState?.exchangeCount,
        userControlEnabled: updatedSubPersonaState?.userControlEnabled,
      });
    }

    console.log('[Chat Stream] Preparing to call Claude:', {
      messageLength: message.length,
      historyMessages: managedHistory.length,
      hasCoachingContext: !!finalCoachingContext
    });

    const encoder = new StreamEncoder();

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('[Chat Stream] Stream started, sending metadata');

          // Send initial metadata (including sub-persona mode for UI)
          controller.enqueue(encoder.encodeMetadata({
            coachingContext: finalCoachingContext,
            messageId: `msg-${Date.now()}`,
            timestamp: new Date().toISOString(),
            // Sub-persona system metadata
            subPersona: updatedSubPersonaState ? {
              currentMode: updatedSubPersonaState.currentMode,
              detectedUserState: updatedSubPersonaState.detectedUserState,
              exchangeCount: updatedSubPersonaState.exchangeCount,
              userControlEnabled: updatedSubPersonaState.userControlEnabled,
            } : undefined,
            useTools: !!useTools,
          }));

          console.log('[Chat Stream] Calling Claude API...', { useTools: !!useTools });

          let fullContent = '';
          let toolsExecuted: Array<{ name: string; success: boolean }> = [];
          let agenticRounds = 0;

          // Branch: Agentic loop with tools OR standard streaming
          if (useTools && bmadSessionForUpdate?.id) {
            // Use agentic loop with tool execution
            console.log('[Chat Stream] Using agentic tool loop');

            const agenticResult = await executeAgenticLoop(
              message,
              managedHistory,
              finalCoachingContext,
              bmadSessionForUpdate.id,
              user.id
            );

            fullContent = agenticResult.finalText;
            toolsExecuted = agenticResult.toolsExecuted;
            agenticRounds = agenticResult.rounds;

            console.log('[Chat Stream] Agentic loop complete:', {
              textLength: fullContent.length,
              toolsExecuted: toolsExecuted.length,
              rounds: agenticRounds,
              segments: agenticResult.segments.length,
            });

            // Stream segments with speaker attribution
            if (agenticResult.segments.length > 0) {
              for (const segment of agenticResult.segments) {
                // Emit speaker change event if there is a handoff
                if (segment.handoffReason) {
                  controller.enqueue(encoder.encodeSpeakerChange(
                    segment.speaker,
                    segment.handoffReason
                  ));
                }

                // Stream the segment content word-by-word with speaker tag
                const words = segment.content.split(' ');
                for (let i = 0; i < words.length; i++) {
                  controller.enqueue(encoder.encodeContent(
                    words[i] + (i < words.length - 1 ? ' ' : ''),
                    segment.speaker
                  ));
                  const delay = Math.max(10, Math.min(50, words[i].length * 5));
                  await new Promise(resolve => setTimeout(resolve, delay));
                }
              }
            } else {
              // Fallback: stream as plain text (no segments)
              const words = fullContent.split(' ');
              for (let i = 0; i < words.length; i++) {
                controller.enqueue(encoder.encodeContent(words[i] + (i < words.length - 1 ? ' ' : '')));
                const delay = Math.max(10, Math.min(50, words[i].length * 5));
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }

          } else {
            // Standard streaming (no tools)
            console.log('[Chat Stream] Using standard streaming');

            // Get Claude streaming response with coaching context
            const claudeResponse = await claudeClient.sendMessage(
              message,
              managedHistory,
              finalCoachingContext
            );

            console.log('[Chat Stream] Claude API responded, starting to stream content');

            // Stream the response
            const reader = claudeResponse.content[Symbol.asyncIterator] ?
              claudeResponse.content[Symbol.asyncIterator]() : null;

            if (reader) {
              // Stream chunks from async iterator
              while (true) {
                const { done, value } = await reader.next();
                if (done) break;

                if (value) {
                  fullContent += value;
                  controller.enqueue(encoder.encodeContent(value));

                  // Add small delay for better visual effect
                  await new Promise(resolve => setTimeout(resolve, 10));
                }
              }
            } else {
              // Fallback: Send full content at once
              fullContent = claudeResponse.content as string;

              // Simulate streaming for better UX
              const words = fullContent.split(' ');

              for (let i = 0; i < words.length; i++) {
                controller.enqueue(encoder.encodeContent(words[i] + (i < words.length - 1 ? ' ' : '')));

                // Variable delay based on word length for natural feel
                const delay = Math.max(20, Math.min(100, words[i].length * 10));
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }
          }

          // Note: Conversation storage is handled by the workspace page
          // which updates user_workspace.workspace_state.chat_context
          // No additional database storage needed here

          // Message count was already incremented atomically BEFORE processing
          // to prevent race conditions (see lines 109-144)

          // Persist updated sub-persona state to database
          if (updatedSubPersonaState && bmadSessionForUpdate?.id) {
            try {
              const { error: updateError } = await supabase
                .from('bmad_sessions')
                .update({ sub_persona_state: updatedSubPersonaState })
                .eq('id', bmadSessionForUpdate.id);

              if (updateError) {
                console.error('[Chat Stream] Failed to persist sub-persona state:', updateError);
              } else {
                console.log('[Chat Stream] Sub-persona state persisted:', {
                  sessionId: bmadSessionForUpdate.id,
                  mode: updatedSubPersonaState.currentMode,
                });
              }
            } catch (persistError) {
              console.error('[Chat Stream] Error persisting sub-persona state:', persistError);
            }
          }

          console.log('[Chat Stream] Stream complete:', {
            contentLength: fullContent.length,
            limitStatus,
            toolsExecuted: toolsExecuted.length > 0 ? toolsExecuted : undefined,
            agenticRounds: agenticRounds > 0 ? agenticRounds : undefined,
          });

          // Send completion signal with usage data, limit status, and tool info
          controller.enqueue(encoder.encodeComplete(
            undefined, // Usage tracking happens inside agentic loop
            limitStatus,
            toolsExecuted.length > 0 ? { toolsExecuted, agenticRounds } : undefined
          ));
          controller.enqueue(encoder.encodeDone());
          controller.close();

        } catch (error) {
          console.error('[Chat Stream] Streaming error:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString()
          });
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

          // Send error with retry suggestion
          controller.enqueue(encoder.encodeError(errorMessage, {
            retryable: !errorMessage.includes('auth'),
            suggestion: 'Please try again. If the issue persists, refresh the page.'
          }));
          controller.close();
        }
      },

      cancel() {
        console.log('[Chat Stream] Stream cancelled by client');
      }
    });

    return new Response(stream, {
      headers: createStreamHeaders()
    });

  } catch (error) {
    console.error('[Chat Stream] API Route Error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error',
      hint: 'Check server logs for more details. Try refreshing the page.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function GET() {
  return new Response(JSON.stringify({ 
    message: 'Claude streaming endpoint ready',
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}