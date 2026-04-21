'use client';

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowRight, Briefcase, Users } from 'lucide-react';
import api, { getApiErrorMessage } from '@/lib/api';
import type { RootState, AppDispatch } from '@/store';
import { setJobs, setLoading, setError } from '@/store/slices/jobsSlice';
import type { Job } from '@/types';

type ApiSuccess<T> = { success: true; data: T };
type ApiError = { success: false; message: string };

type BackendJob = {
  _id?: string;
  id?: string;
  title?: string;
  description?: string;
  requirements?: string[];
  skills?: string[];
  experienceLevel?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  status?: 'Open' | 'Closed' | 'Draft';
};

type JobWithExtras = Job & { skills?: string[]; experienceLevel?: string };

const toIsoString = (d: string | Date | undefined): string => {
  if (!d) return new Date().toISOString();
  if (typeof d === 'string') return d;
  return d.toISOString();
};

const normalizeJob = (raw: BackendJob): JobWithExtras => {
  const id = typeof raw.id === 'string' ? raw.id : typeof raw._id === 'string' ? raw._id : '';
  return {
    id,
    title: typeof raw.title === 'string' ? raw.title : '',
    description: typeof raw.description === 'string' ? raw.description : '',
    requirements: Array.isArray(raw.requirements)
      ? raw.requirements.filter((x): x is string => typeof x === 'string')
      : [],
    status: raw.status ?? 'Open',
    createdAt: toIsoString(raw.createdAt),
    updatedAt: toIsoString(raw.updatedAt),
    skills: Array.isArray(raw.skills) ? raw.skills.filter((x): x is string => typeof x === 'string') : [],
    experienceLevel: typeof raw.experienceLevel === 'string' ? raw.experienceLevel : '',
  };
};

const formatDate = (value: string): string => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(d);
};

export default function ApplicantsIndexPage(): React.JSX.Element {
  const dispatch = useDispatch<AppDispatch>();
  const { jobs, loading, error } = useSelector((s: RootState) => s.jobs);

  useEffect(() => {
    let cancelled = false;

    const run = async (): Promise<void> => {
      dispatch(setLoading(true));
      dispatch(setError(null));

      try {
        const res = await api.get<ApiSuccess<BackendJob[]> | ApiError>('/api/jobs');
        if (!res.data.success) throw new Error(res.data.message);
        const normalized = res.data.data.map(normalizeJob);
        if (!cancelled) dispatch(setJobs(normalized));
      } catch (e: unknown) {
        if (!cancelled) dispatch(setError(getApiErrorMessage(e)));
      } finally {
        if (!cancelled) dispatch(setLoading(false));
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  const sortedJobs = useMemo(
    () => [...jobs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [jobs]
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Applications</h1>
          <p className="text-slate-500 mt-1">Choose a job to manage candidate applications.</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-44 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : null}

      {!loading && sortedJobs.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
          <div className="bg-slate-50 p-6 rounded-full mb-4">
            <Users size={48} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No jobs yet</h3>
          <p className="text-slate-500 max-w-sm mt-2">
            Create a job first, then you will be able to add and review applications.
          </p>
          <Link
            href="/jobs/new"
            className="mt-6 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm shadow-indigo-200"
          >
            <Briefcase size={18} />
            Create Job
          </Link>
        </div>
      ) : null}

      {!loading && sortedJobs.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sortedJobs.map((job) => {
            const extras = job as JobWithExtras;
            const shownSkills = (extras.skills ?? []).slice(0, 4);

            return (
              <div key={job.id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-bold text-slate-900 truncate">{job.title}</h2>
                      {extras.experienceLevel ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                          {extras.experienceLevel}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-slate-500 mt-2 text-sm">{formatDate(job.createdAt)}</p>
                  </div>
                </div>

                {shownSkills.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {shownSkills.map((skill) => (
                      <span
                        key={`${job.id}-${skill}`}
                        className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="mt-6">
                  <Link
                    href={`/applicants/${job.id}`}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm shadow-indigo-200"
                  >
                    Open Applications
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
