'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, RefreshCw, Users, Zap } from 'lucide-react';
import api, { getApiErrorMessage } from '@/lib/api';
import type { RootState, AppDispatch } from '@/store';
import { addJob } from '@/store/slices/jobsSlice';
import { setApplicants } from '@/store/slices/applicantsSlice';
import { setError, setLoading, setResults, setTriggered } from '@/store/slices/screeningSlice';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import EmptyState from '@/components/ui/EmptyState';
import ResultCard from '@/components/screening/ResultCard';
import type { Job, ScreeningResultWithApplicant } from '@/types';

type ApiSuccess<T> = { success: true; data: T; count?: number; message?: string };
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

const formatDate = (value: string | undefined): string => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(d);
};

const isValidMongoObjectId = (id: string | undefined): id is string =>
  typeof id === 'string' && /^[a-f0-9]{24}$/i.test(id);

export default function ScreeningJobPage(): React.JSX.Element {
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId;
  const router = useRouter();

  const dispatch = useDispatch<AppDispatch>();
  const job = useSelector((s: RootState) => s.jobs.jobs.find((j) => j.id === jobId)) as JobWithExtras | undefined;
  const applicants = useSelector((s: RootState) => s.applicants.applicants);
  const screening = useSelector((s: RootState) => s.screening);

  const [shortlist, setShortlist] = useState<10 | 20>(10);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchAll = useCallback(async (): Promise<void> => {
    dispatch(setError(null));
    dispatch(setLoading(true));
    if (!isValidMongoObjectId(jobId)) {
      dispatch(setError('Invalid job ID in the URL.'));
      dispatch(setLoading(false));
      return;
    }
    try {
      const [jobRes, applicantsRes, resultsRes] = await Promise.all([
        api.get<ApiSuccess<BackendJob> | ApiError>(`/api/jobs/${jobId}`),
        api.get<ApiSuccess<unknown[]> | ApiError>(`/api/applicants/${jobId}`),
        api.get<ApiSuccess<ScreeningResultWithApplicant[]> | ApiError>(`/api/screening/${jobId}`),
      ]);

      if (!jobRes.data.success) throw new Error(jobRes.data.message);
      if (!applicantsRes.data.success) throw new Error(applicantsRes.data.message);
      if (!resultsRes.data.success) throw new Error(resultsRes.data.message);

      dispatch(addJob(normalizeJob(jobRes.data.data)));
      dispatch(setApplicants(applicantsRes.data.data as unknown as RootState['applicants']['applicants']));

      const results = resultsRes.data.data ?? [];
      dispatch(setResults(results));
      dispatch(setTriggered(results.length > 0));
    } catch (e: unknown) {
      dispatch(setError(getApiErrorMessage(e)));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, jobId]);

  useEffect(() => {
    const t = setTimeout(() => void fetchAll(), 0);
    return () => clearTimeout(t);
  }, [fetchAll]);

  const runScreening = useCallback(async (): Promise<void> => {
    dispatch(setError(null));
    dispatch(setLoading(true));
    setStatusMessage(null);
    if (!isValidMongoObjectId(jobId)) {
      dispatch(setError('Invalid job ID.'));
      dispatch(setLoading(false));
      return;
    }
    try {
      const res = await api.post<ApiSuccess<ScreeningResultWithApplicant[]> | ApiError>('/api/screening/run', { jobId });
      if (!res.data.success) throw new Error(res.data.message);
      dispatch(setResults(res.data.data));
      dispatch(setTriggered(true));
      setStatusMessage(typeof res.data.message === 'string' ? res.data.message : 'Screening completed successfully.');
    } catch (e: unknown) {
      dispatch(setError(getApiErrorMessage(e)));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, jobId]);

  const results = screening.results;
  const hasResults = results.length > 0;

  const topHireCount = useMemo(() => results.filter((r) => r.recommendation === 'Hire').length, [results]);
  const avgScore = useMemo(() => {
    if (results.length === 0) return 0;
    return Math.round(results.reduce((acc, r) => acc + r.matchScore, 0) / results.length);
  }, [results]);
  const screenedOn = useMemo(() => formatDate(results[0]?.createdAt), [results]);

  const visibleResults = useMemo(() => results.slice(0, shortlist), [results, shortlist]);
  const applicantCount = applicants.length;
  const hasApplicants = applicantCount > 0;

  if (!hasResults && !screening.triggered) {
    return (
      <div className="max-w-4xl mx-auto mt-10 space-y-6">
        {screening.error ? <ErrorMessage message={screening.error} onRetry={() => void fetchAll()} /> : null}

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <Zap className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mt-6">{job?.title ?? 'AI Screening'}</h1>
            <p className="text-slate-500 mt-3 max-w-2xl">
              Launch a full AI review for this role. ProofHire will compare every candidate against the job,
              rank them by fit, and return strengths, gaps, and a hiring recommendation.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">1. Candidate intake</div>
                <div className="mt-1 text-sm text-slate-500">Structured JSON or CSV import</div>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">2. AI evaluation</div>
                <div className="mt-1 text-sm text-slate-500">Gemini ranks every profile against the role</div>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">3. Decision support</div>
                <div className="mt-1 text-sm text-slate-500">Top matches, gaps, and recruiter-ready notes</div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Candidates ready</div>
                <div className="mt-1 text-2xl font-bold text-slate-900">{applicantCount}</div>
              </div>

              {!screening.loading ? (
                <button
                  type="button"
                  onClick={() => void runScreening()}
                  disabled={!hasApplicants}
                  className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-sm shadow-indigo-200"
                >
                  <Zap className="w-5 h-5" />
                  Run AI Screening
                </button>
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-5 py-3">
                  <LoadingSpinner size="sm" />
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Screening in progress</div>
                    <div className="text-sm text-slate-500">This usually takes 15 to 30 seconds.</div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => router.push(`/applicants/${jobId}`)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-medium"
              >
                <Users className="w-4 h-4" />
                Manage Candidates
              </button>
            </div>

            {!hasApplicants ? (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-amber-800">
                Add at least one candidate before launching screening for this job.
              </div>
            ) : null}
          </div>

          <div className="bg-slate-900 text-white rounded-2xl p-8">
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">What you get</div>
            <div className="mt-6 space-y-5">
              <div>
                <div className="text-base font-semibold">Ranked shortlist</div>
                <div className="mt-1 text-sm text-slate-300">Top 10 by default, with the option to expand to Top 20.</div>
              </div>
              <div>
                <div className="text-base font-semibold">Transparent reasoning</div>
                <div className="mt-1 text-sm text-slate-300">Each candidate includes strengths, gaps, and a recommendation.</div>
              </div>
              <div>
                <div className="text-base font-semibold">Recruiter-friendly output</div>
                <div className="mt-1 text-sm text-slate-300">Built to support final human decisions, not replace them.</div>
              </div>
            </div>
            <div className="mt-8 text-xs text-slate-400">Powered by Gemini AI with backup scoring when the AI provider is unavailable.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-16 bg-white shadow-sm border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between">
        <Link href="/jobs" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Jobs</span>
        </Link>
        <div className="text-center">
          <div className="font-semibold text-gray-800">{job?.title ?? 'Job'}</div>
          <div className="text-xs text-gray-400">AI Screening Results</div>
        </div>
        <button
          type="button"
          onClick={() => void runScreening()}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-colors text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Re-run Screening
        </button>
      </div>

      {screening.error ? <ErrorMessage message={screening.error} onRetry={() => void fetchAll()} /> : null}
      {statusMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
          {statusMessage}
        </div>
      ) : null}

      <div className="bg-indigo-600 text-white rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="text-2xl font-bold">{results.length}</div>
          <div className="text-xs opacity-80">Analyzed</div>
        </div>
        <div>
          <div className="text-2xl font-bold">{topHireCount}</div>
          <div className="text-xs opacity-80">Top Candidates</div>
        </div>
        <div>
          <div className="text-2xl font-bold">{avgScore}</div>
          <div className="text-xs opacity-80">Avg Score</div>
        </div>
        <div>
          <div className="text-2xl font-bold">{screenedOn}</div>
          <div className="text-xs opacity-80">Screened On</div>
        </div>
      </div>

      {!screening.loading && results.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No screening results"
          subtitle="Click 'Run AI Screening' to analyze your candidates"
          action={{ label: 'Run AI Screening', onClick: () => void runScreening() }}
        />
      ) : null}

      <div className="flex items-center justify-center">
        <div className="bg-indigo-600 rounded-full p-1 inline-flex gap-1 text-white">
          <button
            type="button"
            onClick={() => setShortlist(10)}
            className={[
              'px-4 py-2 rounded-full text-sm font-semibold transition-colors',
              shortlist === 10 ? 'bg-white text-indigo-700' : 'bg-transparent text-white/90 hover:bg-white/10',
            ].join(' ')}
          >
            Top 10
          </button>
          <button
            type="button"
            onClick={() => setShortlist(20)}
            className={[
              'px-4 py-2 rounded-full text-sm font-semibold transition-colors',
              shortlist === 20 ? 'bg-white text-indigo-700' : 'bg-transparent text-white/90 hover:bg-white/10',
            ].join(' ')}
          >
            Top 20
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {visibleResults.map((r, idx) => (
          <ResultCard key={r._id} result={r} animationDelay={idx * 100} />
        ))}
      </div>
    </div>
  );
}
