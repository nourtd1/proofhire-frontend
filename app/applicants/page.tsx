'use client';

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowRight, Briefcase, FolderOpen, Sparkles, Users } from 'lucide-react';
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
  const recentJobs = useMemo(() => sortedJobs.slice(0, 4), [sortedJobs]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <div data-onboarding="applicants-workspace" className="rounded-3xl bg-slate-900 px-6 py-7 text-white sm:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
            Candidate Workspace
          </div>
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Bring every application into one clean intake flow.</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
            Choose a role, add structured profiles or CSV imports, then move directly into AI screening and test distribution.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/jobs/new"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-slate-900 transition-colors hover:bg-slate-100"
            >
              <Briefcase size={18} />
              Create Job
            </Link>
            <Link
              href="/jobs"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white transition-colors hover:bg-white/10"
            >
              View All Jobs
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-4">
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <FolderOpen size={20} />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Open jobs</div>
                <div className="mt-1 text-2xl font-bold text-slate-900">{jobs.length}</div>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Users size={20} />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Application hubs</div>
                <div className="mt-1 text-2xl font-bold text-slate-900">{recentJobs.length}</div>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <Sparkles size={20} />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ready for intake</div>
                <div className="mt-1 text-2xl font-bold text-slate-900">{jobs.length}</div>
              </div>
            </div>
          </div>
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
              <div key={job.id} className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-sm">
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

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-slate-500">
                    Open this workspace to add profiles, import CSVs, and send skill tests.
                  </div>
                  <Link
                    href={`/applicants/${job.id}`}
                    className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl font-medium transition-colors shadow-sm shadow-indigo-200"
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
