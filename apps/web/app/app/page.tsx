'use client';

import { useEffect, useState, useCallback } from 'react';
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
  Sparkles,
  Folder,
  Home,
} from 'lucide-react';
import Link from 'next/link';
import { ErrorState } from '@/app/components/ui/ErrorState';
import { FeedbackButton } from '@/app/components/feedback/FeedbackButton';
import { SessionMigration } from '@/lib/guest/session-migration';

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
  current_step: string;
  session_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

function DashboardSkeleton() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar skeleton */}
      <aside className="fixed left-0 top-0 h-full w-60 border-r border-border bg-card">
        <div className="px-4 py-6">
          <div className="h-7 w-28 bg-muted rounded animate-pulse" />
        </div>
        <div className="px-4 mb-6">
          <div className="h-10 w-full bg-muted rounded animate-pulse" />
        </div>
        <div className="px-4">
          <div className="h-4 w-24 bg-muted rounded animate-pulse mb-3" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 w-full bg-muted/50 rounded animate-pulse" />
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 border-t border-border px-4 py-4 space-y-2">
          <div className="h-10 w-full bg-muted/50 rounded animate-pulse" />
          <div className="h-10 w-full bg-muted/50 rounded animate-pulse" />
          <div className="h-10 w-full bg-muted/50 rounded animate-pulse" />
        </div>
      </aside>
      {/* Main content skeleton */}
      <main className="ml-60 flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-12 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-9 w-64 bg-muted rounded animate-pulse mb-2" />
                <div className="h-5 w-48 bg-muted/50 rounded animate-pulse" />
              </div>
              <div className="h-11 w-36 bg-muted rounded animate-pulse" />
            </div>
          </div>
          <div className="h-7 w-32 bg-muted rounded animate-pulse mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-card border border-border rounded-lg animate-pulse">
                <div className="p-6">
                  <div className="h-6 w-3/4 bg-muted rounded mb-4" />
                  <div className="h-4 w-full bg-muted/50 rounded mb-2" />
                  <div className="h-4 w-2/3 bg-muted/50 rounded mb-4" />
                  <div className="flex justify-between mt-8">
                    <div className="h-4 w-20 bg-muted/30 rounded" />
                    <div className="h-4 w-16 bg-muted/30 rounded" />
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

  const fetchSessions = useCallback(async () => {
    try {
      setError(null);
      // Select specific columns - exclude chat_context to avoid loading full JSONB blobs
      const { data, error: fetchError } = await supabase
        .from('bmad_sessions')
        .select('id, user_id, pathway, title, current_phase, session_mode, message_count, message_limit, status, created_at, updated_at')
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
    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      const { error } = await supabase
        .from('bmad_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user?.id);  // IDOR protection

      if (error) throw error;

      // Refresh sessions
      fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
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

  const getSessionDescription = (session: BmadSession) => {
    return session.pathway?.replace(/-/g, ' ') || '';
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
      <div className="flex h-screen bg-background">
        {/* Sidebar skeleton for context */}
        <aside className="fixed left-0 top-0 h-full w-60 border-r border-border bg-card">
          <div className="px-4 py-6">
            <Link href="/" className="text-xl font-bold text-foreground">ThinkHaven</Link>
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
    <div className="flex h-screen bg-background">
      {/* Fixed Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-60 border-r border-border flex flex-col bg-card">
        {/* Logo */}
        <div className="px-4 py-6">
          <a href="/" className="text-xl font-bold text-foreground">ThinkHaven</a>
        </div>

        {/* New Session Button */}
        <div className="px-4 mb-6">
          <Button
            onClick={handleNewSession}
            className="w-full"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            New Session
          </Button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-4">
          <h2 className="font-display text-xs font-semibold uppercase tracking-[0.15em] mb-3 text-muted-foreground">
            Recent
          </h2>
          <div className="space-y-1">
            {sessions.slice(0, 5).map((session) => (
              <button
                key={session.id}
                onClick={() => handleSessionClick(session.id)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                  <span className="text-sm truncate text-foreground font-display">
                    {getSessionTitle(session)}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground ml-6">
                  {formatTimestamp(session.updated_at)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Settings and Account */}
        <div className="border-t border-border px-4 py-4 space-y-2">
          <button
            onClick={() => router.push('/')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-foreground"
          >
            <Home className="w-4 h-4" />
            <span className="text-sm">Home</span>
          </button>
          <button
            onClick={() => router.push('/app/account')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-foreground"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm">Settings</span>
          </button>
          <FeedbackButton variant="sidebar" />
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-foreground"
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
                <h1 className="text-3xl font-bold mb-2 text-foreground font-display">
                  {getGreeting()}, {firstName}
                </h1>
                <p className="text-muted-foreground font-body">
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
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Sparkles className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-foreground">
                Start your first strategic session
              </h2>
              <p className="mb-8 text-center max-w-md text-muted-foreground">
                Create a new session to begin your strategic thinking journey with AI-powered insights
              </p>
              <Button
                onClick={handleNewSession}
                size="lg"
                className="px-8 py-6 text-lg"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                New Session
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
                        <h3 className="text-lg font-semibold mb-2 line-clamp-2 text-foreground">
                          {getSessionTitle(session)}
                        </h3>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 hover:bg-accent rounded transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSessionClick(session.id);
                            }}
                          >
                            Open
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(session.id);
                            }}
                            className="text-destructive"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <p className="text-sm mb-4 line-clamp-3 text-muted-foreground">
                      {getSessionDescription(session)}
                    </p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="capitalize">{(session.pathway || 'session').replace(/-/g, ' ')}</span>
                      <span>{formatTimestamp(session.updated_at)}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
