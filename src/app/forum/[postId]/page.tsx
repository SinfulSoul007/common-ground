'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { ForumPost } from '@/lib/types';
import { useUser } from '@/hooks/useUser';
import CommentList from '@/components/forum/CommentList';
import JoinButton from '@/components/forum/JoinButton';
import UpvoteButton from '@/components/forum/UpvoteButton';

export default function ForumPostPage() {
  const params = useParams();
  const postId = params.postId as string;
  const { profile } = useUser();
  const [post, setPost] = useState<ForumPost | null>(null);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function loadPost() {
      try {
        const { data } = await supabase
          .from('forum_posts')
          .select('*, author:profiles(*)')
          .eq('id', postId)
          .single();

        setPost(data as ForumPost | null);

        // Check if user has upvoted (use profile from context)
        if (profile) {
          const { data: upvote } = await supabase
            .from('forum_upvotes')
            .select('post_id')
            .eq('post_id', postId)
            .eq('user_id', profile.id)
            .single();

          setHasUpvoted(!!upvote);
        }
      } catch (err) {
        console.error('Failed to load post:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPost();
  }, [postId, profile]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <p className="text-slate-500">Post not found.</p>
        <Link href="/forum" className="text-primary hover:underline text-sm mt-2 inline-block">
          Back to Forum
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <Link href="/forum" className="text-sm text-slate-400 hover:text-slate-600 mb-6 inline-block">
        &larr; Back to Forum
      </Link>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-start gap-4">
          <UpvoteButton postId={post.id} count={post.upvote_count} hasUpvoted={hasUpvoted} />

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {post.category}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                post.status === 'open' ? 'bg-emerald-100 text-emerald-700' :
                post.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                {post.status === 'in_progress' ? 'In Progress' : post.status}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-800 mb-4">{post.title}</h1>

            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-600 mb-1">The Challenge</h2>
                <p className="text-slate-700 leading-relaxed">{post.plain_english}</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h2 className="text-sm font-semibold text-blue-800 mb-1">Technical Interpretation</h2>
                <p className="text-sm text-blue-900 leading-relaxed">{post.technical_interpretation}</p>
              </div>
            </div>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="mt-4">
                <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-2">Key Concepts</h3>
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.map((tag) => (
                    <span key={tag.id} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                      {tag.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Meta */}
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400">
              <span>Posted by {post.author?.display_name || 'Anonymous'}</span>
              <span>{new Date(post.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Join Button for researchers */}
      {profile?.role === 'researcher' && (
        <div className="mb-6">
          <JoinButton sessionId={post.session_id} postId={post.id} status={post.status} />
        </div>
      )}

      {/* Comments */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <CommentList postId={post.id} />
      </div>
    </div>
  );
}
