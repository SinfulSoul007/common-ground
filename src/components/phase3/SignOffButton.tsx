'use client';

import { motion } from 'framer-motion';

interface SignOffButtonProps {
  onSignOff: () => void;
  hasSignedOff: boolean;
  loading?: boolean;
}

export default function SignOffButton({ onSignOff, hasSignedOff, loading }: SignOffButtonProps) {
  if (hasSignedOff) {
    return (
      <div className="flex items-center gap-2 px-6 py-3 bg-green-50 text-green-700 rounded-xl font-medium">
        <span>✅</span> You have agreed to this charter
      </div>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSignOff}
      disabled={loading}
      className="px-8 py-3 bg-primary text-white rounded-xl font-medium hover:bg-teal-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Processing...
        </>
      ) : (
        'I Agree'
      )}
    </motion.button>
  );
}
