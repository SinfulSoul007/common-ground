'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SessionJoinFormProps {
  onJoin: (sessionId: string) => void;
  onBack: () => void;
  error?: string;
  loading?: boolean;
}

export default function SessionJoinForm({ onJoin, onBack, error, loading }: SessionJoinFormProps) {
  const [sessionId, setSessionId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sessionId.trim()) {
      onJoin(sessionId.trim().toUpperCase());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      <button
        onClick={onBack}
        className="mb-6 text-sm text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1"
      >
        ← Back
      </button>
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="text-4xl mb-4 text-center">🔬</div>
        <h3 className="text-xl font-semibold text-slate-800 mb-2 text-center">Join a Session</h3>
        <p className="text-sm text-slate-500 mb-6 text-center">
          Enter the session ID shared by your NPO partner.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value.toUpperCase())}
            placeholder="Enter Session ID (e.g., ABC123)"
            className="w-full px-4 py-3 rounded-lg border border-slate-300 text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-researcher/20 focus:border-researcher transition-colors"
            maxLength={6}
            autoFocus
          />
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-red-500 text-sm text-center"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
          <button
            type="submit"
            disabled={!sessionId.trim() || loading}
            className="w-full py-3 bg-researcher text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Joining...
              </>
            ) : (
              'Join Session'
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
