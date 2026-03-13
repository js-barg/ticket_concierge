'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-slate-50">
      <div className="mx-auto max-w-2xl space-y-4">
        <h2 className="text-lg font-semibold text-red-300">Something went wrong</h2>
        <p className="text-sm text-slate-400">
          A server-side exception occurred. Check the terminal/server logs for the full error.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <pre className="overflow-auto rounded border border-slate-700 bg-slate-900 p-4 text-xs text-slate-300">
            {error.message}
            {error.digest && `\nDigest: ${error.digest}`}
          </pre>
        )}
        <button
          type="button"
          onClick={reset}
          className="rounded bg-slate-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-500"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
