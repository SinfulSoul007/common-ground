import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createSupabaseServer();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) {
    return NextResponse.json({ user: null, profile: null });
  }

  // Try fetching existing profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();

  if (profile) {
    return NextResponse.json({ user: currentUser, profile });
  }

  // Auto-create from user metadata
  const meta = currentUser.user_metadata;
  const { data: created, error } = await supabase
    .from('profiles')
    .insert({
      id: currentUser.id,
      display_name:
        meta?.display_name ||
        meta?.full_name ||
        currentUser.email?.split('@')[0] ||
        'User',
      role: meta?.role || 'researcher',
    })
    .select()
    .single();

  if (error) {
    // Race condition — another call may have created it
    const { data: retry } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();
    return NextResponse.json({ user: currentUser, profile: retry ?? null });
  }

  return NextResponse.json({ user: currentUser, profile: created });
}
