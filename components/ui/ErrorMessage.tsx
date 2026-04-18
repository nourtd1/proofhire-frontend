'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps): React.JSX.Element {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
      <AlertCircle className="text-red-500 w-5 h-5 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-red-700 font-medium">Something went wrong</p>
            <p className="text-red-600 text-sm mt-1 break-words">{message}</p>
          </div>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="text-red-600 underline text-sm shrink-0"
            >
              Try again
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

