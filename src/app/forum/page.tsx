'use client';

import { useEffect, useState, useCallback } from 'react';
import type { ForumPost } from '@/lib/types';
import ForumPostCard from '@/components/forum/ForumPostCard';

const CATEGORIES = ['all', 'education', 'health', 'environment', 'poverty', 'technology', 'general'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'upvotes', label: 'Most Upvoted' },
  { value: 'comments', label: 'Most Discussed' },
];

export default function ForumPage() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [userUpvotes, setUserUpvotes] = useState<Set<string>>(new Set());
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPosts = useCallback(() => {
    fetch(`/api/forum/posts?category=${category}&sort=${sort}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Server error: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setPosts(data.posts ?? []);
        setUserUpvotes(new Set(data.userUpvotes ?? []));
      })
      .catch((err) => {
        console.error('Failed to load forum posts:', err);
        setError(err.message || 'Failed to load posts');
      })
      .finally(() => setLoading(false));
  }, [category, sort]);

  useEffect(() => {
    setLoading(true);
    setError('');
    fetchPosts();
  }, [fetchPosts]);

  // Poll so forum list stays in sync with DB (realtime)
  useEffect(() => {
    const interval = setInterval(fetchPosts, 4000);
    return () => clearInterval(interval);
  }, [fetchPosts]);

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
      {error ? (
        <div className="text-center py-12">
          <p className="text-red-500 mb-2">Something went wrong</p>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      ) : loading ? (
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
