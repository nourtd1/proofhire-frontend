'use client';

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Briefcase } from 'lucide-react';
import api, { getApiErrorMessage } from '@/lib/api';
import JobCard from '@/components/jobs/JobCard';
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

const toIsoString = (d: string | Date | undefined): string => {
  if (!d) return new Date().toISOString();
  if (typeof d === 'string') return d;
  return d.toISOString();
};

const normalizeJob = (raw: BackendJob): Job & { skills?: string[]; experienceLevel?: string } => {
  const id = typeof raw.id === 'string' ? raw.id : typeof raw._id === 'string' ? raw._id : '';
  return {
    id,
    title: typeof raw.title === 'string' ? raw.title : '',
    description: typeof raw.description === 'string' ? raw.description : '',
    requirements: Array.isArray(raw.requirements) ? raw.requirements.filter((x): x is string => typeof x === 'string') : [],
    status: raw.status ?? 'Open',
    createdAt: toIsoString(raw.createdAt),
    updatedAt: toIsoString(raw.updatedAt),
    skills: Array.isArray(raw.skills) ? raw.skills.filter((x): x is string => typeof x === 'string') : [],
    experienceLevel: typeof raw.experienceLevel === 'string' ? raw.experienceLevel : '',
  };
};

const JobsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { jobs, loading, error } = useSelector((s: RootState) => s.jobs);

  useEffect(() => {
    let cancelled = false;

    const run = async (): Promise<void> => {
      dispatch(setLoading(true));
      dispatch(setError(null));

      try {
        const res = await api.get<ApiSuccess<BackendJob[]> | ApiError>('/api/jobs');
        if (!res.data.success) {
          throw new Error(res.data.message);
        }
        const normalized = res.data.data.map(normalizeJob);
        if (!cancelled) {
          dispatch(setJobs(normalized));
        }
      } catch (e: unknown) {
        if (!cancelled) {
          dispatch(setError(getApiErrorMessage(e)));
        }
      } finally {
        if (!cancelled) dispatch(setLoading(false));
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  const showEmpty = useMemo(() => !loading && !error && jobs.length === 0, [loading, error, jobs.length]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Jobs</h1>
          <p className="text-slate-500 mt-1">Manage your open positions</p>
        </div>
        <Link
          href="/jobs/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm shadow-indigo-200"
        >
          <Plus size={20} />
          Create Job
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="h-44 bg-slate-100 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : null}

      {showEmpty ? (
        <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
          <div className="bg-slate-50 p-6 rounded-full mb-4">
            <Briefcase size={48} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No jobs yet</h3>
          <p className="text-slate-500 max-w-sm mt-2">
            Create your first job to start screening candidates
          </p>
          <Link
            href="/jobs/new"
            className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center gap-2 transition-colors shadow-sm shadow-indigo-200"
          >
            <Plus size={18} />
            Create Job
          </Link>
        </div>
      ) : null}

      {!loading && !showEmpty ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default JobsPage;
