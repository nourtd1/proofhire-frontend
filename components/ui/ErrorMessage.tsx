'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps): React.JSX.Element {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-start gap-3 shadow-sm">
      <AlertCircle className="text-red-500 w-5 h-5 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-red-800 font-semibold">Action required</p>
            <p className="text-red-700 text-sm mt-1 break-words">{message}</p>
          </div>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-red-700 text-sm font-medium shrink-0 hover:bg-red-50"
            >
              Retry
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
