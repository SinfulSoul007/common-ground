'use client';

import { useEffect } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { useRealtimeSession } from './useRealtimeSession';
import { useUser } from './useUser';

export function useSession(sessionId: string) {
  const store = useSessionStore();
  const { profile } = useUser();

  useEffect(() => {
    if (!sessionId || store.initialized || !profile) return;
    store.loadSession(sessionId, profile.role);
  }, [sessionId, store.initialized, profile]);

  // Enable Supabase Realtime sync
  useRealtimeSession(sessionId);

  return store;
}
