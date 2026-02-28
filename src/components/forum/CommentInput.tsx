'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import type { ForumComment } from '@/lib/types';

interface CommentInputProps {
  postId: string;
  onCommentAdded?: (comment: ForumComment) => void;
}

export default function CommentInput({ postId, onCommentAdded }: CommentInputProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);

    try {
      const res = await fetch('/api/forum/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, content: content.trim() }),
      });

      if (res.ok) {
        const comment = await res.json();
        setContent('');
        onCommentAdded?.(comment);
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a comment..."
        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
      />
      <Button type="submit" size="sm" loading={loading} disabled={!content.trim()}>
        Post
      </Button>
    </form>
  );
}
