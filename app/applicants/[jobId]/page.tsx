import React from 'react';
import { Users, Filter, Download } from 'lucide-react';

export default function ApplicantsPage({ params }: { params: { jobId: string } }) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Applicants</h1>
          <p className="text-slate-500 mt-1">Viewing applicants for job: <span className="text-indigo-600 font-semibold">#{params.jobId}</span></p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            <Filter size={16} />
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            <Download size={16} />
            Export List
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-20 flex flex-col items-center justify-center text-center">
          <div className="bg-slate-50 p-6 rounded-full mb-4">
            <Users size={48} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No applicants yet</h3>
          <p className="text-slate-500 max-w-sm mt-2">Applicants will appear here once people start applying to this position.</p>
        </div>
      </div>
    </div>
  );
}
