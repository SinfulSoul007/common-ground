import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id;

  const { searchParams } = req.nextUrl;
  const category = searchParams.get('category') || 'all';
  const sort = searchParams.get('sort') || 'newest';

  let query = supabase.from('forum_posts').select('*, author:profiles!author_id(*)');

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

  if (error) {
    console.error('Forum posts query error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get user's upvotes if authenticated
  let userUpvotes: string[] = [];
  if (userId) {
    const { data: upvotes } = await supabase
      .from('forum_upvotes')
      .select('post_id')
      .eq('user_id', userId);
    userUpvotes = (upvotes ?? []).map((u: { post_id: string }) => u.post_id);
  }

  return NextResponse.json({
    posts: data ?? [],
    userUpvotes,
  });
}
