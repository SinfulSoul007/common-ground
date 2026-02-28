'use client';

import { useState } from 'react';

interface UpvoteButtonProps {
  postId: string;
  count: number;
  hasUpvoted: boolean;
}

export default function UpvoteButton({ postId, count, hasUpvoted: initialUpvoted }: UpvoteButtonProps) {
  const [upvoted, setUpvoted] = useState(initialUpvoted);
  const [displayCount, setDisplayCount] = useState(count);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);

    // Optimistic update
    const wasUpvoted = upvoted;
    setUpvoted(!wasUpvoted);
    setDisplayCount((prev) => wasUpvoted ? prev - 1 : prev + 1);

    try {
      const res = await fetch('/api/forum/upvote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, action: wasUpvoted ? 'remove' : 'add' }),
      });

      if (!res.ok) {
        // Revert optimistic update
        setUpvoted(wasUpvoted);
        setDisplayCount((prev) => wasUpvoted ? prev + 1 : prev - 1);
      }
    } catch {
      setUpvoted(wasUpvoted);
      setDisplayCount((prev) => wasUpvoted ? prev + 1 : prev - 1);
    }

    setLoading(false);
  };

  return (
    <button
      onClick={handleToggle}
      className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors ${
        upvoted
          ? 'bg-primary/10 text-primary'
          : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
      }`}
    >
      <svg className="w-5 h-5" fill={upvoted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
      <span className="text-xs font-semibold">{displayCount}</span>
    </button>
  );
}
