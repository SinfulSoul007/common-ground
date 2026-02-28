'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSessionStore } from '@/store/sessionStore';

export function useRealtimeSession(sessionId: string) {
  const hydrateFromServer = useSessionStore((s) => s.hydrateFromServer);

  useEffect(() => {
    if (!sessionId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${sessionId}`,
        },
        async () => {
          // Re-fetch full session state via API route (not client Supabase)
          try {
            const res = await fetch(`/api/session/${sessionId}/state`);
            if (res.ok) {
              const sessionState = await res.json();
              if (sessionState?.sessionId) {
                hydrateFromServer(sessionState);
              }
            }
          } catch (err) {
            console.warn('Realtime re-fetch failed:', err);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, hydrateFromServer]);
}
