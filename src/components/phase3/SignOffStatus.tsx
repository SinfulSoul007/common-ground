'use client';

import { motion } from 'framer-motion';

interface SignOffStatusProps {
  npoSignedOff: boolean;
  researcherSignedOff: boolean;
}

export default function SignOffStatus({ npoSignedOff, researcherSignedOff }: SignOffStatusProps) {
  const bothSigned = npoSignedOff && researcherSignedOff;

  if (bothSigned) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.2 }}
          className="text-6xl mb-4"
        >
          🎉
        </motion.div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">
          Common Ground Achieved!
        </h2>
        <p className="text-lg text-slate-500 max-w-md mx-auto">
          Both parties have agreed on the project scope. You&apos;re ready to start building.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm">
            ✅ 🏛️ NPO Agreed
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm">
            ✅ 🔬 Researcher Agreed
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex items-center gap-4 text-sm">
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
        npoSignedOff ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
      }`}>
        {npoSignedOff ? '✅' : '⏳'} 🏛️ NPO {npoSignedOff ? 'Agreed' : 'Pending'}
      </div>
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
        researcherSignedOff ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'
      }`}>
        {researcherSignedOff ? '✅' : '⏳'} 🔬 Researcher {researcherSignedOff ? 'Agreed' : 'Pending'}
      </div>
    </div>
  );
}
