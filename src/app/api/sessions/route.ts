import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const userId = user.id;
  const { data, error } = await supabase
    .from('sessions')
    .select('id, current_phase, phase1_complete, published_to_forum, created_at, researcher_user_id, problem_statement')
    .or(`npo_user_id.eq.${userId},researcher_user_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
