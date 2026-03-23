'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { PaneErrorBoundary, OfflineIndicator, useOnlineStatus } from '@/app/components/dual-pane/PaneErrorBoundary'
import { MessageLimitWarning } from '@/app/components/chat/MessageLimitWarning'
import { getBoardMember } from '@/lib/ai/board-members'
import SpeakerMessage from '@/app/components/board/SpeakerMessage'
import HandoffAnnotation from '@/app/components/board/HandoffAnnotation'
import BoardOverview from '@/app/components/board/BoardOverview'
import ExportPanel from '@/app/components/workspace/ExportPanel'
import { ArtifactProvider } from '@/lib/artifact'
import { ArtifactPanel, ArtifactKeyboardHandler } from '@/app/components/artifact'
import { ErrorState } from '@/app/components/ui/ErrorState'
import { FeedbackButton } from '@/app/components/feedback/FeedbackButton'
import { useStreamingChat, parseChatContext } from './useStreamingChat'
import type { SessionData } from './useStreamingChat'
import LeanCanvas from '@/app/components/canvas/LeanCanvas'
import { isNonEmptyCanvas, type LeanCanvas as LeanCanvasType } from '@/lib/canvas/lean-canvas-schema'

export default function SessionPage() {
  const params = useParams()
  const { user, loading: authLoading, signOut } = useAuth()
  const [fetchedSession, setFetchedSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCanvasOpen, setIsCanvasOpen] = useState(false)
  const [userDismissedBoard, setUserDismissedBoard] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)

  const {
    session,
    messageInput,
    setMessageInput,
    sendingMessage,
    limitStatus,
    boardState,
    streamError,
    dismissError,
    handleSendMessage,
  } = useStreamingChat(fetchedSession, user?.id)
  const isOnline = useOnlineStatus()

  const canvasAutoOpenedRef = useRef(false)

  // Auto-open board pane when Board of Directors activates
  useEffect(() => {
    if (boardState && !userDismissedBoard) {
      setIsCanvasOpen(true)
    }
  }, [boardState, userDismissedBoard])

  // Auto-open canvas pane when lean canvas has content (fires once)
  useEffect(() => {
    if (session?.lean_canvas && isNonEmptyCanvas(session.lean_canvas) && !canvasAutoOpenedRef.current) {
      canvasAutoOpenedRef.current = true
      setIsCanvasOpen(true)
    }
  }, [session?.lean_canvas])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session?.chat_context?.length, sendingMessage])

  const fetchSession = useCallback(async () => {
    if (!user) return
    try {
      setError('')
      const { data, error: fetchError } = await supabase
        .from('bmad_sessions')
        .select('id, user_id, chat_context, title, pathway, current_phase, message_count, message_limit, sub_persona_state, session_mode, lean_canvas, updated_at')
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single()

      if (fetchError) throw fetchError

      const sessionData: SessionData = {
        id: data.id,
        user_id: data.user_id,
        chat_context: parseChatContext(data.chat_context),
        title: data.title,
        pathway: data.pathway,
        current_phase: data.current_phase,
        message_count: data.message_count,
        message_limit: data.message_limit,
        sub_persona_state: data.sub_persona_state as any,
        session_mode: data.session_mode,
        lean_canvas: (data.lean_canvas as LeanCanvasType) || null,
      }

      setFetchedSession(sessionData)
    } catch (err) {
      console.error('Error fetching session:', err)
      setError('Session not found or you don\'t have access.')
    } finally {
      setLoading(false)
      setIsRetrying(false)
    }
  }, [user, params.id])

  const handleRetry = () => {
    setIsRetrying(true)
    setRetryCount(c => c + 1)
    setLoading(true)
    fetchSession()
  }

  useEffect(() => {
    if (user && params.id) {
      fetchSession()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, params.id])

  // Loading skeleton
  if (authLoading || loading) {
    return (
      <div className="dual-pane-container canvas-closed">
        <div className="chat-pane">
          <header className="h-14 mb-4 flex justify-between items-center px-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-parchment rounded animate-pulse" />
              <div className="h-6 w-48 bg-parchment rounded animate-pulse" />
            </div>
            <div className="h-8 w-8 bg-parchment/50 rounded animate-pulse" />
          </header>
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
          <p className="text-muted-foreground mb-4">Please sign in to access this session.</p>
          <Link href="/login" className="px-4 py-2 bg-primary text-cream rounded-lg hover:opacity-90">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <ErrorState
          error={error || 'Session not found'}
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
    <ArtifactPanel />
    <ArtifactKeyboardHandler />
    <div className={`dual-pane-container ${!isCanvasOpen ? 'canvas-closed' : ''}`}>
      {!isOnline && <OfflineIndicator />}

      {/* Main Content Pane */}
      <div className="chat-pane">
        <header className="h-14 mb-4 flex justify-between items-center px-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Link href="/app" className="text-primary hover:opacity-80 transition-opacity">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold font-display text-foreground truncate max-w-[300px]">
              {session.title || 'Strategic Session'}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <ExportPanel
              messages={session.chat_context}
              workspaceName={session.title || 'Strategic Session'}
              workspaceId={session.id}
            />
            <FeedbackButton variant="header" />
            <span className="text-muted-foreground">{user.email}</span>
            <Link
              href="/app/account"
              className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Account
            </Link>
            <button
              className="px-2 py-1 text-xs text-rust hover:opacity-80 transition-opacity"
              onClick={signOut}
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Chat Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto p-8 relative"
            data-ph-mask
            onScroll={(e) => {
              const el = e.currentTarget
              const shouldShow = el.scrollHeight - el.scrollTop - el.clientHeight > 200
              setShowScrollButton(prev => prev === shouldShow ? prev : shouldShow)
            }}
          >
            <div className="max-w-4xl mx-auto space-y-6">
              {session.chat_context.length === 0 && (
                <div className="bg-parchment p-6 rounded-lg border border-ink/8 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-terracotta rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-cream font-semibold font-display">M</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-ink text-lg mb-2 font-display">Hey, I&apos;m Mary.</p>
                      <p className="text-ink-light">
                        What idea or decision are you working on? I&apos;ll help you pressure-test it.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {session.chat_context.map((message) => {
                if (message.role === 'system' && message.content.startsWith('__handoff__')) {
                  const parts = message.content.split('__')
                  return (
                    <HandoffAnnotation
                      key={message.id}
                      fromSpeaker={parts[2] || 'Mary'}
                      toSpeaker={parts[3] || ''}
                      reason={parts[4] || ''}
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
                                code({ className, children, ...props }: any) {
                                  const isInline = !className
                                  return isInline ? (
                                    <code className="px-1.5 py-0.5 rounded text-sm bg-ink/5 font-mono">
                                      {children}
                                    </code>
                                  ) : (
                                    <pre className="p-4 rounded-lg overflow-x-auto bg-parchment">
                                      <code className="font-mono">{children}</code>
                                    </pre>
                                  )
                                },
                                h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 text-ink">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-xl font-bold mb-3 text-ink">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-lg font-semibold mb-2 text-ink">{children}</h3>,
                                p: ({ children }) => <p className="mb-4 leading-relaxed text-ink">{children}</p>,
                                ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
                                li: ({ children }) => <li className="text-ink">{children}</li>,
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
                          <span key={i} className="text-xs px-2 py-1 rounded bg-ink/5 text-ink">{tag}</span>
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

              <div ref={messagesEndRef} />
            </div>
            {showScrollButton && (
              <button
                onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="sticky bottom-4 left-1/2 -translate-x-1/2 z-10 bg-ink/80 text-cream px-3 py-1.5 rounded-full text-xs font-medium shadow-lg hover:bg-ink transition-colors flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                Scroll to bottom
              </button>
            )}
          </div>

          <MessageLimitWarning
            limitStatus={limitStatus}
            onExport={() => {
              // Click the header ExportPanel trigger button
              const exportBtn = document.querySelector('[title="Export chat conversation"]') as HTMLButtonElement
              if (exportBtn) exportBtn.click()
            }}
            onNewSession={() => { window.location.href = '/app' }}
          />

          {streamError && (
            <div className="mx-4 mb-2 px-4 py-2 bg-rust/10 border border-rust/20 rounded-lg flex items-center justify-between">
              <p className="text-sm text-rust">{streamError}</p>
              <button onClick={dismissError} className="text-rust/60 hover:text-rust ml-2 flex-shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="mt-4">
            <div className="flex gap-2 items-end">
              <textarea
                ref={textareaRef}
                value={messageInput}
                onChange={(e) => {
                  setMessageInput(e.target.value)
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
                className="flex-1 px-4 py-3 border border-border rounded-lg focus:border-primary focus:outline-none disabled:opacity-50 resize-none min-h-[50px] max-h-[200px]"
              />
              <button
                type="submit"
                disabled={!messageInput.trim() || sendingMessage}
                className="px-4 py-3 bg-primary text-cream font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity self-end"
              >
                {sendingMessage ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Pane - Lean Canvas and/or Board Overview */}
      {isCanvasOpen && (session?.lean_canvas && isNonEmptyCanvas(session.lean_canvas) || boardState) && (
        <div className="w-[380px] flex-shrink-0 border-l border-divider bg-cream overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-divider">
            <span className="font-display text-xs font-semibold uppercase tracking-wider text-ink-light">
              {boardState ? 'Board & Canvas' : 'Lean Canvas'}
            </span>
            <button
              onClick={() => {
                setIsCanvasOpen(false)
                setUserDismissedBoard(true)
              }}
              className="text-ink-light hover:text-ink transition-colors"
              aria-label="Close panel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {session?.lean_canvas && isNonEmptyCanvas(session.lean_canvas) && (
            <LeanCanvas canvas={session.lean_canvas} title={session.title || undefined} />
          )}
          {boardState && (
            <PaneErrorBoundary paneName="board">
              <BoardOverview
                boardState={boardState}
                onClose={() => {
                  setIsCanvasOpen(false)
                  setUserDismissedBoard(true)
                }}
              />
            </PaneErrorBoundary>
          )}
        </div>
      )}
    </div>
    </ArtifactProvider>
  )
}
