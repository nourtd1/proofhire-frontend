import React from 'react';
import Link from 'next/link';
import { Zap, ArrowRight, Briefcase } from 'lucide-react';

const ScreeningIndexPage = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Screening</h1>
          <p className="text-slate-500 mt-1">Select a job to run AI-powered candidate screening.</p>
        </div>
      </div>

      <div
        data-onboarding="screening-workspace"
        className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-2xl border-2 border-dashed border-slate-200"
      >
        <div className="bg-indigo-50 p-6 rounded-full mb-4">
          <Zap size={48} className="text-indigo-300" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">No job selected</h3>
        <p className="text-slate-500 max-w-sm mt-2 mb-6">
          First, create a job and add applicants. Then you can run AI screening from the job&apos;s applicant page.
        </p>
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm shadow-indigo-200"
        >
          <Briefcase size={18} />
          Go to Jobs
          <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
};

export default ScreeningIndexPage;
