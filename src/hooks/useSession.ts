'use client';

import { useEffect } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { useRealtimeSession } from './useRealtimeSession';
import { useUser } from './useUser';

export function useSession(sessionId: string) {
  const store = useSessionStore();
  const { profile } = useUser();
  const isInitializedForThisSession =
    store.initialized && store.sessionId === sessionId;

  useEffect(() => {
    if (!sessionId) return;
    // When navigating to a different session, reset so we show loading and load fresh state
    if (store.sessionId && store.sessionId !== sessionId) {
      store.resetForSession(sessionId);
    }
  }, [sessionId, store.sessionId, store]);

  useEffect(() => {
    if (!sessionId || !profile) return;
    // Always load when we're on a different session or not yet initialized
    if (isInitializedForThisSession) return;
    store.loadSession(sessionId, profile.role);
  }, [sessionId, profile, isInitializedForThisSession, store]);

  // Enable Supabase Realtime sync
  useRealtimeSession(sessionId);

  return store;
}
