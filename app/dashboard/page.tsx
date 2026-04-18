'use client';

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { Briefcase, CheckCircle, List, TrendingUp, Zap } from 'lucide-react';
import api, { getApiErrorMessage } from '@/lib/api';
import type { RootState, AppDispatch } from '@/store';
import { setJobs, setLoading, setError } from '@/store/slices/jobsSlice';
import EmptyState from '@/components/ui/EmptyState';
import type { Job } from '@/types';

type ApiSuccess<T> = { success: true; data: T };
type ApiError = { success: false; message: string };

type BackendJob = {
  _id?: string;
  id?: string;
  title?: string;
  description?: string;
  requirements?: string[];
  status?: 'Open' | 'Closed' | 'Draft';
  createdAt?: string | Date;
  updatedAt?: string | Date;
  skills?: string[];
  experienceLevel?: string;
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

export default function DashboardPage(): React.JSX.Element {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { jobs, loading, error } = useSelector((s: RootState) => s.jobs);

  const cutoff30Days = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.getTime();
  }, []);

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

  const last30Days = useMemo(() => {
    return jobs.filter((j) => new Date(j.createdAt).getTime() >= cutoff30Days).length;
  }, [jobs, cutoff30Days]);

  const recent = useMemo(() => sortedJobs.slice(0, 3) as JobWithExtras[], [sortedJobs]);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome to ProofHire — AI-powered talent screening</p>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-800">{jobs.length}</div>
              <div className="text-sm text-gray-500 mt-1">Total Jobs</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-800">{last30Days}</div>
              <div className="text-sm text-gray-500 mt-1">Active Positions</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-800">{jobs.length}</div>
              <div className="text-sm text-gray-500 mt-1">Ready to Screen</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-gray-800">{jobs.length}</div>
              <div className="text-sm text-gray-500 mt-1">Screening Done</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Positions</h2>
            <Link href="/jobs" className="text-sm text-indigo-600 font-semibold hover:underline">
              View All
            </Link>
          </div>

          {loading ? (
            <div className="p-6 animate-pulse h-32" />
          ) : jobs.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Briefcase}
                title="No jobs yet"
                subtitle="Create your first job to get started"
                action={{ label: 'Create New Job', onClick: () => router.push('/jobs/new') }}
              />
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recent.map((j) => (
                <div key={j.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="font-semibold text-gray-800 truncate">{j.title}</div>
                      {j.experienceLevel ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                          {j.experienceLevel}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">{formatDate(j.createdAt)}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => router.push(`/applicants/${j.id}`)}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm"
                    >
                      Applicants
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push(`/screening/${j.id}`)}
                      className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm shadow-indigo-200"
                    >
                      Screen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4">
            <button
              type="button"
              onClick={() => router.push('/jobs/new')}
              className="text-left bg-white rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Create New Job</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Post a new role and start collecting candidates
                  </div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => router.push('/jobs')}
              className="text-left bg-white rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <List className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">View All Jobs</div>
                  <div className="text-sm text-gray-500 mt-1">
                    See all your open positions and their status
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
