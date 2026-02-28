'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { SidebarState } from '@/lib/types';

interface RequirementsSidebarProps {
  sidebar: SidebarState;
  onRemoveItem: (category: string, index: number) => void;
}

interface SectionProps {
  title: string;
  icon: string;
  items: string[];
  category: string;
  colorClasses: {
    badge: string;
    item: string;
    border: string;
    icon: string;
    removeBtn: string;
  };
  onRemove: (category: string, index: number) => void;
}

function SidebarSection({ title, icon, items, category, colorClasses, onRemove }: SectionProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mb-3">
      {/* Section header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors hover:bg-slate-50"
      >
        <div className="flex items-center gap-2">
          <span aria-hidden="true">{icon}</span>
          <span className="text-sm font-semibold text-slate-700">{title}</span>
          <span
            className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-bold ${colorClasses.badge}`}
          >
            {items.length}
          </span>
        </div>
        <svg
          className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Section items */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-1.5 px-1 pt-1">
              {items.length === 0 ? (
                <p className="px-3 py-2 text-xs italic text-slate-400">
                  No items yet
                </p>
              ) : (
                <AnimatePresence mode="popLayout">
                  {items.map((item, index) => (
                    <motion.div
                      key={`${category}-${index}-${item}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0 }}
                      transition={{ duration: 0.2 }}
                      layout
                      className={`group flex items-start gap-2 rounded-lg border p-2.5 ${colorClasses.item} ${colorClasses.border}`}
                    >
                      <span className={`mt-0.5 text-xs ${colorClasses.icon}`} aria-hidden="true">
                        {icon}
                      </span>
                      <p className="min-w-0 flex-1 text-xs leading-relaxed text-slate-700">
                        {item}
                      </p>
                      <button
                        onClick={() => onRemove(category, index)}
                        className={`shrink-0 rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100 ${colorClasses.removeBtn}`}
                        aria-label={`Remove ${item}`}
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function RequirementsSidebar({ sidebar, onRemoveItem }: RequirementsSidebarProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-bold text-slate-800">Negotiation Progress</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Tracked automatically from conversation
        </p>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto p-3">
        <SidebarSection
          title="Agreed Requirements"
          icon="✅"
          items={sidebar.agreedRequirements}
          category="agreedRequirements"
          colorClasses={{
            badge: 'bg-emerald-100 text-emerald-700',
            item: 'bg-emerald-50/50',
            border: 'border-emerald-200',
            icon: 'text-emerald-500',
            removeBtn: 'text-emerald-400 hover:text-emerald-600 hover:bg-emerald-100',
          }}
          onRemove={onRemoveItem}
        />

        <SidebarSection
          title="Constraints"
          icon="⚠️"
          items={sidebar.constraints}
          category="constraints"
          colorClasses={{
            badge: 'bg-amber-100 text-amber-700',
            item: 'bg-amber-50/50',
            border: 'border-amber-200',
            icon: 'text-amber-500',
            removeBtn: 'text-amber-400 hover:text-amber-600 hover:bg-amber-100',
          }}
          onRemove={onRemoveItem}
        />

        <SidebarSection
          title="Open Questions"
          icon="❓"
          items={sidebar.openQuestions}
          category="openQuestions"
          colorClasses={{
            badge: 'bg-red-100 text-red-700',
            item: 'bg-red-50/50',
            border: 'border-red-200',
            icon: 'text-red-500',
            removeBtn: 'text-red-400 hover:text-red-600 hover:bg-red-100',
          }}
          onRemove={onRemoveItem}
        />
      </div>
    </div>
  );
}
