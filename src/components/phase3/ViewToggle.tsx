'use client';

import { motion } from 'framer-motion';
import type { Role } from '@/lib/types';

interface ViewToggleProps {
  activeView: Role;
  onToggle: (view: Role) => void;
}

export default function ViewToggle({ activeView, onToggle }: ViewToggleProps) {
  return (
    <div className="relative inline-flex items-center rounded-full bg-slate-100 p-1 shadow-inner">
      <motion.div
        className="absolute inset-y-1 rounded-full bg-white shadow-sm"
        initial={false}
        animate={{
          left: activeView === 'npo' ? '4px' : '50%',
          width: 'calc(50% - 4px)',
        }}
        transition={{ type: 'spring', stiffness: 450, damping: 28 }}
      />
      <button
        onClick={() => onToggle('npo')}
        className={`relative z-10 flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors ${
          activeView === 'npo' ? 'text-npo' : 'text-slate-500'
        }`}
      >
        <span aria-hidden>🏛️</span>
        <span>NPO View</span>
      </button>
      <button
        onClick={() => onToggle('researcher')}
        className={`relative z-10 flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors ${
          activeView === 'researcher' ? 'text-researcher' : 'text-slate-500'
        }`}
      >
        <span aria-hidden>🔬</span>
        <span>Researcher View</span>
      </button>
    </div>
  );
}
