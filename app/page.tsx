'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

interface Collection {
  id: string;
  name: string;
  pasteCount: number;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [ttl, setTtl] = useState('');
  const [maxViews, setMaxViews] = useState('');
  const [saveToAccount, setSaveToAccount] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch collections when saveToAccount is checked
  useEffect(() => {
    if (session && saveToAccount && collections.length === 0) {
      fetchCollections();
    }
  }, [session, saveToAccount]);

  const fetchCollections = async () => {
    setCollectionsLoading(true);
    try {
      const res = await fetch('/api/collections');
      if (res.ok) {
        const data = await res.json();
        setCollections(data.collections || []);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setCollectionsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setLink('');

    try {
      const payload: any = {
        content,
        ttl_seconds: ttl ? parseInt(ttl) : undefined,
        max_views: maxViews ? parseInt(maxViews) : undefined,
      };

      // Add title, saveToAccount, and collectionId if user is logged in
      if (session && saveToAccount) {
        payload.title = title || 'Untitled Paste';
        payload.saveToAccount = true;
        if (selectedCollection) {
          payload.collectionId = selectedCollection;
        }
      }

      const res = await fetch('/api/pastes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setLink(data.url);
        setContent('');
        setTitle('');
        setTtl('');
        setMaxViews('');
        setSaveToAccount(false);
        setSelectedCollection('');
      } else {
        setError(data.error || 'Failed to create paste');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCollectionName = collections.find(c => c.id === selectedCollection)?.name;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-2xl backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8">
        {/* Auth buttons */}
        {!session && (
          <div className="absolute top-6 right-6">
            <Link
              href="/auth/login"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors border border-white/20 text-white"
            >
              Login
            </Link>
          </div>
        )}

        {session && (
          <div className="absolute top-6 right-6 flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              {session.user?.name}
            </Link>
            <button
              onClick={() => signOut()}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Logout
            </button>
          </div>
        )}

        {/* Hidden admin link */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <a
            href="/admin"
            className="text-[6px] text-gray-900 hover:text-gray-700 opacity-5 hover:opacity-20 transition-opacity select-none"
            title=""
          >
            •
          </a>
        </div>

        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
          PasteKaro
        </h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Title field - only show if saving to account */}
          {session && saveToAccount && (
            <div>
              <input
                type="text"
                className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500 text-sm"
                placeholder="Title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          )}

          <div>
            <textarea
              className="w-full bg-black/30 border border-white/10 rounded-lg p-4 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[180px] placeholder-gray-500"
              placeholder="Paste your content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="TTL (seconds)"
              className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500 text-sm"
              value={ttl}
              onChange={(e) => setTtl(e.target.value)}
              min="1"
            />
            <input
              type="number"
              placeholder="Max views"
              className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500 text-sm"
              value={maxViews}
              onChange={(e) => setMaxViews(e.target.value)}
              min="1"
            />
          </div>

          {/* Save to account section */}
          {session && (
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300 hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={saveToAccount}
                  onChange={(e) => setSaveToAccount(e.target.checked)}
                  className="w-4 h-4 rounded bg-black/30 border-white/20 text-purple-600 focus:ring-2 focus:ring-purple-500"
                />
                Save to my account
              </label>

              {/* Collection selector - only show when saving to account */}
              {saveToAccount && (
                <div className="pl-6">
                  <label className="block text-xs text-gray-400 mb-1.5">
                    Add to collection (optional)
                  </label>
                  {collectionsLoading ? (
                    <div className="text-xs text-gray-500">Loading collections...</div>
                  ) : collections.length === 0 ? (
                    <div className="text-xs text-gray-500">
                      No collections yet.{' '}
                      <Link href="/dashboard" className="text-purple-400 hover:underline">
                        Create one
                      </Link>
                    </div>
                  ) : (
                    <select
                      value={selectedCollection}
                      onChange={(e) => setSelectedCollection(e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    >
                      <option value="">Don't add to collection</option>
                      {collections.map((collection) => (
                        <option key={collection.id} value={collection.id}>
                          {collection.name} ({collection.pasteCount} items)
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : '🚀 Create'}
          </button>
        </form>

        {link && (
          <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-green-300 text-sm mb-2">
              ✓ Created
              {selectedCollectionName && (
                <span className="text-green-400"> and added to "{selectedCollectionName}"</span>
              )}
            </p>
            <div className="flex items-center gap-2 bg-black/20 p-2 rounded">
              <a href={link} target="_blank" className="text-blue-400 hover:underline break-all text-sm flex-1">
                {link}
              </a>
              <button
                onClick={() => navigator.clipboard.writeText(link)}
                className="p-2 hover:bg-white/10 rounded transition-colors text-xs"
                title="Copy"
              >
                📋
              </button>
            </div>
            {session && saveToAccount && (
              <a
                href="/dashboard"
                className="text-purple-300 hover:text-purple-200 text-xs underline mt-2 inline-block"
              >
                View in dashboard →
              </a>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}