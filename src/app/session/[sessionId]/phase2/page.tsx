'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { useSession } from '@/hooks/useSession';
import { useSessionStore } from '@/store/sessionStore';
import RequirementsSidebar from '@/components/phase2/RequirementsSidebar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import type { SidebarState, ScopingQuestion } from '@/lib/types';

export default function Phase2Page() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const store = useSession(sessionId);
  const {
    sidebar,
    role,
    problemStatement,
    initialized,
    scopingQuestions,
    currentQuestionIndex,
    npoAgreedPhase2,
    researcherAgreedPhase2,
    phase2BothAgreed,
    updateSidebar,
    completePhase2,
    setScopingQuestions,
    answerQuestion,
    setSynthesis,
    advanceQuestion,
    addFollowUpQuestion,
    agreePhase2,
  } = store;

  const [myAnswer, setMyAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [showAllComplete, setShowAllComplete] = useState(false);
  const hasGeneratedQuestions = useRef(false);

  // Current question derived from state
  const currentQuestion: ScopingQuestion | null =
    scopingQuestions.length > 0 && currentQuestionIndex < scopingQuestions.length
      ? scopingQuestions[currentQuestionIndex]
      : null;

  // Check if all questions have been answered
  const allQuestionsAnswered =
    scopingQuestions.length > 0 &&
    scopingQuestions.every((q) => q.status === 'answered');

  // On mount: generate scoping questions if empty
  useEffect(() => {
    if (
      !initialized ||
      !problemStatement ||
      scopingQuestions.length > 0 ||
      hasGeneratedQuestions.current ||
      isLoadingQuestions
    ) {
      return;
    }
    hasGeneratedQuestions.current = true;

    async function generateQuestions() {
      setIsLoadingQuestions(true);
      try {
        const res = await fetch('/api/phase2/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ problemStatement }),
        });

        if (!res.ok) {
          console.error('Failed to generate questions');
          setIsLoadingQuestions(false);
          return;
        }

        const data = (await res.json()) as {
          questions: Array<{
            topic: string;
            npoQuestion: string;
            npoContext: string;
            researcherQuestion: string;
            researcherContext: string;
          }>;
        };

        const questions: ScopingQuestion[] = data.questions.map((q, i) => ({
          id: uuidv4(),
          topic: q.topic,
          npoQuestion: q.npoQuestion,
          researcherQuestion: q.researcherQuestion,
          npoContext: q.npoContext,
          researcherContext: q.researcherContext,
          status: (i === 0 ? 'active' : 'pending') as ScopingQuestion['status'],
        }));

        setScopingQuestions(questions);
      } catch (err) {
        console.error('Error generating questions:', err);
      } finally {
        setIsLoadingQuestions(false);
      }
    }

    generateQuestions();
  }, [initialized, problemStatement, scopingQuestions.length, isLoadingQuestions, setScopingQuestions]);

  // Detect when all questions are done to show summary
  useEffect(() => {
    if (allQuestionsAnswered && scopingQuestions.length > 0) {
      setShowAllComplete(true);
    }
  }, [allQuestionsAnswered, scopingQuestions.length]);

  // Check if both have answered the current question and trigger synthesis
  const triggerSynthesis = useCallback(
    async (question: ScopingQuestion) => {
      if (!question.npoAnswer || !question.researcherAnswer) return;

      setIsSynthesizing(true);
      try {
        const currentSidebar = useSessionStore.getState().sidebar;

        const res = await fetch('/api/phase2/synthesize-answers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: question.topic,
            npoQuestion: question.npoQuestion,
            researcherQuestion: question.researcherQuestion,
            npoAnswer: question.npoAnswer,
            researcherAnswer: question.researcherAnswer,
            currentSidebar,
          }),
        });

        if (!res.ok) {
          console.error('Failed to synthesize answers');
          setIsSynthesizing(false);
          return;
        }

        const data = (await res.json()) as {
          synthesis: string;
          sidebarUpdates: {
            newRequirements: string[];
            newConstraints: string[];
            newQuestions: string[];
            resolvedQuestions: string[];
          };
          followUpQuestion: {
            topic: string;
            npoQuestion: string;
            npoContext: string;
            researcherQuestion: string;
            researcherContext: string;
          } | null;
        };

        // Set synthesis on the question
        setSynthesis(question.id, data.synthesis);

        // Merge sidebar updates
        if (data.sidebarUpdates) {
          const latestSidebar = useSessionStore.getState().sidebar;
          const mergedSidebar: SidebarState = {
            agreedRequirements: [
              ...latestSidebar.agreedRequirements,
              ...(data.sidebarUpdates.newRequirements || []).filter(
                (r) => !latestSidebar.agreedRequirements.includes(r)
              ),
            ],
            constraints: [
              ...latestSidebar.constraints,
              ...(data.sidebarUpdates.newConstraints || []).filter(
                (c) => !latestSidebar.constraints.includes(c)
              ),
            ],
            openQuestions: [
              ...latestSidebar.openQuestions.filter(
                (q) => !(data.sidebarUpdates.resolvedQuestions || []).includes(q)
              ),
              ...(data.sidebarUpdates.newQuestions || []).filter(
                (q) => !latestSidebar.openQuestions.includes(q)
              ),
            ],
          };
          updateSidebar(mergedSidebar);
        }

        // Add follow-up question if present
        if (data.followUpQuestion) {
          const followUp: ScopingQuestion = {
            id: uuidv4(),
            topic: data.followUpQuestion.topic,
            npoQuestion: data.followUpQuestion.npoQuestion,
            researcherQuestion: data.followUpQuestion.researcherQuestion,
            npoContext: data.followUpQuestion.npoContext,
            researcherContext: data.followUpQuestion.researcherContext,
            status: 'pending',
          };
          addFollowUpQuestion(followUp);
        }
      } catch (err) {
        console.error('Synthesis error:', err);
      } finally {
        setIsSynthesizing(false);
      }
    },
    [setSynthesis, updateSidebar, addFollowUpQuestion]
  );

  // Handle submitting an answer
  const handleSubmitAnswer = useCallback(async () => {
    if (!role || !currentQuestion || !myAnswer.trim()) return;

    setIsSubmitting(true);

    // Save the answer
    answerQuestion(currentQuestion.id, role, myAnswer.trim());
    setMyAnswer('');

    // Check if both have now answered (after this submission)
    // We need to read the latest state since our answer was just applied
    const latestState = useSessionStore.getState();
    const updatedQuestion = latestState.scopingQuestions.find(
      (q) => q.id === currentQuestion.id
    );

    if (updatedQuestion && updatedQuestion.npoAnswer && updatedQuestion.researcherAnswer) {
      await triggerSynthesis(updatedQuestion);
    }

    setIsSubmitting(false);
  }, [role, currentQuestion, myAnswer, answerQuestion, triggerSynthesis]);

  // Handle advancing to next question
  const handleNextQuestion = useCallback(() => {
    advanceQuestion();
  }, [advanceQuestion]);

  // Handle "Agree & Proceed"
  const handleAgree = useCallback(() => {
    if (!role) return;
    agreePhase2(role);
  }, [role, agreePhase2]);

  // Handle proceeding to Phase 3 (when both agreed)
  const handleProceedToPhase3 = useCallback(() => {
    completePhase2();
    router.push(`/session/${sessionId}/phase3`);
  }, [completePhase2, router, sessionId]);

  // Handle removing an item from the sidebar
  const handleRemoveItem = useCallback(
    (category: string, index: number) => {
      const currentState = useSessionStore.getState();
      const currentSb = currentState.sidebar;
      const key = category as keyof SidebarState;

      if (!Array.isArray(currentSb[key])) return;

      const updated: SidebarState = {
        ...currentSb,
        [key]: currentSb[key].filter((_: string, i: number) => i !== index),
      };

      updateSidebar(updated);
    },
    [updateSidebar]
  );

  // Check if the current user has already answered the current question
  const hasMyAnswer =
    currentQuestion &&
    role &&
    (role === 'npo' ? currentQuestion.npoAnswer : currentQuestion.researcherAnswer);

  // Loading state
  if (!initialized || !role) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Main Q&A area - 70% */}
      <div className="flex flex-[7] flex-col border-r border-slate-200 bg-slate-50">
        {/* Header with progress */}
        <div className="border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-slate-800">
                Structured Scoping Q&A
              </h1>
              <p className="text-sm text-slate-500">
                Answer questions to align on project requirements
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">
                Your role:
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  role === 'npo'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-purple-100 text-purple-700'
                }`}
              >
                {role === 'npo' ? 'NPO' : 'Researcher'}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          {scopingQuestions.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>
                  Question {Math.min(currentQuestionIndex + 1, scopingQuestions.length)} of{' '}
                  {scopingQuestions.length}
                </span>
                <span>
                  {scopingQuestions.filter((q) => q.status === 'answered').length} answered
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-teal-600 transition-all duration-500"
                  style={{
                    width: `${
                      (scopingQuestions.filter((q) => q.status === 'answered').length /
                        scopingQuestions.length) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Loading questions */}
          {isLoadingQuestions && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin h-10 w-10 border-4 border-teal-600 border-t-transparent rounded-full mb-4" />
              <p className="text-sm text-slate-600 font-medium">
                AI Facilitator is generating scoping questions...
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Based on your problem statement
              </p>
            </div>
          )}

          {/* All questions answered - summary view */}
          {showAllComplete && allQuestionsAnswered && (
            <div className="space-y-6">
              {/* Summary header */}
              <Card className="border-teal-200 bg-teal-50/50">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white text-sm font-bold">
                    AI
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      All Scoping Questions Complete
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Great work! Both parties have answered all {scopingQuestions.length} scoping
                      questions. The requirements sidebar has been populated with agreed items.
                      Please review the sidebar and click &quot;Agree &amp; Proceed&quot; when you are
                      ready to move to the Project Charter phase.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Review of all questions and syntheses */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  Question Summary
                </h3>
                {scopingQuestions.map((q, i) => (
                  <Card key={q.id} className="bg-white">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{q.topic}</p>
                          <p className="text-sm text-slate-700">
                            <span className="font-medium text-blue-700">NPO:</span> {q.npoQuestion}
                          </p>
                          <p className="text-sm text-slate-700 mt-0.5">
                            <span className="font-medium text-purple-700">Researcher:</span> {q.researcherQuestion}
                          </p>
                        </div>
                      </div>
                      {q.aiSynthesis && (
                        <div className="ml-8 rounded-lg bg-slate-50 p-3 border border-slate-200">
                          <p className="text-xs font-semibold text-teal-700 mb-1">AI Synthesis</p>
                          <p className="text-sm text-slate-600">{q.aiSynthesis}</p>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              {/* Agree & Proceed section */}
              <Card className="border-2 border-teal-300 bg-white">
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800 text-center">
                    Ready to Proceed?
                  </h3>
                  <p className="text-sm text-slate-500 text-center">
                    Both parties must agree before moving to the Project Charter phase.
                  </p>

                  {/* Agreement status */}
                  <div className="flex justify-center gap-6">
                    <div className="flex items-center gap-2">
                      {npoAgreedPhase2 ? (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-sm">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      ) : (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400 text-sm">
                          <svg className="h-4 w-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </span>
                      )}
                      <span className={`text-sm font-medium ${npoAgreedPhase2 ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {npoAgreedPhase2 ? 'NPO agreed' : 'Waiting for NPO'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {researcherAgreedPhase2 ? (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-sm">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                      ) : (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400 text-sm">
                          <svg className="h-4 w-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </span>
                      )}
                      <span className={`text-sm font-medium ${researcherAgreedPhase2 ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {researcherAgreedPhase2 ? 'Researcher agreed' : 'Waiting for Researcher'}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex justify-center gap-3">
                    {role && !(role === 'npo' ? npoAgreedPhase2 : researcherAgreedPhase2) && (
                      <Button onClick={handleAgree} size="lg">
                        Agree &amp; Proceed to Charter
                      </Button>
                    )}
                    {role && (role === 'npo' ? npoAgreedPhase2 : researcherAgreedPhase2) && !phase2BothAgreed && (
                      <div className="rounded-lg bg-teal-50 border border-teal-200 px-4 py-2">
                        <p className="text-sm text-teal-700 font-medium">
                          You have agreed. Waiting for the other party...
                        </p>
                      </div>
                    )}
                    {phase2BothAgreed && (
                      <Button onClick={handleProceedToPhase3} size="lg">
                        Proceed to Phase 3: Project Charter
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Active question display */}
          {!isLoadingQuestions && !showAllComplete && currentQuestion && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Previously answered questions (compact) */}
              {scopingQuestions
                .slice(0, currentQuestionIndex)
                .filter((q) => q.status === 'answered')
                .map((q, i) => (
                  <div key={q.id} className="rounded-lg border border-slate-200 bg-white p-4 opacity-60">
                    <div className="flex items-start gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-600">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{q.topic}</p>
                        <p className="text-sm font-medium text-slate-700">{role === 'npo' ? q.npoQuestion : q.researcherQuestion}</p>
                        {q.aiSynthesis && (
                          <p className="mt-1 text-xs text-slate-500 italic">{q.aiSynthesis}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

              {/* Current question card */}
              <Card className="border-2 border-teal-200 bg-white shadow-md">
                <div className="space-y-4">
                  {/* Question header */}
                  <div className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white text-sm font-bold">
                      {currentQuestionIndex + 1}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide mb-1">
                        {currentQuestion.topic}
                      </p>
                      <h2 className="text-base font-semibold text-slate-800">
                        {role === 'npo' ? currentQuestion.npoQuestion : currentQuestion.researcherQuestion}
                      </h2>
                      {(role === 'npo' ? currentQuestion.npoContext : currentQuestion.researcherContext) && (
                        <p className="mt-1 text-sm text-slate-500 italic">
                          {role === 'npo' ? currentQuestion.npoContext : currentQuestion.researcherContext}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-slate-100" />

                  {/* Answer sections */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* NPO Answer */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                          NPO
                        </span>
                        {currentQuestion.npoAnswer && (
                          <span className="text-xs text-emerald-600 font-medium">Answered</span>
                        )}
                      </div>

                      {role === 'npo' && !currentQuestion.npoAnswer ? (
                        <textarea
                          value={myAnswer}
                          onChange={(e) => setMyAnswer(e.target.value)}
                          placeholder="Type your answer..."
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
                          rows={4}
                          disabled={isSubmitting}
                        />
                      ) : currentQuestion.npoAnswer ? (
                        <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                          <p className="text-sm text-slate-700">{currentQuestion.npoAnswer}</p>
                        </div>
                      ) : (
                        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 flex items-center gap-2">
                          <svg className="h-4 w-4 animate-pulse text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm text-slate-400 italic">Waiting for NPO...</p>
                        </div>
                      )}
                    </div>

                    {/* Researcher Answer */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                          Researcher
                        </span>
                        {currentQuestion.researcherAnswer && (
                          <span className="text-xs text-emerald-600 font-medium">Answered</span>
                        )}
                      </div>

                      {role === 'researcher' && !currentQuestion.researcherAnswer ? (
                        <textarea
                          value={myAnswer}
                          onChange={(e) => setMyAnswer(e.target.value)}
                          placeholder="Type your answer..."
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
                          rows={4}
                          disabled={isSubmitting}
                        />
                      ) : currentQuestion.researcherAnswer ? (
                        <div className="rounded-lg bg-purple-50 border border-purple-100 p-3">
                          <p className="text-sm text-slate-700">{currentQuestion.researcherAnswer}</p>
                        </div>
                      ) : (
                        <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 flex items-center gap-2">
                          <svg className="h-4 w-4 animate-pulse text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm text-slate-400 italic">Waiting for Researcher...</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit button - only show if user hasn't answered yet */}
                  {role && !hasMyAnswer && (
                    <div className="flex justify-end">
                      <Button
                        onClick={handleSubmitAnswer}
                        disabled={!myAnswer.trim() || isSubmitting}
                        loading={isSubmitting}
                      >
                        Submit Answer
                      </Button>
                    </div>
                  )}

                  {/* Synthesis display */}
                  {isSynthesizing && (
                    <div className="rounded-lg bg-teal-50 border border-teal-200 p-4">
                      <div className="flex items-center gap-3">
                        <div className="animate-spin h-5 w-5 border-2 border-teal-600 border-t-transparent rounded-full" />
                        <p className="text-sm text-teal-700 font-medium">
                          AI Facilitator is synthesizing both answers...
                        </p>
                      </div>
                    </div>
                  )}

                  {currentQuestion.aiSynthesis && (
                    <div className="rounded-lg bg-teal-50 border border-teal-200 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white text-xs font-bold">
                          AI
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-teal-700 mb-1">
                            Facilitator Synthesis
                          </p>
                          <p className="text-sm text-slate-700">{currentQuestion.aiSynthesis}</p>
                        </div>
                      </div>

                      {/* Next question button */}
                      {currentQuestionIndex < scopingQuestions.length - 1 && (
                        <div className="flex justify-end mt-3">
                          <Button onClick={handleNextQuestion} size="sm">
                            Next Question
                            <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Waiting for other party indicator */}
                  {hasMyAnswer && !currentQuestion.aiSynthesis && !isSynthesizing && (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-center gap-2">
                      <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-amber-700">
                        Your answer has been submitted. Waiting for the other party to respond...
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Upcoming questions preview */}
              {scopingQuestions.slice(currentQuestionIndex + 1).length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                    Upcoming Questions
                  </p>
                  <div className="space-y-2">
                    {scopingQuestions.slice(currentQuestionIndex + 1).map((q, i) => (
                      <div
                        key={q.id}
                        className="rounded-lg border border-slate-200 bg-white/50 p-3 opacity-50"
                      >
                        <div className="flex items-start gap-2">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-500">
                            {currentQuestionIndex + 2 + i}
                          </span>
                          <p className="text-sm text-slate-500">{q.topic}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No questions and not loading - fallback */}
          {!isLoadingQuestions && scopingQuestions.length === 0 && !showAllComplete && (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-sm text-slate-500">
                Waiting for session data to load...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar - 30% */}
      <div className="flex flex-[3] flex-col bg-white">
        <div className="flex-1 overflow-hidden">
          <RequirementsSidebar sidebar={sidebar} onRemoveItem={handleRemoveItem} />
        </div>
      </div>
    </div>
  );
}
