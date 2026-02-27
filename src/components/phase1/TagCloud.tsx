'use client';

import React from 'react';
import Tag from './Tag';
import type { Tag as TagType } from '@/lib/types';

interface TagCloudProps {
  tags: TagType[];
  selectedTags: string[];
  onTagClick: (tagId: string) => void;
  onTagRemove: (tagId: string) => void;
}

function sortTags(tags: TagType[]): TagType[] {
  return [...tags].sort((a, b) => {
    // Combined tags first (most prominent)
    if (a.parents && !b.parents) return -1;
    if (!a.parents && b.parents) return 1;
    // Custom tags next
    if (a.isCustom && !b.isCustom && !b.parents) return -1;
    if (!a.isCustom && !a.parents && b.isCustom) return 1;
    // Seed tags last, alphabetical within each group
    return a.label.localeCompare(b.label);
  });
}

export default function TagCloud({ tags, selectedTags, onTagClick, onTagRemove }: TagCloudProps) {
  const sortedTags = sortTags(tags);

  return (
    <div className="flex flex-wrap gap-2">
      {sortedTags.map((tag) => (
        <Tag
          key={tag.id}
          tag={tag}
          isSelected={selectedTags.includes(tag.id)}
          onClick={() => onTagClick(tag.id)}
          onRemove={onTagRemove}
        />
      ))}
    </div>
  );
}
