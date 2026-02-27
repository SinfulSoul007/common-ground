'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDrop } from 'react-dnd';
import { TAG_DND_TYPE } from './Tag';
import type { Tag } from '@/lib/types';
import type { TagDragItem } from './Tag';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface CombineZoneProps {
  selectedTags: Tag[];
  onCombine: (tag1Id: string, tag2Id: string) => void;
  onDropTag: (tagId: string) => void;
  isLoading: boolean;
}

export default function CombineZone({
  selectedTags,
  onCombine,
  onDropTag,
  isLoading,
}: CombineZoneProps) {
  const [showFlash, setShowFlash] = useState(false);

  const [{ isOver, canDrop }, dropRef] = useDrop<TagDragItem, void, { isOver: boolean; canDrop: boolean }>({
    accept: TAG_DND_TYPE,
    drop: (item) => {
      if (selectedTags.length === 1 && selectedTags[0].id !== item.id) {
        onCombine(selectedTags[0].id, item.id);
      } else if (selectedTags.length === 0) {
        onDropTag(item.id);
      }
    },
    canDrop: (item) => {
      if (selectedTags.length >= 2) return false;
      if (selectedTags.length === 1 && selectedTags[0].id === item.id) return false;
      return true;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setShowFlash(true), 600);
      return () => clearTimeout(timer);
    }
    setShowFlash(false);
  }, [isLoading]);

  const isActive = isOver && canDrop;

  return (
    <div
      ref={dropRef as unknown as React.Ref<HTMLDivElement>}
      className={`relative w-full rounded-xl border-2 border-dashed p-6 transition-all duration-200 ${
        isActive
          ? 'border-primary bg-primary/5'
          : canDrop && isOver
            ? 'border-slate-400 bg-slate-50'
            : 'border-slate-300 bg-white'
      }`}
    >
      {/* Flash overlay on combine */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-10 rounded-xl bg-teal-300"
          />
        )}
      </AnimatePresence>

      <div className="flex min-h-[80px] flex-col items-center justify-center gap-3">
        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3"
          >
            {/* Show both tags sliding together */}
            <div className="flex items-center gap-2">
              {selectedTags.map((tag, i) => (
                <motion.span
                  key={tag.id}
                  initial={{ x: i === 0 ? -20 : 20, opacity: 0.7 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="rounded-full bg-teal-100 px-3 py-1.5 text-sm font-medium text-teal-800"
                >
                  {tag.label}
                </motion.span>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <LoadingSpinner size="sm" />
              <span>Combining concepts...</span>
            </div>
          </motion.div>
        ) : selectedTags.length === 0 ? (
          <div className="text-center">
            <p className="text-sm font-medium text-slate-500">
              {isActive ? 'Release to add tag' : 'Drop a tag here to combine'}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Or click two tags to combine them into a new concept
            </p>
          </div>
        ) : selectedTags.length === 1 ? (
          <div className="flex items-center gap-3">
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="rounded-full bg-teal-100 px-3 py-1.5 text-sm font-medium text-teal-800"
            >
              {selectedTags[0].label}
            </motion.span>
            <span className="text-lg text-slate-400">+</span>
            <span className="rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-400">
              {isActive ? 'Release to combine' : 'Drop or click another tag'}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {selectedTags.map((tag) => (
              <motion.span
                key={tag.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="rounded-full bg-teal-100 px-3 py-1.5 text-sm font-medium text-teal-800"
              >
                {tag.label}
              </motion.span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
