'use client';

import React from 'react';
import Card from '@/components/ui/Card';

interface WaitingRoomProps {
  sessionId: string;
  tagCount: number;
}

export default function WaitingRoom({ sessionId, tagCount }: WaitingRoomProps) {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="animate-pulse-glow max-w-md text-center">
        {/* Pulsing indicator */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
          <div className="h-6 w-6 animate-pulse rounded-full bg-teal-500" />
        </div>

        {/* Main message */}
        <h2 className="mb-2 text-xl font-semibold text-slate-900">
          Your NPO partner is defining the problem...
        </h2>

        {/* Subtitle */}
        <p className="mb-6 text-sm text-slate-500">
          You&apos;ll be brought in once they&apos;ve identified their core challenge.
        </p>

        {/* Status info */}
        <div className="rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-500">
          <span>Session ID: {sessionId}</span>
          <span className="mx-2">&bull;</span>
          <span>NPO is in Phase 1</span>
          <span className="mx-2">&bull;</span>
          <span>{tagCount} concept{tagCount !== 1 ? 's' : ''} created so far</span>
        </div>
      </Card>
    </div>
  );
}
