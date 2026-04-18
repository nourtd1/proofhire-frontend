'use client';

import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClass: Record<NonNullable<LoadingSpinnerProps['size']>, string> = {
  sm: 'w-6 h-6',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
};

export default function LoadingSpinner({ message, size = 'md' }: LoadingSpinnerProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className={[
          'rounded-full border-4 border-indigo-600 border-t-transparent animate-spin',
          sizeClass[size],
        ].join(' ')}
      />
      {message ? (
        <p className="text-sm text-gray-500 mt-3 text-center">{message}</p>
      ) : null}
    </div>
  );
}

