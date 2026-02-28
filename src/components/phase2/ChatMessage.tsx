'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { ChatMessage as ChatMessageType, Role } from '@/lib/types';
import { ROLE_ICONS, ROLE_LABELS } from '@/lib/constants';
import TranslationBadge from './TranslationBadge';
import FacilitatorMessage from './FacilitatorMessage';

interface ChatMessageProps {
  message: ChatMessageType;
  currentRole: Role;
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatMessage({ message, currentRole }: ChatMessageProps) {
  const { role: msgRole } = message;

  // Facilitator messages get their own dedicated component
  if (msgRole === 'facilitator') {
    return (
      <div className="flex justify-center px-4 py-1">
        <div className="w-full max-w-2xl">
          <FacilitatorMessage content={message.displayContent} />
          <p className="mt-1 text-center text-[10px] text-slate-400">
            {formatTimestamp(message.timestamp)}
          </p>
        </div>
      </div>
    );
  }

  // Determine alignment
  const isNpo = msgRole === 'npo';
  const alignment = isNpo ? 'justify-start' : 'justify-end';

  // Determine bubble styles
  const bubbleStyles = isNpo
    ? 'bg-emerald-50 text-emerald-900'
    : 'bg-blue-50 text-blue-900';

  // Determine what content to show
  const renderContent = () => {
    // Sender always sees their own originalContent
    if (currentRole === msgRole) {
      return <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.originalContent}</p>;
    }

    // Viewing a researcher message as NPO: show displayContent with simplified badge
    if (msgRole === 'researcher' && message.simplifiedLabel) {
      return (
        <div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.displayContent}</p>
          <div className="mt-2">
            <TranslationBadge type="simplified" />
          </div>
        </div>
      );
    }

    // Viewing an NPO message as researcher: show originalContent + optional technical note
    if (currentRole === 'researcher' && msgRole === 'npo') {
      return (
        <div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.originalContent}</p>
          {message.technicalNote && (
            <TranslationBadge type="technical">
              {message.technicalNote}
            </TranslationBadge>
          )}
        </div>
      );
    }

    // Default fallback: show displayContent
    return <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.displayContent}</p>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex ${alignment} px-4 py-1`}
    >
      <div className={`max-w-[75%] ${isNpo ? '' : 'flex flex-col items-end'}`}>
        {/* Role label */}
        <div className={`mb-1 flex items-center gap-1.5 ${isNpo ? '' : 'flex-row-reverse'}`}>
          <span className="text-sm" aria-hidden="true">
            {ROLE_ICONS[msgRole]}
          </span>
          <span className="text-xs font-medium text-slate-500">
            {ROLE_LABELS[msgRole]}
          </span>
        </div>

        {/* Message bubble */}
        <div className={`rounded-2xl px-4 py-3 ${bubbleStyles} ${isNpo ? 'rounded-tl-md' : 'rounded-tr-md'}`}>
          {renderContent()}
        </div>

        {/* Timestamp */}
        <p className={`mt-1 text-[10px] text-slate-400 ${isNpo ? '' : 'text-right'}`}>
          {formatTimestamp(message.timestamp)}
        </p>
      </div>
    </motion.div>
  );
}
