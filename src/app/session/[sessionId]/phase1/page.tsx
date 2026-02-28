'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { v4 as uuidv4 } from 'uuid';
import { useSession } from '@/hooks/useSession';
import TagCloud from '@/components/phase1/TagCloud';
import CustomTagInput from '@/components/phase1/CustomTagInput';
import WaitingRoom from '@/components/phase1/WaitingRoom';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import type { Tag, ProblemStatement } from '@/lib/types';

export default function Phase1Page() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const store = useSession(sessionId);

  const {
    role,
    tags,
    combinationHistory,
    phase1Complete,
    initialized,
    addTag,
    removeTag,
    combineTagsLocally,
    setProblemStatement,
    completePhase1,
  } = store;

  // Local state
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isCombining, setIsCombining] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [showProblemModal, setShowProblemModal] = useState(false);
  const [checkedTagIds, setCheckedTagIds] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProblem, setGeneratedProblem] = useState<ProblemStatement | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishCategory, setPublishCategory] = useState('general');

  // Researcher auto-navigate to phase2 when phase1 completes
  useEffect(() => {
    if (role === 'researcher' && phase1Complete) {
      router.push(`/session/${sessionId}/phase2`);
    }
  }, [role, phase1Complete, sessionId, router]);

  // Combine multiple tags via API
  const handleCombine = useCallback(
    async (tagIds: string[]) => {
      const tagObjects = tagIds.map((id) => tags.find((t) => t.id === id)).filter(Boolean) as Tag[];
      if (tagObjects.length < 2) return;

      setIsCombining(true);

      try {
        const response = await fetch('/api/phase1/combine-tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tags: tagObjects.map((t) => t.label) }),
        });

        if (!response.ok) throw new Error('Failed to combine tags');

        const data = await response.json();
        const resultTag: Tag = {
          id: uuidv4(),
          label: data.result,
          parents: [tagIds[0], tagIds[1]],
        };

        combineTagsLocally(tagIds[0], tagIds[1], resultTag);
      } catch (error) {
        console.error('Error combining tags:', error);
      } finally {
        setIsCombining(false);
        setSelectedTagIds([]);
      }
    },
    [tags, combineTagsLocally]
  );

  // Handle tag click — toggle selection
  const handleTagClick = useCallback(
    (tagId: string) => {
      if (isCombining) return;
      setSelectedTagIds((prev) => {
        if (prev.includes(tagId)) {
          return prev.filter((id) => id !== tagId);
        }
        return [...prev, tagId];
      });
    },
    [isCombining]
  );

  // Trigger combine from button
  const handleCombineSelected = useCallback(() => {
    if (selectedTagIds.length >= 2) {
      handleCombine(selectedTagIds);
    }
  }, [selectedTagIds, handleCombine]);

  // Add custom tag
  const handleAddCustomTag = useCallback(
    (label: string) => {
      const newTag: Tag = {
        id: uuidv4(),
        label,
        isCustom: true,
      };
      addTag(newTag);
    },
    [addTag]
  );

  // Remove tag
  const handleRemoveTag = useCallback(
    (tagId: string) => {
      removeTag(tagId);
      setSelectedTagIds((prev) => prev.filter((id) => id !== tagId));
    },
    [removeTag]
  );

  // Finalize: get non-seed tags, sorted newest first
  const nonSeedTags = [...tags.filter((t) => !t.isSeed)].reverse();

  // Toggle tag in finalize checklist
  const toggleCheckedTag = (tagId: string) => {
    setCheckedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  };

  // Generate problem statement
  const handleGenerateProblem = async () => {
    const selectedLabels = tags
      .filter((t) => checkedTagIds.has(t.id))
      .map((t) => t.label);

    if (selectedLabels.length === 0) return;

    setIsGenerating(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/phase1/generate-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: selectedLabels }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      const finalTags = tags.filter((t) => checkedTagIds.has(t.id));
      const ps: ProblemStatement = {
        plainEnglish: data.plainEnglish,
        technicalInterpretation: data.technicalInterpretation,
        finalTags,
      };

      setGeneratedProblem(ps);
      setProblemStatement(ps);
      setShowFinalizeModal(false);
      setShowProblemModal(true);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Something went wrong';
      console.error('Error generating problem statement:', msg);
      setErrorMessage(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // Publish to forum via API route (avoids client-side auth issues)
  const handlePublishToForum = async () => {
    if (!generatedProblem) return;
    setIsPublishing(true);

    try {
      const res = await fetch('/api/forum/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          plainEnglish: generatedProblem.plainEnglish,
          technicalInterpretation: generatedProblem.technicalInterpretation,
          tags: generatedProblem.finalTags,
          category: publishCategory,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error || `Server error: ${res.status}`);
      }

      setPublished(true);
    } catch (error) {
      console.error('Error publishing to forum:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  // Confirm problem statement and advance
  const handleConfirmProblem = () => {
    completePhase1();
    setShowProblemModal(false);
    router.push(`/session/${sessionId}/phase2`);
  };

  // Tag lookup helper for history display
  const getTagLabel = (tagId: string): string => {
    return tags.find((t) => t.id === tagId)?.label ?? '?';
  };

  // Loading / uninitialized
  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-slate-500">Loading session...</div>
      </div>
    );
  }

  // Researcher waiting room
  if (role === 'researcher' && !phase1Complete) {
    return <WaitingRoom sessionId={sessionId} tagCount={tags.length} />;
  }

  // NPO Discovery Game
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-full flex-col overflow-hidden">
        {/* Instruction bar */}
        <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-3">
          <p className="text-sm text-slate-500">
            Select multiple concepts and click <strong>&quot;Combine&quot;</strong> to merge them. Create at least 3 combinations, then click <strong>&quot;Finalize Problem&quot;</strong>.
          </p>
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main area (70%) */}
          <main className="flex w-[70%] flex-col gap-4 overflow-y-auto p-6 custom-scrollbar">
            {/* Combine bar */}
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
              {selectedTagIds.length === 0 ? (
                <p className="text-sm text-slate-400 flex-1">Click tags below to select them for combining...</p>
              ) : (
                <div className="flex flex-wrap gap-2 flex-1">
                  {selectedTagIds.map((id) => {
                    const tag = tags.find((t) => t.id === id);
                    return tag ? (
                      <span
                        key={id}
                        className="rounded-full bg-teal-100 px-3 py-1.5 text-sm font-medium text-teal-800 flex items-center gap-1"
                      >
                        {tag.label}
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedTagIds((prev) => prev.filter((i) => i !== id)); }}
                          className="ml-1 text-teal-600 hover:text-teal-900"
                        >
                          &times;
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
              <Button
                onClick={handleCombineSelected}
                disabled={selectedTagIds.length < 2 || isCombining}
                loading={isCombining}
                size="sm"
              >
                {isCombining ? 'Combining...' : `Combine${selectedTagIds.length >= 2 ? ` (${selectedTagIds.length})` : ''}`}
              </Button>
              {selectedTagIds.length > 0 && (
                <button
                  onClick={() => setSelectedTagIds([])}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Tag Cloud */}
            <div className="flex-1">
              <h2 className="mb-3 text-sm font-medium text-slate-700">
                Concepts ({tags.length})
              </h2>
              <TagCloud
                tags={tags}
                selectedTags={selectedTagIds}
                onTagClick={handleTagClick}
                onTagRemove={handleRemoveTag}
              />
            </div>

            {/* Custom Tag Input */}
            <div className="shrink-0 pt-2">
              <CustomTagInput onAddTag={handleAddCustomTag} />
            </div>
          </main>

          {/* Sidebar (30%) */}
          <aside className="flex w-[30%] flex-col border-l border-slate-200 bg-white">
            {/* Combination History */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <h2 className="mb-3 text-sm font-semibold text-slate-700">
                Combination History
              </h2>
              {combinationHistory.length === 0 ? (
                <p className="text-xs text-slate-400">
                  No combinations yet. Select tags and click &quot;Combine&quot; to create new concepts.
                </p>
              ) : (
                <ul className="space-y-2">
                  {[...combinationHistory].reverse().map((combo, index) => (
                    <li
                      key={index}
                      className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600"
                    >
                      <span className="font-medium text-slate-700">
                        {getTagLabel(combo.parent1Id)}
                      </span>
                      <span className="mx-1.5 text-slate-400">+</span>
                      <span className="font-medium text-slate-700">
                        {getTagLabel(combo.parent2Id)}
                      </span>
                      <span className="mx-1.5 text-slate-400">&rarr;</span>
                      <span className="font-medium text-teal-700">
                        {getTagLabel(combo.resultId)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Finalize button */}
            <div className="shrink-0 border-t border-slate-200 p-4 bg-slate-50">
              <Button
                onClick={() => {
                  setCheckedTagIds(new Set());
                  setErrorMessage('');
                  setShowFinalizeModal(true);
                }}
                disabled={combinationHistory.length < 3}
                className="w-full text-base py-3"
              >
                Finalize Problem
              </Button>
              {combinationHistory.length < 3 ? (
                <p className="mt-2 text-center text-xs text-slate-400">
                  Create at least {3 - combinationHistory.length} more combination
                  {3 - combinationHistory.length !== 1 ? 's' : ''} to finalize
                </p>
              ) : (
                <p className="mt-2 text-center text-xs text-green-600 font-medium">
                  Ready! Click above to generate your problem statement.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Finalize Modal - Tag selection */}
      <Modal
        isOpen={showFinalizeModal}
        onClose={() => { if (!isGenerating) setShowFinalizeModal(false); }}
        title="Select Key Concepts"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Choose the tags that best represent your challenge.
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCheckedTagIds(new Set(nonSeedTags.map((t) => t.id)))}
              className="text-xs text-primary hover:underline"
            >
              Select all
            </button>
            <span className="text-xs text-slate-300">|</span>
            <button
              onClick={() => setCheckedTagIds(new Set())}
              className="text-xs text-primary hover:underline"
            >
              Unselect all
            </button>
            <span className="ml-auto text-xs text-slate-400">{checkedTagIds.size} selected</span>
          </div>

          <div className="max-h-60 space-y-2 overflow-y-auto custom-scrollbar">
            {nonSeedTags.map((tag) => (
              <label
                key={tag.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={checkedTagIds.has(tag.id)}
                  onChange={() => toggleCheckedTag(tag.id)}
                  className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-slate-700">{tag.label}</span>
                {tag.parents && (
                  <span className="ml-auto text-xs text-slate-400">combined</span>
                )}
                {tag.isCustom && (
                  <span className="ml-auto text-xs text-slate-400">custom</span>
                )}
              </label>
            ))}
          </div>

          {nonSeedTags.length === 0 && (
            <p className="text-center text-sm text-slate-400">
              No custom or combined tags yet. Create some combinations first.
            </p>
          )}

          {errorMessage && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setShowFinalizeModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateProblem}
              disabled={checkedTagIds.size === 0}
              loading={isGenerating}
              className="flex-1"
            >
              {isGenerating ? 'Generating...' : 'Generate Problem Statement'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Problem Summary Modal — NPO only sees plain English */}
      <Modal
        isOpen={showProblemModal}
        onClose={() => setShowProblemModal(false)}
        title="Your Problem Statement"
      >
        {generatedProblem && (
          <div className="space-y-5">
            <div className="rounded-lg border border-green-200 bg-green-50 p-5">
              <h3 className="mb-2 text-sm font-semibold text-green-800">
                Here&apos;s what we understood:
              </h3>
              <p className="text-sm leading-relaxed text-green-900">
                {generatedProblem.plainEnglish}
              </p>
            </div>

            {generatedProblem.finalTags.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Key Concepts
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {generatedProblem.finalTags.map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                    >
                      {tag.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-slate-400">
              The researcher will receive a technical interpretation of this problem. You don&apos;t need to worry about the technical details.
            </p>

            {/* Publish to Forum */}
            <div className="border-t border-slate-200 pt-4">
              <h4 className="text-sm font-medium text-slate-700 mb-2">Post to the Forum</h4>
              <p className="text-xs text-slate-400 mb-3">
                Publish your problem statement so researchers can discover and join your project.
              </p>
              <div className="flex items-center gap-2 mb-3">
                <label className="text-xs text-slate-500">Category:</label>
                <select
                  value={publishCategory}
                  onChange={(e) => setPublishCategory(e.target.value)}
                  className="rounded border border-slate-300 px-2 py-1 text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="general">General</option>
                  <option value="education">Education</option>
                  <option value="health">Health</option>
                  <option value="environment">Environment</option>
                  <option value="poverty">Poverty</option>
                  <option value="technology">Technology</option>
                </select>
              </div>
              {published ? (
                <div className="text-sm text-green-600 font-medium bg-green-50 rounded-lg px-3 py-2">
                  Published to forum! Researchers can now find your project.
                </div>
              ) : (
                <Button
                  variant="secondary"
                  onClick={handlePublishToForum}
                  loading={isPublishing}
                  className="w-full"
                >
                  {isPublishing ? 'Publishing...' : 'Publish to Forum'}
                </Button>
              )}
            </div>

            <Button onClick={handleConfirmProblem} className="w-full">
              {published ? 'Continue to Negotiation' : 'Skip Forum & Continue'}
            </Button>
          </div>
        )}
      </Modal>
    </DndProvider>
  );
}
