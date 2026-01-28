'use client';

import { useEffect } from 'react';
import { Button } from '@/components/Button';
import { AlertTriangle } from '@/components/Icons';
import {
  LABEL_BACK_TO_DASHBOARD,
  LABEL_RETRY,
  MSG_ERROR_OCCURRED,
  MSG_ERROR_UNEXPECTED,
} from '@/lib/messages';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 bg-red-900/30 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-red-400 mb-2">{MSG_ERROR_OCCURRED}</h2>
        <p className="text-gray-400 mb-6">{MSG_ERROR_UNEXPECTED}</p>
        {error.digest && (
          <p className="text-xs text-gray-500 mb-6 font-mono">エラーID: {error.digest}</p>
        )}
        <div className="flex gap-3 justify-center">
          <Button onClick={reset}>{LABEL_RETRY}</Button>
          <Button
            variant="ghost"
            onClick={() => {
              window.location.href = '/';
            }}
          >
            {LABEL_BACK_TO_DASHBOARD}
          </Button>
        </div>
      </div>
    </div>
  );
}
