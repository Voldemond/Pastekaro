'use client';

import { useState } from 'react';

export default function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset icon after 2 seconds
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-2 px-5 py-3 border rounded-xl font-medium transition-all ${
        copied 
          ? 'bg-green-500/20 border-green-500/50 text-green-200' 
          : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
      }`}
    >
      <span>{copied ? '✅' : '📋'}</span>
      {copied ? 'Copied!' : 'Copy Content'}
    </button>
  );
}