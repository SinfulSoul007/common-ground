'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface TranslationBadgeProps {
  type: 'simplified' | 'technical';
  children?: React.ReactNode;
}

export default function TranslationBadge({ type, children }: TranslationBadgeProps) {
  const [expanded, setExpanded] = useState(false);

  if (type === 'simplified') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
        <span aria-hidden="true">✨</span> Simplified for clarity
      </span>
    );
  }

  // technical type - clickable to expand
  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-200"
      >
        <span aria-hidden="true">📎</span> Technical context
        <svg
          className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <AnimatePresence>
        {expanded && children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50/50 p-3 text-xs text-blue-800">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
