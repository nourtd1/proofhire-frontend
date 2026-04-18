'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, Mail, MapPin, User, Zap } from 'lucide-react';
import { Applicant } from '@/types';
import VerifiedBadge from '@/components/ui/VerifiedBadge';

interface ApplicantCardProps {
  applicant: Applicant & { isVerified?: boolean };
}

const ApplicantCard: React.FC<ApplicantCardProps> = ({ applicant }) => {
  const router = useRouter();
  const isVerified = applicant.isVerified === true;
  const applicantId = applicant.id;
  const jobId = applicant.jobId;

  return (
    <div className="relative bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
      {isVerified ? (
        <div className="absolute top-4 right-4">
          <VerifiedBadge size="sm" showLabel={true} />
        </div>
      ) : null}
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
        <button
          type="button"
          onClick={() => router.push(`/applicants/${jobId}`)}
          className="flex-1 py-2 px-4 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm font-semibold text-slate-600 transition-colors"
        >
          View Profile
        </button>
        <button
          type="button"
          disabled={isVerified}
          onClick={() => router.push(`/test/${applicantId}?jobId=${jobId}`)}
          className={[
            'py-2 px-3 rounded-lg text-sm font-semibold transition-colors inline-flex items-center gap-2',
            isVerified
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed'
              : 'border border-indigo-200 text-indigo-700 hover:bg-indigo-50',
          ].join(' ')}
          title={isVerified ? 'This candidate is already Verified' : 'Take the skill verification test'}
        >
          <Zap size={18} />
          {isVerified ? 'Verified ✓' : 'Take Skill Test'}
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
