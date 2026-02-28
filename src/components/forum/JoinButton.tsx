'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { joinSessionAsResearcher } from '@/lib/supabase/sessions';
import Button from '@/components/ui/Button';

interface JoinButtonProps {
  sessionId: string;
  postId: string;
  status: string;
}

export default function JoinButton({ sessionId, postId, status }: JoinButtonProps) {
  const router = useRouter();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    if (!user) {
      setError('Please log in to join.');
      return;
    }

    setLoading(true);
    setError('');

    const supabase = createClient();
    const success = await joinSessionAsResearcher(supabase, sessionId, user.id);
    if (!success) {
      setError('This project already has a researcher assigned.');
      setLoading(false);
      return;
    }

    // Update forum post status
    await supabase
      .from('forum_posts')
      .update({ status: 'in_progress' })
      .eq('id', postId);

    router.push(`/session/${sessionId}/phase2`);
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
