'use client';

import { useCallback, useState } from 'react';
import { UI_COPY_FEEDBACK_MS } from '@/lib/constants';

interface CopyButtonProps {
  text: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function CopyButton({ text, className = '', size = 'sm' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), UI_COPY_FEEDBACK_MS);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [text]);

  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const paddingClass = size === 'sm' ? 'p-1' : 'p-1.5';

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`
        ${paddingClass} rounded
        text-gray-400 hover:text-gray-200
        hover:bg-gray-700 transition-colors
        focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500
        ${className}
      `}
      title={copied ? 'コピーしました' : 'コピー'}
      aria-label={copied ? 'コピーしました' : 'クリップボードにコピー'}
    >
      {copied ? (
        <svg
          className={`${sizeClass} text-green-400`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg
          className={sizeClass}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      )}
    </button>
  );
}
