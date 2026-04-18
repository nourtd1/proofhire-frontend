import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Send } from 'lucide-react';

const CreateJobPage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/jobs" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create New Job</h1>
          <p className="text-slate-500 mt-1">Define the requirements and responsibilities for this position.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Job Title</label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            placeholder="e.g. Senior Frontend Engineer"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Description</label>
          <textarea
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all h-32"
            placeholder="What will they be doing?"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Skills & Requirements (Comma separated)</label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            placeholder="React, TypeScript, Next.js, 5+ years experience..."
          />
        </div>

        <div className="pt-4 flex items-center justify-end gap-3">
          <button className="px-6 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            Save as Draft
          </button>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm shadow-indigo-200">
            <Send size={18} />
            Publish Job
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateJobPage;
