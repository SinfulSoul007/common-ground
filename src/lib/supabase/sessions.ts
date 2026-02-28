import type { SupabaseClient } from '@supabase/supabase-js';
import type { SessionState } from '@/lib/types';

/** Convert DB row (snake_case) → SessionState (camelCase) */
function rowToSessionState(row: Record<string, unknown>): SessionState {
  return {
    sessionId: row.id as string,
    currentPhase: row.current_phase as number as SessionState['currentPhase'],
    npoJoined: true, // If row exists, NPO created it
    researcherJoined: row.researcher_user_id !== null,
    tags: (row.tags ?? []) as SessionState['tags'],
    combinationHistory: (row.combination_history ?? []) as SessionState['combinationHistory'],
    problemStatement: (row.problem_statement ?? null) as SessionState['problemStatement'],
    phase1Complete: row.phase1_complete as boolean,
    chatMessages: [], // Chat messages not stored in DB yet (ephemeral)
    sidebar: (row.sidebar ?? { agreedRequirements: [], constraints: [], openQuestions: [] }) as SessionState['sidebar'],
    phase2Complete: row.phase2_complete as boolean,
    scopingQuestions: (row.scoping_questions ?? []) as SessionState['scopingQuestions'],
    currentQuestionIndex: row.current_question_index as number,
    phase2BothAgreed: row.phase2_both_agreed as boolean,
    npoAgreedPhase2: row.npo_agreed_phase2 as boolean,
    researcherAgreedPhase2: row.researcher_agreed_phase2 as boolean,
    charter: (row.charter ?? null) as SessionState['charter'],
    npoSignedOff: row.npo_signed_off as boolean,
    researcherSignedOff: row.researcher_signed_off as boolean,
  };
}

/** Convert SessionState (camelCase) → DB fields (snake_case) for updates */
function sessionStateToRow(state: Partial<SessionState>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (state.currentPhase !== undefined) row.current_phase = state.currentPhase;
  if (state.tags !== undefined) row.tags = state.tags;
  if (state.combinationHistory !== undefined) row.combination_history = state.combinationHistory;
  if (state.problemStatement !== undefined) row.problem_statement = state.problemStatement;
  if (state.phase1Complete !== undefined) row.phase1_complete = state.phase1Complete;
  if (state.sidebar !== undefined) row.sidebar = state.sidebar;
  if (state.phase2Complete !== undefined) row.phase2_complete = state.phase2Complete;
  if (state.scopingQuestions !== undefined) row.scoping_questions = state.scopingQuestions;
  if (state.currentQuestionIndex !== undefined) row.current_question_index = state.currentQuestionIndex;
  if (state.phase2BothAgreed !== undefined) row.phase2_both_agreed = state.phase2BothAgreed;
  if (state.npoAgreedPhase2 !== undefined) row.npo_agreed_phase2 = state.npoAgreedPhase2;
  if (state.researcherAgreedPhase2 !== undefined) row.researcher_agreed_phase2 = state.researcherAgreedPhase2;
  if (state.charter !== undefined) row.charter = state.charter;
  if (state.npoSignedOff !== undefined) row.npo_signed_off = state.npoSignedOff;
  if (state.researcherSignedOff !== undefined) row.researcher_signed_off = state.researcherSignedOff;
  return row;
}

export async function createSession(
  supabase: SupabaseClient,
  userId: string,
  tags: SessionState['tags']
): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let sessionId = '';
  for (let i = 0; i < 6; i++) {
    sessionId += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const { error } = await supabase.from('sessions').insert({
    id: sessionId,
    npo_user_id: userId,
    tags,
  });

  if (error) throw error;
  return sessionId;
}

export async function fetchSession(
  supabase: SupabaseClient,
  sessionId: string
): Promise<SessionState | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error || !data) return null;
  return rowToSessionState(data);
}

export async function updateSession(
  supabase: SupabaseClient,
  sessionId: string,
  patch: Partial<SessionState>
): Promise<void> {
  const row = sessionStateToRow(patch);
  if (Object.keys(row).length === 0) return;

  const { error } = await supabase
    .from('sessions')
    .update(row)
    .eq('id', sessionId);

  if (error) throw error;
}

export async function joinSessionAsResearcher(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string
): Promise<boolean> {
  // Only join if no researcher yet
  const { data, error } = await supabase
    .from('sessions')
    .update({ researcher_user_id: userId })
    .eq('id', sessionId)
    .is('researcher_user_id', null)
    .select('id')
    .single();

  if (error || !data) return false;
  return true;
}

export async function setPublishedToForum(
  supabase: SupabaseClient,
  sessionId: string,
  published: boolean
): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update({ published_to_forum: published })
    .eq('id', sessionId);

  if (error) throw error;
}
