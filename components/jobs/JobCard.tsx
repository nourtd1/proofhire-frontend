'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, Users, ChevronRight, Briefcase } from 'lucide-react';
import { Job } from '@/types';

interface JobCardProps {
  job: Job;
}

const JobCard: React.FC<JobCardProps> = ({ job }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-100 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
          <Briefcase size={24} />
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          job.status === 'Open' ? 'bg-emerald-100 text-emerald-700' : 
          job.status === 'Draft' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
        }`}>
          {job.status}
        </span>
      </div>
      
      <h3 className="text-lg font-bold text-slate-900 mb-2 truncate">{job.title}</h3>
      <p className="text-slate-500 text-sm line-clamp-2 mb-6 h-10">
        {job.description}
      </p>

      <div className="flex items-center gap-6 text-slate-400 text-sm mb-6">
        <div className="flex items-center gap-2">
          <Calendar size={16} />
          <span>{new Date(job.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users size={16} />
          <span>0 applicants</span>
        </div>
      </div>

      <Link 
        href={`/applicants/${job.id}`}
        className="flex items-center justify-between py-2 px-4 bg-slate-50 rounded-lg group/btn hover:bg-slate-100 transition-colors"
      >
        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">View Applicants</span>
        <ChevronRight size={18} className="text-slate-400 group-hover/btn:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
};

export default JobCard;
