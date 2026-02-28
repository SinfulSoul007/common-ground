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

async function loadProfile(
  supabase: ReturnType<typeof createClient>,
  currentUser: User
): Promise<Profile | null> {
  // Try fetching existing profile
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();

  if (data) return data as Profile;

  // Auto-create from user metadata
  const meta = currentUser.user_metadata;
  const { data: created, error } = await supabase
    .from('profiles')
    .insert({
      id: currentUser.id,
      display_name:
        meta?.display_name ||
        meta?.full_name ||
        currentUser.email?.split('@')[0] ||
        'User',
      role: meta?.role || 'researcher',
    })
    .select()
    .single();

  if (error) {
    // Race condition — another call may have created it
    const { data: retry } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();
    return (retry as Profile) ?? null;
  }

  return created as Profile;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    // 1) Initial load via getSession (reads cookie, no network call)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        const p = await loadProfile(supabase, u);
        if (!cancelled) setProfile(p);
      }
      if (!cancelled) setLoading(false);
    });

    // 2) Subsequent auth events (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled || event === 'INITIAL_SESSION') return;

      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        const p = await loadProfile(supabase, u);
        if (!cancelled) setProfile(p);
      } else {
        setProfile(null);
      }
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
