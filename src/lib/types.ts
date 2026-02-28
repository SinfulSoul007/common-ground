export type Role = 'npo' | 'researcher';
export type Phase = 1 | 2 | 3;

// ---- Auth & Forum types ----

export interface Profile {
  id: string;
  display_name: string;
  role: Role;
  avatar_url: string | null;
  created_at: string;
}

export interface ForumPost {
  id: string;
  session_id: string;
  author_id: string;
  title: string;
  plain_english: string;
  technical_interpretation: string;
  tags: Tag[];
  category: string;
  upvote_count: number;
  comment_count: number;
  status: 'open' | 'in_progress' | 'completed';
  created_at: string;
  author?: Profile;
}

export interface ForumComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: Profile;
}

export interface ForumUpvote {
  post_id: string;
  user_id: string;
}

export interface Tag {
  id: string;
  label: string;
  parents?: [string, string];
  isCustom?: boolean;
  isSeed?: boolean;
}

export interface ProblemStatement {
  plainEnglish: string;
  technicalInterpretation: string;
  finalTags: Tag[];
}

export interface ChatMessage {
  id: string;
  role: 'npo' | 'researcher' | 'facilitator';
  originalContent: string;
  displayContent: string;
  technicalNote?: string;
  simplifiedLabel?: boolean;
  timestamp: number;
}

export interface SidebarState {
  agreedRequirements: string[];
  constraints: string[];
  openQuestions: string[];
}

export interface Charter {
  npoView: string;
  researcherView: string;
  feasibilityFlags: FeasibilityFlag[];
}

export interface FeasibilityFlag {
  category: 'timeline' | 'data' | 'scope' | 'ethics' | 'missing_info' | 'other';
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
}

export interface ScopingQuestion {
  id: string;
  topic: string; // shared topic label
  npoQuestion: string; // plain-language version for NPO
  researcherQuestion: string; // technical version for researcher
  npoContext?: string; // why this matters for NPO
  researcherContext?: string; // why this matters for researcher
  npoAnswer?: string;
  researcherAnswer?: string;
  aiSynthesis?: string; // AI's summary after both answer
  status: 'pending' | 'active' | 'answered';
}

export interface SessionState {
  sessionId: string;
  currentPhase: Phase;
  npoJoined: boolean;
  researcherJoined: boolean;
  // Phase 1
  tags: Tag[];
  combinationHistory: Array<{ parent1Id: string; parent2Id: string; resultId: string }>;
  problemStatement: ProblemStatement | null;
  phase1Complete: boolean;
  // Phase 2
  chatMessages: ChatMessage[];
  sidebar: SidebarState;
  phase2Complete: boolean;
  scopingQuestions: ScopingQuestion[];
  currentQuestionIndex: number;
  phase2BothAgreed: boolean; // both must agree to move to phase 3
  npoAgreedPhase2: boolean;
  researcherAgreedPhase2: boolean;
  // Phase 3
  charter: Charter | null;
  npoSignedOff: boolean;
  researcherSignedOff: boolean;
}
