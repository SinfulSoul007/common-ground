'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';

export default function ForumLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { profile } = useUser();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="bg-white border-b border-border px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-lg font-bold bg-gradient-to-r from-slate-800 to-primary bg-clip-text text-transparent">
            Common Ground
          </Link>
          <span className="text-slate-300">|</span>
          <Link href="/forum" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">
            Forum
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {profile && (
            <>
              <span className="text-sm text-slate-600">{profile.display_name}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                profile.role === 'npo' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {profile.role === 'npo' ? 'NPO' : 'Researcher'}
              </span>
            </>
          )}
          <Link
            href="/dashboard"
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Dashboard
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
