'use client';

import { useEffect } from 'react';
import { useSessionStore } from '@/store/sessionStore';

export function usePolling(sessionId: string, intervalMs = 2000) {
  const hydrateFromStorage = useSessionStore((s) => s.hydrateFromStorage);

  useEffect(() => {
    if (!sessionId) return;

    // Poll localStorage periodically
    const interval = setInterval(() => {
      const stored = localStorage.getItem(`common-ground-session-${sessionId}`);
      if (stored) {
        try {
          hydrateFromStorage(JSON.parse(stored));
        } catch {
          // ignore parse errors
        }
      }
    }, intervalMs);

    // Also listen for storage events for instant cross-tab sync
    const handler = (e: StorageEvent) => {
      if (e.key === `common-ground-session-${sessionId}` && e.newValue) {
        try {
          hydrateFromStorage(JSON.parse(e.newValue));
        } catch {
          // ignore parse errors
        }
      }
    };
    window.addEventListener('storage', handler);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handler);
    };
  }, [sessionId, intervalMs, hydrateFromStorage]);
}
