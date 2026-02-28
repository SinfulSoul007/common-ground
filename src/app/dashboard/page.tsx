'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import Button from '@/components/ui/Button';

interface SessionRow {
  id: string;
  current_phase: number;
  phase1_complete: boolean;
  published_to_forum: boolean;
  created_at: string;
  researcher_user_id: string | null;
  problem_statement?: { plainEnglish?: string } | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading: userLoading } = useUser();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [unpublishingId, setUnpublishingId] = useState<string | null>(null);

  // Initial load and polling so session list stays in sync with DB (realtime)
  useEffect(() => {
    if (userLoading || !user) return;

    const fetchSessions = () => {
      fetch('/api/sessions')
        .then((res) => res.json())
        .then((data) => setSessions(Array.isArray(data) ? data : []))
        .catch((err) => console.error('Failed to load sessions:', err))
        .finally(() => setLoading(false));
    };

    fetchSessions();
    const interval = setInterval(fetchSessions, 3000);
    return () => clearInterval(interval);
  }, [user, userLoading]);

  const handleCreateSession = async () => {
    if (!user) return;
    setCreating(true);

    try {
      const { SEED_TAGS } = await import('@/lib/constants');
      const { v4: uuidv4 } = await import('uuid');

      const tags = SEED_TAGS.map((label) => ({
        id: uuidv4(),
        label,
        isSeed: true,
      }));

      const res = await fetch('/api/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/session/${data.sessionId}/phase1`);
    } catch (err) {
      console.error('Failed to create session:', err);
      setCreating(false);
    }
  };

  const handleUnpublish = async (e: React.MouseEvent, sessionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setUnpublishingId(sessionId);
    try {
      const res = await fetch('/api/forum/unpublish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove from forum');
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, published_to_forum: false } : s))
      );
    } catch (err) {
      console.error('Unpublish error:', err);
      alert(err instanceof Error ? err.message : 'Failed to remove from forum');
    } finally {
      setUnpublishingId(null);
    }
  };

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [userLoading, user, router]);

  if (userLoading || !user || !profile) {
    return (
      <div className="min-h-screen bg-surface">
        {/* Skeleton header */}
        <header className="bg-white border-b border-border px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Common Ground" width={28} height={28} className="rounded" />
            <span className="text-lg font-bold bg-gradient-to-r from-slate-800 to-primary bg-clip-text text-transparent">
              Common Ground
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-16 bg-slate-100 rounded animate-pulse" />
            <div className="h-6 w-20 bg-slate-100 rounded-full animate-pulse" />
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Skeleton welcome */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="h-7 w-56 bg-slate-100 rounded animate-pulse mb-2" />
              <div className="h-4 w-72 bg-slate-50 rounded animate-pulse" />
            </div>
            <div className="h-10 w-32 bg-slate-100 rounded-xl animate-pulse" />
          </div>

          {/* Skeleton session list */}
          <div className="h-5 w-32 bg-slate-100 rounded animate-pulse mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-20 bg-slate-100 rounded animate-pulse" />
                    <div className="h-4 w-16 bg-slate-50 rounded animate-pulse" />
                    <div className="h-5 w-24 bg-slate-50 rounded-full animate-pulse" />
                  </div>
                  <div className="h-3 w-20 bg-slate-50 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-white border-b border-border px-6 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Common Ground" width={28} height={28} className="rounded" />
          <span className="text-lg font-bold bg-gradient-to-r from-slate-800 to-primary bg-clip-text text-transparent">
            Common Ground
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/forum" className="text-sm text-slate-600 hover:text-primary transition-colors">
            Forum
          </Link>
          <span className="text-sm text-slate-600">{profile.display_name}</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            profile.role === 'npo' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {profile.role === 'npo' ? 'NPO' : 'Researcher'}
          </span>
          <button
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              window.location.href = '/';
            }}
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Welcome, {profile.display_name}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {profile.role === 'npo'
                ? 'Create new sessions or manage your existing projects.'
                : 'Browse the forum to find projects, or continue your active sessions.'}
            </p>
          </div>

          {profile.role === 'npo' && (
            <Button onClick={handleCreateSession} loading={creating}>
              New Session
            </Button>
          )}
          {profile.role === 'researcher' && (
            <Link href="/forum">
              <Button>Browse Forum</Button>
            </Link>
          )}
        </motion.div>

        <h2 className="text-lg font-semibold text-slate-700 mb-4">
          {profile.role === 'npo' ? 'Your Sessions' : 'Joined Sessions'}
        </h2>

        {loading ? (
          <div className="text-sm text-slate-400">Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-slate-500 mb-2">No sessions yet.</p>
            <p className="text-sm text-slate-400">
              {profile.role === 'npo'
                ? 'Click "New Session" to start defining your challenge.'
                : 'Visit the Forum to find a project to join.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const targetPhase = session.phase1_complete ? Math.max(2, session.current_phase) : session.current_phase;
              const problemTitle = session.problem_statement?.plainEnglish;
              const titleDisplay = problemTitle
                ? (problemTitle.length > 55 ? problemTitle.slice(0, 55).trim() + '…' : problemTitle)
                : null;
              const isUnpublishing = unpublishingId === session.id;
              return (
                <div
                  key={session.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow flex items-start justify-between gap-3"
                >
                  <Link
                    href={`/session/${session.id}/phase${targetPhase}`}
                    className="flex-1 min-w-0"
                  >
                    {titleDisplay && (
                      <p className="text-sm font-medium text-slate-800 mb-2 line-clamp-2" title={problemTitle ?? undefined}>
                        {titleDisplay}
                      </p>
                    )}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono text-sm font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded">
                          {session.id}
                        </span>
                        <span className="text-sm text-slate-500">
                          Phase {targetPhase}
                        </span>
                        {session.published_to_forum && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                            Published
                          </span>
                        )}
                        {session.researcher_user_id ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Researcher joined
                          </span>
                        ) : (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                            Waiting for researcher
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 shrink-0">
                        {new Date(session.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                  {profile.role === 'npo' && session.published_to_forum && (
                    <button
                      type="button"
                      onClick={(e) => handleUnpublish(e, session.id)}
                      disabled={isUnpublishing}
                      className="shrink-0 text-xs text-slate-500 hover:text-red-600 px-2 py-1.5 rounded border border-slate-200 hover:border-red-200 transition-colors disabled:opacity-50"
                      title="Remove this project from the forum"
                    >
                      {isUnpublishing ? 'Removing…' : 'Remove from forum'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
