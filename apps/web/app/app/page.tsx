'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  PlusIcon,
  MoreVertical,
  LogOut,
  Settings,
  Folder,
  Home,
  X,
  Pencil,
} from 'lucide-react';
import Link from 'next/link';
import * as Dialog from '@radix-ui/react-dialog';
import { ErrorState } from '@/app/components/ui/ErrorState';
import { FeedbackButton } from '@/app/components/feedback/FeedbackButton';
import { SessionMigration } from '@/lib/guest/session-migration';
import { PATHWAY_LABELS } from '@/lib/session/pathway-labels';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

interface BmadSession {
  id: string;
  user_id: string;
  pathway: string;
  title: string | null;
  current_phase: string;
  message_count: number;
  message_limit: number;
  status: string;
  created_at: string;
  updated_at: string;
}

function DashboardSkeleton() {
  return (
    <div className="flex h-screen bg-cream">
      {/* Sidebar skeleton */}
      <aside className="fixed left-0 top-0 h-full w-60 border-r border-ink/10 bg-parchment">
        <div className="px-4 py-6">
          <div className="h-7 w-28 bg-parchment rounded animate-pulse" />
        </div>
        <div className="px-4 mb-6">
          <div className="h-10 w-full bg-parchment rounded animate-pulse" />
        </div>
        <div className="px-4">
          <div className="h-4 w-24 bg-parchment rounded animate-pulse mb-3" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 w-full bg-parchment/50 rounded animate-pulse" />
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 border-t border-ink/10 px-4 py-4 space-y-2">
          <div className="h-10 w-full bg-parchment/50 rounded animate-pulse" />
          <div className="h-10 w-full bg-parchment/50 rounded animate-pulse" />
          <div className="h-10 w-full bg-parchment/50 rounded animate-pulse" />
        </div>
      </aside>
      {/* Main content skeleton */}
      <main className="ml-60 flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-12 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-9 w-64 bg-parchment rounded animate-pulse mb-2" />
                <div className="h-5 w-48 bg-parchment/50 rounded animate-pulse" />
              </div>
              <div className="h-11 w-36 bg-parchment rounded animate-pulse" />
            </div>
          </div>
          <div className="h-7 w-32 bg-parchment rounded animate-pulse mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-parchment border border-ink/10 rounded-lg animate-pulse">
                <div className="p-6">
                  <div className="h-6 w-3/4 bg-parchment rounded mb-4" />
                  <div className="h-4 w-full bg-parchment/50 rounded mb-2" />
                  <div className="h-4 w-2/3 bg-parchment/50 rounded mb-4" />
                  <div className="flex justify-between mt-8">
                    <div className="h-4 w-20 bg-parchment/30 rounded" />
                    <div className="h-4 w-16 bg-parchment/30 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AppDashboardPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [sessions, setSessions] = useState<BmadSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [renamingSession, setRenamingSession] = useState<{ id: string; title: string } | null>(null);
  const [confirmDeleteSession, setConfirmDeleteSession] = useState<{ id: string; title: string } | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setError(null);
      // Select specific columns - exclude chat_context to avoid loading full JSONB blobs
      const { data, error: fetchError } = await supabase
        .from('bmad_sessions')
        .select('id, user_id, pathway, title, current_phase, message_count, message_limit, status, created_at, updated_at')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      setSessions(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load sessions';
      console.error('Error fetching sessions:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  }, [user?.id]);

  // Check for guest session migration on mount
  useEffect(() => {
    if (!user) return
    let ignore = false

    if (SessionMigration.hasGuestSession()) {
      SessionMigration.migrateToUserWorkspace(user.id).then(result => {
        if (ignore) return
        if (result.success && result.sessionId) {
          router.push(`/app/session/${result.sessionId}`)
        } else {
          fetchSessions()
        }
      }).catch(() => {
        if (!ignore) fetchSessions()
      })
    } else {
      fetchSessions()
    }

    return () => { ignore = true }
  }, [user, fetchSessions, router]);

  const handleRetry = () => {
    setIsRetrying(true);
    setRetryCount(c => c + 1);
    setLoading(true);
    fetchSessions();
  };

  const handleNewSession = () => {
    router.push('/app/new');
  };

  const handleSessionClick = (sessionId: string) => {
    router.push(`/app/session/${sessionId}`);
  };

  const handleDeleteSession = async (sessionId: string) => {
    setConfirmDeleteSession(null);

    // Optimistic removal so UI updates immediately
    setSessions(prev => prev.filter(s => s.id !== sessionId));

    try {
      const { error } = await supabase
        .from('bmad_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user?.id);  // IDOR protection

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting session:', error);
      // Revert on failure
      fetchSessions();
    }
  };

  const handleRenameSession = async (sessionId: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;

    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title: trimmed } : s));
    setRenamingSession(null);

    try {
      const { error } = await supabase
        .from('bmad_sessions')
        .update({ title: trimmed })
        .eq('id', sessionId)
        .eq('user_id', user?.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error renaming session:', error);
      fetchSessions();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return 'Yesterday';
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;
    return date.toLocaleDateString();
  };

  const getSessionTitle = (session: BmadSession) => {
    return session.title || 'Untitled Session';
  };

  const getPathwayLabel = (pathway: string) => {
    return PATHWAY_LABELS[pathway] || pathway.replace(/-/g, ' ');
  };

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User';

  if (!user) {
    return null;
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex h-screen bg-cream">
        {/* Sidebar skeleton for context */}
        <aside className="fixed left-0 top-0 h-full w-60 border-r border-ink/10 bg-parchment">
          <div className="px-4 py-6">
            <Link href="/" className="text-xl font-bold text-ink">ThinkHaven</Link>
          </div>
        </aside>
        <main className="ml-60 flex-1 flex items-center justify-center">
          <ErrorState
            error={error}
            onRetry={handleRetry}
            onSignOut={signOut}
            retryCount={retryCount}
            isRetrying={isRetrying}
            showSignOut={true}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-cream">
      {/* Fixed Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-60 border-r border-ink/10 flex flex-col bg-parchment">
        {/* Logo */}
        <div className="px-4 py-6">
          <Link href="/" className="text-xl font-bold text-ink">ThinkHaven</Link>
        </div>

        {/* New Session Button (sidebar tertiary action; primary entry is the body CTA) */}
        <div className="px-4 mb-6">
          <Button
            onClick={handleNewSession}
            variant="ghost"
            size="sm"
            className="w-full justify-start text-ink-light hover:text-ink"
          >
            New session
          </Button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-4">
          <h2 className="font-display text-xs font-semibold uppercase tracking-[0.15em] mb-3 text-ink-light">
            Recent
          </h2>
          <div className="space-y-1">
            {sessions.slice(0, 5).map((session) => (
              <button
                key={session.id}
                onClick={() => handleSessionClick(session.id)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-ink/5 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 flex-shrink-0 text-ink-light" />
                  <span className="text-sm truncate text-ink font-display">
                    {getSessionTitle(session)}
                  </span>
                </div>
                <span className="text-xs text-ink-light ml-6">
                  {formatTimestamp(session.updated_at)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Settings and Account */}
        <div className="border-t border-ink/10 px-4 py-4 space-y-2">
          <button
            onClick={() => router.push('/')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-ink/5 transition-colors text-ink"
          >
            <Home className="w-4 h-4" />
            <span className="text-sm">Home</span>
          </button>
          <button
            onClick={() => router.push('/app/account')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-ink/5 transition-colors text-ink"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm">Settings</span>
          </button>
          <FeedbackButton variant="sidebar" />
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-ink/5 transition-colors text-ink"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-60 flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-12 py-8">
          {/* Welcome Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2 text-ink font-display">
                  {getGreeting()}, {firstName}
                </h1>
                <p className="text-ink-light font-body">
                  What strategic challenge are you working on today?
                </p>
              </div>
            </div>
          </div>

          {/* New Session CTA */}
          <div className="mb-10">
            <Link
              href="/app/new"
              className="bg-parchment rounded-2xl shadow border border-ink/8 p-6 flex items-center gap-4 transition-all duration-200 hover:shadow-md active:scale-[0.98] cursor-pointer"
            >
              <div className="w-12 h-12 bg-terracotta rounded-full flex items-center justify-center flex-shrink-0">
                <PlusIcon className="w-6 h-6 text-cream" />
              </div>
              <div>
                <h3 className="font-display text-lg font-medium text-ink mb-1">
                  Start a New Session
                </h3>
                <p className="font-body text-sm leading-relaxed text-ink-light">
                  Share your idea and Mary will pressure-test it through structured loops.
                </p>
              </div>
            </Link>
          </div>

          {/* Session Grid or Empty State */}
          {sessions.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-start py-16 max-w-xl">
              <h2 className="font-display text-2xl font-medium mb-3 text-ink">
                Nothing yet. What are you trying to decide?
              </h2>
              <p className="font-body mb-8 text-ink-light leading-relaxed">
                Open a new session and the board will pressure-test the decision you&rsquo;re about to make.
              </p>
              <Button
                onClick={handleNewSession}
                size="lg"
              >
                Start a session
              </Button>
            </div>
          ) : (
            /* Session Grid */
            <div>
              <h2 className="font-display text-xs font-semibold uppercase tracking-[0.15em] text-ink-light mb-6">
                Recent Sessions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.map((session) => (
                  <Card
                    key={session.id}
                    className="p-6 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer group"
                    onClick={() => handleSessionClick(session.id)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold mb-2 line-clamp-2 text-ink">
                          {getSessionTitle(session)}
                        </h3>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                            className="p-1.5 hover:bg-ink/5 rounded transition-colors relative z-10"
                          >
                            <MoreVertical className="w-4 h-4 text-ink-light" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem
                            onSelect={() => handleSessionClick(session.id)}
                          >
                            Open
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => setRenamingSession({ id: session.id, title: getSessionTitle(session) })}
                          >
                            <Pencil className="w-3.5 h-3.5 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => setConfirmDeleteSession({ id: session.id, title: getSessionTitle(session) })}
                            className="text-destructive"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center justify-between text-xs text-ink-light mt-auto pt-4">
                      <span>{getPathwayLabel(session.pathway || 'explore')}</span>
                      <span>{session.message_count || 0} msgs · {formatTimestamp(session.updated_at)}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Rename Dialog */}
      <Dialog.Root open={!!renamingSession} onOpenChange={(open) => { if (!open) setRenamingSession(null) }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-ink/50 z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-cream rounded-lg shadow-xl max-w-sm w-full mx-4 z-50 p-6 focus:outline-none">
            <Dialog.Title className="font-display text-lg font-semibold text-ink mb-4">
              Rename Session
            </Dialog.Title>
            <form onSubmit={(e) => {
              e.preventDefault()
              if (renamingSession) {
                handleRenameSession(renamingSession.id, renameInputRef.current?.value || '')
              }
            }}>
              <input
                ref={renameInputRef}
                type="text"
                defaultValue={renamingSession?.title || ''}
                autoFocus
                className="w-full px-3 py-2 border border-ink/10 rounded-lg text-sm focus:ring-2 focus:ring-terracotta focus:border-transparent bg-parchment"
                placeholder="Session title"
                maxLength={100}
              />
              <div className="flex justify-end gap-2 mt-4">
                <Dialog.Close asChild>
                  <button type="button" className="px-4 py-2 text-sm text-ink-light hover:text-ink transition-colors">
                    Cancel
                  </button>
                </Dialog.Close>
                <button type="submit" className="px-4 py-2 text-sm font-medium bg-terracotta text-cream rounded-lg hover:bg-terracotta-hover transition-colors">
                  Save
                </button>
              </div>
            </form>
            <Dialog.Close asChild>
              <button className="absolute top-4 right-4 text-ink/40 hover:text-ink transition-colors" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirmation Dialog */}
      <Dialog.Root open={!!confirmDeleteSession} onOpenChange={(open) => { if (!open) setConfirmDeleteSession(null) }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-ink/50 z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-cream rounded-lg shadow-xl max-w-sm w-full mx-4 z-50 p-6 focus:outline-none">
            <Dialog.Title className="font-display text-lg font-medium text-ink mb-2">
              Delete this session?
            </Dialog.Title>
            <Dialog.Description className="font-body text-sm text-ink-light mb-6 leading-relaxed">
              &ldquo;{confirmDeleteSession?.title}&rdquo; will be removed permanently. This can&rsquo;t be undone.
            </Dialog.Description>
            <div className="flex justify-end gap-2">
              <Dialog.Close asChild>
                <button type="button" className="px-4 py-2 text-sm text-ink-light hover:text-ink transition-colors">
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="button"
                onClick={() => {
                  if (confirmDeleteSession) {
                    handleDeleteSession(confirmDeleteSession.id);
                  }
                }}
                className="px-4 py-2 text-sm font-medium bg-rust text-cream rounded-lg hover:bg-rust/90 transition-colors"
              >
                Delete session
              </button>
            </div>
            <Dialog.Close asChild>
              <button className="absolute top-4 right-4 text-ink/40 hover:text-ink transition-colors" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
