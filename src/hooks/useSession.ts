'use client';

import { useEffect } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { usePolling } from './usePolling';
import type { Role } from '@/lib/types';

export function useSession(sessionId: string) {
  const store = useSessionStore();

  useEffect(() => {
    if (!sessionId || store.initialized) return;
    // Try to load from localStorage on mount
    const storedRole = localStorage.getItem(`common-ground-role-${sessionId}`) as Role | null;
    if (storedRole) {
      store.loadSession(sessionId, storedRole);
    }
  }, [sessionId, store.initialized]);

  // Enable cross-tab polling
  usePolling(sessionId);

  return store;
}
