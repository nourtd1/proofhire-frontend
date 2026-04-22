import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface TestQuestion {
  id: string
  question: string
  options: string[]
  skill: string
  difficulty: 'easy' | 'medium' | 'hard'
}

interface TestResult {
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

interface TestState {
  testId: string | null
  questions: TestQuestion[]
  answers: number[]
  currentQuestion: number
  timeLeft: number
  status: 'idle' | 'generating' | 'in_progress' | 'submitting' | 'completed'
  result: TestResult | null
  error: string | null
}

const initialState: TestState = {
  testId: null,
  questions: [],
  answers: [-1, -1, -1, -1, -1],
  currentQuestion: 0,
  timeLeft: 300,
  status: 'idle',
  result: null,
  error: null,
}

const resetAnswers = (questionCount = 5): number[] => Array.from({ length: Math.max(0, questionCount) }, () => -1)

const normalizeAnswers = (answers: number[], questionCount: number): number[] => {
  const normalized = answers
    .slice(0, questionCount)
    .map((answer) => (Number.isInteger(answer) && answer >= 0 && answer <= 3 ? answer : -1))

  if (normalized.length >= questionCount) return normalized

  return [...normalized, ...resetAnswers(questionCount - normalized.length)]
}

const testSlice = createSlice({
  name: 'test',
  initialState,
  reducers: {
    setTest: (state, action: PayloadAction<{ testId: string; questions: TestQuestion[] }>) => {
      state.testId = action.payload.testId
      state.questions = action.payload.questions
      state.status = 'in_progress'
      state.answers = resetAnswers(action.payload.questions.length)
      state.currentQuestion = 0
      state.timeLeft = 300
      state.result = null
      state.error = null
    },
    selectAnswer: (state, action: PayloadAction<{ questionIndex: number; answerIndex: number }>) => {
      const { questionIndex, answerIndex } = action.payload
      if (questionIndex < 0 || questionIndex >= state.answers.length) return
      state.answers[questionIndex] = answerIndex
    },
    nextQuestion: (state) => {
      state.currentQuestion = Math.min(Math.max(0, state.questions.length - 1), state.currentQuestion + 1)
    },
    prevQuestion: (state) => {
      state.currentQuestion = Math.max(0, state.currentQuestion - 1)
    },
    tickTimer: (state) => {
      state.timeLeft = Math.max(0, state.timeLeft - 1)
    },
    setStatus: (state, action: PayloadAction<TestState['status']>) => {
      state.status = action.payload
    },
    setResult: (state, action: PayloadAction<TestResult>) => {
      state.result = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    resetTest: () => initialState,

    // Additional hydration actions (needed for resume flow)
    setTimeLeft: (state, action: PayloadAction<number>) => {
      state.timeLeft = Math.max(0, action.payload)
    },
    setAnswers: (state, action: PayloadAction<number[]>) => {
      state.answers = normalizeAnswers(action.payload, state.questions.length || 5)
    },
    setCurrentQuestion: (state, action: PayloadAction<number>) => {
      state.currentQuestion = Math.max(0, Math.min(Math.max(0, state.questions.length - 1), action.payload))
    },
  },
})

export const {
  setTest,
  selectAnswer,
  nextQuestion,
  prevQuestion,
  tickTimer,
  setStatus,
  setResult,
  setError,
  resetTest,
  setTimeLeft,
  setAnswers,
  setCurrentQuestion,
} = testSlice.actions

export default testSlice.reducer
