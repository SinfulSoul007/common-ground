'use client';

import React, { useState } from 'react';

interface CustomTagInputProps {
  onAddTag: (label: string) => void;
}

export default function CustomTagInput({ onAddTag }: CustomTagInputProps) {
  const [value, setValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = value.trim();
      if (trimmed) {
        onAddTag(trimmed);
        setValue('');
      }
    }
  };

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onAddTag(trimmed);
      setValue('');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add your own word..."
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
      />
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!value.trim()}
        className="shrink-0 rounded-lg bg-teal-700 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-teal-400"
      >
        Add
      </button>
    </div>
  );
}
