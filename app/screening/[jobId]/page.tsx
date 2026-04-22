'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeft,
  BriefcaseBusiness,
  RefreshCw,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import api, { getApiErrorMessage } from '@/lib/api';
import type { AppDispatch, RootState } from '@/store';
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

const toIsoString = (value: string | Date | undefined): string => {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') return value;
  return value.toISOString();
};

const normalizeJob = (raw: BackendJob): JobWithExtras => {
  const id = typeof raw.id === 'string' ? raw.id : typeof raw._id === 'string' ? raw._id : '';

  return {
    id,
    title: typeof raw.title === 'string' ? raw.title : '',
    description: typeof raw.description === 'string' ? raw.description : '',
    requirements: Array.isArray(raw.requirements)
      ? raw.requirements.filter((item): item is string => typeof item === 'string')
      : [],
    status: raw.status ?? 'Open',
    createdAt: toIsoString(raw.createdAt),
    updatedAt: toIsoString(raw.updatedAt),
    skills: Array.isArray(raw.skills) ? raw.skills.filter((item): item is string => typeof item === 'string') : [],
    experienceLevel: typeof raw.experienceLevel === 'string' ? raw.experienceLevel : '',
  };
};

const formatDate = (value: string | undefined): string => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(date);
};

const isValidMongoObjectId = (id: string | undefined): id is string =>
  typeof id === 'string' && /^[a-f0-9]{24}$/i.test(id);

export default function ScreeningJobPage(): React.JSX.Element {
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId;
  const router = useRouter();

  const dispatch = useDispatch<AppDispatch>();
  const job = useSelector((state: RootState) => state.jobs.jobs.find((item) => item.id === jobId)) as
    | JobWithExtras
    | undefined;
  const applicants = useSelector((state: RootState) => state.applicants.applicants);
  const screening = useSelector((state: RootState) => state.screening);

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
      dispatch(setApplicants(applicantsRes.data.data as RootState['applicants']['applicants']));

      const results = resultsRes.data.data ?? [];
      dispatch(setResults(results));
      dispatch(setTriggered(results.length > 0));
    } catch (error: unknown) {
      dispatch(setError(getApiErrorMessage(error)));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, jobId]);

  useEffect(() => {
    const timeout = setTimeout(() => void fetchAll(), 0);
    return () => clearTimeout(timeout);
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
      const response = await api.post<ApiSuccess<ScreeningResultWithApplicant[]> | ApiError>(
        '/api/screening/run',
        { jobId }
      );

      if (!response.data.success) throw new Error(response.data.message);

      dispatch(setResults(response.data.data));
      dispatch(setTriggered(true));
      setStatusMessage(
        typeof response.data.message === 'string' ? response.data.message : 'Screening completed successfully.'
      );
    } catch (error: unknown) {
      dispatch(setError(getApiErrorMessage(error)));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, jobId]);

  const results = screening.results;
  const hasResults = results.length > 0;
  const applicantCount = applicants.length;
  const hasApplicants = applicantCount > 0;
  const topHireCount = useMemo(
    () => results.filter((result) => result.recommendation === 'Hire').length,
    [results]
  );
  const avgScore = useMemo(() => {
    if (results.length === 0) return 0;
    return Math.round(results.reduce((total, result) => total + result.matchScore, 0) / results.length);
  }, [results]);
  const screenedOn = useMemo(() => formatDate(results[0]?.createdAt), [results]);
  const visibleResults = useMemo(() => results.slice(0, shortlist), [results, shortlist]);

  const jobSkills = useMemo(
    () => (Array.isArray(job?.skills) ? job.skills.filter((skill): skill is string => Boolean(skill)) : []),
    [job?.skills]
  );

  if (!hasResults && !screening.triggered) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        {screening.error ? <ErrorMessage message={screening.error} onRetry={() => void fetchAll()} /> : null}

        <section className="overflow-hidden rounded-[32px] bg-slate-950 text-white shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
                <Sparkles className="h-3.5 w-3.5" />
                AI Screening Workspace
              </div>

              <div>
                <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  {job?.title ?? 'Launch AI screening for this role'}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                  Review every candidate in one run. ProofHire compares each profile against the role, ranks the
                  shortlist, and returns strengths, gaps, and a recruiter-ready recommendation.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-slate-200">
                {job?.experienceLevel ? (
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">
                    Level: {job.experienceLevel}
                  </span>
                ) : null}
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">
                  Candidates ready: {applicantCount}
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">
                  Ranking: Top 10 or Top 20
                </span>
              </div>

              {jobSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {jobSkills.slice(0, 6).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-indigo-400/30 bg-indigo-500/15 px-3 py-1 text-xs font-medium text-indigo-100"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                {!screening.loading ? (
                  <button
                    type="button"
                    onClick={() => void runScreening()}
                    disabled={!hasApplicants}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <Zap className="h-5 w-5" />
                    Run AI Screening
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm text-slate-100">
                    <LoadingSpinner size="sm" />
                    Screening in progress. This usually takes 15 to 30 seconds.
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => router.push(`/applicants/${jobId}`)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-medium text-white transition hover:bg-white/10"
                >
                  <Users className="h-4 w-4" />
                  Manage Candidates
                </button>
              </div>

              {!hasApplicants ? (
                <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-4 text-sm text-amber-100">
                  Add at least one candidate before launching screening for this role.
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">How it works</div>
                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm font-semibold text-white">1. Candidate intake</div>
                    <div className="mt-1 text-sm text-slate-300">Structured JSON profiles or CSV import.</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm font-semibold text-white">2. AI review</div>
                    <div className="mt-1 text-sm text-slate-300">Gemini evaluates every profile against the role.</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm font-semibold text-white">3. Ranking output</div>
                    <div className="mt-1 text-sm text-slate-300">
                      You get scores, recommendation, strengths, and hiring gaps.
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/20 to-cyan-400/10 p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Recruiter value</div>
                <div className="mt-4 text-2xl font-semibold text-white">Fast shortlist, human decision.</div>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  ProofHire accelerates screening, but the final hiring call stays in the recruiter’s hands.
                </p>
                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-slate-200">
                  <BriefcaseBusiness className="h-3.5 w-3.5" />
                  Backup scoring is available if the AI provider is temporarily unavailable.
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="overflow-hidden rounded-[32px] bg-slate-950 text-white shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
        <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
          <div className="space-y-6">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Jobs
            </Link>

            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
                <Sparkles className="h-3.5 w-3.5" />
                Screening Results
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {job?.title ?? 'AI Screening Results'}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Review the ranked shortlist, compare fit scores, and decide which candidates should move to the next
                stage.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-slate-200">
              {job?.experienceLevel ? (
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">
                  Level: {job.experienceLevel}
                </span>
              ) : null}
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">
                Candidates analyzed: {results.length}
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">
                Last run: {screenedOn}
              </span>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => void runScreening()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                <RefreshCw className="h-4 w-4" />
                Re-run Screening
              </button>

              <button
                type="button"
                onClick={() => router.push(`/applicants/${jobId}`)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-medium text-white transition hover:bg-white/10"
              >
                <Users className="h-4 w-4" />
                Open Candidate Workspace
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Average fit</div>
              <div className="mt-3 text-4xl font-semibold text-white">{avgScore}/100</div>
              <div className="mt-2 text-sm text-slate-300">Overall match quality across the full shortlist.</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Hire signals</div>
              <div className="mt-3 text-4xl font-semibold text-white">{topHireCount}</div>
              <div className="mt-2 text-sm text-slate-300">Candidates currently recommended as “Hire”.</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Profiles reviewed</div>
              <div className="mt-3 text-4xl font-semibold text-white">{results.length}</div>
              <div className="mt-2 text-sm text-slate-300">The AI processed the full candidate batch in one run.</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/20 to-cyan-400/10 p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">Shortlist view</div>
              <div className="mt-3 text-4xl font-semibold text-white">Top {shortlist}</div>
              <div className="mt-2 text-sm text-slate-200">Switch between a focused top 10 and an expanded top 20.</div>
            </div>
          </div>
        </div>
      </section>

      {screening.error ? <ErrorMessage message={screening.error} onRetry={() => void fetchAll()} /> : null}
      {statusMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {statusMessage}
        </div>
      ) : null}

      {!screening.loading && results.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No screening results yet"
          subtitle="Run AI screening to generate a ranked shortlist for this role."
          action={{ label: 'Run AI Screening', onClick: () => void runScreening() }}
        />
      ) : null}

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Ranked shortlist</div>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Review the best-fit candidates first</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
              Each card includes match score, recommendation, strengths, gaps, and a direct path to candidate
              verification.
            </p>
          </div>

          <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setShortlist(10)}
              className={[
                'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                shortlist === 10 ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900',
              ].join(' ')}
            >
              Top 10
            </button>
            <button
              type="button"
              onClick={() => setShortlist(20)}
              className={[
                'rounded-full px-4 py-2 text-sm font-semibold transition-colors',
                shortlist === 20 ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900',
              ].join(' ')}
            >
              Top 20
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {visibleResults.map((result, index) => (
            <ResultCard key={result._id} result={result} animationDelay={index * 100} />
          ))}
        </div>
      </section>
    </div>
  );
}
