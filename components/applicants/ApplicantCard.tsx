'use client';

import React from 'react';
import { User, Mail, MapPin, ExternalLink } from 'lucide-react';
import { Applicant } from '@/types';

interface ApplicantCardProps {
  applicant: Applicant;
}

const ApplicantCard: React.FC<ApplicantCardProps> = ({ applicant }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
          <User size={32} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">{applicant.profile.name}</h3>
          <p className="text-sm font-medium text-indigo-600">{applicant.status}</p>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Mail size={16} />
          <span>{applicant.profile.email}</span>
        </div>
        {applicant.profile.location && (
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <MapPin size={16} />
            <span>{applicant.profile.location}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button className="flex-1 py-2 px-4 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm font-semibold text-slate-600 transition-colors">
          View Profile
        </button>
        <a 
          href={applicant.profile.resumeUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 transition-colors"
        >
          <ExternalLink size={20} />
        </a>
      </div>
    </div>
  );
};

export default ApplicantCard;
