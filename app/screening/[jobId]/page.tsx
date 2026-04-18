import React from 'react';
import { Zap, Play, BarChart3, Clock } from 'lucide-react';

export default function ScreeningPage({ params }: { params: { jobId: string } }) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Screening</h1>
          <p className="text-slate-500 mt-1">Run AI-powered analysis for job: <span className="text-indigo-600 font-semibold">#{params.jobId}</span></p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm shadow-indigo-200">
          <Play size={18} />
          Run All Screenings
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-96 flex flex-col items-center justify-center text-center">
                <div className="bg-indigo-50 p-6 rounded-full mb-4">
                    <Zap size={48} className="text-indigo-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">No screenings run yet</h3>
                <p className="text-slate-500 max-w-sm mt-2">Trigger the AI analysis to evaluate all candidates against the job requirements.</p>
                <button className="mt-6 text-indigo-600 font-semibold hover:underline">
                    Learn how it works →
                </button>
            </div>
        </div>

        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <BarChart3 size={18} className="text-indigo-500" />
                    Screening Status
                </h4>
                <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Completed</span>
                        <span className="font-semibold text-slate-900">0</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">In Progress</span>
                        <span className="font-semibold text-slate-900">0</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Pending</span>
                        <span className="font-semibold text-slate-900">0</span>
                    </div>
                </div>
            </div>

            <div className="bg-indigo-900 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200">
                <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} />
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">Pro Tip</span>
                </div>
                <h4 className="font-bold mb-2">Detailed Analysis</h4>
                <p className="text-indigo-100/80 text-sm leading-relaxed">
                    ProofHire's AI analyzes skills, experience, and achievements to give you a comprehensive match score.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}
