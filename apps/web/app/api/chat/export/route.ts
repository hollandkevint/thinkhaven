import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  exportChatToMarkdown,
  exportChatToText,
  exportChatToJSON,
  validateMessages,
} from '@/lib/export/chat-export';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, workspaceId, format = 'markdown' } = await request.json();

    // Accept sessionId (new) or workspaceId (legacy)
    if (!sessionId && !workspaceId) {
      return NextResponse.json(
        { error: 'Missing sessionId' },
        { status: 400 }
      );
    }

    if (!['markdown', 'text', 'json'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be markdown, text, or json' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let chatContext: unknown[] = [];
    let sessionTitle = 'Strategic Session';

    if (sessionId) {
      // New path: read from bmad_sessions
      const { data: session, error: sessionError } = await supabase
        .from('bmad_sessions')
        .select('chat_context, title')
        .eq('id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (sessionError || !session) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }

      chatContext = Array.isArray(session.chat_context) ? session.chat_context : [];
      sessionTitle = session.title || 'Strategic Session';
    } else {
      // Legacy path: read from user_workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from('user_workspace')
        .select('user_id, workspace_state')
        .eq('user_id', user.id)
        .single();

      if (workspaceError || !workspace) {
        return NextResponse.json(
          { error: 'Workspace not found' },
          { status: 404 }
        );
      }

      chatContext = workspace.workspace_state?.chat_context || [];
      sessionTitle = workspace.workspace_state?.name || 'Strategic Session';
    }

    const validation = validateMessages(chatContext);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid messages' },
        { status: 400 }
      );
    }

    let result;
    switch (format) {
      case 'markdown':
        result = exportChatToMarkdown(chatContext, {
          workspaceName: sessionTitle,
          includeMetadata: true,
          includeTimestamps: true,
        });
        break;
      case 'text':
        result = exportChatToText(chatContext, {
          workspaceName: sessionTitle,
          includeMetadata: true,
          includeTimestamps: true,
        });
        break;
      case 'json':
        result = exportChatToJSON(chatContext, { workspaceName: sessionTitle });
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid format' },
          { status: 400 }
        );
    }

    if (!result.success || !result.content) {
      return NextResponse.json(
        { error: result.error || 'Export failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      content: result.content,
      fileName: result.fileName,
      format: result.format,
    });
  } catch (error) {
    console.error('Chat export API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Chat export endpoint ready',
    supportedFormats: ['markdown', 'text', 'json'],
    timestamp: new Date().toISOString(),
  });
}
