'use client';

import React, { useEffect, useRef } from 'react';
import type { ChatMessage as ChatMessageType, Role } from '@/lib/types';
import ChatMessageComponent from './ChatMessage';

interface ChatWindowProps {
  messages: ChatMessageType[];
  currentRole: Role;
}

export default function ChatWindow({ messages, currentRole }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          </div>
          <p className="text-sm text-slate-500">The conversation will appear here...</p>
          <p className="mt-1 text-xs text-slate-400">Messages are translated in real-time for both parties</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="custom-scrollbar flex-1 overflow-y-auto py-4"
    >
      <div className="space-y-2">
        {messages.map((message) => (
          <ChatMessageComponent
            key={message.id}
            message={message}
            currentRole={currentRole}
          />
        ))}
      </div>
    </div>
  );
}
