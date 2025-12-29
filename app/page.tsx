'use client';

import { useState } from 'react';

export default function Home() {
  const [content, setContent] = useState('');
  const [ttl, setTtl] = useState('');
  const [maxViews, setMaxViews] = useState('');
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setLink('');

    try {
      const res = await fetch('/api/pastes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          ttl_seconds: ttl ? parseInt(ttl) : undefined,
          max_views: maxViews ? parseInt(maxViews) : undefined,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setLink(data.url);
      } else {
        setError(data.error || 'Failed to create paste');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-2xl backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
          PasteKaro
        </h1>
        <p className="text-gray-400 mb-8">Share text securely with auto-expiry and view limits.</p>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Paste Content</label>
            <textarea
              className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[200px] placeholder-gray-500"
              placeholder="Type or paste your content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Self-destruct Timer (Seconds)</label>
              <input
                type="number"
                placeholder="e.g. 60 (Optional)"
                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={ttl}
                onChange={(e) => setTtl(e.target.value)}
                min="1"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">View Limit</label>
              <input
                type="number"
                placeholder="e.g. 5 (Optional)"
                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={maxViews}
                onChange={(e) => setMaxViews(e.target.value)}
                min="1"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : ' Paste 🚀'}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-center">
            {error}
          </div>
        )}

        {link && (
          <div className="mt-8 p-6 bg-green-500/10 border border-green-500/30 rounded-xl text-center animate-fade-in">
            <p className="text-green-300 mb-2 font-medium">✨ Paste Created Successfully!</p>
            <div className="flex items-center justify-center gap-2 bg-black/30 p-3 rounded-lg border border-white/10">
              <a href={link} target="_blank" className="text-blue-400 hover:underline break-all">
                {link}
              </a>
              <button 
                onClick={() => navigator.clipboard.writeText(link)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Copy Link"
              >
                📋
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}