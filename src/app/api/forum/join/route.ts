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
  const { sessionId, postId } = await req.json();

  // Join session (only if no researcher yet)
  const { data, error } = await supabase
    .from('sessions')
    .update({ researcher_user_id: userId })
    .eq('id', sessionId)
    .is('researcher_user_id', null)
    .select('id')
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'This project already has a researcher assigned.' },
      { status: 409 }
    );
  }

  // Update forum post status
  await supabase
    .from('forum_posts')
    .update({ status: 'in_progress' })
    .eq('id', postId);

  return NextResponse.json({ ok: true });
}
