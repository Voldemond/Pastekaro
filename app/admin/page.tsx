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
  sizeKB: number;
}

type FilterType = 'date' | 'size' | 'name';
type ViewMode = 'all' | 'redis' | 'postgres' | 'users';

export default function AdminPage() {
  const [pastes, setPastes] = useState<PasteInfo[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [secret, setSecret] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [filterBy, setFilterBy] = useState<FilterType>('date');

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

      // Also fetch users
      const usersResponse = await fetch(`/api/admin/users?secret=${secret}`);
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users || []);
      }

      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.message);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const deletePaste = async (id: string, source: string) => {
    if (!confirm('Delete this paste?')) return;

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

  // Filter and sort
  const getFilteredPastes = () => {
    let filtered = pastes;

    // Filter by view mode
    if (viewMode === 'redis') {
      filtered = filtered.filter(p => p.source === 'redis');
    } else if (viewMode === 'postgres') {
      filtered = filtered.filter(p => p.source === 'postgres');
    }

    // Filter by search
    filtered = filtered.filter(paste =>
      paste.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paste.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paste.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paste.userName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort by filter
    if (filterBy === 'size') {
      filtered.sort((a, b) => b.sizeKB - a.sizeKB);
    } else if (filterBy === 'name') {
      filtered.sort((a, b) => (a.title || a.id).localeCompare(b.title || b.id));
    } else {
      filtered.sort((a, b) => b.createdAt - a.createdAt);
    }

    return filtered;
  };

  const filteredPastes = getFilteredPastes();
  const redisPastes = pastes.filter(p => p.source === 'redis');
  const postgresPastes = pastes.filter(p => p.source === 'postgres');

  // Calculate storage stats
  const redisUsedKB = redisPastes.reduce((sum, p) => sum + p.sizeKB, 0);
  const postgresUsedKB = postgresPastes.reduce((sum, p) => sum + p.sizeKB, 0);
  const redisLimitKB = 256 * 1024; // 256MB free tier (Upstash)
  const postgresLimitKB = 500 * 1024; // 500MB free tier (Neon)
  const redisPercentage = (redisUsedKB / redisLimitKB) * 100;
  const postgresPercentage = (postgresUsedKB / postgresLimitKB) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Admin Panel
              </h1>
              <p className="text-xs text-gray-400 mt-1">Database Management</p>
            </div>
            {isAuthenticated && (
              <a href="/" className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-white text-sm transition-colors">
                Home
              </a>
            )}
          </div>

          {/* Login */}
          {!isAuthenticated && (
            <form onSubmit={handleLogin} className="flex gap-2 max-w-md">
              <input
                type="password"
                placeholder="Secret..."
                className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 rounded font-medium text-white text-sm"
              >
                Access
              </button>
              {error && <p className="text-red-400 text-xs">{error}</p>}
            </form>
          )}

          {/* Dashboard */}
          {isAuthenticated && (
            <>
              {loading && (
                <div className="text-center py-8 text-gray-400">Loading...</div>
              )}

              {!loading && (
                <>
                  {/* Storage Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white/5 border border-blue-500/30 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-blue-300 font-medium">Redis</span>
                        <span className="text-xs text-gray-400">{redisPastes.length} pastes</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-white">{(redisUsedKB / 1024).toFixed(2)} MB</span>
                        <span className="text-xs text-gray-500">/ 256 MB</span>
                      </div>
                      <div className="mt-2 h-1.5 bg-black/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                          style={{ width: `${Math.min(redisPercentage, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{redisPercentage.toFixed(1)}% used</p>
                    </div>

                    <div className="bg-white/5 border border-purple-500/30 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-purple-300 font-medium">Postgres</span>
                        <span className="text-xs text-gray-400">{postgresPastes.length} pastes</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-white">{(postgresUsedKB / 1024).toFixed(2)} MB</span>
                        <span className="text-xs text-gray-500">/ 500 MB</span>
                      </div>
                      <div className="mt-2 h-1.5 bg-black/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                          style={{ width: `${Math.min(postgresPercentage, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{postgresPercentage.toFixed(1)}% used</p>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setViewMode('all')}
                      className={`px-3 py-1 rounded text-sm transition-colors ${viewMode === 'all'
                          ? 'bg-white/20 text-white'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                    >
                      All ({pastes.length})
                    </button>
                    <button
                      onClick={() => setViewMode('redis')}
                      className={`px-3 py-1 rounded text-sm transition-colors ${viewMode === 'redis'
                          ? 'bg-blue-500/30 text-blue-200 border border-blue-500/50'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                    >
                      Redis ({redisPastes.length})
                    </button>
                    <button
                      onClick={() => setViewMode('postgres')}
                      className={`px-3 py-1 rounded text-sm transition-colors ${viewMode === 'postgres'
                          ? 'bg-purple-500/30 text-purple-200 border border-purple-500/50'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                    >
                      Postgres ({postgresPastes.length})
                    </button>
                    <button
                      onClick={() => setViewMode('users')}
                      className={`px-3 py-1 rounded text-sm transition-colors ${viewMode === 'users'
                          ? 'bg-green-500/30 text-green-200 border border-green-500/50'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                    >
                      Users ({users.length})
                    </button>
                  </div>

                  {/* Search & Filter - Hide for Users tab */}
                  {viewMode !== 'users' && (
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        placeholder="🔍 Search..."
                        className="flex-1 bg-white/10 border border-white/20 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <select
                        value={filterBy}
                        onChange={(e) => setFilterBy(e.target.value as FilterType)}
                        className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="date">Latest</option>
                        <option value="size">Size</option>
                        <option value="name">Name</option>
                      </select>
                      <button
                        onClick={fetchPastes}
                        className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-200 rounded text-sm transition-colors"
                      >
                        🔄
                      </button>
                    </div>
                  )}

                  {/* Pastes List */}
                  {viewMode !== 'users' && (
                    <>
                      {filteredPastes.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 text-sm">
                          {searchQuery ? 'No results' : 'No pastes'}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {filteredPastes.map((paste) => (
                            <PasteCard key={paste.key} paste={paste} onDelete={deletePaste} />
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* Users List */}
                  {viewMode === 'users' && (
                    <div className="space-y-2">
                      {users.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 text-sm">
                          No users registered
                        </div>
                      ) : (
                        <>
                          {users.map((user) => (
                            <div
                              key={user.id}
                              className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-all"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-white font-medium">{user.name}</span>
                                    <span className="text-xs text-gray-500 font-mono">{user.id.substring(0, 8)}</span>
                                  </div>
                                  <div className="text-sm text-gray-400">{user.email}</div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    Joined: {new Date(user.created_at).toLocaleDateString()}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm text-gray-400">
                                    {postgresPastes.filter(p => p.userName === user.name).length} pastes
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
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
      bg-white/5 border rounded-lg p-3 transition-all hover:bg-white/10 group
      ${paste.isExpired ? 'border-red-500/30' : 'border-white/10'}
    `}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`px-2 py-0.5 bg-${sourceColor}-500/20 border border-${sourceColor}-500/50 text-${sourceColor}-300 text-[10px] font-bold rounded uppercase`}>
              {paste.source}
            </span>
            <span className="text-white text-sm font-mono font-medium">{paste.id}</span>
            {paste.title && (
              <span className="text-gray-300 text-sm">"{paste.title}"</span>
            )}
            {paste.userName && (
              <span className="text-gray-500 text-xs">@{paste.userName}</span>
            )}
            {paste.isExpired && (
              <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/50 text-red-300 text-[10px] rounded">
                {paste.expiredReason}
              </span>
            )}
          </div>

          {/* Content Preview */}
          <div className="bg-black/30 rounded p-2 mb-2">
            <pre className="text-gray-300 text-[11px] font-mono whitespace-pre-wrap break-words line-clamp-2">
              {paste.content.substring(0, 150)}
              {paste.content.length > 150 && '...'}
            </pre>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-3 text-[11px] text-gray-500">
            <span className="font-bold text-yellow-400">{paste.sizeKB.toFixed(1)} KB</span>
            <span>👁 {paste.viewCount}{paste.maxViews && `/${paste.maxViews}`}</span>
            {paste.expiresIn && <span>⏰ {paste.expiresIn}</span>}
            <span>{new Date(paste.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!paste.isExpired && (
            <a
              href={`/p/${paste.id}`}
              target="_blank"
              className="px-2 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded text-[11px] transition-colors"
            >
              View
            </a>
          )}
          <button
            onClick={() => onDelete(paste.id, paste.source)}
            className="px-2 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded text-[11px] transition-colors"
          >
            Del
          </button>
        </div>
      </div>
    </div>
  );
}