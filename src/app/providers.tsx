'use client';

import { UserProvider } from '@/hooks/useUser';

export function Providers({ children }: { children: React.ReactNode }) {
  return <UserProvider>{children}</UserProvider>;
}
