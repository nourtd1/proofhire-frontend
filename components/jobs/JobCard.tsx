'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Job } from '@/types';

interface JobCardProps {
  job: Job;
  onDelete?: (id: string) => void;
}

type JobWithExtras = Job & { skills?: string[]; experienceLevel?: string };

const formatDate = (value: string): string => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(d);
};

const JobCard: React.FC<JobCardProps> = ({ job, onDelete }) => {
  const router = useRouter();
  const extras = job as JobWithExtras;
  const skills = Array.isArray(extras.skills) ? extras.skills : [];
  const experienceLevel = typeof extras.experienceLevel === 'string' ? extras.experienceLevel : '';
  const shownSkills = skills.slice(0, 4);
  const remaining = Math.max(0, skills.length - shownSkills.length);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <h3 className="text-lg font-bold text-slate-900 truncate">{job.title}</h3>
            {experienceLevel ? (
              <span className="shrink-0 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                {experienceLevel}
              </span>
            ) : null}
          </div>
        </div>

        {onDelete ? (
          <button
            type="button"
            onClick={() => onDelete(job.id)}
            className="shrink-0 p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            aria-label="Delete job"
            title="Delete job"
          >
            <Trash2 size={18} />
          </button>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {shownSkills.map((s) => (
          <span
            key={s}
            className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700"
          >
            {s}
          </span>
        ))}
        {remaining > 0 ? (
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            +{remaining} more
          </span>
        ) : null}
      </div>

      <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
        <span>{formatDate(job.createdAt)}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push(`/applicants/${job.id}`)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            View Applicants
          </button>
          <button
            type="button"
            onClick={() => router.push(`/screening/${job.id}`)}
            className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors shadow-sm shadow-indigo-200"
          >
            Screen Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobCard;
