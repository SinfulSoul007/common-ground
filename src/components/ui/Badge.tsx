'use client';

import React from 'react';

interface BadgeProps {
  variant?: 'npo' | 'researcher' | 'facilitator' | 'default';
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<string, string> = {
  npo: 'bg-emerald-100 text-emerald-800',
  researcher: 'bg-blue-100 text-blue-800',
  facilitator: 'bg-violet-100 text-violet-800',
  default: 'bg-slate-100 text-slate-700',
};

export default function Badge({
  variant = 'default',
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
