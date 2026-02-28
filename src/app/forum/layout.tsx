'use client';

import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';

export default function ForumLayout({ children }: { children: React.ReactNode }) {
  const { profile } = useUser();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="bg-white border-b border-border px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <a
            href="/dashboard"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = '/dashboard';
            }}
            className="flex items-center gap-2 cursor-pointer hover:opacity-90"
          >
            <Image src="/logo.png" alt="Common Ground" width={28} height={28} className="rounded" />
            <span className="text-lg font-bold bg-gradient-to-r from-slate-800 to-primary bg-clip-text text-transparent">
              Common Ground
            </span>
          </a>
          <span className="text-slate-300">|</span>
          <a
            href="/forum"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = '/forum';
            }}
            className="text-sm font-medium text-slate-600 hover:text-primary transition-colors cursor-pointer"
          >
            Forum
          </a>
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
          <a
            href="/dashboard"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = '/dashboard';
            }}
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
          >
            Dashboard
          </a>
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
