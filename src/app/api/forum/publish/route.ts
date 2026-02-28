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
  const { sessionId, plainEnglish, technicalInterpretation, tags, category } = body;

  if (!sessionId || !plainEnglish || !technicalInterpretation) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Insert forum post
  const { error: insertErr } = await supabase.from('forum_posts').insert({
    session_id: sessionId,
    author_id: user.id,
    title:
      plainEnglish.slice(0, 100) +
      (plainEnglish.length > 100 ? '...' : ''),
    plain_english: plainEnglish,
    technical_interpretation: technicalInterpretation,
    tags: tags ?? [],
    category: category ?? 'general',
  });

  if (insertErr) {
    console.error('Forum post insert error:', insertErr);
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // Mark session as published
  const { error: updateErr } = await supabase
    .from('sessions')
    .update({ published_to_forum: true })
    .eq('id', sessionId);

  if (updateErr) {
    console.error('Session update error:', updateErr);
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
