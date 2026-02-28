import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const supabase = await createSupabaseServer();

  const { data } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', sessionId)
    .single();

  return NextResponse.json({ exists: !!data });
}
