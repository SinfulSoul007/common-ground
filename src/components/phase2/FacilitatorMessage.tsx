'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface FacilitatorMessageProps {
  content: string;
}

export default function FacilitatorMessage({ content }: FacilitatorMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex w-full items-start gap-3 rounded-xl border border-dashed border-violet-200 bg-violet-50 p-4"
    >
      {/* Icon */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-base">
        <span aria-hidden="true">🤖</span>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-violet-600">
          AI Facilitator
        </p>
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-violet-900">
          {content}
        </div>
      </div>
    </motion.div>
  );
}
