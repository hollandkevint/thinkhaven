'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { LayoutTemplate, ArrowLeft, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import BmadInterface from '@/app/components/bmad/BmadInterface'
import StateBridge from '@/app/components/dual-pane/StateBridge'
import { PaneErrorBoundary, OfflineIndicator, useOnlineStatus } from '@/app/components/dual-pane/PaneErrorBoundary'
import { useSharedInput } from '@/app/components/workspace/useSharedInput'
import CanvasContextSync from '@/components/canvas/CanvasContextSync'
import { MessageLimitWarning } from '@/app/components/chat/MessageLimitWarning'
import type { MessageLimitStatus } from '@/lib/bmad/message-limit-manager'
import type { ChatMessage, BoardState } from '@/lib/ai/board-types'
import { getBoardMember } from '@/lib/ai/board-members'
import SpeakerMessage from '@/app/components/board/SpeakerMessage'
import HandoffAnnotation from '@/app/components/board/HandoffAnnotation'
import BoardOverview from '@/app/components/board/BoardOverview'
import ExportPanel from '@/app/components/workspace/ExportPanel'
import dynamic from 'next/dynamic'
import { ArtifactProvider } from '@/lib/artifact'
import { ArtifactPanel, ArtifactList, ArtifactKeyboardHandler } from '@/app/components/artifact'
import { ErrorState } from '@/app/components/ui/ErrorState'
import { FeedbackButton } from '@/app/components/feedback/FeedbackButton'

// Dynamically import canvas components (SSR-safe)
const EnhancedCanvasWorkspace = dynamic(
  () => import('@/app/components/canvas/EnhancedCanvasWorkspace'),
  { ssr: false }
)

interface Workspace {
  id: string
  name: string
  description: string
  chat_context: ChatMessage[]
  canvas_elements: Array<Record<string, unknown>>
  user_id: string
}

type WorkspaceTab = 'chat' | 'bmad'

export default function WorkspacePage() {
  const params = useParams()
  const { user, loading: authLoading, signOut } = useAuth()
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [messageInput, setMessageInput] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('bmad')
  const [canvasState, setCanvasState] = useState<{
    mode: 'draw' | 'diagram'
    diagramCode?: string
    diagramType?: string
    drawingSnapshot?: string
    lastModified: Date
  } | null>(null)
  const [limitStatus, setLimitStatus] = useState<MessageLimitStatus | null>(null)
  const [isCanvasOpen, setIsCanvasOpen] = useState(false)
  const [boardState, setBoardState] = useState<BoardState | null>(null)
  const workspaceRef = useRef<Workspace | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const isOnline = useOnlineStatus()
  const { preserveInput, hasPreservedInput, peekPreservedInput, clearPreservedInput } = useSharedInput(params.id as string)

  const fetchWorkspace = useCallback(async () => {
    if (!user) return
    try {
      setError('')
      const { data, error: fetchError } = await supabase
        .from('user_workspace')
        .select('user_id, workspace_state, updated_at')
        .eq('user_id', user.id)
        .single()

      if (fetchError) throw fetchError

      // Transform user_workspace data to Workspace format
      const transformedWorkspace: Workspace = {
        id: data.user_id,
        name: data.workspace_state?.name || 'My Strategic Workspace',
        description: data.workspace_state?.description || 'Strategic thinking workspace',
        chat_context: data.workspace_state?.chat_context || [],
        canvas_elements: data.workspace_state?.canvas_elements || [],
        user_id: data.user_id
      }

      setWorkspace(transformedWorkspace)
    } catch (err) {
      console.error('Error fetching workspace:', err)
      const errorMessage = err instanceof Error ? err.message : 'Workspace not found or you do not have access to it'
      setError(errorMessage)
    } finally {
      setLoading(false)
      setIsRetrying(false)
    }
  }, [user])

  const handleRetry = () => {
    setIsRetrying(true)
    setRetryCount(c => c + 1)
    setLoading(true)
    fetchWorkspace()
  }

  useEffect(() => {
    if (user && params.id) {
      fetchWorkspace()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, params.id])

  const addChatMessage = async (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    if (!workspace) return

    const newMessage: ChatMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    }

    const updatedChatContext = [...workspace.chat_context, newMessage]

    try {
      const { error } = await supabase
        .from('user_workspace')
        .update({
          workspace_state: {
            name: workspace.name,
            description: workspace.description,
            chat_context: updatedChatContext,
            canvas_elements: workspace.canvas_elements,
            updated_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('user_id', workspace.id)

      if (error) throw error

      setWorkspace({
        ...workspace,
        chat_context: updatedChatContext
      })
    } catch (error) {
      console.error('Error saving message:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || sendingMessage) return

    const userMessage = messageInput
    setSendingMessage(true)
    setMessageInput('')

    try {
      // Add user message immediately
      await addChatMessage({
        role: 'user',
        content: userMessage
      })
      
      // Stream Mary's response from Claude API
      await streamClaudeResponse(userMessage)
      
    } catch (err) {
      console.error('[Workspace] Error sending message:', {
        error: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });

      // Add detailed error message for user
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      await addChatMessage({
        role: 'system',
        content: `❌ **Error:** ${errorMessage}\n\n**Troubleshooting:**\n- Check your internet connection\n- Verify you're signed in\n- Try refreshing the page\n- If the problem persists, contact support`
      })
    } finally {
      setSendingMessage(false)
    }
  }

  const streamClaudeResponse = async (message: string) => {
    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          workspaceId: workspace?.id,
          conversationHistory: workspace?.chat_context?.slice(-10) || [] // Last 10 messages for context
        }),
      });

      if (!response.ok) {
        // Try to parse error details from response
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.details || errorData?.error || response.statusText || 'Unknown error';
        const errorHint = errorData?.hint || 'Please try again';

        console.error('[Workspace] HTTP error:', {
          status: response.status,
          message: errorMessage,
          hint: errorHint
        });

        throw new Error(`${errorMessage} (${errorHint})`);
      }

      if (!response.body) {
        throw new Error('No response stream available')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      
      let assistantContent = ''
      let assistantMessageId = crypto.randomUUID()
      let chunkCount = 0;
      let currentSpeaker: string | undefined = undefined;
      let previousSpeaker: string | undefined = undefined;

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          break;
        }

        chunkCount++;
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim()

            // Skip [DONE] signal
            if (dataStr === '[DONE]') {
              continue
            }

            try {
              const data = JSON.parse(dataStr)

              if (data.type === 'speaker_change') {
                // A new board member is about to speak
                const newSpeaker = data.metadata?.speaker
                const handoffReason = data.metadata?.handoffReason

                if (newSpeaker && newSpeaker !== currentSpeaker) {
                  // Finalize current message if there's content
                  if (assistantContent.trim()) {
                    await finalizeAssistantMessage(assistantContent, assistantMessageId)
                  }

                  // Insert handoff annotation
                  if (currentSpeaker && handoffReason) {
                    const fromMember = getBoardMember(currentSpeaker as any)
                    const toMember = getBoardMember(newSpeaker as any)
                    const annotationId = crypto.randomUUID()
                    const current = workspaceRef.current
                    if (current) {
                      const updatedContext = [...current.chat_context, {
                        id: annotationId,
                        role: 'system' as const,
                        content: `__handoff__${fromMember.name}__${toMember.name}__${handoffReason}`,
                        timestamp: new Date().toISOString(),
                        metadata: {
                          speaker: currentSpeaker as any,
                          handoff_reason: handoffReason,
                        },
                      }]
                      const updated = { ...current, chat_context: updatedContext }
                      workspaceRef.current = updated
                      setWorkspace(updated)
                    }
                  }

                  // Start new message for new speaker
                  previousSpeaker = currentSpeaker
                  currentSpeaker = newSpeaker
                  assistantContent = ''
                  assistantMessageId = crypto.randomUUID()

                  // Update board state
                  setBoardState(prev => prev
                    ? { ...prev, activeSpeaker: newSpeaker as any }
                    : { activeSpeaker: newSpeaker as any, taylorOptedIn: false }
                  )
                }
              } else if (data.type === 'content') {
                // Track speaker from content metadata if present
                const contentSpeaker = data.metadata?.speaker
                if (contentSpeaker && !currentSpeaker) {
                  currentSpeaker = contentSpeaker
                }

                assistantContent += data.content
                updateStreamingMessage(
                  assistantMessageId,
                  assistantContent,
                  currentSpeaker as any
                )
              } else if (data.type === 'complete') {
                if (data.limitStatus) {
                  setLimitStatus(data.limitStatus);
                }
                // Update board state from completion metadata
                if (data.additionalData?.boardState) {
                  setBoardState(data.additionalData.boardState as BoardState)
                }
                await finalizeAssistantMessage(assistantContent, assistantMessageId)
              } else if (data.type === 'error') {
                console.error('[Workspace] Received error from stream:', data);
                throw new Error(data.error || 'Stream error')
              } else if (data.type === 'metadata') {
                // Initialize board state from metadata if present
                if (data.metadata?.boardState) {
                  setBoardState(data.metadata.boardState as BoardState)
                }
              }
            } catch (parseError) {
              console.error('[Workspace] Failed to parse stream data:', {
                dataStr: dataStr.substring(0, 100),
                error: parseError instanceof Error ? parseError.message : 'Unknown error'
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('[Workspace] Streaming error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  // Keep ref in sync with state for use in streaming callbacks
  useEffect(() => {
    workspaceRef.current = workspace
  }, [workspace])

  const updateStreamingMessage = (messageId: string, content: string, speaker?: string) => {
    const current = workspaceRef.current
    if (!current) return

    // Update the workspace state with streaming content
    const updatedChatContext = [...current.chat_context]
    const existingIndex = updatedChatContext.findIndex(msg => msg.id === messageId)

    if (existingIndex >= 0) {
      updatedChatContext[existingIndex] = {
        ...updatedChatContext[existingIndex],
        content: content,
        metadata: {
          ...updatedChatContext[existingIndex].metadata,
          ...(speaker ? { speaker: speaker as any } : {}),
        },
      }
    } else {
      updatedChatContext.push({
        id: messageId,
        role: 'assistant',
        content: content,
        timestamp: new Date().toISOString(),
        metadata: speaker ? { speaker: speaker as any } : undefined,
      })
    }

    const updated = {
      ...current,
      chat_context: updatedChatContext
    }
    workspaceRef.current = updated
    setWorkspace(updated)
  }

  const finalizeAssistantMessage = async (content: string, messageId: string) => {
    if (!workspace) return

    // Find the existing streaming message in chat_context
    const existingMessageIndex = workspace.chat_context.findIndex(msg => msg.id === messageId)

    if (existingMessageIndex === -1) {
      console.error('[Workspace] Could not find streaming message to finalize:', messageId)
      // Fallback: add as new message
      await addChatMessage({
        role: 'assistant',
        content: content
      })
      return
    }

    // The message is already in the state from streaming, just save it to database
    const updatedChatContext = [...workspace.chat_context]

    try {
      const { error } = await supabase
        .from('user_workspace')
        .update({
          workspace_state: {
            name: workspace.name,
            description: workspace.description,
            chat_context: updatedChatContext,
            canvas_elements: workspace.canvas_elements,
            updated_at: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('user_id', workspace.id)

      if (error) throw error

    } catch (error) {
      console.error('[Workspace] Error finalizing message:', error)
    }
  }

  const handleTabSwitch = (tab: WorkspaceTab) => {
    // Preserve input when switching from chat to BMad Method
    if (activeTab === 'chat' && tab === 'bmad' && messageInput.trim()) {
      preserveInput(messageInput)
    }
    
    setActiveTab(tab)
  }

  // Restore preserved input when returning to chat tab
  useEffect(() => {
    if (activeTab === 'chat' && hasPreservedInput() && !messageInput) {
      setMessageInput(peekPreservedInput())
    }
  }, [activeTab, hasPreservedInput, peekPreservedInput, messageInput])

  if (authLoading || loading) {
    return (
      <div className="flex h-screen bg-background">
        {/* Chat pane skeleton */}
        <div className="flex-[6] border-r border-border flex flex-col">
          {/* Header skeleton */}
          <header className="h-14 mb-4 flex justify-between items-center px-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-muted rounded animate-pulse" />
              <div className="h-6 w-48 bg-muted rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-6 w-24 bg-muted/50 rounded animate-pulse" />
              <div className="h-6 w-20 bg-muted/50 rounded animate-pulse" />
              <div className="h-6 w-16 bg-muted/50 rounded animate-pulse" />
            </div>
          </header>
          {/* Tab navigation skeleton */}
          <div className="mb-4 px-4 border-b border-border">
            <div className="flex gap-4 pb-3">
              <div className="h-5 w-24 bg-muted rounded animate-pulse" />
              <div className="h-5 w-28 bg-muted/50 rounded animate-pulse" />
            </div>
          </div>
          {/* Chat messages skeleton */}
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Welcome card skeleton */}
              <div className="bg-muted/20 p-6 rounded-lg border border-border">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 w-48 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-full bg-muted/50 rounded animate-pulse" />
                    <div className="h-4 w-3/4 bg-muted/50 rounded animate-pulse" />
                  </div>
                </div>
              </div>
              {/* Message skeletons */}
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                  <div className="flex items-start gap-3 max-w-[70%]">
                    {i % 2 !== 0 && <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />}
                    <div className="px-5 py-4 rounded-xl bg-muted/30 min-w-[200px]">
                      <div className="h-4 w-full bg-muted/50 rounded animate-pulse mb-2" />
                      <div className="h-4 w-2/3 bg-muted/50 rounded animate-pulse" />
                    </div>
                    {i % 2 === 0 && <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Input skeleton */}
          <div className="mt-4 px-4 pb-4">
            <div className="flex gap-2">
              <div className="flex-1 h-12 bg-muted/30 border border-border rounded-lg animate-pulse" />
              <div className="h-12 w-20 bg-muted rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
        {/* Canvas pane skeleton */}
        <div className="flex-[4] p-4 flex flex-col">
          <header className="h-14 mb-4 flex justify-between items-center border-b border-border">
            <div>
              <div className="h-6 w-32 bg-muted rounded animate-pulse mb-1" />
              <div className="h-4 w-24 bg-muted/50 rounded animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="h-3 w-20 bg-muted/30 rounded animate-pulse" />
              <div className="h-3 w-16 bg-muted/30 rounded animate-pulse" />
            </div>
          </header>
          <div className="flex-1 bg-muted/10 rounded-lg border border-border animate-pulse" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">Access Required</h1>
          <p className="text-secondary mb-4">Please sign in to access your workspace.</p>
          <Link href="/login" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (error || !workspace) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <ErrorState
          error={error || 'Workspace not found'}
          onRetry={handleRetry}
          onSignOut={signOut}
          retryCount={retryCount}
          isRetrying={isRetrying}
          showSignOut={false}
        />
        <Link
          href="/app"
          className="mt-4 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <ArtifactProvider initialSessionId={params.id as string}>
    {/* Artifact Panel Overlay */}
    <ArtifactPanel />
    {/* Keyboard Shortcuts Handler */}
    <ArtifactKeyboardHandler />
    <div className={`dual-pane-container ${!isCanvasOpen ? 'canvas-closed' : ''}`}>
      {/* State Bridge Component for Sync */}
      <StateBridge workspaceId={workspace.id} className="hidden" />
      
      {/* Offline Indicator */}
      {!isOnline && <OfflineIndicator />}
      
      {/* Main Content Pane - 60% */}
      <PaneErrorBoundary paneName="chat">
        <div className="chat-pane">
        <header className="h-14 mb-4 flex justify-between items-center px-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Link href="/app" className="text-primary hover:opacity-80 transition-opacity">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold font-display text-foreground">{workspace.name}</h1>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCanvasOpen(!isCanvasOpen)}
              className="h-7 text-xs"
            >
              <LayoutTemplate className="w-3 h-3 mr-1" />
              {boardState
                ? (isCanvasOpen ? 'Hide Board' : 'Show Board')
                : (isCanvasOpen ? 'Hide Canvas' : 'Show Canvas')}
            </Button>
            <ArtifactList mode="badge" />
            <ExportPanel
              messages={workspace.chat_context}
              workspaceName={workspace.name}
              workspaceId={workspace.id}
            />
            <FeedbackButton variant="header" />
            <span className="text-muted-foreground">{user.email}</span>
            <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
              <Link href="/app/account">Account</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-destructive hover:text-destructive"
              onClick={signOut}
            >
              Sign Out
            </Button>
          </div>
        </header>
        
        {/* Tab Navigation */}
        <div className="mb-4 px-4 border-b border-border">
          <div className="flex gap-4">
            <button
              onClick={() => handleTabSwitch('chat')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'chat'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-primary hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Mary Chat
                {workspace.chat_context.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-terracotta/10 text-terracotta">
                    {workspace.chat_context.length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => handleTabSwitch('bmad')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'bmad'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-primary hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-terracotta rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">B</span>
                </div>
                BMad Method
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'chat' ? (
            <>
              <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                {workspace.chat_context.length === 0 && (
                  <div className="bg-parchment p-6 rounded-lg border border-ink/8 mb-4">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 bg-terracotta rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-cream font-semibold font-display">M</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-ink text-lg mb-2 font-display">Welcome to your Strategic Session!</p>
                        <p className="text-ink-light mb-4">
                          I&apos;m Mary, your AI strategic advisor. I&apos;m here to help you think through ideas, validate concepts,
                          and develop actionable plans using the proven bMAD Method.
                        </p>
                        <p className="font-medium text-ink mb-3">Try asking me about:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              setMessageInput("I have a new product idea I want to validate")
                              setTimeout(() => {
                                textareaRef.current?.focus()
                                textareaRef.current?.select()
                              }, 100)
                            }}
                            className="text-left px-4 py-3 bg-white hover:bg-parchment border border-ink/8 rounded-lg text-sm text-ink-light hover:text-ink transition-colors"
                          >
                            💡 Validate a new product idea
                          </button>
                          <button
                            onClick={() => {
                              setMessageInput("I need help analyzing my competitive landscape")
                              setTimeout(() => {
                                textareaRef.current?.focus()
                                textareaRef.current?.select()
                              }, 100)
                            }}
                            className="text-left px-4 py-3 bg-white hover:bg-parchment border border-ink/8 rounded-lg text-sm text-ink-light hover:text-ink transition-colors"
                          >
                            📊 Analyze competitive landscape
                          </button>
                          <button
                            onClick={() => {
                              setMessageInput("I'm stuck on my business model and need guidance")
                              setTimeout(() => {
                                textareaRef.current?.focus()
                                textareaRef.current?.select()
                              }, 100)
                            }}
                            className="text-left px-4 py-3 bg-white hover:bg-parchment border border-ink/8 rounded-lg text-sm text-ink-light hover:text-ink transition-colors"
                          >
                            🎯 Refine business model
                          </button>
                          <button
                            onClick={() => {
                              setMessageInput("Help me prioritize my product features")
                              setTimeout(() => {
                                textareaRef.current?.focus()
                                textareaRef.current?.select()
                              }, 100)
                            }}
                            className="text-left px-4 py-3 bg-white hover:bg-parchment border border-ink/8 rounded-lg text-sm text-ink-light hover:text-ink transition-colors"
                          >
                            ⚡ Prioritize features
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-terracotta/10 rounded-lg">
                      <p className="text-sm text-ink">
                        💬 <strong>Tip:</strong> Click a suggestion above to populate the input field, then press <kbd className="px-2 py-1 bg-white border border-ink/15 rounded text-xs font-mono">Send</kbd> or <kbd className="px-2 py-1 bg-white border border-ink/15 rounded text-xs font-mono">Enter</kbd> to chat with Mary!
                      </p>
                    </div>
                  </div>
                )}
                
                {workspace.chat_context.map((message) => {
                  // Handoff annotation (encoded as system message)
                  if (message.role === 'system' && message.content.startsWith('__handoff__')) {
                    const parts = message.content.split('__')
                    // Format: __handoff__FromName__ToName__reason
                    const fromName = parts[2] || 'Mary'
                    const toName = parts[3] || ''
                    const reason = parts[4] || ''
                    return (
                      <HandoffAnnotation
                        key={message.id}
                        fromSpeaker={fromName}
                        toSpeaker={toName}
                        reason={reason}
                      />
                    )
                  }

                  return (
                  <div key={message.id} className="mb-6">
                    {message.role === 'user' ? (
                      <div className="flex justify-end">
                        <div className="flex items-start gap-3 max-w-[70%]">
                          <div className="px-5 py-4 rounded-xl bg-terracotta/10">
                            <p className="text-foreground">{message.content}</p>
                          </div>
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-primary text-primary-foreground">
                            {user?.email?.[0]?.toUpperCase() || 'U'}
                          </div>
                        </div>
                      </div>
                    ) : message.role === 'assistant' && message.metadata?.speaker ? (
                      <SpeakerMessage
                        message={message}
                        boardMember={getBoardMember(message.metadata.speaker)}
                      />
                    ) : message.role === 'assistant' ? (
                      <div className="flex justify-start">
                        <div className="flex items-start gap-3 max-w-[70%]">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-terracotta text-cream">
                            M
                          </div>
                          <div className="px-5 py-4 rounded-xl bg-muted">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              className="prose prose-sm max-w-none"
                              components={{
                                code({ inline, className, children, ...props }: any) {
                                  return inline ? (
                                    <code className="px-1.5 py-0.5 rounded text-sm bg-ink/5 font-mono">
                                      {children}
                                    </code>
                                  ) : (
                                    <pre className="p-4 rounded-lg overflow-x-auto bg-parchment">
                                      <code className="font-mono">
                                        {children}
                                      </code>
                                    </pre>
                                  );
                                },
                                h1: ({ children }) => (
                                  <h1 className="text-2xl font-bold mb-4 text-ink">
                                    {children}
                                  </h1>
                                ),
                                h2: ({ children }) => (
                                  <h2 className="text-xl font-bold mb-3 text-ink">
                                    {children}
                                  </h2>
                                ),
                                h3: ({ children }) => (
                                  <h3 className="text-lg font-semibold mb-2 text-ink">
                                    {children}
                                  </h3>
                                ),
                                p: ({ children }) => (
                                  <p className="mb-4 leading-relaxed text-ink">
                                    {children}
                                  </p>
                                ),
                                ul: ({ children }) => (
                                  <ul className="list-disc pl-6 mb-4 space-y-1">
                                    {children}
                                  </ul>
                                ),
                                ol: ({ children }) => (
                                  <ol className="list-decimal pl-6 mb-4 space-y-1">
                                    {children}
                                  </ol>
                                ),
                                li: ({ children }) => (
                                  <li className="text-ink">
                                    {children}
                                  </li>
                                ),
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center">
                        <div className="px-5 py-4 rounded-xl bg-parchment max-w-[70%]">
                          <p className="text-sm text-slate-blue">
                            <strong>System:</strong> {message.content}
                          </p>
                        </div>
                      </div>
                    )}
                    {message.metadata?.strategic_tags && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {message.metadata.strategic_tags.map((tag, i) => (
                          <span key={i} className="text-xs px-2 py-1 rounded bg-ink/5 text-ink">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  )
                })}
                
                {sendingMessage && (
                  <div className="flex justify-start mb-6 opacity-50">
                    <div className="flex items-start gap-3 max-w-[70%]">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-terracotta text-cream">
                        M
                      </div>
                      <div className="px-5 py-4 rounded-xl bg-muted">
                        <span className="loading-shimmer h-4 w-32 inline-block rounded"></span>
                      </div>
                    </div>
                  </div>
                )}
                </div>
              </div>

              {/* Canvas Context Sync - Only shown when ENABLE_CANVAS=true */}
              {process.env.NEXT_PUBLIC_ENABLE_CANVAS === 'true' && (
                <div className="mt-4">
                  <CanvasContextSync
                    workspaceId={workspace.id}
                    messages={workspace.chat_context.map(msg => ({
                      id: msg.id,
                      role: msg.role as 'user' | 'assistant',
                      content: msg.content,
                      timestamp: new Date(msg.timestamp)
                    }))}
                    canvasState={canvasState}
                    onCanvasUpdate={(diagramCode, type) => {
                      setCanvasState({
                        mode: 'diagram',
                        diagramCode,
                        diagramType: type,
                        lastModified: new Date()
                      })
                    }}
                    autoPopulate={false}
                  />
                </div>
              )}

              {/* Message Limit Warning */}
              <MessageLimitWarning
                limitStatus={limitStatus}
                onExport={() => {
                  // Trigger export panel - user can export via header
                  const exportButton = document.querySelector('[title="Export chat conversation"]') as HTMLButtonElement;
                  if (exportButton) {
                    exportButton.click();
                  }
                }}
                onNewSession={() => {
                  window.location.href = '/app'
                }}
              />

              <form onSubmit={handleSendMessage} className="mt-4">
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={textareaRef}
                    value={messageInput}
                    onChange={(e) => {
                      setMessageInput(e.target.value)
                      // Auto-resize textarea
                      e.target.style.height = 'auto'
                      e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        if (messageInput.trim() && !sendingMessage) {
                          handleSendMessage(e)
                        }
                      }
                    }}
                    placeholder="Type your strategic question... (Shift+Enter for new line)"
                    disabled={sendingMessage}
                    rows={1}
                    className="flex-1 px-4 py-3 border border-divider rounded-lg focus:border-primary focus:outline-none disabled:opacity-50 resize-none min-h-[50px] max-h-[200px]"
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim() || sendingMessage}
                    className="px-4 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:hover:bg-primary transition-colors self-end"
                  >
                    {sendingMessage ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <BmadInterface 
                workspaceId={workspace.id} 
                className="w-full"
                preservedInput={hasPreservedInput() ? peekPreservedInput() : undefined}
                onInputConsumed={clearPreservedInput}
              />
            </div>
          )}
        </div>
        </div>
      </PaneErrorBoundary>

      {/* Right Pane - 40% (Board Overview or Canvas) */}
      <PaneErrorBoundary paneName={boardState ? 'board' : 'canvas'}>
        {boardState ? (
          <BoardOverview boardState={boardState} />
        ) : (
          <div className="canvas-pane">
          <header className="h-14 mb-4 flex justify-between items-center border-b border-border">
            <div>
              <h2 className="text-xl font-bold font-display text-foreground">Visual Canvas</h2>
              <p className="text-sm text-muted-foreground">Sketches & diagrams</p>
            </div>
            <div className="text-right text-xs">
              <div className="mb-1">
                <span className="text-muted-foreground">Messages:</span>
                <span className="font-medium ml-1 text-foreground">{workspace.chat_context.length}</span>
              </div>
              <div className="mb-1">
                <span className="text-muted-foreground">Elements:</span>
                <span className="font-medium ml-1 text-foreground">{workspace.canvas_elements.length}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-forest"></div>
                <span className="text-muted-foreground">Auto-saved</span>
              </div>
            </div>
          </header>

          <div className="canvas-container">
            <EnhancedCanvasWorkspace
              workspaceId={workspace.id}
              initialMode={canvasState?.mode || 'draw'}
              initialDiagramCode={canvasState?.diagramCode}
              initialDiagramType={canvasState?.diagramType as any}
              onStateChange={(newState) => {
                setCanvasState({
                  ...newState,
                  lastModified: new Date()
                })
              }}
            />
          </div>
          </div>
        )}
      </PaneErrorBoundary>
    </div>
    </ArtifactProvider>
  )
}