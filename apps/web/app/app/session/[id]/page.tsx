'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import StateBridge from '@/app/components/dual-pane/StateBridge'
import { PaneErrorBoundary, OfflineIndicator, useOnlineStatus } from '@/app/components/dual-pane/PaneErrorBoundary'
import CanvasContextSync from '@/components/canvas/CanvasContextSync'
import { MessageLimitWarning } from '@/app/components/chat/MessageLimitWarning'
import type { ChatMessage, BoardState } from '@/lib/ai/board-types'
import { getBoardMember } from '@/lib/ai/board-members'
import SpeakerMessage from '@/app/components/board/SpeakerMessage'
import HandoffAnnotation from '@/app/components/board/HandoffAnnotation'
import BoardOverview from '@/app/components/board/BoardOverview'
import ExportPanel from '@/app/components/workspace/ExportPanel'
import HeaderOverflowMenu from '@/app/components/session/HeaderOverflowMenu'
import dynamic from 'next/dynamic'
import { ArtifactProvider } from '@/lib/artifact'
import { ArtifactPanel, ArtifactKeyboardHandler } from '@/app/components/artifact'
import { ErrorState } from '@/app/components/ui/ErrorState'
import ModeIndicator from '@/app/components/session/ModeIndicator'
import ToneSelector from '@/app/components/session/ToneSelector'
import { useStreamingChat } from './useStreamingChat'

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

export default function WorkspacePage() {
  const params = useParams()
  const { user, loading: authLoading, signOut } = useAuth()
  const [fetchedWorkspace, setFetchedWorkspace] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [canvasState, setCanvasState] = useState<{
    mode: 'draw' | 'diagram'
    diagramCode?: string
    diagramType?: string
    drawingSnapshot?: string
    lastModified: Date
  } | null>(null)
  const [isCanvasOpen, setIsCanvasOpen] = useState(false)
  const [userDismissedBoard, setUserDismissedBoard] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showExport, setShowExport] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)

  // Streaming chat logic extracted to hook
  const {
    workspace,
    setWorkspace,
    messageInput,
    setMessageInput,
    sendingMessage,
    limitStatus,
    boardState,
    setBoardState,
    handleSendMessage,
    sessionMode,
    currentTone,
    switchMode,
    switchTone,
  } = useStreamingChat(fetchedWorkspace)
  const isOnline = useOnlineStatus()

  // Auto-open right pane when Board of Directors activates
  // Respects user dismissal to prevent force-reopening on streaming events
  useEffect(() => {
    if (boardState && !userDismissedBoard) {
      setIsCanvasOpen(true)
    }
  }, [boardState, userDismissedBoard])

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

      setFetchedWorkspace(transformedWorkspace)
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


  if (authLoading || loading) {
    return (
      <div className="dual-pane-container canvas-closed">
        <div className="chat-pane">
          {/* Simplified header skeleton */}
          <header className="h-14 mb-4 flex justify-between items-center px-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-parchment rounded animate-pulse" />
              <div className="h-6 w-48 bg-parchment rounded animate-pulse" />
              <div className="h-7 w-24 bg-parchment/50 rounded-full animate-pulse" />
              <div className="h-7 w-28 bg-parchment/50 rounded-full animate-pulse" />
            </div>
            <div className="h-8 w-8 bg-parchment/50 rounded animate-pulse" />
          </header>

          {/* Chat content skeleton */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-parchment/50 p-6 rounded-lg animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-terracotta/30 rounded-full" />
                    <div className="flex-1 space-y-3">
                      <div className="h-5 w-64 bg-parchment rounded" />
                      <div className="h-4 w-full bg-parchment/70 rounded" />
                      <div className="h-4 w-4/5 bg-parchment/70 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex gap-2 items-end">
                <div className="flex-1 h-[50px] bg-parchment/20 border border-border rounded-lg animate-pulse" />
                <div className="h-[50px] w-16 bg-parchment rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        </div>
        <div className="canvas-pane" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">Access Required</h1>
          <p className="text-muted-foreground mb-4">Please sign in to access your workspace.</p>
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
            <h1 className="text-xl font-bold font-display text-foreground truncate max-w-[200px]">{workspace.name}</h1>
            <ModeIndicator
              currentMode={sessionMode}
              onModeChange={switchMode}
              disabled={sendingMessage}
            />
            <ToneSelector
              currentTone={currentTone}
              onToneChange={switchTone}
              disabled={sendingMessage}
            />
          </div>
          <HeaderOverflowMenu
            onExportClick={() => setShowExport(true)}
            onSignOut={signOut}
          />
        </header>
        
        {/* Chat Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
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
                            className="text-left px-4 py-3 bg-cream hover:bg-parchment border border-ink/8 rounded-lg text-sm text-ink-light hover:text-ink transition-colors"
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
                            className="text-left px-4 py-3 bg-cream hover:bg-parchment border border-ink/8 rounded-lg text-sm text-ink-light hover:text-ink transition-colors"
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
                            className="text-left px-4 py-3 bg-cream hover:bg-parchment border border-ink/8 rounded-lg text-sm text-ink-light hover:text-ink transition-colors"
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
                            className="text-left px-4 py-3 bg-cream hover:bg-parchment border border-ink/8 rounded-lg text-sm text-ink-light hover:text-ink transition-colors"
                          >
                            ⚡ Prioritize features
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-terracotta/10 rounded-lg">
                      <p className="text-sm text-ink">
                        💬 <strong>Tip:</strong> Click a suggestion above to populate the input field, then press <kbd className="px-2 py-1 bg-cream border border-ink/15 rounded text-xs font-mono">Send</kbd> or <kbd className="px-2 py-1 bg-cream border border-ink/15 rounded text-xs font-mono">Enter</kbd> to chat with Mary!
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

              {/* Export Panel - conditionally rendered from overflow menu */}
              {showExport && (
                <div className="relative mb-4">
                  <ExportPanel
                    messages={workspace.chat_context}
                    workspaceName={workspace.name}
                    workspaceId={workspace.id}
                  />
                </div>
              )}

              {/* Message Limit Warning */}
              <MessageLimitWarning
                limitStatus={limitStatus}
                onExport={() => setShowExport(true)}
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
        </div>
        </div>
      </PaneErrorBoundary>

      {/* Right Pane - 40% (Board Overview or Canvas) */}
      <PaneErrorBoundary paneName={boardState ? 'board' : 'canvas'}>
        {boardState ? (
          <BoardOverview
            boardState={boardState}
            onClose={() => {
              setIsCanvasOpen(false)
              setUserDismissedBoard(true)
            }}
          />
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