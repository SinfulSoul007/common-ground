'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';

interface UpvoteButtonProps {
  postId: string;
  count: number;
  hasUpvoted: boolean;
}

export default function UpvoteButton({ postId, count, hasUpvoted: initialUpvoted }: UpvoteButtonProps) {
  const { user } = useUser();
  const [upvoted, setUpvoted] = useState(initialUpvoted);
  const [displayCount, setDisplayCount] = useState(count);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (loading || !user) return;
    setLoading(true);

    const supabase = createClient();

    // Optimistic update
    setUpvoted(!upvoted);
    setDisplayCount((prev) => upvoted ? prev - 1 : prev + 1);

    if (upvoted) {
      const { error } = await supabase
        .from('forum_upvotes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (error) {
        setUpvoted(true);
        setDisplayCount((prev) => prev + 1);
      }
    } else {
      const { error } = await supabase
        .from('forum_upvotes')
        .insert({ post_id: postId, user_id: user.id });

      if (error) {
        setUpvoted(false);
        setDisplayCount((prev) => prev - 1);
      }
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
