'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useUser } from '@/hooks/useUser';

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useUser();

  // If logged in, redirect to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-sm text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-surface">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <div className="flex justify-center mb-4">
          <Image src="/logo.png" alt="" width={80} height={80} className="rounded-xl" />
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-slate-800 to-primary bg-clip-text text-transparent mb-4">
          Common Ground
        </h1>
        <p className="text-lg text-slate-500 max-w-md mx-auto">
          Bridging the gap between non-profits and AI researchers
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <Link
          href="/signup"
          className="px-8 py-3 bg-primary text-white rounded-xl font-medium text-center hover:bg-primary/90 transition-colors shadow-sm"
        >
          Get Started
        </Link>
        <Link
          href="/login"
          className="px-8 py-3 bg-white text-slate-700 rounded-xl font-medium text-center border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          Sign In
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl"
      >
        <div className="text-center p-4">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 text-lg font-bold">1</div>
          <h3 className="font-medium text-slate-700 mb-1">Define Your Challenge</h3>
          <p className="text-sm text-slate-400">NPOs explore and combine concepts to articulate their problem.</p>
        </div>
        <div className="text-center p-4">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-3 text-lg font-bold">2</div>
          <h3 className="font-medium text-slate-700 mb-1">Find a Researcher</h3>
          <p className="text-sm text-slate-400">Post your problem on the forum. Researchers browse and join.</p>
        </div>
        <div className="text-center p-4">
          <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-3 text-lg font-bold">3</div>
          <h3 className="font-medium text-slate-700 mb-1">Scope Together</h3>
          <p className="text-sm text-slate-400">AI-facilitated Q&amp;A aligns both parties on a project charter.</p>
        </div>
      </motion.div>
    </div>
  );
}
