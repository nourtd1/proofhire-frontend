'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Shield,
  Target,
  Timer,
} from 'lucide-react'
import api, { getApiErrorMessage } from '@/lib/api'
import type { RootState, AppDispatch } from '@/store'
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
} from '@/store/slices/testSlice'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorMessage from '@/components/ui/ErrorMessage'
import VerifiedBadge from '@/components/ui/VerifiedBadge'
import { useTestTimer } from '@/hooks/useTestTimer'

type ApiSuccess<T> = { success: true; data: T; message?: string }
type ApiError = { success: false; message: string }

type TestQuestion = RootState['test']['questions'][number]

type GenerateResponse = { testId: string; questions: TestQuestion[] }

type GetTestInProgress = {
  _id: string
  applicantId: string
  jobId: string
  status: 'pending' | 'in_progress'
  answers: number[]
  timeLeft: number
  startedAt?: string
  createdAt: string
  questions: TestQuestion[]
}

type SubmitResponse = {
  score: number
  passed: boolean
  correctCount: number
  totalQuestions: number
  message: string
  breakdown: {
    questionId: string
    skill: string
    correct: boolean
    yourAnswer: number
    correctAnswer: number
  }[]
}

type GetTestCompleted = {
  _id: string
  applicantId: string
  jobId: string
  status: 'completed'
  score: number
  passed: boolean
  answers: number[]
  startedAt?: string
  completedAt?: string
  createdAt: string
  questions: TestQuestion[]
  result: SubmitResponse
}

const difficultyPill = (d: TestQuestion['difficulty']): string => {
  if (d === 'easy') return 'bg-emerald-100 text-emerald-700 border border-emerald-200'
  if (d === 'medium') return 'bg-amber-100 text-amber-700 border border-amber-200'
  return 'bg-red-100 text-red-700 border border-red-200'
}

const timerClasses = (timeLeft: number): string => {
  if (timeLeft > 120) return 'text-emerald-600'
  if (timeLeft > 60) return 'text-amber-600'
  return 'text-red-600 animate-pulse'
}

const segmentClass = (idx: number, current: number): string => {
  if (idx === current) return 'bg-indigo-600'
  if (idx < current) return 'bg-indigo-200'
  return 'bg-gray-200'
}

const letter = (i: number): string => ['A', 'B', 'C', 'D'][i] ?? ''

export default function TestPage(): React.JSX.Element {
  const router = useRouter()
  const params = useParams<{ applicantId: string }>()
  const searchParams = useSearchParams()
  const applicantId = params.applicantId
  const jobId = searchParams.get('jobId') ?? ''

  const dispatch = useDispatch<AppDispatch>()
  const test = useSelector((s: RootState) => s.test)

  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [showBreakdown, setShowBreakdown] = useState<boolean>(false)

  const uniqueSkills = useMemo(() => {
    const set = new Set<string>()
    test.questions.forEach((q) => set.add(q.skill))
    return [...set]
  }, [test.questions])

  const loadOrGenerate = useCallback(async (): Promise<void> => {
    dispatch(setError(null))
    dispatch(setStatus('generating'))

    try {
      const existing = await api.get<ApiSuccess<GetTestInProgress | GetTestCompleted | null> | ApiError>(
        `/api/tests/${applicantId}`
      )
      if (!existing.data.success) throw new Error(existing.data.message)

      const data = existing.data.data
      if (data && data.status === 'completed') {
        dispatch(setTest({ testId: data._id, questions: data.questions }))
        dispatch(setAnswers(data.answers))
        dispatch(setResult(data.result))
        dispatch(setStatus('completed'))
        return
      }

      if (data && data.status === 'in_progress') {
        dispatch(setTest({ testId: data._id, questions: data.questions }))
        dispatch(setAnswers(data.answers))
        dispatch(setTimeLeft(data.timeLeft))
        dispatch(setStatus('in_progress'))
        return
      }

      if (data && data.status === 'pending') {
        dispatch(setTest({ testId: data._id, questions: data.questions }))
        dispatch(setAnswers(data.answers))
        dispatch(setTimeLeft(300))
        dispatch(setStatus('idle'))
        return
      }

      if (!jobId) {
        throw new Error('Missing jobId in URL. Please open this test from an Applicant card.')
      }

      const gen = await api.post<ApiSuccess<GenerateResponse> | ApiError>('/api/tests/generate', {
        applicantId,
        jobId,
      })
      if (!gen.data.success) throw new Error(gen.data.message)

      dispatch(setTest({ testId: gen.data.data.testId, questions: gen.data.data.questions }))
      dispatch(setStatus('idle'))
    } catch (e: unknown) {
      dispatch(setError(getApiErrorMessage(e)))
      dispatch(setStatus('idle'))
    }
  }, [applicantId, dispatch, jobId])

  useEffect(() => {
    void loadOrGenerate()
  }, [loadOrGenerate])

  const submit = useCallback(
    async (answersOverride?: number[]): Promise<void> => {
      if (!test.testId) return
      dispatch(setStatus('submitting'))
      try {
        const answersToSend = answersOverride ?? test.answers.map((a) => (a === -1 ? 0 : a))
        const res = await api.post<ApiSuccess<SubmitResponse> | ApiError>('/api/tests/submit', {
          testId: test.testId,
          answers: answersToSend,
        })
        if (!res.data.success) throw new Error(res.data.message)
        dispatch(setResult(res.data.data))
        dispatch(setStatus('completed'))
      } catch (e: unknown) {
        dispatch(setError(getApiErrorMessage(e)))
        dispatch(setStatus('in_progress'))
      }
    },
    [dispatch, test.answers, test.testId]
  )

  const { timeLeft, formattedTime } = useTestTimer(() => void submit())

  const startTest = useCallback(async (): Promise<void> => {
    if (!test.testId) return
    dispatch(setError(null))
    try {
      const res = await api.get<ApiSuccess<GetTestInProgress | GetTestCompleted | null> | ApiError>(
        `/api/tests/${applicantId}?start=true`
      )
      if (!res.data.success) throw new Error(res.data.message)
      const data = res.data.data
      if (!data || data.status === 'completed') throw new Error('Unable to start test')
      dispatch(setTimeLeft(data.timeLeft))
      dispatch(setAnswers(data.answers))
      dispatch(setStatus('in_progress'))
    } catch (e: unknown) {
      dispatch(setError(getApiErrorMessage(e)))
    }
  }, [applicantId, dispatch, test.testId])

  const unansweredCount = useMemo(() => test.answers.filter((a) => a === -1).length, [test.answers])

  const current = test.questions[test.currentQuestion]

  const view = useMemo(() => {
    if (test.status === 'generating') return 'generating'
    if (test.status === 'completed' && test.result) return 'results'
    if (test.status === 'in_progress' || test.status === 'submitting') return 'in_progress'
    return 'intro'
  }, [test.result, test.status])

  // State 0 — generating
  if (view === 'generating') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center text-center">
          <LoadingSpinner size="lg" />
          <div className="mt-6 text-lg text-gray-600">Generating your personalized test...</div>
          <div className="mt-2 text-sm text-gray-400">
            Gemini AI is crafting questions based on your declared skills
          </div>
          <div className="mt-4 flex gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.2s]" />
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.1s]" />
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
          </div>
        </div>
      </div>
    )
  }

  // State 3 — results
  if (view === 'results' && test.result) {
    const score = test.result.score
    const radius = 44
    const circumference = 2 * Math.PI * radius
    const dashOffset = circumference * (1 - score / 100)
    const ringColor = score >= 70 ? '#22c55e' : '#ef4444'
    const completedIn = Math.max(0, Math.round((300 - test.timeLeft) / 60))

    return (
      <div className="max-w-lg mx-auto mt-10">
        {test.error ? <ErrorMessage message={test.error} /> : null}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <div className="flex flex-col items-center">
            <div className="relative w-[120px] h-[120px]">
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r={radius} stroke="#e5e7eb" strokeWidth="10" fill="none" />
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
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <div className="text-3xl font-bold text-gray-900">{score}%</div>
              </div>
            </div>

            <div
              className={[
                'mt-6 w-full rounded-xl p-4 flex items-center justify-center gap-3',
                test.result.passed ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800',
              ].join(' ')}
            >
              {test.result.passed ? (
                <>
                  <VerifiedBadge size="md" showLabel={false} />
                  <div className="text-xl font-bold">Profile Verified ✓</div>
                </>
              ) : (
                <div className="text-xl font-bold">Keep Practicing</div>
              )}
            </div>

            <div className="mt-4 text-gray-600 text-center">{test.result.message}</div>

            <div className="mt-6 w-full grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-slate-900">
                  {test.result.correctCount} / {test.result.totalQuestions}
                </div>
                <div className="text-sm text-slate-500">correct answers</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-slate-900">{completedIn}</div>
                <div className="text-sm text-slate-500">minutes</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowBreakdown((v) => !v)}
              className="mt-6 text-indigo-600 font-medium inline-flex items-center gap-2"
            >
              View Detailed Results
              {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showBreakdown ? (
              <div className="mt-4 w-full space-y-3">
                {test.questions.map((q, i) => {
                  const b = test.result?.breakdown[i]
                  const correct = b?.correct === true
                  const your = typeof b?.yourAnswer === 'number' ? b.yourAnswer : -1
                  const corr = typeof b?.correctAnswer === 'number' ? b.correctAnswer : -1
                  return (
                    <div key={q.id} className="border border-slate-100 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-sm font-semibold text-slate-900 pr-2">
                          {i + 1}. {q.question}
                        </div>
                        <div className={correct ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
                          {correct ? '✓' : '✗'}
                        </div>
                      </div>
                      {!correct ? (
                        <div className="mt-3 text-sm">
                          <div className="text-slate-500">
                            Your answer: <span className="font-medium text-slate-800">{letter(your)}</span>
                          </div>
                          <div className="text-emerald-700">
                            Correct answer: <span className="font-semibold">{letter(corr)}</span>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            ) : null}

            <div className="mt-8 w-full flex flex-col gap-3">
              {test.result.passed ? (
                <button
                  type="button"
                  onClick={() => router.push(`/applicants/${jobId}`)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold transition-colors"
                >
                  View My Profile
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void loadOrGenerate()}
                  className="w-full border border-orange-200 text-orange-700 hover:bg-orange-50 py-3 rounded-xl font-semibold transition-colors"
                >
                  Try Again
                </button>
              )}
              <button
                type="button"
                onClick={() => router.push(`/applicants/${jobId}`)}
                className="w-full border border-slate-200 text-slate-700 hover:bg-slate-50 py-3 rounded-xl font-semibold transition-colors"
              >
                Back to Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // State 1 — intro
  if (view === 'intro') {
    return (
      <div className="max-w-lg mx-auto mt-10">
        {test.error ? <ErrorMessage message={test.error} onRetry={() => void loadOrGenerate()} /> : null}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
              <Shield className="w-7 h-7" />
            </div>
            <div className="mt-4 text-2xl font-bold text-slate-900">Skill Verification Test</div>
            <div className="mt-1 text-slate-500">Candidate</div>

            <div className="mt-6 grid grid-cols-3 gap-3 w-full">
              <div className="bg-indigo-50 rounded-lg p-3 text-center">
                <Clock className="w-4 h-4 text-indigo-500 mx-auto" />
                <div className="mt-1 text-sm font-semibold text-slate-900">5 Questions</div>
              </div>
              <div className="bg-indigo-50 rounded-lg p-3 text-center">
                <Timer className="w-4 h-4 text-indigo-500 mx-auto" />
                <div className="mt-1 text-sm font-semibold text-slate-900">5 Minutes</div>
              </div>
              <div className="bg-indigo-50 rounded-lg p-3 text-center">
                <Target className="w-4 h-4 text-indigo-500 mx-auto" />
                <div className="mt-1 text-sm font-semibold text-slate-900">70% to Pass</div>
              </div>
            </div>

            <div className="mt-6 w-full text-left">
              <div className="text-sm font-semibold text-slate-700">Skills being tested:</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {uniqueSkills.length === 0 ? (
                  <span className="text-sm text-slate-400">—</span>
                ) : (
                  uniqueSkills.map((s) => (
                    <span key={s} className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full">
                      {s}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="mt-6 w-full text-left">
              <ul className="text-sm text-slate-600 space-y-2">
                <li>• Read each question carefully before answering</li>
                <li>• You can navigate between questions freely</li>
                <li>• Timer starts when you click Start Test</li>
                <li>• You need 70% or more to earn the Verified badge</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => void startTest()}
              className="mt-8 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold transition-colors"
            >
              Start Test →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // State 2 — in progress
  if (!current) {
    return (
      <div className="max-w-lg mx-auto mt-10">
        <ErrorMessage message="No questions loaded. Please refresh." onRetry={() => void loadOrGenerate()} />
      </div>
    )
  }

  const selected = test.answers[test.currentQuestion]
  const allAnswered = unansweredCount === 0

  return (
    <div className="max-w-2xl mx-auto">
      {test.error ? <ErrorMessage message={test.error} /> : null}

      <div className="sticky top-0 z-10 bg-[#f8fafc] pt-4 pb-3">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm font-semibold text-slate-700">
            Question {test.currentQuestion + 1} of 5{' '}
            <span className="ml-2 bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
              {current.skill}
            </span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={['h-2 w-10 rounded-full', segmentClass(i, test.currentQuestion)].join(' ')} />
            ))}
          </div>
          <div className={['font-mono text-sm font-bold', timerClasses(timeLeft)].join(' ')}>{formattedTime}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 mt-4">
        <div className="flex items-start justify-between gap-4">
          <span className={['text-xs font-semibold px-2 py-1 rounded-full', difficultyPill(current.difficulty)].join(' ')}>
            {current.difficulty === 'easy' ? 'Easy' : current.difficulty === 'medium' ? 'Medium' : 'Hard'}
          </span>
        </div>

        <div className="mt-4 text-xl font-medium text-gray-800 leading-relaxed">{current.question}</div>

        <div className="mt-6 space-y-3">
          {current.options.map((opt, idx) => {
            const isSelected = selected === idx
            return (
              <button
                key={idx}
                type="button"
                onClick={() => dispatch(selectAnswer({ questionIndex: test.currentQuestion, answerIndex: idx }))}
                className={[
                  'w-full text-left flex items-start gap-3 p-4 rounded-xl border transition-all duration-150',
                  isSelected
                    ? 'border-2 border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50',
                ].join(' ')}
              >
                <span
                  className={[
                    'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0',
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700',
                  ].join(' ')}
                >
                  {letter(idx)}
                </span>
                <span className={isSelected ? 'font-medium' : ''}>{opt}</span>
              </button>
            )
          })}
        </div>

        <div className="mt-8 flex items-center justify-between gap-4">
          <button
            type="button"
            disabled={test.currentQuestion === 0}
            onClick={() => dispatch(prevQuestion())}
            className={[
              'px-4 py-2 rounded-lg font-semibold border transition-colors',
              test.currentQuestion === 0
                ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50',
            ].join(' ')}
          >
            ← Previous
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => {
              const answered = test.answers[i] !== -1
              const currentDot = i === test.currentQuestion
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => dispatch(setCurrentQuestion(i))}
                  className={[
                    'w-3 h-3 rounded-full border',
                    currentDot ? 'border-indigo-600' : 'border-slate-300',
                    answered ? 'bg-indigo-600' : 'bg-transparent',
                  ].join(' ')}
                  title={answered ? 'Answered' : 'Unanswered'}
                />
              )
            })}
          </div>

          {test.currentQuestion < 4 ? (
            <button
              type="button"
              onClick={() => dispatch(nextQuestion())}
              className="px-4 py-2 rounded-lg font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Next →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (allAnswered) {
                  void submit()
                } else {
                  setShowConfirm(true)
                }
              }}
              className="px-4 py-2 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
              disabled={test.status === 'submitting'}
            >
              {test.status === 'submitting' ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Submitting...
                </span>
              ) : (
                'Submit Test'
              )}
            </button>
          )}
        </div>
      </div>

      {showConfirm ? (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-lg font-bold text-slate-900">Submit anyway?</div>
                <div className="mt-1 text-sm text-slate-600">
                  You have <span className="font-semibold">{unansweredCount}</span> unanswered questions. Submit anyway?
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 border border-slate-200 text-slate-700 hover:bg-slate-50 py-2.5 rounded-xl font-semibold transition-colors"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirm(false)
                  void submit()
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-semibold transition-colors"
              >
                Submit Anyway
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

