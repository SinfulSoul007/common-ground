'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

interface JoinButtonProps {
  sessionId: string;
  postId: string;
  status: string;
}

export default function JoinButton({ sessionId, postId, status }: JoinButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/forum/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, postId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to join project.');
        setLoading(false);
        return;
      }

      router.push(`/session/${sessionId}/phase2`);
    } catch {
      setError('Failed to join project.');
      setLoading(false);
    }
  };

  if (status !== 'open') {
    return (
      <div className="text-sm text-slate-500 px-4 py-2 bg-slate-50 rounded-lg text-center">
        {status === 'in_progress' ? 'A researcher has already joined this project.' : 'This project is completed.'}
      </div>
    );
  }

  return (
    <div>
      <Button onClick={handleJoin} loading={loading} className="w-full">
        Join This Project
      </Button>
      {error && (
        <p className="mt-2 text-sm text-red-600 text-center">{error}</p>
      )}
    </div>
  );
}
