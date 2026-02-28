'use client';

import Link from 'next/link';
import type { ForumPost } from '@/lib/types';
import UpvoteButton from './UpvoteButton';

interface ForumPostCardProps {
  post: ForumPost;
  hasUpvoted: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  education: 'bg-purple-100 text-purple-700',
  health: 'bg-red-100 text-red-700',
  environment: 'bg-green-100 text-green-700',
  poverty: 'bg-amber-100 text-amber-700',
  technology: 'bg-blue-100 text-blue-700',
  general: 'bg-slate-100 text-slate-600',
};

export default function ForumPostCard({ post, hasUpvoted }: ForumPostCardProps) {
  const categoryColor = CATEGORY_COLORS[post.category] || CATEGORY_COLORS.general;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* Upvote */}
        <UpvoteButton postId={post.id} count={post.upvote_count} hasUpvoted={hasUpvoted} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColor}`}>
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

          <Link href={`/forum/${post.id}`} className="block group">
            <h3 className="text-lg font-semibold text-slate-800 group-hover:text-primary transition-colors mb-1">
              {post.title}
            </h3>
            <p className="text-sm text-slate-500 line-clamp-2">
              {post.plain_english}
            </p>
          </Link>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {post.tags.slice(0, 5).map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                >
                  {tag.label}
                </span>
              ))}
              {post.tags.length > 5 && (
                <span className="text-xs text-slate-400">+{post.tags.length - 5} more</span>
              )}
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
            <span>{post.author?.display_name || 'Anonymous'}</span>
            <span>{new Date(post.created_at).toLocaleDateString()}</span>
            <span>{post.comment_count} comment{post.comment_count !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
