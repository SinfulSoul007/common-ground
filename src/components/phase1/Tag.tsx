'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useDrag } from 'react-dnd';
import type { Tag as TagType } from '@/lib/types';

export const TAG_DND_TYPE = 'TAG';

export interface TagDragItem {
  id: string;
  label: string;
}

interface TagProps {
  tag: TagType;
  isSelected: boolean;
  onClick: () => void;
  onRemove?: (tagId: string) => void;
}

export default function Tag({ tag, isSelected, onClick, onRemove }: TagProps) {
  const [isHovered, setIsHovered] = useState(false);

  const [{ isDragging }, dragRef] = useDrag<TagDragItem, unknown, { isDragging: boolean }>({
    type: TAG_DND_TYPE,
    item: { id: tag.id, label: tag.label },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const isCombined = !!tag.parents;
  const isCustom = !!tag.isCustom;
  const isSeed = !!tag.isSeed;
  const isRemovable = !isSeed && (isCombined || isCustom);

  let colorClasses = '';
  if (isCombined) {
    colorClasses =
      'bg-gradient-to-r from-emerald-50 to-teal-50 text-teal-800 border border-teal-200 font-medium';
  } else if (isCustom) {
    colorClasses = 'bg-blue-50 text-blue-700 border border-blue-200';
  } else {
    colorClasses = 'bg-slate-100 text-slate-700';
  }

  const selectedClasses = isSelected
    ? 'ring-2 ring-primary ring-offset-2 shadow-md bg-teal-50/80 border-teal-300'
    : '';

  return (
    <motion.div
      ref={dragRef as unknown as React.Ref<HTMLDivElement>}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: isDragging ? 0.5 : 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      whileHover={{ scale: 1.05 }}
      className={`rounded-full px-4 py-2.5 min-h-[2.25rem] cursor-pointer select-none inline-flex items-center gap-1 text-sm transition-all ${colorClasses} ${selectedClasses}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span>{tag.label}</span>
      {isRemovable && isHovered && onRemove && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-current opacity-60 hover:opacity-100 hover:bg-black/10"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(tag.id);
          }}
          aria-label={`Remove ${tag.label}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </motion.button>
      )}
    </motion.div>
  );
}
