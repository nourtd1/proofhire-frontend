'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Shield,
  Sparkles,
  Target,
  Timer,
} from 'lucide-react';
import api, { getApiErrorMessage } from '@/lib/api';
import type { AppDispatch, RootState } from '@/store';
import {
  nextQuestion,
  prevQuestion,
  selectAnswer,
  setAnswers,
  setCurrentQuestion,
  setError,
  setResult,
  setStatus,
  setTest,
  setTimeLeft,
} from '@/store/slices/testSlice';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import { useTestTimer } from '@/hooks/useTestTimer';

type ApiSuccess<T> = { success: true; data: T; message?: string };
type ApiError = { success: false; message: string };

type TestQuestion = RootState['test']['questions'][number];

type GenerateResponse = { testId: string; questions: TestQuestion[] };

type ApplicantDetail = {
  _id?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
  };
};

type GetTestInProgress = {
  _id: string;
  applicantId: string;
  jobId: string;
  status: 'pending' | 'in_progress';
  answers: number[];
  timeLeft: number;
  startedAt?: string;
  createdAt: string;
  questions: TestQuestion[];
};

type SubmitResponse = {
  score: number;
  passed: boolean;
  correctCount: number;
  totalQuestions: number;
  message: string;
  breakdown: {
    questionId: string;
    skill: string;
    correct: boolean;
    yourAnswer: number;
    correctAnswer: number;
  }[];
};

type GetTestCompleted = {
  _id: string;
  applicantId: string;
  jobId: string;
  status: 'completed';
  score: number;
  passed: boolean;
  answers: number[];
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  questions: TestQuestion[];
  result: SubmitResponse;
};

const difficultyPill = (difficulty: TestQuestion['difficulty']): string => {
  if (difficulty === 'easy') return 'border border-emerald-200 bg-emerald-100 text-emerald-700';
  if (difficulty === 'medium') return 'border border-amber-200 bg-amber-100 text-amber-700';
  return 'border border-rose-200 bg-rose-100 text-rose-700';
};

const timerClasses = (timeLeft: number): string => {
  if (timeLeft > 120) return 'text-emerald-600';
  if (timeLeft > 60) return 'text-amber-600';
  return 'animate-pulse text-rose-600';
};

const progressSegmentClass = (index: number, current: number): string => {
  if (index === current) return 'bg-indigo-600';
  if (index < current) return 'bg-indigo-200';
  return 'bg-slate-200';
};

const answerLetter = (index: number): string => ['A', 'B', 'C', 'D'][index] ?? '';

export default function TestPage(): React.JSX.Element {
  const router = useRouter();
  const params = useParams<{ applicantId: string }>();
  const searchParams = useSearchParams();
  const applicantId = params.applicantId;
  const jobIdFromQuery = searchParams.get('jobId') ?? '';

  const dispatch = useDispatch<AppDispatch>();
  const test = useSelector((state: RootState) => state.test);

  const [showConfirm, setShowConfirm] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [candidateName, setCandidateName] = useState('Candidate');
  const [resolvedJobId, setResolvedJobId] = useState(jobIdFromQuery);

  const uniqueSkills = useMemo(() => {
    const skills = new Set<string>();
    test.questions.forEach((question) => skills.add(question.skill));
    return [...skills];
  }, [test.questions]);

  const loadOrGenerate = useCallback(async (): Promise<void> => {
    dispatch(setError(null));
    dispatch(setStatus('generating'));

    try {
      const existing = await api.get<ApiSuccess<GetTestInProgress | GetTestCompleted | null> | ApiError>(
        `/api/tests/${applicantId}`
      );

      if (!existing.data.success) throw new Error(existing.data.message);

      const data = existing.data.data;

      if (data && data.status === 'completed') {
        setResolvedJobId(data.jobId);
        dispatch(setTest({ testId: data._id, questions: data.questions }));
        dispatch(setAnswers(data.answers));
        dispatch(setResult(data.result));
        dispatch(setStatus('completed'));
        return;
      }

      if (data && data.status === 'in_progress') {
        setResolvedJobId(data.jobId);
        dispatch(setTest({ testId: data._id, questions: data.questions }));
        dispatch(setAnswers(data.answers));
        dispatch(setTimeLeft(data.timeLeft));
        dispatch(setStatus('in_progress'));
        return;
      }

      if (data && data.status === 'pending') {
        setResolvedJobId(data.jobId);
        dispatch(setTest({ testId: data._id, questions: data.questions }));
        dispatch(setAnswers(data.answers));
        dispatch(setTimeLeft(300));
        dispatch(setStatus('idle'));
        return;
      }

      if (!jobIdFromQuery) {
        throw new Error('Missing jobId in the URL. Please open this test from an applicant card.');
      }

      const generated = await api.post<ApiSuccess<GenerateResponse> | ApiError>('/api/tests/generate', {
        applicantId,
        jobId: jobIdFromQuery,
      });

      if (!generated.data.success) throw new Error(generated.data.message);

      setResolvedJobId(jobIdFromQuery);
      dispatch(setTest({ testId: generated.data.data.testId, questions: generated.data.data.questions }));
      dispatch(setStatus('idle'));
    } catch (error: unknown) {
      dispatch(setError(getApiErrorMessage(error)));
      dispatch(setStatus('idle'));
    }
  }, [applicantId, dispatch, jobIdFromQuery]);

  useEffect(() => {
    void loadOrGenerate();
  }, [loadOrGenerate]);

  useEffect(() => {
    let cancelled = false;

    const loadApplicant = async (): Promise<void> => {
      try {
        const response = await api.get<ApiSuccess<ApplicantDetail> | ApiError>(`/api/applicants/detail/${applicantId}`);
        if (!response.data.success) throw new Error(response.data.message);
        const profile = response.data.data.profile;
        const name = `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim() || 'Candidate';
        if (!cancelled) setCandidateName(name);
      } catch {
        if (!cancelled) setCandidateName('Candidate');
      }
    };

    void loadApplicant();

    return () => {
      cancelled = true;
    };
  }, [applicantId]);

  const submit = useCallback(
    async (answersOverride?: number[]): Promise<void> => {
      if (!test.testId) return;

      dispatch(setStatus('submitting'));

      try {
        const answersToSend = answersOverride ?? test.answers.map((answer) => (answer === -1 ? 0 : answer));
        const response = await api.post<ApiSuccess<SubmitResponse> | ApiError>('/api/tests/submit', {
          testId: test.testId,
          answers: answersToSend,
        });

        if (!response.data.success) throw new Error(response.data.message);

        dispatch(setResult(response.data.data));
        dispatch(setStatus('completed'));
      } catch (error: unknown) {
        dispatch(setError(getApiErrorMessage(error)));
        dispatch(setStatus('in_progress'));
      }
    },
    [dispatch, test.answers, test.testId]
  );

  const { timeLeft, formattedTime } = useTestTimer(() => void submit());

  const startTest = useCallback(async (): Promise<void> => {
    if (!test.testId) return;

    dispatch(setError(null));

    try {
      const response = await api.get<ApiSuccess<GetTestInProgress | GetTestCompleted | null> | ApiError>(
        `/api/tests/${applicantId}?start=true`
      );

      if (!response.data.success) throw new Error(response.data.message);

      const data = response.data.data;
      if (!data || data.status === 'completed') throw new Error('Unable to start test');

      dispatch(setTimeLeft(data.timeLeft));
      dispatch(setAnswers(data.answers));
      dispatch(setStatus('in_progress'));
    } catch (error: unknown) {
      dispatch(setError(getApiErrorMessage(error)));
    }
  }, [applicantId, dispatch, test.testId]);

  const unansweredCount = useMemo(() => test.answers.filter((answer) => answer === -1).length, [test.answers]);
  const answeredCount = test.answers.length - unansweredCount;
  const currentQuestion = test.questions[test.currentQuestion];

  const view = useMemo(() => {
    if (test.status === 'generating') return 'generating';
    if (test.status === 'completed' && test.result) return 'results';
    if (test.status === 'in_progress' || test.status === 'submitting') return 'in_progress';
    return 'intro';
  }, [test.result, test.status]);

  if (view === 'generating') {
    return (
      <div className="mx-auto flex min-h-[72vh] max-w-3xl items-center justify-center px-4">
        <div className="w-full rounded-[32px] bg-slate-950 p-8 text-center text-white shadow-[0_30px_90px_rgba(15,23,42,0.18)] sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 text-white">
            <Sparkles className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">Preparing your skill verification test</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
            ProofHire is generating five targeted questions from your declared skills so the recruiter can verify your
            profile with confidence.
          </p>

          <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-200">
            <LoadingSpinner size="sm" />
            Building your personalized test now
          </div>

          <div className="mt-6 flex justify-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-300 animate-bounce [animation-delay:-0.2s]" />
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-300 animate-bounce [animation-delay:-0.1s]" />
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-300 animate-bounce" />
          </div>
        </div>
      </div>
    );
  }

  if (view === 'results' && test.result) {
    const score = test.result.score;
    const radius = 44;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - score / 100);
    const ringColor = score >= 70 ? '#22c55e' : '#ef4444';
    const completedInMinutes = Math.max(0, Math.round((300 - test.timeLeft) / 60));

    return (
      <div className="mx-auto max-w-4xl space-y-6">
        {test.error ? <ErrorMessage message={test.error} /> : null}

        <section className="overflow-hidden rounded-[32px] bg-slate-950 text-white shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:p-10">
            <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
              <div className="relative h-[120px] w-[120px]">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r={radius} stroke="#334155" strokeWidth="10" fill="none" />
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    stroke={ringColor}
                    strokeWidth="10"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    transform="rotate(-90 60 60)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-3xl font-semibold text-white">{score}%</div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Score</div>
                </div>
              </div>

              <div
                className={[
                  'mt-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold',
                  test.result.passed ? 'bg-emerald-500/15 text-emerald-200' : 'bg-rose-500/15 text-rose-200',
                ].join(' ')}
              >
                {test.result.passed ? <VerifiedBadge size="sm" showLabel={false} /> : <Shield className="h-4 w-4" />}
                {test.result.passed ? 'Verified Candidate' : 'Needs Improvement'}
              </div>
            </div>

            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Test Results
              </div>

              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{candidateName}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">{test.result.message}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Correct answers</div>
                  <div className="mt-2 text-2xl font-semibold text-white">
                    {test.result.correctCount}/{test.result.totalQuestions}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Completion time</div>
                  <div className="mt-2 text-2xl font-semibold text-white">{completedInMinutes} min</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Pass mark</div>
                  <div className="mt-2 text-2xl font-semibold text-white">70%</div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {test.result.passed ? (
                  <button
                    type="button"
                    onClick={() => router.push(`/applicants/${resolvedJobId}?applicantId=${applicantId}`)}
                    className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-slate-100"
                  >
                    View My Profile
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void loadOrGenerate()}
                    className="inline-flex items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-500/10 px-5 py-3 font-semibold text-amber-100 transition hover:bg-amber-500/15"
                  >
                    Try Again
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => router.push(`/applicants/${resolvedJobId}?applicantId=${applicantId}`)}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-medium text-white transition hover:bg-white/10"
                >
                  Back to Profile
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <button
            type="button"
            onClick={() => setShowBreakdown((value) => !value)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700"
          >
            View detailed answers
            {showBreakdown ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showBreakdown ? (
            <div className="mt-5 space-y-3">
              {test.questions.map((question, index) => {
                const breakdown = test.result?.breakdown[index];
                const isCorrect = breakdown?.correct === true;
                const yourAnswer = typeof breakdown?.yourAnswer === 'number' ? breakdown.yourAnswer : -1;
                const correctAnswer = typeof breakdown?.correctAnswer === 'number' ? breakdown.correctAnswer : -1;

                return (
                  <div key={question.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="pr-2 text-sm font-semibold text-slate-900">
                        {index + 1}. {question.question}
                      </div>
                      <div className={isCorrect ? 'font-bold text-emerald-600' : 'font-bold text-rose-600'}>
                        {isCorrect ? 'OK' : 'KO'}
                      </div>
                    </div>

                    {!isCorrect ? (
                      <div className="mt-3 space-y-1 text-sm">
                        <div className="text-slate-600">
                          Your answer: <span className="font-medium text-slate-900">{answerLetter(yourAnswer)}</span>
                        </div>
                        <div className="text-emerald-700">
                          Correct answer: <span className="font-semibold">{answerLetter(correctAnswer)}</span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
        </section>
      </div>
    );
  }

  if (view === 'intro') {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        {test.error ? <ErrorMessage message={test.error} onRetry={() => void loadOrGenerate()} /> : null}

        <section className="overflow-hidden rounded-[32px] bg-slate-950 text-white shadow-[0_30px_90px_rgba(15,23,42,0.18)]">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:p-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
                <Shield className="h-3.5 w-3.5" />
                Skill Verification Test
              </div>

              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{candidateName}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                  Answer five short questions tailored to your declared skills. Passing this test adds the verified
                  badge to your profile for the recruiter.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                  <Clock className="mx-auto h-4 w-4 text-indigo-200" />
                  <div className="mt-2 text-base font-semibold text-white">5 Questions</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                  <Timer className="mx-auto h-4 w-4 text-indigo-200" />
                  <div className="mt-2 text-base font-semibold text-white">5 Minutes</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                  <Target className="mx-auto h-4 w-4 text-indigo-200" />
                  <div className="mt-2 text-base font-semibold text-white">70% to Pass</div>
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-slate-200">Skills being tested</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {uniqueSkills.length === 0 ? (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                      Skills will appear here
                    </span>
                  ) : (
                    uniqueSkills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full border border-indigo-400/30 bg-indigo-500/15 px-3 py-1 text-xs font-medium text-indigo-100"
                      >
                        {skill}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => void startTest()}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-slate-100 sm:w-auto"
              >
                Start Test
              </button>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Before you begin</div>
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-semibold text-white">Read carefully</div>
                  <p className="mt-1 text-sm text-slate-300">Take a moment on each question before you answer.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-semibold text-white">Navigate freely</div>
                  <p className="mt-1 text-sm text-slate-300">You can move back and forth between questions any time.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-semibold text-white">Verification matters</div>
                  <p className="mt-1 text-sm text-slate-300">
                    A passing score helps recruiters trust that your declared skills are real.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="mx-auto mt-10 max-w-lg">
        <ErrorMessage message="No questions loaded. Please refresh." onRetry={() => void loadOrGenerate()} />
      </div>
    );
  }

  const selectedAnswer = test.answers[test.currentQuestion];
  const allAnswered = unansweredCount === 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {test.error ? <ErrorMessage message={test.error} /> : null}

      <section className="sticky top-[88px] z-10 rounded-[28px] border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur sm:p-5 lg:top-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Candidate test</div>
            <div className="mt-1 text-xl font-semibold text-slate-950">{candidateName}</div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span>
                Question {test.currentQuestion + 1} of {test.questions.length}
              </span>
              <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700">
                {currentQuestion.skill}
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Progress</div>
              <div className="mt-1 text-lg font-semibold text-slate-950">
                {answeredCount}/{test.questions.length}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Remaining</div>
              <div className="mt-1 text-lg font-semibold text-slate-950">{unansweredCount}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Timer</div>
              <div className={['mt-1 font-mono text-lg font-semibold', timerClasses(timeLeft)].join(' ')}>
                {formattedTime}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          {Array.from({ length: test.questions.length }).map((_, index) => (
            <div key={index} className={['h-2 flex-1 rounded-full', progressSegmentClass(index, test.currentQuestion)].join(' ')} />
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <span
            className={[
              'rounded-full px-2.5 py-1 text-xs font-semibold',
              difficultyPill(currentQuestion.difficulty),
            ].join(' ')}
          >
            {currentQuestion.difficulty === 'easy'
              ? 'Easy'
              : currentQuestion.difficulty === 'medium'
                ? 'Medium'
                : 'Hard'}
          </span>
        </div>

        <h2 className="mt-5 text-2xl font-semibold leading-tight text-slate-950">{currentQuestion.question}</h2>

        <div className="mt-6 space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === index;

            return (
              <button
                key={index}
                type="button"
                onClick={() => dispatch(selectAnswer({ questionIndex: test.currentQuestion, answerIndex: index }))}
                className={[
                  'flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-150',
                  isSelected
                    ? 'border-2 border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50',
                ].join(' ')}
              >
                <span
                  className={[
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-bold',
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700',
                  ].join(' ')}
                >
                  {answerLetter(index)}
                </span>
                <span className={isSelected ? 'font-medium' : 'text-slate-800'}>{option}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <button
            type="button"
            disabled={test.currentQuestion === 0}
            onClick={() => dispatch(prevQuestion())}
            className={[
              'rounded-2xl border px-4 py-3 font-semibold transition-colors',
              test.currentQuestion === 0
                ? 'cursor-not-allowed border-slate-200 text-slate-300'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50',
            ].join(' ')}
          >
            Previous
          </button>

          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: test.questions.length }).map((_, index) => {
              const answered = test.answers[index] !== -1;
              const isCurrent = index === test.currentQuestion;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => dispatch(setCurrentQuestion(index))}
                  className={[
                    'h-3.5 w-3.5 rounded-full border transition-colors',
                    isCurrent ? 'border-indigo-600' : 'border-slate-300',
                    answered ? 'bg-indigo-600' : 'bg-transparent',
                  ].join(' ')}
                  title={answered ? 'Answered' : 'Unanswered'}
                  aria-label={`Question ${index + 1} ${answered ? 'answered' : 'unanswered'}`}
                />
              );
            })}
          </div>

          {test.currentQuestion < test.questions.length - 1 ? (
            <button
              type="button"
              onClick={() => dispatch(nextQuestion())}
              className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (allAnswered) {
                  void submit();
                } else {
                  setShowConfirm(true);
                }
              }}
              disabled={test.status === 'submitting'}
              className="rounded-2xl bg-indigo-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
            >
              {test.status === 'submitting' ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Submitting...
                </span>
              ) : (
                'Submit Test'
              )}
            </button>
          )}
        </div>
      </section>

      {showConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-lg font-semibold text-slate-950">Submit anyway?</div>
                <div className="mt-1 text-sm text-slate-600">
                  You still have <span className="font-semibold">{unansweredCount}</span> unanswered questions.
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="rounded-2xl border border-slate-200 py-2.5 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirm(false);
                  void submit();
                }}
                className="rounded-2xl bg-indigo-600 py-2.5 font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                Submit Anyway
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
