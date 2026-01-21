'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Welcome back, {session.user?.name}!
              </h1>
              <p className="text-gray-400 mt-1">Manage your pastes and packages</p>
            </div>
            <div className="flex gap-2">
              <Link 
                href="/"
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
              >
                Home
              </Link>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-200 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-1">Total Pastes</div>
            <div className="text-3xl font-bold text-white">0</div>
          </div>
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-1">Packages</div>
            <div className="text-3xl font-bold text-white">0</div>
          </div>
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6">
            <div className="text-gray-400 text-sm mb-1">Total Views</div>
            <div className="text-3xl font-bold text-white">0</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">🚀</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Your Dashboard is Ready!
          </h2>
          <p className="text-gray-400 mb-6">
            Start creating pastes to see them here
          </p>
          <Link 
            href="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl text-white font-medium transition-all"
          >
            Create Your First Paste
          </Link>
        </div>

        {/* Coming Soon */}
        <div className="mt-6 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-3">🔜 Coming Soon</h3>
          <ul className="space-y-2 text-gray-300">
            <li>• View and manage all your pastes</li>
            <li>• Create and organize packages</li>
            <li>• Search and filter your content</li>
            <li>• Edit and update pastes</li>
            <li>• Analytics and insights</li>
          </ul>
        </div>
      </div>
    </div>
  );
}