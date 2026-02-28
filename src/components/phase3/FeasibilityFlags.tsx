'use client';

import { motion } from 'framer-motion';
import type { FeasibilityFlag } from '@/lib/types';

interface FeasibilityFlagsProps {
  flags: FeasibilityFlag[];
}

const CATEGORY_ICONS: Record<string, string> = {
  timeline: '🕐',
  data: '📊',
  scope: '📐',
  ethics: '⚖️',
  missing_info: '❓',
  other: '📌',
};

const SEVERITY_STYLES: Record<string, string> = {
  low: 'border-l-green-400 bg-green-50/50',
  medium: 'border-l-amber-400 bg-amber-50/50',
  high: 'border-l-red-400 bg-red-50/50',
};

const SEVERITY_BADGE: Record<string, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
};

export default function FeasibilityFlags({ flags }: FeasibilityFlagsProps) {
  if (flags.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        ⚡ Feasibility Check
      </h3>
      <div className="space-y-3">
        {flags.map((flag, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`border-l-4 rounded-lg p-4 ${SEVERITY_STYLES[flag.severity]}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">{CATEGORY_ICONS[flag.category] ?? '📌'}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-slate-800 capitalize">
                    {flag.category.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_BADGE[flag.severity]}`}>
                    {flag.severity}
                  </span>
                </div>
                <p className="text-sm text-slate-700">{flag.description}</p>
                <p className="text-sm text-slate-500 italic mt-1">{flag.recommendation}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
