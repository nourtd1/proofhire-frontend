import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Applicant } from '../../types';

interface ApplicantsState {
  applicants: Applicant[];
  loading: boolean;
  error: string | null;
}

const dedupeApplicants = (applicants: Applicant[]): Applicant[] => {
  const byId = new Map<string, Applicant>();

  for (const applicant of applicants) {
    if (!applicant.id) continue;
    byId.set(applicant.id, applicant);
  }

  return [...byId.values()];
};

const initialState: ApplicantsState = {
  applicants: [],
  loading: false,
  error: null,
};

const applicantsSlice = createSlice({
  name: 'applicants',
  initialState,
  reducers: {
    setApplicants: (state, action: PayloadAction<Applicant[]>) => {
      state.applicants = dedupeApplicants(action.payload);
    },
    addApplicant: (state, action: PayloadAction<Applicant>) => {
      const incoming = action.payload;
      if (!incoming.id) return;

      const existingIndex = state.applicants.findIndex((applicant) => applicant.id === incoming.id);
      if (existingIndex >= 0) {
        state.applicants[existingIndex] = incoming;
        return;
      }

      state.applicants.push(incoming);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setApplicants, addApplicant, setLoading, setError } = applicantsSlice.actions;
export default applicantsSlice.reducer;
