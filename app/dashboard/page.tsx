'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface UserPaste {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  viewCount: number;
  maxViews: number | null;
  ttlSeconds: number | null;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pastes, setPastes] = useState<UserPaste[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      fetchPastes();
    }
  }, [status, router]);

  const fetchPastes = async () => {
    try {
      const res = await fetch('/api/pastes/my');
      if (res.ok) {
        const data = await res.json();
        setPastes(data.pastes || []);
      }
    } catch (error) {
      console.error('Error fetching pastes:', error);
    } finally {
      setLoading(false);
    }
  };

  const deletePaste = async (id: string) => {
    if (!confirm('Delete this paste?')) return;

    try {
      const res = await fetch(`/api/pastes/my/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchPastes();
      }
    } catch (error) {
      console.error('Error deleting paste');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!session) return null;

  // Filter pastes
  const filteredPastes = pastes.filter(paste =>
    paste.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paste.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paste.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Minimal Header */}
        <div className="flex items-center justify-between mb-6 text-white">
          <div>
            <h1 className="text-2xl font-bold">{session.user?.name}'s Pastes</h1>
            <p className="text-sm text-gray-400 mt-1">{pastes.length} total</p>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded text-sm transition-colors">
              Home
            </Link>
            <button
              onClick={() => signOut()}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded text-sm text-gray-400 hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="🔍 Search pastes..."
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Pastes List - Minimal */}
        {filteredPastes.length === 0 && searchQuery && (
          <div className="text-center py-12 text-gray-400">
            No pastes match "{searchQuery}"
          </div>
        )}

        {filteredPastes.length === 0 && !searchQuery && (
          <div className="text-center py-16 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl">
            <p className="text-gray-400 mb-4">No pastes yet</p>
            <Link
              href="/"
              className="inline-block px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg text-white text-sm transition-all"
            >
              Create your first paste
            </Link>
          </div>
        )}

        {filteredPastes.length > 0 && (
          <div className="space-y-2">
            {filteredPastes.map((paste) => (
              <div
                key={paste.id}
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-medium truncate">
                        {paste.title}
                      </h3>
                      <span className="text-xs text-gray-500 font-mono">
                        {paste.id.substring(0, 6)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-400 truncate mb-2">
                      {paste.content.substring(0, 80)}
                      {paste.content.length > 80 && '...'}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>👁 {paste.viewCount}</span>
                      {paste.maxViews && <span>Max: {paste.maxViews}</span>}
                      <span>{new Date(paste.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      href={`/p/${paste.id}`}
                      target="_blank"
                      className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded text-xs transition-colors"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => deletePaste(paste.id)}
                      className="px-3 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded text-xs transition-colors"
                    >
                      Del
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}