'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useSession } from '@/hooks/useSession';
import { PHASE_NAMES } from '@/lib/constants';

export default function SessionLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { currentPhase, role } = useSession(sessionId);
  const [copied, setCopied] = useState(false);

  const copySessionId = () => {
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const phases = [1, 2, 3] as const;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b border-border px-6 py-3 flex items-center justify-between shrink-0">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold bg-gradient-to-r from-slate-800 to-primary bg-clip-text text-transparent">
            Common Ground
          </span>
        </div>

        {/* Center: Phase Indicator */}
        <div className="flex items-center gap-0">
          {phases.map((phase, i) => (
            <div key={phase} className="flex items-center">
              {/* Phase circle */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    phase < currentPhase
                      ? 'bg-primary text-white'
                      : phase === currentPhase
                        ? 'bg-primary text-white ring-4 ring-primary/20'
                        : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {phase < currentPhase ? '✓' : phase}
                </div>
                <span
                  className={`text-xs ${
                    phase <= currentPhase ? 'text-primary font-medium' : 'text-slate-400'
                  }`}
                >
                  {PHASE_NAMES[phase]}
                </span>
              </div>
              {/* Connector line */}
              {i < phases.length - 1 && (
                <div
                  className={`w-16 h-0.5 mx-2 mb-5 ${
                    phase < currentPhase ? 'bg-primary' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Right: Session ID + Role */}
        <div className="flex items-center gap-3">
          <button
            onClick={copySessionId}
            className="relative px-3 py-1.5 bg-slate-100 rounded-lg text-sm font-mono text-slate-600 hover:bg-slate-200 transition-colors"
            title="Click to copy"
          >
            {sessionId}
            {copied && (
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                Copied!
              </span>
            )}
          </button>
          {role && (
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                role === 'npo'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {role === 'npo' ? '🏛️ NPO' : '🔬 Researcher'}
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
