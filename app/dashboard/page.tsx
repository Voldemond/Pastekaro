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

interface Collection {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  createdAt: string;
  pasteCount: number;
}

interface CollectionPaste {
  id: string;
  title: string;
  content: string;
  order: number;
  maxViews?: number | null;
  ttlSeconds?: number | null;
  viewCount?: number;
}

type TabType = 'pastes' | 'collections';
type ModalType = 'none' | 'create-collection' | 'edit-collection' | 'edit-paste' | 'create-paste';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Main state
  const [activeTab, setActiveTab] = useState<TabType>('pastes');
  const [pastes, setPastes] = useState<UserPaste[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [modal, setModal] = useState<ModalType>('none');
  const [editingCollection, setEditingCollection] = useState<string | null>(null);

  // Form state for create/edit collection
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIsPublic, setFormIsPublic] = useState(true);
  const [selectedPastes, setSelectedPastes] = useState<Set<string>>(new Set());
  const [collectionPastes, setCollectionPastes] = useState<CollectionPaste[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Paste editing/creating state
  const [editingPaste, setEditingPaste] = useState<CollectionPaste | null>(null);
  const [pasteEditTitle, setPasteEditTitle] = useState('');
  const [pasteEditContent, setPasteEditContent] = useState('');
  const [pasteEditMaxViews, setPasteEditMaxViews] = useState('');
  const [pasteEditTtl, setPasteEditTtl] = useState('');
  const [pasteEditLoading, setPasteEditLoading] = useState(false);
  const [pasteEditSaved, setPasteEditSaved] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pastesRes, collectionsRes] = await Promise.all([
        fetch('/api/pastes/my'),
        fetch('/api/collections')
      ]);

      if (pastesRes.ok) {
        const pastesData = await pastesRes.json();
        setPastes(pastesData.pastes || []);
      }

      if (collectionsRes.ok) {
        const collectionsData = await collectionsRes.json();
        setCollections(collectionsData.collections || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormIsPublic(true);
    setSelectedPastes(new Set());
    setCollectionPastes([]);
    setFormError('');
    setEditingPaste(null);
    resetPasteForm();
  };

  const resetPasteForm = () => {
    setPasteEditTitle('');
    setPasteEditContent('');
    setPasteEditMaxViews('');
    setPasteEditTtl('');
    setPasteEditSaved(false);
  };

  // Open create collection modal
  const openCreateModal = () => {
    resetForm();
    setEditingCollection(null);
    setModal('create-collection');
  };

  // Open edit collection modal
  const openEditModal = async (collectionId: string) => {
    resetForm();
    setEditingCollection(collectionId);
    setFormLoading(true);
    setModal('edit-collection');

    try {
      const res = await fetch(`/api/collections/${collectionId}`);
      if (res.ok) {
        const data = await res.json();
        setFormName(data.name);
        setFormDescription(data.description || '');
        setFormIsPublic(data.isPublic);
        setCollectionPastes(data.pastes || []);
      } else {
        setFormError('Failed to load collection');
      }
    } catch (error) {
      setFormError('Failed to load collection');
    } finally {
      setFormLoading(false);
    }
  };

  // Open paste edit view
  const openPasteEditor = async (paste: CollectionPaste) => {
    setEditingPaste(paste);
    setPasteEditTitle(paste.title);
    setPasteEditContent(paste.content);
    setPasteEditMaxViews(paste.maxViews?.toString() || '');
    setPasteEditTtl(paste.ttlSeconds?.toString() || '');
    setPasteEditSaved(false);
    setModal('edit-paste');
  };

  // Open create paste view (from collection)
  const openCreatePaste = () => {
    resetPasteForm();
    setEditingPaste(null);
    setModal('create-paste');
  };

  // Close modal
  const closeModal = () => {
    setModal('none');
    resetForm();
    setEditingCollection(null);
  };

  // Back to collection edit from paste edit/create
  const backToCollection = () => {
    setEditingPaste(null);
    setModal('edit-collection');
    // Refresh collection data
    if (editingCollection) {
      openEditModal(editingCollection);
    }
  };

  // Toggle paste selection (for create collection)
  const togglePaste = (pasteId: string) => {
    const newSelected = new Set(selectedPastes);
    if (newSelected.has(pasteId)) {
      newSelected.delete(pasteId);
    } else {
      newSelected.add(pasteId);
    }
    setSelectedPastes(newSelected);
  };

  // Move paste up/down
  const moveUp = (index: number) => {
    if (index === 0) return;
    const newPastes = [...collectionPastes];
    [newPastes[index], newPastes[index - 1]] = [newPastes[index - 1], newPastes[index]];
    newPastes.forEach((p, i) => p.order = i);
    setCollectionPastes(newPastes);
  };

  const moveDown = (index: number) => {
    if (index === collectionPastes.length - 1) return;
    const newPastes = [...collectionPastes];
    [newPastes[index], newPastes[index + 1]] = [newPastes[index + 1], newPastes[index]];
    newPastes.forEach((p, i) => p.order = i);
    setCollectionPastes(newPastes);
  };

  const removePaste = (pasteId: string) => {
    setCollectionPastes(prev => prev.filter(p => p.id !== pasteId).map((p, i) => ({ ...p, order: i })));
  };

  // Create collection
  const handleCreate = async () => {
    if (!formName.trim()) {
      setFormError('Collection name is required');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          isPublic: formIsPublic,
          pasteIds: Array.from(selectedPastes),
        }),
      });

      if (res.ok) {
        closeModal();
        fetchData();
      } else {
        const data = await res.json();
        setFormError(data.error || 'Failed to create collection');
      }
    } catch (err) {
      setFormError('Something went wrong');
    } finally {
      setFormLoading(false);
    }
  };

  // Save collection edits
  const handleSave = async () => {
    if (!editingCollection) return;

    setFormLoading(true);
    setFormError('');

    try {
      const res = await fetch(`/api/collections/${editingCollection}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          isPublic: formIsPublic,
          pastes: collectionPastes.map(p => ({ pasteId: p.id, order: p.order })),
        }),
      });

      if (res.ok) {
        closeModal();
        fetchData();
      } else {
        setFormError('Failed to save changes');
      }
    } catch (err) {
      setFormError('Something went wrong');
    } finally {
      setFormLoading(false);
    }
  };

  // Save paste edits
  const handleSavePaste = async () => {
    if (!editingPaste) return;

    setPasteEditLoading(true);

    try {
      const res = await fetch(`/api/pastes/my/${editingPaste.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: pasteEditTitle,
          content: pasteEditContent,
          maxViews: pasteEditMaxViews ? parseInt(pasteEditMaxViews) : null,
          ttlSeconds: pasteEditTtl ? parseInt(pasteEditTtl) : null,
        }),
      });

      if (res.ok) {
        setPasteEditSaved(true);
        setTimeout(() => setPasteEditSaved(false), 2000);
        // Update local state
        setCollectionPastes(prev => prev.map(p =>
          p.id === editingPaste.id
            ? { ...p, title: pasteEditTitle, content: pasteEditContent }
            : p
        ));
      } else {
        setFormError('Failed to save paste');
      }
    } catch (err) {
      setFormError('Something went wrong');
    } finally {
      setPasteEditLoading(false);
    }
  };

  // Create new paste (and add to collection)
  const handleCreatePaste = async () => {
    if (!pasteEditContent.trim()) {
      setFormError('Content is required');
      return;
    }

    setPasteEditLoading(true);
    setFormError('');

    try {
      const res = await fetch('/api/pastes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: pasteEditContent,
          title: pasteEditTitle || 'Untitled Paste',
          saveToAccount: true,
          collectionId: editingCollection,
          ttl_seconds: pasteEditTtl ? parseInt(pasteEditTtl) : undefined,
          max_views: pasteEditMaxViews ? parseInt(pasteEditMaxViews) : undefined,
        }),
      });

      if (res.ok) {
        setPasteEditSaved(true);
        // Refresh and go back to collection
        setTimeout(() => {
          backToCollection();
          fetchData();
        }, 500);
      } else {
        const data = await res.json();
        setFormError(data.error || 'Failed to create paste');
      }
    } catch (err) {
      setFormError('Something went wrong');
    } finally {
      setPasteEditLoading(false);
    }
  };

  // Delete paste
  const deletePaste = async (id: string) => {
    if (!confirm('Delete this paste?')) return;
    try {
      const res = await fetch(`/api/pastes/my/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (error) {
      console.error('Error deleting paste');
    }
  };

  // Delete collection
  const deleteCollection = async (id: string) => {
    if (!confirm('Delete this collection? Pastes will not be deleted.')) return;
    try {
      const res = await fetch(`/api/collections/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (error) {
      console.error('Error deleting collection');
    }
  };

  // Toggle privacy
  const togglePrivacy = async (id: string, currentState: boolean) => {
    try {
      const res = await fetch(`/api/collections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !currentState }),
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error('Error updating privacy');
    }
  };

  // Copy collection link
  const copyLink = (id: string) => {
    const url = `${window.location.origin}/c/${id}`;
    navigator.clipboard.writeText(url);
    alert('Link copied!');
  };

  // Open paste editor from pastes tab (direct)
  const openPasteEditorDirect = async (paste: UserPaste) => {
    setEditingPaste({
      id: paste.id,
      title: paste.title,
      content: paste.content,
      order: 0,
      maxViews: paste.maxViews,
      ttlSeconds: paste.ttlSeconds,
      viewCount: paste.viewCount,
    });
    setPasteEditTitle(paste.title);
    setPasteEditContent(paste.content);
    setPasteEditMaxViews(paste.maxViews?.toString() || '');
    setPasteEditTtl(paste.ttlSeconds?.toString() || '');
    setPasteEditSaved(false);
    setEditingCollection(null);
    setModal('edit-paste');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-sm">Loading...</div>
      </div>
    );
  }

  if (!session) return null;

  // Check if we're in create or edit mode for paste
  const isCreatingPaste = modal === 'create-paste';
  const isEditingPaste = modal === 'edit-paste';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 text-white">
          <div>
            <h1 className="text-2xl font-bold">{session.user?.name}'s Dashboard</h1>
            <p className="text-sm text-gray-400 mt-1">
              {pastes.length} pastes • {collections.length} collections
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded text-sm transition-colors">
              + New Paste
            </Link>
            <button
              onClick={() => signOut()}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded text-sm text-gray-400 hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('pastes')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'pastes'
              ? 'bg-white/20 text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
          >
            📄 Pastes ({pastes.length})
          </button>
          <button
            onClick={() => setActiveTab('collections')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'collections'
              ? 'bg-white/20 text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
          >
            📦 Collections ({collections.length})
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : (
          <>
            {/* Pastes Tab */}
            {activeTab === 'pastes' && (
              <div className="space-y-2">
                {pastes.length === 0 ? (
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-12 text-center">
                    <div className="text-5xl mb-3">📄</div>
                    <p className="text-gray-400 mb-4">No pastes yet</p>
                    <Link
                      href="/"
                      className="inline-block px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white text-sm"
                    >
                      Create Your First Paste
                    </Link>
                  </div>
                ) : (
                  pastes.map((paste) => (
                    <div
                      key={paste.id}
                      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium mb-1 truncate">{paste.title}</h3>
                          <p className="text-sm text-gray-400 truncate mb-2">
                            {paste.content.substring(0, 80)}...
                          </p>
                          <div className="flex gap-3 text-xs text-gray-500">
                            <span>👁 {paste.viewCount}{paste.maxViews ? `/${paste.maxViews}` : ''}</span>
                            <span>{new Date(paste.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openPasteEditorDirect(paste)}
                            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs transition-colors"
                          >
                            Edit
                          </button>
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
                  ))
                )}
              </div>
            )}

            {/* Collections Tab */}
            {activeTab === 'collections' && (
              <div className="space-y-4">
                <button
                  onClick={openCreateModal}
                  className="w-full backdrop-blur-xl bg-white/5 border border-dashed border-white/20 rounded-xl p-6 text-center hover:bg-white/10 transition-all group"
                >
                  <div className="text-3xl mb-2 opacity-50 group-hover:opacity-100 transition-opacity">➕</div>
                  <div className="text-white font-medium">Create New Collection</div>
                  <div className="text-sm text-gray-400">Group your pastes together</div>
                </button>

                {collections.length === 0 ? (
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-8 text-center">
                    <div className="text-4xl mb-3">📭</div>
                    <p className="text-gray-400">No collections yet. Create one above!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {collections.map((collection) => (
                      <div
                        key={collection.id}
                        className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-white font-medium truncate flex-1">{collection.name}</h3>
                          <div
                            className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold ${collection.isPublic
                              ? 'bg-green-500/20 text-green-300'
                              : 'bg-gray-500/20 text-gray-400'
                              }`}
                          >
                            {collection.isPublic ? '🌍' : '🔒'}
                          </div>
                        </div>
                        <p className="text-sm text-gray-400 line-clamp-1 mb-3">
                          {collection.description || 'No description'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                          <span>{collection.pasteCount} items</span>
                          <span>•</span>
                          <span>{new Date(collection.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/c/${collection.id}`}
                            target="_blank"
                            className="flex-1 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded text-xs text-center transition-colors"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => openEditModal(collection.id)}
                            className="flex-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-xs transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => copyLink(collection.id)}
                            className="px-2 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-xs transition-colors"
                            title="Copy link"
                          >
                            🔗
                          </button>
                          <button
                            onClick={() => togglePrivacy(collection.id, collection.isPublic)}
                            className="px-2 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-xs transition-colors"
                            title="Toggle privacy"
                          >
                            {collection.isPublic ? '🔒' : '🌍'}
                          </button>
                          <button
                            onClick={() => deleteCollection(collection.id)}
                            className="px-2 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded text-xs transition-colors"
                            title="Delete"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* CREATE COLLECTION MODAL */}
      {modal === 'create-collection' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={closeModal}>
          <div
            className="backdrop-blur-xl bg-slate-900/95 border border-white/20 rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Create Collection</h2>
              <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="My Collection"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 h-20"
                  placeholder="What's this collection about?"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setFormIsPublic(true)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${formIsPublic
                    ? 'bg-green-500/20 text-green-300 border border-green-500/50'
                    : 'bg-white/5 text-gray-400 border border-white/10'
                    }`}
                >
                  🌍 Public
                </button>
                <button
                  onClick={() => setFormIsPublic(false)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${!formIsPublic
                    ? 'bg-gray-500/20 text-gray-300 border border-gray-500/50'
                    : 'bg-white/5 text-gray-400 border border-white/10'
                    }`}
                >
                  🔒 Private
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Add Pastes ({selectedPastes.size} selected)
                </label>
                {pastes.length === 0 ? (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center text-gray-400 text-sm">
                    No pastes available
                  </div>
                ) : (
                  <div className="bg-white/5 border border-white/10 rounded-lg max-h-48 overflow-y-auto">
                    {pastes.map((paste) => (
                      <label
                        key={paste.id}
                        className="flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPastes.has(paste.id)}
                          onChange={() => togglePaste(paste.id)}
                          className="w-4 h-4"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-sm truncate">{paste.title}</div>
                          <div className="text-xs text-gray-500 truncate">{paste.content.substring(0, 40)}...</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {formError && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                  {formError}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/10">
              <button
                onClick={handleCreate}
                disabled={formLoading || !formName.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium py-2.5 rounded-lg transition-all disabled:opacity-50"
              >
                {formLoading ? 'Creating...' : 'Create Collection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT COLLECTION MODAL */}
      {modal === 'edit-collection' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={closeModal}>
          <div
            className="backdrop-blur-xl bg-slate-900/95 border border-white/20 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Edit Collection</h2>
              <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {formLoading && !formName ? (
                <div className="text-center py-8 text-gray-400">Loading...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column - Collection Info */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Collection Details</h3>

                    <div>
                      <label className="block text-sm text-gray-300 mb-1.5">Name</label>
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-300 mb-1.5">Description</label>
                      <textarea
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 h-20 text-sm"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setFormIsPublic(true)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${formIsPublic
                          ? 'bg-green-500/20 text-green-300 border border-green-500/50'
                          : 'bg-white/5 text-gray-400 border border-white/10'
                          }`}
                      >
                        🌍 Public
                      </button>
                      <button
                        onClick={() => setFormIsPublic(false)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${!formIsPublic
                          ? 'bg-gray-500/20 text-gray-300 border border-gray-500/50'
                          : 'bg-white/5 text-gray-400 border border-white/10'
                          }`}
                      >
                        🔒 Private
                      </button>
                    </div>
                  </div>

                  {/* Right Column - Pastes */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                        Pastes ({collectionPastes.length})
                      </h3>
                      <button
                        onClick={openCreatePaste}
                        className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded text-xs font-medium transition-all"
                      >
                        + New Paste
                      </button>
                    </div>

                    {collectionPastes.length === 0 ? (
                      <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-center">
                        <div className="text-3xl mb-2 opacity-50">📄</div>
                        <p className="text-gray-400 text-sm mb-3">No pastes yet</p>
                        <button
                          onClick={openCreatePaste}
                          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded text-sm transition-colors"
                        >
                          Create First Paste
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {collectionPastes.map((paste, index) => (
                          <div
                            key={paste.id}
                            className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-all group"
                          >
                            <div className="flex items-center gap-2">
                              <div className="text-gray-500 font-mono text-xs w-5">{index + 1}.</div>
                              <div
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => openPasteEditor(paste)}
                              >
                                <div className="text-white text-sm truncate">{paste.title}</div>
                                <div className="text-xs text-gray-500 truncate">{paste.content.substring(0, 40)}...</div>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => openPasteEditor(paste)}
                                  className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 rounded text-xs"
                                  title="Edit paste"
                                >
                                  ✏️
                                </button>
                                <button onClick={() => moveUp(index)} disabled={index === 0} className="px-1.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs disabled:opacity-30">↑</button>
                                <button onClick={() => moveDown(index)} disabled={index === collectionPastes.length - 1} className="px-1.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs disabled:opacity-30">↓</button>
                                <button onClick={() => removePaste(paste.id)} className="px-1.5 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded text-xs">×</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {formError && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                  {formError}
                </div>
              )}
            </div>

            <div className="flex gap-2 p-4 border-t border-white/10">
              <button
                onClick={handleSave}
                disabled={formLoading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium py-2.5 rounded-lg transition-all disabled:opacity-50"
              >
                {formLoading ? 'Saving...' : 'Save Changes'}
              </button>
              {editingCollection && (
                <Link
                  href={`/c/${editingCollection}`}
                  target="_blank"
                  className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-center"
                >
                  Preview
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT/CREATE PASTE MODAL - UNIFIED */}
      {(isEditingPaste || isCreatingPaste) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={closeModal}>
          <div
            className="backdrop-blur-xl bg-slate-900/95 border border-white/20 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                {editingCollection && (
                  <button
                    onClick={backToCollection}
                    className="p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                  >
                    ←
                  </button>
                )}
                <h2 className="text-xl font-bold text-white">
                  {isCreatingPaste ? 'New Paste' : 'Edit Paste'}
                </h2>
                {pasteEditSaved && (
                  <span className="text-green-400 text-sm">✓ {isCreatingPaste ? 'Created!' : 'Saved!'}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isEditingPaste && editingPaste && (
                  <Link
                    href={`/p/${editingPaste.id}`}
                    target="_blank"
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-sm transition-colors"
                  >
                    View Live →
                  </Link>
                )}
                <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white">✕</button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left - Content (2 cols) */}
                <div className="lg:col-span-2 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                    <input
                      type="text"
                      value={pasteEditTitle}
                      onChange={(e) => setPasteEditTitle(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Untitled Paste"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Content *</label>
                    <textarea
                      value={pasteEditContent}
                      onChange={(e) => setPasteEditContent(e.target.value)}
                      className="w-full bg-black/30 border border-white/10 rounded-lg p-4 text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[300px] font-mono text-sm"
                      placeholder="Paste your content here..."
                    />
                  </div>
                </div>

                {/* Right - Settings (1 col) */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Settings</h3>

                  <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-1.5">Max Views</label>
                      <input
                        type="number"
                        value={pasteEditMaxViews}
                        onChange={(e) => setPasteEditMaxViews(e.target.value)}
                        placeholder="No limit"
                        min="1"
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited</p>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-300 mb-1.5">TTL (seconds)</label>
                      <input
                        type="number"
                        value={pasteEditTtl}
                        onChange={(e) => setPasteEditTtl(e.target.value)}
                        placeholder="No expiry"
                        min="1"
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">Leave empty for no expiry</p>
                    </div>

                    {isEditingPaste && editingPaste && (
                      <div className="border-t border-white/10 pt-4">
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>Current views: {editingPaste.viewCount || 0}</p>
                          <p className="break-all">ID: {editingPaste.id}</p>
                        </div>
                      </div>
                    )}

                    {isCreatingPaste && editingCollection && (
                      <div className="border-t border-white/10 pt-4">
                        <div className="text-xs text-gray-500">
                          <p>Will be added to: <span className="text-purple-400">{formName}</span></p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-gray-500">
                    💡 {isCreatingPaste ? 'Will be saved to your account' : 'The URL will stay the same after editing'}
                  </div>
                </div>
              </div>

              {formError && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                  {formError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-2 p-4 border-t border-white/10">
              <button
                onClick={isCreatingPaste ? handleCreatePaste : handleSavePaste}
                disabled={pasteEditLoading || (isCreatingPaste && !pasteEditContent.trim())}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium py-2.5 rounded-lg transition-all disabled:opacity-50"
              >
                {pasteEditLoading
                  ? (isCreatingPaste ? 'Creating...' : 'Saving...')
                  : (isCreatingPaste ? 'Create Paste' : 'Save Paste')
                }
              </button>
              {editingCollection && (
                <button
                  onClick={backToCollection}
                  className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                >
                  Back to Collection
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}