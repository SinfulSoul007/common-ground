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

function createDefaultSession(sessionId: string): SessionState {
  return {
    sessionId,
    currentPhase: 1,
    npoJoined: false,
    researcherJoined: false,
    tags: createInitialTags(),
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
  };
}

function getStorageKey(sessionId: string) {
  return `common-ground-session-${sessionId}`;
}

function saveToStorage(state: SessionState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getStorageKey(state.sessionId), JSON.stringify(state));
  } catch {
    console.warn('Failed to save to localStorage');
  }
}

function loadFromStorage(sessionId: string): SessionState | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(getStorageKey(sessionId));
    if (stored) return JSON.parse(stored) as SessionState;
  } catch {
    console.warn('Failed to load from localStorage');
  }
  return null;
}

interface SessionStore extends SessionState {
  role: Role | null;
  initialized: boolean;

  // Session management
  createSession: (role: Role) => string;
  joinSession: (sessionId: string, role: Role) => boolean;
  loadSession: (sessionId: string, role: Role) => void;

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
  hydrateFromStorage: (state: SessionState) => void;
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

  createSession: (role: Role) => {
    const sessionId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const session = { ...createDefaultSession(sessionId), npoJoined: role === 'npo', researcherJoined: role === 'researcher' };
    saveToStorage(session);
    set({ ...session, role, initialized: true });
    return sessionId;
  },

  joinSession: (sessionId: string, role: Role) => {
    const existing = loadFromStorage(sessionId);
    if (!existing) return false;
    if (role === 'researcher' && existing.researcherJoined) return false;
    if (role === 'npo' && existing.npoJoined) return false;
    const updated = {
      ...existing,
      npoJoined: role === 'npo' ? true : existing.npoJoined,
      researcherJoined: role === 'researcher' ? true : existing.researcherJoined,
    };
    saveToStorage(updated);
    set({ ...updated, role, initialized: true });
    return true;
  },

  loadSession: (sessionId: string, role: Role) => {
    const existing = loadFromStorage(sessionId);
    if (existing) {
      set({ ...existing, role, initialized: true });
    }
  },

  addTag: (tag: Tag) => {
    const state = get();
    const newTags = [...state.tags, tag];
    const newState: SessionState = { ...extractSessionState(state), tags: newTags };
    saveToStorage(newState);
    set({ tags: newTags });
  },

  removeTag: (tagId: string) => {
    const state = get();
    const newTags = state.tags.filter((t) => t.id !== tagId);
    const newState: SessionState = { ...extractSessionState(state), tags: newTags };
    saveToStorage(newState);
    set({ tags: newTags });
  },

  combineTagsLocally: (parent1Id: string, parent2Id: string, resultTag: Tag) => {
    const state = get();
    const newTags = [...state.tags, resultTag];
    const newHistory = [...state.combinationHistory, { parent1Id, parent2Id, resultId: resultTag.id }];
    const newState: SessionState = { ...extractSessionState(state), tags: newTags, combinationHistory: newHistory };
    saveToStorage(newState);
    set({ tags: newTags, combinationHistory: newHistory });
  },

  setProblemStatement: (ps: ProblemStatement) => {
    const state = get();
    const newState: SessionState = { ...extractSessionState(state), problemStatement: ps };
    saveToStorage(newState);
    set({ problemStatement: ps });
  },

  completePhase1: () => {
    const state = get();
    const newState: SessionState = { ...extractSessionState(state), phase1Complete: true, currentPhase: 2 };
    saveToStorage(newState);
    set({ phase1Complete: true, currentPhase: 2 });
  },

  addChatMessage: (msg: ChatMessage) => {
    const state = get();
    const newMessages = [...state.chatMessages, msg];
    const newState: SessionState = { ...extractSessionState(state), chatMessages: newMessages };
    saveToStorage(newState);
    set({ chatMessages: newMessages });
  },

  updateSidebar: (sidebar: SidebarState) => {
    const state = get();
    const newState: SessionState = { ...extractSessionState(state), sidebar };
    saveToStorage(newState);
    set({ sidebar });
  },

  completePhase2: () => {
    const state = get();
    // Only allow completion when both parties have agreed
    if (!state.npoAgreedPhase2 || !state.researcherAgreedPhase2) return;
    const newState: SessionState = {
      ...extractSessionState(state),
      phase2Complete: true,
      phase2BothAgreed: true,
      currentPhase: 3,
    };
    saveToStorage(newState);
    set({ phase2Complete: true, phase2BothAgreed: true, currentPhase: 3 });
  },

  setScopingQuestions: (questions: ScopingQuestion[]) => {
    const state = get();
    // Mark the first question as active
    const withStatus = questions.map((q, i) => ({
      ...q,
      status: (i === 0 ? 'active' : 'pending') as ScopingQuestion['status'],
    }));
    const newState: SessionState = {
      ...extractSessionState(state),
      scopingQuestions: withStatus,
      currentQuestionIndex: 0,
    };
    saveToStorage(newState);
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
    const newState: SessionState = { ...extractSessionState(state), scopingQuestions: newQuestions };
    saveToStorage(newState);
    set({ scopingQuestions: newQuestions });
  },

  setSynthesis: (questionId: string, synthesis: string) => {
    const state = get();
    const newQuestions = state.scopingQuestions.map((q) => {
      if (q.id !== questionId) return q;
      return { ...q, aiSynthesis: synthesis, status: 'answered' as const };
    });
    const newState: SessionState = { ...extractSessionState(state), scopingQuestions: newQuestions };
    saveToStorage(newState);
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
    const newState: SessionState = {
      ...extractSessionState(state),
      scopingQuestions: newQuestions,
      currentQuestionIndex: nextIndex,
    };
    saveToStorage(newState);
    set({ scopingQuestions: newQuestions, currentQuestionIndex: nextIndex });
  },

  addFollowUpQuestion: (question: ScopingQuestion) => {
    const state = get();
    const newQuestions = [...state.scopingQuestions, question];
    const newState: SessionState = { ...extractSessionState(state), scopingQuestions: newQuestions };
    saveToStorage(newState);
    set({ scopingQuestions: newQuestions });
  },

  agreePhase2: (role: Role) => {
    const state = get();
    const updates: Partial<SessionState> = role === 'npo'
      ? { npoAgreedPhase2: true }
      : { researcherAgreedPhase2: true };

    // Check if both will have agreed after this update
    const npoAgreed = role === 'npo' ? true : state.npoAgreedPhase2;
    const researcherAgreed = role === 'researcher' ? true : state.researcherAgreedPhase2;
    if (npoAgreed && researcherAgreed) {
      updates.phase2BothAgreed = true;
    }

    const newState: SessionState = { ...extractSessionState(state), ...updates };
    saveToStorage(newState);
    set(updates);
  },

  setCharter: (charter: Charter) => {
    const state = get();
    const newState: SessionState = { ...extractSessionState(state), charter };
    saveToStorage(newState);
    set({ charter });
  },

  signOff: (role: Role) => {
    const state = get();
    const updates = role === 'npo'
      ? { npoSignedOff: true }
      : { researcherSignedOff: true };
    const newState: SessionState = { ...extractSessionState(state), ...updates };
    saveToStorage(newState);
    set(updates);
  },

  advancePhase: () => {
    const state = get();
    const nextPhase = Math.min(state.currentPhase + 1, 3) as Phase;
    const newState: SessionState = { ...extractSessionState(state), currentPhase: nextPhase };
    saveToStorage(newState);
    set({ currentPhase: nextPhase });
  },

  setPhase: (phase: Phase) => {
    const state = get();
    const newState: SessionState = { ...extractSessionState(state), currentPhase: phase };
    saveToStorage(newState);
    set({ currentPhase: phase });
  },

  hydrateFromStorage: (sessionState: SessionState) => {
    const currentRole = get().role;
    set({ ...sessionState, role: currentRole, initialized: true });
  },
}));

function extractSessionState(store: SessionStore): SessionState {
  return {
    sessionId: store.sessionId,
    currentPhase: store.currentPhase,
    npoJoined: store.npoJoined,
    researcherJoined: store.researcherJoined,
    tags: store.tags,
    combinationHistory: store.combinationHistory,
    problemStatement: store.problemStatement,
    phase1Complete: store.phase1Complete,
    chatMessages: store.chatMessages,
    sidebar: store.sidebar,
    phase2Complete: store.phase2Complete,
    scopingQuestions: store.scopingQuestions,
    currentQuestionIndex: store.currentQuestionIndex,
    phase2BothAgreed: store.phase2BothAgreed,
    npoAgreedPhase2: store.npoAgreedPhase2,
    researcherAgreedPhase2: store.researcherAgreedPhase2,
    charter: store.charter,
    npoSignedOff: store.npoSignedOff,
    researcherSignedOff: store.researcherSignedOff,
  };
}
