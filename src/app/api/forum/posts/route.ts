import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const category = searchParams.get('category') || 'all';
  const sort = searchParams.get('sort') || 'newest';

  let query = supabase.from('forum_posts').select('*, author:profiles(*)');

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also get user's upvotes
  const { data: upvotes } = await supabase
    .from('forum_upvotes')
    .select('post_id')
    .eq('user_id', user.id);

  return NextResponse.json({
    posts: data ?? [],
    userUpvotes: (upvotes ?? []).map((u: { post_id: string }) => u.post_id),
  });
}
