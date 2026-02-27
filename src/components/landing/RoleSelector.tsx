'use client';

import { motion } from 'framer-motion';

interface RoleSelectorProps {
  onSelectNpo: () => void;
  onSelectResearcher: () => void;
}

export default function RoleSelector({ onSelectNpo, onSelectResearcher }: RoleSelectorProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl">
      <motion.button
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={onSelectNpo}
        className="flex-1 bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm hover:shadow-lg hover:border-npo/30 transition-all duration-200 cursor-pointer group"
      >
        <div className="text-5xl mb-4">🏛️</div>
        <h3 className="text-xl font-semibold text-slate-800 mb-2">I&apos;m from an NPO</h3>
        <p className="text-sm text-slate-500">
          Create a new session to define your problem and scope a project with an AI researcher.
        </p>
        <div className="mt-4 inline-block px-4 py-2 bg-npo/10 text-npo rounded-full text-sm font-medium group-hover:bg-npo/20 transition-colors">
          Create Session
        </div>
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={onSelectResearcher}
        className="flex-1 bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm hover:shadow-lg hover:border-researcher/30 transition-all duration-200 cursor-pointer group"
      >
        <div className="text-5xl mb-4">🔬</div>
        <h3 className="text-xl font-semibold text-slate-800 mb-2">I&apos;m a Researcher</h3>
        <p className="text-sm text-slate-500">
          Join an existing session to collaborate with an NPO on scoping an AI project.
        </p>
        <div className="mt-4 inline-block px-4 py-2 bg-researcher/10 text-researcher rounded-full text-sm font-medium group-hover:bg-researcher/20 transition-colors">
          Join Session
        </div>
      </motion.button>
    </div>
  );
}
