'use client';

import React from 'react';
import { Zap, CheckCircle2, XCircle } from 'lucide-react';
import { ScreeningResult } from '@/types';

interface ResultCardProps {
  result: ScreeningResult;
}

const ResultCard: React.FC<ResultCardProps> = ({ result }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Zap size={24} />
          </div>
          <div>
            <h4 className="font-bold text-slate-900">AI Screening Score</h4>
            <p className="text-sm text-slate-500">Based on candidate's matching skills</p>
          </div>
        </div>
        <div className="text-3xl font-black text-indigo-600">{result.score}%</div>
      </div>

      <div className="mb-8">
        <h5 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">AI Analysis</h5>
        <p className="text-slate-600 text-sm leading-relaxed">
          {result.aiAnalysis}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h5 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-2">
            <CheckCircle2 size={14} />
            Key Strengths
          </h5>
          <ul className="space-y-2">
            {result.strengths.map((s, i) => (
              <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                <div className="mt-1.5 w-1 h-1 bg-emerald-400 rounded-full shrink-0"></div>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h5 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-2">
            <XCircle size={14} />
            Missing/Weak Areas
          </h5>
          <ul className="space-y-2">
            {result.weaknesses.map((w, i) => (
              <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                <div className="mt-1.5 w-1 h-1 bg-amber-400 rounded-full shrink-0"></div>
                {w}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;
