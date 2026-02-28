'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useSessionStore } from '@/store/sessionStore';
import { fetchSession } from '@/lib/supabase/sessions';

export function useRealtimeSession(sessionId: string) {
  const hydrateFromSupabase = useSessionStore((s) => s.hydrateFromSupabase);

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
          // Re-fetch full session state on any change
          const sessionState = await fetchSession(supabase, sessionId);
          if (sessionState) {
            hydrateFromSupabase(sessionState);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, hydrateFromSupabase]);
}
