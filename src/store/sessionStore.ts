import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { SessionState, Tag, ProblemStatement, ChatMessage, SidebarState, Charter, Role, Phase, ScopingQuestion } from '@/lib/types';
import { SEED_TAGS } from '@/lib/constants';

function createInitialTags(): Tag[] {
  return SEED_TAGS.map((label) => ({
    id: uuidv4(),
    label,
    isSeed: true,
  }));
}

/** Persist a partial state update via API route (fire-and-forget) */
function persistToServer(sessionId: string, patch: Partial<SessionState>) {
  fetch(`/api/session/${sessionId}/state`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  }).catch((err) => console.warn('Failed to persist session:', err));
}

interface SessionStore extends SessionState {
  role: Role | null;
  initialized: boolean;

  // Session management
  loadSession: (sessionId: string, role: Role) => Promise<void>;
  resetForSession: (sessionId: string) => void;

  // Phase 1
  addTag: (tag: Tag) => void;
  removeTag: (tagId: string) => void;
  combineTagsLocally: (parent1Id: string, parent2Id: string, resultTag: Tag) => void;
  setProblemStatement: (ps: ProblemStatement) => void;
  completePhase1: () => void;

  // Phase 2
  addChatMessage: (msg: ChatMessage) => void;
  updateSidebar: (sidebar: SidebarState) => void;
  completePhase2: () => void;
  setScopingQuestions: (questions: ScopingQuestion[]) => void;
  answerQuestion: (questionId: string, role: Role, answer: string) => void;
  setSynthesis: (questionId: string, synthesis: string) => void;
  advanceQuestion: () => void;
  addFollowUpQuestion: (question: ScopingQuestion) => void;
  agreePhase2: (role: Role) => void;

  // Phase 3
  setCharter: (charter: Charter) => void;
  signOff: (role: Role) => void;

  // Navigation
  advancePhase: () => void;
  setPhase: (phase: Phase) => void;

  // Sync
  hydrateFromServer: (state: SessionState) => void;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  // Default state
  sessionId: '',
  currentPhase: 1,
  npoJoined: false,
  researcherJoined: false,
  tags: [],
  combinationHistory: [],
  problemStatement: null,
  phase1Complete: false,
  chatMessages: [],
  sidebar: { agreedRequirements: [], constraints: [], openQuestions: [] },
  phase2Complete: false,
  scopingQuestions: [],
  currentQuestionIndex: 0,
  phase2BothAgreed: false,
  npoAgreedPhase2: false,
  researcherAgreedPhase2: false,
  charter: null,
  npoSignedOff: false,
  researcherSignedOff: false,
  role: null,
  initialized: false,

  loadSession: async (sessionId: string, role: Role) => {
    try {
      const res = await fetch(`/api/session/${sessionId}/state`);
      if (!res.ok) {
        console.error('Failed to load session:', res.status);
        set({ initialized: false, role: null });
        return;
      }
      const sessionState = await res.json();
      if (sessionState && sessionState.sessionId) {
        set({ ...sessionState, chatMessages: [], role, initialized: true });
      } else {
        set({ initialized: false, role: null });
      }
    } catch (err) {
      console.error('Failed to load session:', err);
      set({ initialized: false, role: null });
    }
  },

  resetForSession: (sessionId: string) => {
    const state = get();
    if (state.sessionId === sessionId) return;
    set({
      sessionId: '',
      currentPhase: 1,
      npoJoined: false,
      researcherJoined: false,
      tags: [],
      combinationHistory: [],
      problemStatement: null,
      phase1Complete: false,
      chatMessages: [],
      sidebar: { agreedRequirements: [], constraints: [], openQuestions: [] },
      phase2Complete: false,
      scopingQuestions: [],
      currentQuestionIndex: 0,
      phase2BothAgreed: false,
      npoAgreedPhase2: false,
      researcherAgreedPhase2: false,
      charter: null,
      npoSignedOff: false,
      researcherSignedOff: false,
      role: null,
      initialized: false,
    });
  },

  addTag: (tag: Tag) => {
    const state = get();
    const newTags = [...state.tags, tag];
    persistToServer(state.sessionId, { tags: newTags });
    set({ tags: newTags });
  },

  removeTag: (tagId: string) => {
    const state = get();
    const newTags = state.tags.filter((t) => t.id !== tagId);
    persistToServer(state.sessionId, { tags: newTags });
    set({ tags: newTags });
  },

  combineTagsLocally: (parent1Id: string, parent2Id: string, resultTag: Tag) => {
    const state = get();
    const newTags = [...state.tags, resultTag];
    const newHistory = [...state.combinationHistory, { parent1Id, parent2Id, resultId: resultTag.id }];
    persistToServer(state.sessionId, { tags: newTags, combinationHistory: newHistory });
    set({ tags: newTags, combinationHistory: newHistory });
  },

  setProblemStatement: (ps: ProblemStatement) => {
    const state = get();
    persistToServer(state.sessionId, { problemStatement: ps });
    set({ problemStatement: ps });
  },

  completePhase1: () => {
    const state = get();
    persistToServer(state.sessionId, { phase1Complete: true, currentPhase: 2 });
    set({ phase1Complete: true, currentPhase: 2 });
  },

  addChatMessage: (msg: ChatMessage) => {
    const newMessages = [...get().chatMessages, msg];
    set({ chatMessages: newMessages });
  },

  updateSidebar: (sidebar: SidebarState) => {
    const state = get();
    persistToServer(state.sessionId, { sidebar });
    set({ sidebar });
  },

  completePhase2: () => {
    const state = get();
    if (!state.npoAgreedPhase2 || !state.researcherAgreedPhase2) return;
    persistToServer(state.sessionId, { phase2Complete: true, phase2BothAgreed: true, currentPhase: 3 });
    set({ phase2Complete: true, phase2BothAgreed: true, currentPhase: 3 });
  },

  setScopingQuestions: (questions: ScopingQuestion[]) => {
    const state = get();
    const withStatus = questions.map((q, i) => ({
      ...q,
      status: (i === 0 ? 'active' : 'pending') as ScopingQuestion['status'],
    }));
    persistToServer(state.sessionId, { scopingQuestions: withStatus, currentQuestionIndex: 0 });
    set({ scopingQuestions: withStatus, currentQuestionIndex: 0 });
  },

  answerQuestion: (questionId: string, role: Role, answer: string) => {
    const state = get();
    const newQuestions = state.scopingQuestions.map((q) => {
      if (q.id !== questionId) return q;
      return {
        ...q,
        ...(role === 'npo' ? { npoAnswer: answer } : { researcherAnswer: answer }),
      };
    });
    persistToServer(state.sessionId, { scopingQuestions: newQuestions });
    set({ scopingQuestions: newQuestions });
  },

  setSynthesis: (questionId: string, synthesis: string) => {
    const state = get();
    const newQuestions = state.scopingQuestions.map((q) => {
      if (q.id !== questionId) return q;
      return { ...q, aiSynthesis: synthesis, status: 'answered' as const };
    });
    persistToServer(state.sessionId, { scopingQuestions: newQuestions });
    set({ scopingQuestions: newQuestions });
  },

  advanceQuestion: () => {
    const state = get();
    const nextIndex = state.currentQuestionIndex + 1;
    if (nextIndex >= state.scopingQuestions.length) return;
    const newQuestions = state.scopingQuestions.map((q, i) => {
      if (i === nextIndex) return { ...q, status: 'active' as const };
      return q;
    });
    persistToServer(state.sessionId, { scopingQuestions: newQuestions, currentQuestionIndex: nextIndex });
    set({ scopingQuestions: newQuestions, currentQuestionIndex: nextIndex });
  },

  addFollowUpQuestion: (question: ScopingQuestion) => {
    const state = get();
    const newQuestions = [...state.scopingQuestions, question];
    persistToServer(state.sessionId, { scopingQuestions: newQuestions });
    set({ scopingQuestions: newQuestions });
  },

  agreePhase2: (role: Role) => {
    const state = get();
    const updates: Partial<SessionState> = role === 'npo'
      ? { npoAgreedPhase2: true }
      : { researcherAgreedPhase2: true };

    const npoAgreed = role === 'npo' ? true : state.npoAgreedPhase2;
    const researcherAgreed = role === 'researcher' ? true : state.researcherAgreedPhase2;
    if (npoAgreed && researcherAgreed) {
      updates.phase2BothAgreed = true;
    }

    persistToServer(state.sessionId, updates);
    set(updates);
  },

  setCharter: (charter: Charter) => {
    const state = get();
    persistToServer(state.sessionId, { charter });
    set({ charter });
  },

  signOff: (role: Role) => {
    const state = get();
    const updates = role === 'npo'
      ? { npoSignedOff: true }
      : { researcherSignedOff: true };
    persistToServer(state.sessionId, updates);
    set(updates);
  },

  advancePhase: () => {
    const state = get();
    const nextPhase = Math.min(state.currentPhase + 1, 3) as Phase;
    persistToServer(state.sessionId, { currentPhase: nextPhase });
    set({ currentPhase: nextPhase });
  },

  setPhase: (phase: Phase) => {
    const state = get();
    persistToServer(state.sessionId, { currentPhase: phase });
    set({ currentPhase: phase });
  },

  hydrateFromServer: (sessionState: SessionState) => {
    const currentRole = get().role;
    const currentMessages = get().chatMessages;
    set({ ...sessionState, chatMessages: currentMessages, role: currentRole, initialized: true });
  },
}));
