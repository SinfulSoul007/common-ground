'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';
import type { User } from '@supabase/supabase-js';

interface UserContextValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  profile: null,
  loading: true,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Load user + profile via server-side API route (avoids client auth issues)
    async function loadAuth() {
      try {
        const res = await fetch('/api/auth/profile');
        if (!res.ok) {
          if (!cancelled) setLoading(false);
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setUser(data.user ?? null);
          setProfile(data.profile ?? null);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    loadAuth();

    // Listen for auth changes (login, logout) to refresh
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (cancelled || event === 'INITIAL_SESSION') return;

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        return;
      }

      // On sign in or token refresh, re-fetch from server
      loadAuth();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, profile, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  return useContext(UserContext);
}
