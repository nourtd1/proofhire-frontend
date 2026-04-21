import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Job } from '../../types';

interface JobsState {
  jobs: Job[];
  loading: boolean;
  error: string | null;
}

const dedupeJobs = (jobs: Job[]): Job[] => {
  const byId = new Map<string, Job>()

  for (const job of jobs) {
    if (!job.id) continue
    byId.set(job.id, job)
  }

  return [...byId.values()]
}

const initialState: JobsState = {
  jobs: [],
  loading: false,
  error: null,
};

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    setJobs: (state, action: PayloadAction<Job[]>) => {
      state.jobs = dedupeJobs(action.payload);
    },
    addJob: (state, action: PayloadAction<Job>) => {
      const incoming = action.payload
      if (!incoming.id) return

      const existingIndex = state.jobs.findIndex((job) => job.id === incoming.id)
      if (existingIndex >= 0) {
        state.jobs[existingIndex] = incoming
        return
      }

      state.jobs.push(incoming)
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setJobs, addJob, setLoading, setError } = jobsSlice.actions;
export default jobsSlice.reducer;
