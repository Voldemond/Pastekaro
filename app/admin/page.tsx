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
}

export default function AdminPage() {
  const [pastes, setPastes] = useState<PasteInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [secret, setSecret] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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

  const deletePaste = async (id: string) => {
    if (!confirm('Are you sure you want to delete this paste?')) return;
    
    try {
      const response = await fetch(`/api/admin/pastes/${id}?secret=${secret}`, {
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

  const activePastes = pastes.filter(p => !p.isExpired);
  const expiredPastes = pastes.filter(p => p.isExpired);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-8">
            🗄️ Database Admin Panel
          </h1>

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
                  {/* Stats Bar */}
                  <div className="flex flex-wrap gap-4 items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="flex gap-6">
                      <div>
                        <span className="text-gray-400 text-sm">Total: </span>
                        <span className="text-white font-bold">{pastes.length}</span>
                      </div>
                      <div>
                        <span className="text-green-400 text-sm">✓ Active: </span>
                        <span className="text-white font-bold">{activePastes.length}</span>
                      </div>
                      <div>
                        <span className="text-red-400 text-sm">✗ Expired: </span>
                        <span className="text-white font-bold">{expiredPastes.length}</span>
                      </div>
                    </div>
                    <button 
                      onClick={fetchPastes} 
                      className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg text-white font-medium transition-colors"
                    >
                      🔄 Refresh
                    </button>
                  </div>

                  {/* Active Pastes */}
                  {activePastes.length > 0 && (
                    <div>
                      <h2 className="text-xl font-bold text-green-400 mb-3">✓ Active Pastes</h2>
                      <div className="space-y-3">
                        {activePastes.map((paste) => (
                          <PasteCard key={paste.key} paste={paste} onDelete={deletePaste} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expired Pastes */}
                  {expiredPastes.length > 0 && (
                    <div>
                      <h2 className="text-xl font-bold text-red-400 mb-3">✗ Expired Pastes</h2>
                      <div className="space-y-3">
                        {expiredPastes.map((paste) => (
                          <PasteCard key={paste.key} paste={paste} onDelete={deletePaste} />
                        ))}
                      </div>
                    </div>
                  )}

                  {pastes.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <div className="text-6xl mb-4">📭</div>
                      <p>No pastes in database</p>
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

function PasteCard({ paste, onDelete }: { paste: PasteInfo; onDelete: (id: string) => void }) {
  return (
    <div className={`
      bg-white/5 backdrop-blur-sm border rounded-xl p-4 transition-all
      ${paste.isExpired ? 'border-red-500/30 bg-red-500/5' : 'border-white/10 hover:bg-white/10'}
    `}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-blue-400 font-mono text-sm font-bold">
              {paste.id}
            </span>
            
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
              {paste.content.substring(0, 200)}
              {paste.content.length > 200 && '...'}
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
              className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-medium transition-colors text-center"
            >
              View
            </a>
          )}
          <button
            onClick={() => onDelete(paste.id)}
            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}