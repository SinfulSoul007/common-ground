'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import type { ForumPost } from '@/lib/types';
import ForumPostCard from '@/components/forum/ForumPostCard';

const CATEGORIES = ['all', 'education', 'health', 'environment', 'poverty', 'technology', 'general'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'upvotes', label: 'Most Upvoted' },
  { value: 'comments', label: 'Most Discussed' },
];

export default function ForumPage() {
  const { user } = useUser();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [userUpvotes, setUserUpvotes] = useState<Set<string>>(new Set());
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();

    async function loadPosts() {
      try {
        let query = supabase
          .from('forum_posts')
          .select('*, author:profiles(*)');

        if (category !== 'all') {
          query = query.eq('category', category);
        }

        if (sort === 'upvotes') {
          query = query.order('upvote_count', { ascending: false });
        } else if (sort === 'comments') {
          query = query.order('comment_count', { ascending: false });
        } else {
          query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query;
        if (error) console.error('Forum query error:', error);
        setPosts((data as ForumPost[]) || []);

        // Load user's upvotes
        const { data: upvotes } = await supabase
          .from('forum_upvotes')
          .select('post_id')
          .eq('user_id', user.id);

        setUserUpvotes(new Set((upvotes || []).map((u: { post_id: string }) => u.post_id)));
      } catch (err) {
        console.error('Failed to load forum posts:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPosts();
  }, [category, sort, user]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Problem Forum</h1>
        <p className="text-slate-500">
          Browse challenges posted by non-profit organizations. Find a project that matches your expertise and join the conversation.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                category === cat
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="ml-auto rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400 mb-2">No posts found.</p>
          <p className="text-sm text-slate-300">
            {category !== 'all' ? 'Try a different category.' : 'Be the first to post a challenge!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <ForumPostCard
              key={post.id}
              post={post}
              hasUpvoted={userUpvotes.has(post.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
