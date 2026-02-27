import type { SessionState } from './types';

const sessions = new Map<string, SessionState>();

export function getSession(id: string): SessionState | undefined {
  return sessions.get(id);
}

export function setSession(id: string, state: SessionState): void {
  sessions.set(id, state);
}
