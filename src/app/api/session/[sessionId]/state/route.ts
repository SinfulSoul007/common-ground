import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

/** Convert DB row (snake_case) → camelCase session state */
function rowToState(row: Record<string, unknown>) {
  return {
    sessionId: row.id as string,
    currentPhase: row.current_phase,
    npoJoined: true,
    researcherJoined: row.researcher_user_id !== null,
    tags: row.tags ?? [],
    combinationHistory: row.combination_history ?? [],
    problemStatement: row.problem_statement ?? null,
    phase1Complete: row.phase1_complete,
    sidebar: row.sidebar ?? { agreedRequirements: [], constraints: [], openQuestions: [] },
    phase2Complete: row.phase2_complete,
    scopingQuestions: row.scoping_questions ?? [],
    currentQuestionIndex: row.current_question_index,
    phase2BothAgreed: row.phase2_both_agreed,
    npoAgreedPhase2: row.npo_agreed_phase2,
    researcherAgreedPhase2: row.researcher_agreed_phase2,
    charter: row.charter ?? null,
    npoSignedOff: row.npo_signed_off,
    researcherSignedOff: row.researcher_signed_off,
  };
}

/** Convert camelCase patch → DB snake_case fields */
function patchToRow(patch: Record<string, unknown>) {
  const map: Record<string, string> = {
    currentPhase: 'current_phase',
    tags: 'tags',
    combinationHistory: 'combination_history',
    problemStatement: 'problem_statement',
    phase1Complete: 'phase1_complete',
    sidebar: 'sidebar',
    phase2Complete: 'phase2_complete',
    scopingQuestions: 'scoping_questions',
    currentQuestionIndex: 'current_question_index',
    phase2BothAgreed: 'phase2_both_agreed',
    npoAgreedPhase2: 'npo_agreed_phase2',
    researcherAgreedPhase2: 'researcher_agreed_phase2',
    charter: 'charter',
    npoSignedOff: 'npo_signed_off',
    researcherSignedOff: 'researcher_signed_off',
  };

  const row: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(patch)) {
    if (map[key] !== undefined) {
      row[map[key]] = value;
    }
  }
  return row;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error || !data) {
    console.error('Session state fetch error:', error);
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json(rowToState(data));
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const supabase = await createSupabaseServer();

  const patch = await req.json();
  const row = patchToRow(patch);

  if (Object.keys(row).length === 0) {
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase
    .from('sessions')
    .update(row)
    .eq('id', sessionId);

  if (error) {
    console.error('Session state update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
