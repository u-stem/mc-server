'use client';

import { useCallback, useState } from 'react';
import { UI_COPY_FEEDBACK_MS } from '@/lib/constants';
import { CopyButton } from './CopyButton';

interface CodeBlockProps {
  children: string;
  copyable?: boolean;
  className?: string;
}

export function CodeBlock({ children, copyable = true, className = '' }: CodeBlockProps) {
  return (
    <div className={`relative group ${className}`}>
      <code className="block bg-gray-900 rounded px-3 py-2 pr-10 font-mono text-sm text-green-400 my-2">
        {children}
      </code>
      {copyable && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <CopyButton text={children} />
        </div>
      )}
    </div>
  );
}

interface InlineCodeProps {
  children: string;
  copyable?: boolean;
  className?: string;
}

export function InlineCode({ children, copyable = true, className = '' }: InlineCodeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!copyable) return;
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), UI_COPY_FEEDBACK_MS);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [children, copyable]);

  if (!copyable) {
    return (
      <code
        className={`bg-gray-900 rounded px-1.5 py-0.5 font-mono text-sm text-green-400 ${className}`}
      >
        {children}
      </code>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`
        inline-flex items-center gap-1
        bg-gray-900 rounded px-1.5 py-0.5
        font-mono text-sm text-green-400
        hover:bg-gray-800 transition-colors
        focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500
        ${className}
      `}
      title={copied ? 'コピーしました' : 'クリックでコピー'}
    >
      {children}
      {copied && (
        <svg
          className="w-3 h-3 text-green-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );
}
