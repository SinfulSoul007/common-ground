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

  const body = await req.json();
  const { sessionId } = body;

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
  }

  // Verify session belongs to current user as NPO
  const { data: session, error: sessionErr } = await supabase
    .from('sessions')
    .select('id, npo_user_id')
    .eq('id', sessionId)
    .single();

  if (sessionErr || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (session.npo_user_id !== user.id) {
    return NextResponse.json({ error: 'Only the NPO owner can remove this from the forum' }, { status: 403 });
  }

  // Find forum post by session_id
  const { data: post, error: postErr } = await supabase
    .from('forum_posts')
    .select('id')
    .eq('session_id', sessionId)
    .eq('author_id', user.id)
    .maybeSingle();

  if (postErr) {
    console.error('Forum post lookup error:', postErr);
    return NextResponse.json({ error: postErr.message }, { status: 500 });
  }

  if (post) {
    const { error: deleteErr } = await supabase
      .from('forum_posts')
      .delete()
      .eq('id', post.id);

    if (deleteErr) {
      console.error('Forum post delete error:', deleteErr);
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }
  }

  // Mark session as not published
  const { error: updateErr } = await supabase
    .from('sessions')
    .update({ published_to_forum: false })
    .eq('id', sessionId);

  if (updateErr) {
    console.error('Session update error:', updateErr);
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
