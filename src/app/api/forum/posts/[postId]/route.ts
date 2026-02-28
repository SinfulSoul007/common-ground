import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id;

  const { data, error } = await supabase
    .from('forum_posts')
    .select('*, author:profiles!author_id(*)')
    .eq('id', postId)
    .single();

  if (error) {
    console.error('Forum post detail error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Check if user has upvoted
  let hasUpvoted = false;
  if (userId) {
    const { data: upvote } = await supabase
      .from('forum_upvotes')
      .select('post_id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();
    hasUpvoted = !!upvote;
  }

  return NextResponse.json({
    post: data,
    hasUpvoted,
  });
}
