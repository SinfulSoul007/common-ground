import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServer();

  const postId = req.nextUrl.searchParams.get('postId');

  const { data, error } = await supabase
    .from('forum_comments')
    .select('*, author:profiles!author_id(*)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Comments query error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { postId, content } = await req.json();

  const { data, error } = await supabase
    .from('forum_comments')
    .insert({
      post_id: postId,
      author_id: user.id,
      content,
    })
    .select('*, author:profiles!author_id(*)')
    .single();

  if (error) {
    console.error('Comment insert error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
