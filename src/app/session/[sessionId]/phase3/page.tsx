'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import ViewToggle from '@/components/phase3/ViewToggle';
import CharterDocument from '@/components/phase3/CharterDocument';
import FeasibilityFlags from '@/components/phase3/FeasibilityFlags';
import SignOffButton from '@/components/phase3/SignOffButton';
import SignOffStatus from '@/components/phase3/SignOffStatus';
import type { Role, FeasibilityFlag } from '@/lib/types';

export default function Phase3Page() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const {
    role,
    charter,
    setCharter,
    problemStatement,
    chatMessages,
    scopingQuestions,
    sidebar,
    npoSignedOff,
    researcherSignedOff,
    signOff,
  } = useSession(sessionId);

  const [activeView, setActiveView] = useState<Role>(role ?? 'npo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feasibilityFlags, setFeasibilityFlags] = useState<FeasibilityFlag[]>([]);
  const [generatingCharter, setGeneratingCharter] = useState(false);

  const generateCharter = useCallback(async () => {
    if (!problemStatement || generatingCharter) return;
    setGeneratingCharter(true);
    setError('');

    try {
      // Build chat transcript from scoping Q&A (preferred) or legacy chat messages
      let chatTranscript: string;
      if (scopingQuestions && scopingQuestions.length > 0) {
        chatTranscript = scopingQuestions
          .filter((q) => q.status === 'answered')
          .map((q, i) => {
            const lines = [
              `Question ${i + 1} — Topic: ${q.topic}`,
              `NPO was asked: ${q.npoQuestion}`,
              `Researcher was asked: ${q.researcherQuestion}`,
            ];
            if (q.npoAnswer) lines.push(`NPO Answer: ${q.npoAnswer}`);
            if (q.researcherAnswer) lines.push(`Researcher Answer: ${q.researcherAnswer}`);
            if (q.aiSynthesis) lines.push(`AI Synthesis: ${q.aiSynthesis}`);
            return lines.join('\n');
          })
          .join('\n\n');
      } else {
        chatTranscript = chatMessages
          .map((m) => {
            const roleLabel = m.role === 'npo' ? 'NPO' : m.role === 'researcher' ? 'Researcher' : 'Facilitator';
            return `${roleLabel}: ${m.originalContent}`;
          })
          .join('\n');
      }

      // Generate charter
      const charterRes = await fetch('/api/phase3/generate-charter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemStatement, chatTranscript, sidebar }),
      });

      if (!charterRes.ok) throw new Error('Failed to generate charter');
      const charterData = await charterRes.json();

      const newCharter = {
        npoView: charterData.npoView,
        researcherView: charterData.researcherView,
        feasibilityFlags: [],
      };

      // Generate feasibility flags
      try {
        const flagsRes = await fetch('/api/phase3/feasibility-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ charter: newCharter, problemStatement, sidebar }),
        });

        if (flagsRes.ok) {
          const flagsData = await flagsRes.json();
          newCharter.feasibilityFlags = flagsData.flags ?? [];
          setFeasibilityFlags(flagsData.flags ?? []);
        }
      } catch {
        // Feasibility check is non-critical
        console.warn('Feasibility check failed, continuing without flags');
      }

      setCharter(newCharter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate charter');
    } finally {
      setGeneratingCharter(false);
    }
  }, [problemStatement, chatMessages, scopingQuestions, sidebar, setCharter, generatingCharter]);

  useEffect(() => {
    if (!charter && problemStatement && !generatingCharter) {
      generateCharter();
    } else if (charter) {
      setFeasibilityFlags(charter.feasibilityFlags ?? []);
    }
  }, [charter, problemStatement]);

  useEffect(() => {
    if (role) setActiveView(role);
  }, [role]);

  const handleSignOff = () => {
    if (!role) return;
    setLoading(true);
    signOff(role);
    setTimeout(() => setLoading(false), 500);
  };

  const bothSigned = npoSignedOff && researcherSignedOff;

  // Loading state while generating charter
  if (!charter && (generatingCharter || !error)) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
        <h2 className="text-xl font-semibold text-slate-700">Generating your project charter...</h2>
        <p className="text-slate-500 text-sm">This may take a moment as we analyze your conversation.</p>
      </div>
    );
  }

  if (error && !charter) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-xl font-semibold text-slate-700">Something went wrong</h2>
        <p className="text-red-500 text-sm">{error}</p>
        <button
          onClick={() => { setError(''); generateCharter(); }}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-teal-800 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!charter) return null;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header with toggle */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Project Charter</h1>
          <ViewToggle activeView={activeView} onToggle={setActiveView} />
        </div>

        {/* Charter Document */}
        <CharterDocument
          npoView={charter.npoView}
          researcherView={charter.researcherView}
          activeView={activeView}
        />

        {/* Feasibility Flags */}
        <FeasibilityFlags flags={feasibilityFlags} />

        {/* Sign-off Section */}
        {!bothSigned && (
          <div className="mt-8 p-6 bg-white rounded-xl border border-border">
            <p className="text-sm text-slate-500 mb-4">
              By confirming, you acknowledge that you&apos;ve read and understand this project charter.
            </p>
            <div className="flex items-center justify-between">
              <SignOffButton
                onSignOff={handleSignOff}
                hasSignedOff={role === 'npo' ? npoSignedOff : researcherSignedOff}
                loading={loading}
              />
              <SignOffStatus npoSignedOff={npoSignedOff} researcherSignedOff={researcherSignedOff} />
            </div>
          </div>
        )}

        {/* Success state */}
        {bothSigned && (
          <div className="mt-8">
            <SignOffStatus npoSignedOff={npoSignedOff} researcherSignedOff={researcherSignedOff} />
          </div>
        )}
      </div>
    </div>
  );
}
