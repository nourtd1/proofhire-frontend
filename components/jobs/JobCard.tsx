'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Trash2, Users, Zap } from 'lucide-react';
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
  const requirementCount = useMemo(() => job.requirements.length, [job.requirements.length]);

  return (
    <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
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

      <p className="mt-4 text-sm leading-6 text-slate-500">
        {job.description
          ? `${job.description.slice(0, 135)}${job.description.length > 135 ? '…' : ''}`
          : 'No description provided yet.'}
      </p>

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

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Skills</div>
          <div className="mt-1 text-xl font-bold text-slate-900">{skills.length}</div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Requirements</div>
          <div className="mt-1 text-xl font-bold text-slate-900">{requirementCount}</div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 text-sm text-slate-500">
        <span>Created {formatDate(job.createdAt)}</span>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => router.push(`/applicants/${job.id}`)}
            className="px-4 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center justify-center gap-2"
          >
            <Users size={16} />
            Applications
          </button>
          <button
            type="button"
            onClick={() => router.push(`/screening/${job.id}`)}
            className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors shadow-sm shadow-indigo-200 inline-flex items-center justify-center gap-2"
          >
            <Zap size={16} />
            Run Screening
          </button>
          <button
            type="button"
            onClick={() => router.push(`/applicants/${job.id}`)}
            className="px-4 py-3 rounded-xl border border-transparent text-indigo-700 font-medium hover:bg-indigo-50 transition-colors inline-flex items-center justify-center gap-2 sm:ml-auto"
          >
            Open Workspace
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobCard;
