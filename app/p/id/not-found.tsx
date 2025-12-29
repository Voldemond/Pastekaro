export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-gray-600 mb-6">
          Paste not found or has expired
        </p>
        <a
          href="/"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to home
        </a>
      </div>
    </div>
  );
}