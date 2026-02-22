import { NextRequest } from 'next/server';
import { claudeClient } from '@/lib/ai/claude-client';
import { StreamEncoder, createStreamHeaders } from '@/lib/ai/streaming';
import { maryPersona, SubPersonaSessionState, CoachingContext } from '@/lib/ai/mary-persona';

/**
 * Guest Chat Stream API
 *
 * Simplified streaming endpoint for guest users (no auth required)
 * Limitations:
 * - No database persistence
 * - Limited conversation history (client manages via localStorage)
 * - Basic Mary persona without workspace context
 */

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory, subPersonaState: clientSubPersonaState } = await request.json();

    // Validate request
    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Limit conversation history to prevent abuse
    const limitedHistory = (conversationHistory || []).slice(-10);

    // Initialize or use existing sub-persona state
    // Guest sessions default to 'new-idea' pathway
    let subPersonaState: SubPersonaSessionState;
    if (clientSubPersonaState) {
      // Restore state from client localStorage
      subPersonaState = clientSubPersonaState;
    } else {
      // Initialize fresh state for new guest session
      subPersonaState = maryPersona.initializeSubPersonaState('new-idea');
    }

    // Update sub-persona state based on user message
    subPersonaState = maryPersona.updateSessionState(
      subPersonaState,
      message,
      limitedHistory
    );

    const encoder = new StreamEncoder();

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial metadata (including sub-persona mode)
          controller.enqueue(encoder.encodeMetadata({
            messageId: `guest-msg-${Date.now()}`,
            timestamp: new Date().toISOString(),
            isGuest: true,
            // Sub-persona system metadata
            subPersona: {
              currentMode: subPersonaState.currentMode,
              detectedUserState: subPersonaState.detectedUserState,
              exchangeCount: subPersonaState.exchangeCount,
              userControlEnabled: subPersonaState.userControlEnabled,
            },
          }));

          // Guest-specific coaching context with sub-persona system
          const guestCoachingContext: CoachingContext = {
            currentBmadSession: {
              pathway: 'new-idea',
              phase: 'discovery',
              progress: 0,
            },
            subPersonaState: subPersonaState,
            recentMessages: limitedHistory,
          };

          // Get Claude streaming response
          const claudeResponse = await claudeClient.sendMessage(
            message,
            limitedHistory,
            guestCoachingContext
          );

          // Stream the response
          let fullContent = '';
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

                // Small delay for smooth streaming
                await new Promise(resolve => setTimeout(resolve, 10));
              }
            }
          } else {
            // Fallback: Send full content with simulated streaming
            fullContent = claudeResponse.content as string;

            const words = fullContent.split(' ');

            for (let i = 0; i < words.length; i++) {
              controller.enqueue(encoder.encodeContent(words[i] + (i < words.length - 1 ? ' ' : '')));

              const delay = Math.max(20, Math.min(100, words[i].length * 10));
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }

          // Send completion signal with sub-persona state for client persistence
          // (no usage data for guests to prevent API exposure)
          controller.enqueue(encoder.encodeComplete(undefined, undefined, {
            subPersonaState: subPersonaState, // Client should store this in localStorage
          }));
          controller.enqueue(encoder.encodeDone());
          controller.close();

        } catch (error) {
          console.error('[Guest Chat] Streaming error:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString()
          });

          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

          controller.enqueue(encoder.encodeError(errorMessage, {
            retryable: true,
            suggestion: 'Please try again. If the issue persists, try refreshing the page.'
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
    console.error('[Guest Chat] API Route Error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function GET() {
  return new Response(JSON.stringify({
    message: 'Guest chat endpoint ready',
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
