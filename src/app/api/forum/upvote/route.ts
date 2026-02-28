import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const userId = user.id;
  const { postId, action } = await req.json();

  if (action === 'remove') {
    const { error } = await supabase
      .from('forum_upvotes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase
      .from('forum_upvotes')
      .insert({ post_id: postId, user_id: userId });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
