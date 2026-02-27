'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { ProblemStatement } from '@/lib/types';
import Button from '@/components/ui/Button';

interface ProblemSummaryProps {
  problemStatement: ProblemStatement;
  onConfirm: () => void;
}

export default function ProblemSummary({ problemStatement, onConfirm }: ProblemSummaryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Plain English - NPO-facing */}
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <h3 className="mb-2 text-sm font-semibold text-green-800">
          What we understood (for you):
        </h3>
        <p className="text-sm leading-relaxed text-green-900">
          {problemStatement.plainEnglish}
        </p>
      </div>

      {/* Technical Interpretation - Researcher-facing */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h3 className="mb-2 text-sm font-semibold text-blue-800">
          Technical interpretation (for the researcher):
        </h3>
        <p className="text-sm leading-relaxed text-blue-900">
          {problemStatement.technicalInterpretation}
        </p>
      </div>

      {/* Final tags */}
      {problemStatement.finalTags.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            Key Concepts
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {problemStatement.finalTags.map((tag) => (
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

      {/* Confirm button */}
      <div className="pt-2">
        <Button onClick={onConfirm} className="w-full">
          Confirm &amp; Continue to Negotiation
        </Button>
      </div>
    </motion.div>
  );
}
