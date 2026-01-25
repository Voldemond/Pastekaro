'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Paste {
    id: string;
    title: string;
    content: string;
    order: number;
    createdAt: string;
    sizeKB?: number;
}

interface Collection {
    id: string;
    name: string;
    description?: string;
    userName?: string;
    pastes: Paste[];
}

export default function CollectionViewPage() {
    const params = useParams();
    const id = params.id as string;

    const [collection, setCollection] = useState<Collection | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPaste, setSelectedPaste] = useState<Paste | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (id) {
            fetchCollection();
        }
    }, [id]);

    const fetchCollection = async () => {
        try {
            const res = await fetch(`/api/collections/${id}/public`);
            if (res.ok) {
                const data = await res.json();
                setCollection(data);
            } else if (res.status === 404) {
                setError('Collection not found');
            } else if (res.status === 403) {
                setError('This collection is private');
            } else {
                setError('Failed to load collection');
            }
        } catch (err) {
            setError('Failed to load collection');
        } finally {
            setLoading(false);
        }
    };

    const copyContent = async (content: string) => {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="text-white">Loading collection...</div>
            </div>
        );
    }

    // Error state
    if (error || !collection) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-8 text-center max-w-md">
                    <div className="text-5xl mb-4">❌</div>
                    <h1 className="text-xl font-bold text-white mb-2">{error || 'Not Found'}</h1>
                    <p className="text-gray-400 mb-4">
                        {error === 'This collection is private'
                            ? 'The owner has made this collection private.'
                            : 'This collection may have been deleted or never existed.'}
                    </p>
                    <Link
                        href="/"
                        className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white transition-colors"
                    >
                        Go Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header Card */}
                <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6 mb-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                                {collection.name}
                            </h1>
                            {collection.description && (
                                <p className="text-gray-300 mb-3">{collection.description}</p>
                            )}
                            <div className="flex items-center gap-3 text-sm text-gray-400">
                                <span>by {collection.userName || 'Anonymous'}</span>
                                <span>•</span>
                                <span>{collection.pastes?.length || 0} items</span>
                            </div>
                        </div>
                        <Link
                            href="/"
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors whitespace-nowrap"
                        >
                            Create Your Own
                        </Link>
                    </div>
                </div>

                {/* Pastes List */}
                <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl overflow-hidden">
                    {collection.pastes && collection.pastes.length > 0 ? (
                        <div className="divide-y divide-white/10">
                            {collection.pastes.map((paste, index) => (
                                <div
                                    key={paste.id}
                                    className="p-4 hover:bg-white/5 transition-colors cursor-pointer"
                                    onClick={() => setSelectedPaste(paste)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="text-gray-500 font-mono text-sm w-6">
                                            {index + 1}.
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-white font-medium mb-1">
                                                {paste.title}
                                            </div>
                                            <div className="text-sm text-gray-400 line-clamp-2">
                                                {paste.content.substring(0, 150)}
                                                {paste.content.length > 150 && '...'}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-2">
                                                {(paste.sizeKB || 0).toFixed(1)} KB
                                            </div>
                                        </div>
                                        <button className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-sm transition-colors">
                                            View
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 text-gray-400">
                            <div className="text-4xl mb-3">📭</div>
                            <p>This collection is empty</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal for viewing paste */}
            {selectedPaste && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    onClick={() => setSelectedPaste(null)}
                >
                    <div
                        className="backdrop-blur-xl bg-slate-900/95 border border-white/20 rounded-xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <h2 className="text-xl font-bold text-white truncate pr-4">
                                {selectedPaste.title}
                            </h2>
                            <button
                                onClick={() => setSelectedPaste(null)}
                                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-auto p-4">
                            <pre className="text-gray-200 text-sm font-mono whitespace-pre-wrap break-words bg-black/30 rounded-lg p-4 border border-white/10">
                                {selectedPaste.content}
                            </pre>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex gap-2 p-4 border-t border-white/10">
                            <button
                                onClick={() => copyContent(selectedPaste.content)}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors flex items-center gap-2"
                            >
                                {copied ? '✓ Copied!' : '📋 Copy'}
                            </button>
                            <Link
                                href={`/p/${selectedPaste.id}`}
                                target="_blank"
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                            >
                                Open in New Tab
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}