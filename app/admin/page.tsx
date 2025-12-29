'use client';

import { useEffect, useState } from 'react';

interface PasteInfo {
  key: string;
  id: string;
  content: string;
  createdAt: number;
  viewCount: number;
  maxViews?: number;
  expiresIn?: string;
}

export default function AdminPage() {
  const [pastes, setPastes] = useState<PasteInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secret, setSecret] = useState(''); // Store the password here
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchPastes = async () => {
    if (!secret) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Send the secret in the URL
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
      // Send the secret in the DELETE request too
      const response = await fetch(`/api/admin/pastes/${id}?secret=${secret}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete paste');
      
      // Refresh the list
      fetchPastes();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // Trigger fetch when user hits "Enter" or clicks Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPastes();
  };

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4 text-white">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🛡️ Secure Admin Panel</h1>

        {/* Login Section */}
        {!isAuthenticated && (
          <div className="bg-white/10 p-8 rounded-xl max-w-md mx-auto text-center">
            <p className="mb-4 text-gray-300">Enter Admin Secret to View Database</p>
            <form onSubmit={handleLogin} className="flex gap-2">
              <input 
                type="password" 
                placeholder="Admin Secret..."
                className="flex-1 bg-black/30 border border-white/20 rounded-lg px-4 py-2"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
              />
              <button type="submit" className="bg-blue-600 px-6 py-2 rounded-lg font-bold">
                Access
              </button>
            </form>
            {error && <p className="text-red-400 mt-4">{error}</p>}
          </div>
        )}

        {/* Dashboard Section (Only shows after login) */}
        {isAuthenticated && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <p>Total Pastes: {pastes.length}</p>
              <button onClick={fetchPastes} className="bg-green-600 px-4 py-2 rounded-lg">Refresh</button>
            </div>

            <div className="grid gap-4">
              {pastes.map((paste) => (
                <div key={paste.key} className="bg-white/5 p-4 rounded-xl border border-white/10 flex justify-between items-start">
                  <div className="overflow-hidden">
                    <div className="flex gap-3 mb-2">
                      <span className="font-mono text-blue-400">{paste.id}</span>
                      <span className="text-gray-400 text-sm">Views: {paste.viewCount}</span>
                      {paste.expiresIn && <span className="text-purple-400 text-sm">Expires: {paste.expiresIn}</span>}
                    </div>
                    <pre className="text-xs text-gray-300 bg-black/30 p-2 rounded truncate max-w-2xl">
                      {paste.content}
                    </pre>
                  </div>
                  <button 
                    onClick={() => deletePaste(paste.id)}
                    className="bg-red-500/20 hover:bg-red-500 text-red-200 px-3 py-1 rounded text-sm border border-red-500/50"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
            
            {pastes.length === 0 && !loading && (
              <p className="text-center text-gray-500 mt-10">Database is empty</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}