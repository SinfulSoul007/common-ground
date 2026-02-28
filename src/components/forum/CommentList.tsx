'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ForumComment } from '@/lib/types';
import CommentInput from './CommentInput';

interface CommentListProps {
  postId: string;
}

export default function CommentList({ postId }: CommentListProps) {
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function loadComments() {
      const { data } = await supabase
        .from('forum_comments')
        .select('*, author:profiles(*)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      setComments((data as ForumComment[]) || []);
      setLoading(false);
    }

    loadComments();

    // Subscribe to new comments
    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'forum_comments',
          filter: `post_id=eq.${postId}`,
        },
        async (payload) => {
          // Fetch the full comment with author
          const { data } = await supabase
            .from('forum_comments')
            .select('*, author:profiles(*)')
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setComments((prev) => [...prev, data as ForumComment]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  if (loading) {
    return <div className="text-sm text-slate-400 py-4">Loading comments...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-700">
        Comments ({comments.length})
      </h3>

      {comments.length === 0 ? (
        <p className="text-sm text-slate-400">No comments yet. Be the first to share your thoughts.</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-lg bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-slate-700">
                  {comment.author?.display_name || 'Anonymous'}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
                {comment.author?.role && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    comment.author.role === 'researcher'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {comment.author.role === 'researcher' ? 'Researcher' : 'NPO'}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600">{comment.content}</p>
            </div>
          ))}
        </div>
      )}

      <CommentInput postId={postId} />
    </div>
  );
}
