import { notFound } from 'next/navigation';
import { getPaste } from '@/lib/paste';
import CopyButton from '@/components/CopyButton';

// This is a Server Component
export default async function ViewPastePage({
  params,
}: {
  params: Promise<{ id: string }>; // <--- Must be a Promise in Next.js 15
}) {
  const { id } = await params; // <--- Must await the params

  // 1. Fetch the data
  const paste = await getPaste(id, true);

  // 2. Handle missing/expired pastes
  if (!paste) {
    notFound();
  }

  // 3. Calculate display values
  const remainingViews = paste.maxViews !== undefined 
    ? paste.maxViews - paste.viewCount 
    : null;

  const expiresAt = paste.ttlSeconds
    ? new Date(paste.createdAt + paste.ttlSeconds * 1000).toLocaleString()
    : null;

  // 4. Render the UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
      </div>

      <div className="relative min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="w-full max-w-4xl">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8">
            
            {/* Header */}
            <div className="mb-6 pb-6 border-b border-white/20">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
                📄 Your Paste
              </h1>
              
              <div className="flex flex-wrap gap-4 text-sm">
                {/* View Limit Badge */}
                {remainingViews !== null && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                    <span className="text-xl">👁️</span>
                    <span>{remainingViews} {remainingViews === 1 ? 'view' : 'views'} remaining</span>
                  </div>
                )}
                
                {/* Expiry Badge */}
                {expiresAt && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/50 rounded-lg">
                    <span className="text-xl">⏰</span>
                    <span>Expires: {expiresAt}</span>
                  </div>
                )}

                {/* No Limits Badge */}
                {!remainingViews && !expiresAt && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg">
                    <span className="text-xl">♾️</span>
                    <span>No Limits</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* The Text Content */}
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-6 overflow-auto max-h-[60vh]">
              <pre className="whitespace-pre-wrap break-words font-mono text-sm text-gray-100 leading-relaxed">
                {paste.content}
              </pre>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap gap-3">
              <a
                href="/"
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-medium transition-all hover:shadow-lg hover:scale-105"
              >
                <span>←</span> Create New Paste
              </a>
              
              {/* The Client Component Button */}
              <CopyButton content={paste.content} />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}