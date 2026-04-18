'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({ icon: Icon, title, subtitle, action }: EmptyStateProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16">
      <Icon className="w-12 h-12 text-gray-300" />
      <h3 className="text-lg font-semibold text-gray-700 mt-4">{title}</h3>
      <p className="text-sm text-gray-400 mt-1 text-center max-w-xs">{subtitle}</p>
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm shadow-indigo-200"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}

