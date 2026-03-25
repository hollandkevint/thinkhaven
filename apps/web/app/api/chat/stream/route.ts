import { NextRequest } from 'next/server';
import { claudeClient, type ConversationMessage } from '@/lib/ai/claude-client';
import { StreamEncoder, createStreamHeaders } from '@/lib/ai/streaming';
import { createClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/auth/admin';
import { CoachingContext, SubPersonaSessionState } from '@/lib/ai/mary-persona';
import { WorkspaceContextBuilder, ConversationContextManager, BmadSessionData } from '@/lib/ai/workspace-context';
import { ContextBuilder } from '@/lib/ai/context-builder';
import {
  incrementMessageCount,
  getLimitReachedMessage,
  type MessageLimitStatus,
} from '@/lib/session/message-limit-manager';
import { ToolExecutor, type ToolCall } from '@/lib/ai/tool-executor';
import { TOOL_NAMES } from '@/lib/ai/tools/index';
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
    const { message, sessionId, conversationHistory, useTools } = await request.json();

    if (!message || !sessionId) {
      return new Response(JSON.stringify({ error: 'Missing required fields (message, sessionId)' }), {
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

    // ADMIN BYPASS CHECK: unlimited messages (check BEFORE any message limit logic)
    const isAdmin = isAdminEmail(user.email);

    // Validate session ownership
    let limitStatus: MessageLimitStatus | null = null;

    const { data: bmadSession, error: sessionError } = await supabase
      .from('bmad_sessions')
      .select('id, pathway, current_phase, overall_completion, sub_persona_state, message_count, message_limit')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !bmadSession) {
      return new Response(JSON.stringify({
        error: 'Session not found',
        details: 'The session does not exist or you do not have access.',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const cachedBmadSession = bmadSession;

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

      // Build limitStatus from incrementResult (avoids redundant DB round trip)
      const remaining = incrementResult.messageLimit - incrementResult.newCount;
      limitStatus = {
        currentCount: incrementResult.newCount,
        messageLimit: incrementResult.messageLimit,
        remaining: Math.max(0, remaining),
        limitReached: incrementResult.limitReached,
        warningThreshold: remaining <= 5 && !incrementResult.limitReached,
      };

      // Check if THIS increment pushed us over the limit
      if (incrementResult.limitReached) {
        console.log('[LIMIT] Message limit reached:', { sessionId, count: incrementResult.newCount, limit: incrementResult.messageLimit });

        return new Response(JSON.stringify({
          error: 'MESSAGE_LIMIT_REACHED',
          message: getLimitReachedMessage(),
          limitStatus,
        }), {
          status: 429, // Too Many Requests
          headers: { 'Content-Type': 'application/json' }
        });
      }

    } else if (isAdmin) {
      // Admin: Skip increment, set limitStatus to look unlimited so UI doesn't warn
      limitStatus = {
        currentCount: 0,
        messageLimit: -1,
        remaining: 9999,
        limitReached: false,
        warningThreshold: false,
      };
    }

    // Always rebuild coaching context server-side (never trust client-supplied context)
    let finalCoachingContext: CoachingContext | undefined = undefined;
    let bmadSessionForUpdate: BmadSessionData | null = null;

    if (!finalCoachingContext) {
      try {
        // Reuse the bmad session fetched earlier (avoids duplicate DB query)
        const bmadSession = cachedBmadSession;

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

        finalCoachingContext = await WorkspaceContextBuilder.buildCoachingContext(
          user.id,
          user.id,
          bmadSessionForUpdate || undefined
        );

        // Apply board state and session mode AFTER buildCoachingContext
        // (buildCoachingContext rebuilds the object, so these must come after)
        // Board state is managed via sub_persona_state and tool calls
        // (board_state column may not exist in all environments)
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

      // Only auto-shift tone if user hasn't explicitly set it via UI
      if (finalCoachingContext.subPersonaState.userOverride) {
        updatedSubPersonaState = finalCoachingContext.subPersonaState;
        updatedSubPersonaState.exchangeCount = (updatedSubPersonaState.exchangeCount || 0) + 1;
      } else {
        // Update state (detects user emotional state and may shift mode)
        updatedSubPersonaState = WorkspaceContextBuilder.updateSubPersonaState(
          finalCoachingContext,
          message,
          managedHistory
        );
      }

    }

    const encoder = new StreamEncoder();

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
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
            // Session mode + ID for client sync
            sessionMode: finalCoachingContext?.sessionMode || 'assessment',
            bmadSessionId: bmadSessionForUpdate?.id || sessionId || null,
          }));

          let fullContent = '';
          let toolsExecuted: Array<{ name: string; success: boolean }> = [];
          let agenticRounds = 0;

          // Branch: Agentic loop with tools OR standard streaming
          if (useTools && bmadSessionForUpdate?.id) {
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
            // Get Claude streaming response with coaching context
            const claudeResponse = await claudeClient.sendMessage(
              message,
              managedHistory,
              finalCoachingContext
            );

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

          // Auto-title session on first message (fire-and-forget)
          if (cachedBmadSession.message_count === 0) {
            const autoTitle = message.split(/\s+/).slice(0, 6).join(' ').slice(0, 100)
            supabase
              .from('bmad_sessions')
              .update({ title: autoTitle })
              .eq('id', sessionId)
              .eq('user_id', user.id)
              .then(({ error: titleErr }) => {
                if (titleErr) console.warn('[Chat Stream] Auto-title failed:', titleErr.message)
              })
              .catch(() => {}) // Best-effort, never block the stream
          }

          // Persist updated sub-persona state to database
          if (updatedSubPersonaState && bmadSessionForUpdate?.id) {
            try {
              const { error: updateError } = await supabase
                .from('bmad_sessions')
                .update({ sub_persona_state: updatedSubPersonaState })
                .eq('id', bmadSessionForUpdate.id)
                .eq('user_id', user.id);

              if (updateError) {
                console.error('[Chat Stream] Failed to persist sub-persona state:', updateError);
              }
            } catch (persistError) {
              console.error('[Chat Stream] Error persisting sub-persona state:', persistError);
            }
          }

          // Build additionalData for complete event
          const additionalData: Record<string, unknown> = {};
          if (toolsExecuted.length > 0) {
            additionalData.toolsExecuted = toolsExecuted;
            additionalData.agenticRounds = agenticRounds;
          }

          // Attach lean canvas state if update_lean_canvas tool ran
          if (toolsExecuted.some(t => t.name === TOOL_NAMES.UPDATE_LEAN_CANVAS && t.success)) {
            try {
              const { data: canvasRow } = await supabase
                .from('bmad_sessions')
                .select('lean_canvas')
                .eq('id', sessionId)
                .eq('user_id', user.id)
                .single();
              if (canvasRow?.lean_canvas) {
                additionalData.leanCanvas = canvasRow.lean_canvas;
              }
            } catch (canvasErr) {
              console.warn('[Chat Stream] Failed to fetch canvas state:', canvasErr);
            }
          }

          // Send completion signal with usage data, limit status, and tool info
          controller.enqueue(encoder.encodeComplete(
            undefined, // Usage tracking happens inside agentic loop
            limitStatus,
            Object.keys(additionalData).length > 0 ? additionalData : undefined
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
        // Client disconnected
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
      details: process.env.NODE_ENV !== 'production' ? (error instanceof Error ? error.message : 'Unknown error') : undefined,
      hint: 'Please try again. If the issue persists, refresh the page.'
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