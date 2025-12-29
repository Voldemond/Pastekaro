import { notFound } from 'next/navigation';
import { getPaste } from '@/lib/paste';

export default async function ViewPastePage({
  params,
}: {
  params: Promise<{ id: string }>; // <--- FIX 1: Type is Promise
}) {
  const { id } = await params; // <--- FIX 2: Await the params

  const paste = await getPaste(id, true);

  if (!paste) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Paste</h1>
            <div className="flex gap-4 text-sm text-gray-600">
              {paste.maxViews !== undefined && (
                <span>Views remaining: {paste.maxViews - paste.viewCount}</span>
              )}
              {paste.ttlSeconds && (
                <span>
                  Expires: {new Date(paste.createdAt + paste.ttlSeconds * 1000).toLocaleString()}
                </span>
              )}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
            <pre className="whitespace-pre-wrap break-words font-mono text-sm text-gray-800">
              {paste.content}
            </pre>
          </div>

          <div className="mt-6">
            <a
              href="/"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← Create new paste
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}