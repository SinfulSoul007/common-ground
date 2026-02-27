'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const { currentPhase, initialized } = useSession(sessionId);

  useEffect(() => {
    if (initialized && sessionId) {
      router.replace(`/session/${sessionId}/phase${currentPhase}`);
    }
  }, [initialized, sessionId, currentPhase, router]);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
}
