export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-8">
          <div className="text-8xl mb-4">😢</div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent mb-4">
            404
          </h1>
          <p className="text-gray-300 text-lg mb-2">
            Paste not found or has expired
          </p>
          <p className="text-gray-400 text-sm">
            The paste you're looking for doesn't exist or has reached its limits.
          </p>
        </div>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl font-semibold transition-all hover:shadow-lg"
        >
          <span>←</span>
          Back to Home
        </a>
      </div>
    </div>
  );
}