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

  const { tags } = await req.json();

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let sessionId = '';
  for (let i = 0; i < 6; i++) {
    sessionId += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const { error } = await supabase.from('sessions').insert({
    id: sessionId,
    npo_user_id: user.id,
    tags: tags ?? [],
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sessionId });
}
