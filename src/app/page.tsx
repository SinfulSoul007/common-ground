'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSessionStore } from '@/store/sessionStore';
import RoleSelector from '@/components/landing/RoleSelector';
import SessionJoinForm from '@/components/landing/SessionJoinForm';

export default function LandingPage() {
  const router = useRouter();
  const { createSession, joinSession } = useSessionStore();
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateSession = () => {
    setLoading(true);
    const sessionId = createSession('npo');
    localStorage.setItem(`common-ground-role-${sessionId}`, 'npo');
    router.push(`/session/${sessionId}/phase1`);
  };

  const handleJoinSession = (sessionId: string) => {
    setLoading(true);
    setJoinError('');
    const success = joinSession(sessionId, 'researcher');
    if (success) {
      localStorage.setItem(`common-ground-role-${sessionId}`, 'researcher');
      router.push(`/session/${sessionId}/phase1`);
    } else {
      setJoinError('Session not found or already has a researcher. Check the ID and try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-surface">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-slate-800 to-primary bg-clip-text text-transparent mb-4">
          Common Ground
        </h1>
        <p className="text-lg text-slate-500 max-w-md mx-auto">
          Bridging the gap between non-profits and AI researchers
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {!showJoinForm ? (
          <motion.div
            key="selector"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center"
          >
            <RoleSelector
              onSelectNpo={handleCreateSession}
              onSelectResearcher={() => setShowJoinForm(true)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="join-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center"
          >
            <SessionJoinForm
              onJoin={handleJoinSession}
              onBack={() => {
                setShowJoinForm(false);
                setJoinError('');
              }}
              error={joinError}
              loading={loading}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12 text-sm text-slate-400 text-center max-w-md"
      >
        NPOs create a session, then share the session ID with their research partner.
        Open two browser tabs to demo the full experience.
      </motion.p>
    </div>
  );
}
