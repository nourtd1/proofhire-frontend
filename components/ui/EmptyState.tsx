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
    <div className="rounded-2xl border border-slate-100 bg-white px-8 py-14 shadow-sm">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 border border-slate-100">
          <Icon className="h-8 w-8 text-slate-300" />
        </div>
        <h3 className="mt-5 text-xl font-bold text-slate-900">{title}</h3>
        <p className="mt-2 max-w-md text-sm text-slate-500">{subtitle}</p>
      </div>
      {action ? (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={action.onClick}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm shadow-indigo-200"
          >
            {action.label}
          </button>
        </div>
      ) : null}
    </div>
  );
}
