'use client';

import { useEffect, useState } from 'react';

interface PasteInfo {
  key: string;
  id: string;
  content: string;
  createdAt: number;
  ttlSeconds?: number;
  maxViews?: number;
  viewCount: number;
  expiresIn?: string;
  isExpired: boolean;
  expiredReason?: string;
  source: 'redis' | 'postgres';
  title?: string;
  userName?: string;
}

export default function AdminPage() {
  const [pastes, setPastes] = useState<PasteInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [secret, setSecret] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPastes = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/pastes?secret=${secret}`);

      if (response.status === 401) {
        throw new Error('Invalid Secret Key');
      }
      if (!response.ok) throw new Error('Failed to fetch pastes');

      const data = await response.json();
      setPastes(data.pastes || []);
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.message);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const deletePaste = async (id: string, source: string) => {
    if (!confirm('Are you sure you want to delete this paste?')) return;

    try {
      const response = await fetch(`/api/admin/pastes/${id}?secret=${secret}&source=${source}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete paste');

      fetchPastes();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPastes();
  };

  // Filter pastes based on search
  const filteredPastes = pastes.filter(paste =>
    paste.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paste.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paste.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paste.userName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const redisPastes = filteredPastes.filter(p => p.source === 'redis');
  const postgresPastes = filteredPastes.filter(p => p.source === 'postgres');
  const activePastes = filteredPastes.filter(p => !p.isExpired);
  const expiredPastes = filteredPastes.filter(p => p.isExpired);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                🗄️ Database Admin Panel
              </h1>
              <p className="text-gray-300 text-sm">Manage Redis & PostgreSQL databases</p>
            </div>
            {isAuthenticated && (
              <a
                href="/"
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors text-sm"
              >
                ← Back to Home
              </a>
            )}
          </div>

          {/* Login Section */}
          {!isAuthenticated && (
            <div className="max-w-md mx-auto">
              <p className="mb-4 text-gray-300 text-center">Enter Admin Secret to Access Database</p>
              <form onSubmit={handleLogin} className="flex gap-2">
                <input
                  type="password"
                  placeholder="Admin Secret..."
                  className="flex-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-6 py-3 rounded-xl font-bold text-white transition-all"
                >
                  Access
                </button>
              </form>
              {error && <p className="text-red-400 mt-4 text-center text-sm">{error}</p>}
            </div>
          )}

          {/* Dashboard Section */}
          {isAuthenticated && (
            <div className="space-y-6">
              {loading && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-purple-500 border-t-transparent"></div>
                  <p className="text-gray-300 mt-4">Loading...</p>
                </div>
              )}

              {!loading && (
                <>
                  {/* Search Bar */}
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <input
                      type="text"
                      placeholder="🔍 Search by ID, content, title, or user..."
                      className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Stats Bar */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                      <div className="text-gray-400 text-xs mb-1">Total</div>
                      <div className="text-white font-bold text-2xl">{pastes.length}</div>
                    </div>
                    <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/30 text-center">
                      <div className="text-blue-300 text-xs mb-1">Redis (Anon)</div>
                      <div className="text-white font-bold text-2xl">{redisPastes.length}</div>
                    </div>
                    <div className="bg-purple-500/10 p-4 rounded-xl border border-purple-500/30 text-center">
                      <div className="text-purple-300 text-xs mb-1">Postgres (User)</div>
                      <div className="text-white font-bold text-2xl">{postgresPastes.length}</div>
                    </div>
                    <div className="bg-green-500/10 p-4 rounded-xl border border-green-500/30 text-center">
                      <div className="text-green-300 text-xs mb-1">Active</div>
                      <div className="text-white font-bold text-2xl">{activePastes.length}</div>
                    </div>
                    <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/30 text-center">
                      <div className="text-red-300 text-xs mb-1">Expired</div>
                      <div className="text-white font-bold text-2xl">{expiredPastes.length}</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={fetchPastes}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white font-medium transition-colors"
                    >
                      🔄 Refresh
                    </button>
                  </div>

                  {/* Database Sections */}
                  {redisPastes.length > 0 && (
                    <div>
                      <h2 className="text-xl font-bold text-blue-400 mb-3 flex items-center gap-2">
                        <span>📦 Redis Database</span>
                        <span className="text-sm text-gray-400">({redisPastes.length} anonymous pastes)</span>
                      </h2>
                      <div className="space-y-3">
                        {redisPastes.map((paste) => (
                          <PasteCard key={paste.key} paste={paste} onDelete={deletePaste} />
                        ))}
                      </div>
                    </div>
                  )}

                  {postgresPastes.length > 0 && (
                    <div>
                      <h2 className="text-xl font-bold text-purple-400 mb-3 flex items-center gap-2">
                        <span>🗃️ PostgreSQL Database</span>
                        <span className="text-sm text-gray-400">({postgresPastes.length} user pastes)</span>
                      </h2>
                      <div className="space-y-3">
                        {postgresPastes.map((paste) => (
                          <PasteCard key={paste.key} paste={paste} onDelete={deletePaste} />
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredPastes.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <div className="text-6xl mb-4">📭</div>
                      <p>{searchQuery ? 'No pastes match your search' : 'No pastes in database'}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PasteCard({ paste, onDelete }: { paste: PasteInfo; onDelete: (id: string, source: string) => void }) {
  const sourceColor = paste.source === 'redis' ? 'blue' : 'purple';

  return (
    <div className={`
      bg-white/5 backdrop-blur-sm border rounded-xl p-4 transition-all
      ${paste.isExpired ? 'border-red-500/30 bg-red-500/5' : 'border-white/10 hover:bg-white/10'}
    `}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`px-2 py-1 bg-${sourceColor}-500/20 border border-${sourceColor}-500/50 text-${sourceColor}-300 text-xs font-bold rounded`}>
              {paste.source.toUpperCase()}
            </span>

            <span className="text-blue-400 font-mono text-sm font-bold">
              {paste.id}
            </span>

            {paste.title && (
              <span className="text-purple-300 text-sm font-medium">
                "{paste.title}"
              </span>
            )}

            {paste.userName && (
              <span className="text-gray-400 text-xs">
                by {paste.userName}
              </span>
            )}

            {paste.isExpired && (
              <span className="px-2 py-1 bg-red-500/20 border border-red-500/50 text-red-300 text-xs font-bold rounded">
                ❌ {paste.expiredReason}
              </span>
            )}

            <span className="text-gray-400 text-xs">
              Views: {paste.viewCount}
              {paste.maxViews && ` / ${paste.maxViews}`}
            </span>

            {paste.expiresIn && !paste.isExpired && (
              <span className="text-purple-400 text-xs">
                ⏰ {paste.expiresIn}
              </span>
            )}
          </div>

          <div className="bg-black/30 rounded-lg p-3 mb-2">
            <pre className="text-gray-200 text-xs font-mono whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
              {paste.content.substring(0, 300)}
              {paste.content.length > 300 && '...'}
            </pre>
          </div>

          <div className="text-xs text-gray-400">
            Created: {new Date(paste.createdAt).toLocaleString()}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {!paste.isExpired && (
            <a
              href={`/p/${paste.id}`}
              target="_blank"
              className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-medium transition-colors text-center whitespace-nowrap"
            >
              View
            </a>
          )}
          <button
            onClick={() => onDelete(paste.id, paste.source)}
            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}