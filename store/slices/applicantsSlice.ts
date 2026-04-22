import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Applicant } from '../../types';

interface ApplicantsState {
  applicants: Applicant[];
  loading: boolean;
  error: string | null;
}

type ApplicantLike = Applicant & { _id?: string };

const getApplicantId = (applicant: ApplicantLike): string => {
  if (typeof applicant.id === 'string' && applicant.id.trim().length > 0) return applicant.id;
  if (typeof applicant._id === 'string' && applicant._id.trim().length > 0) return applicant._id;
  return '';
};

const normalizeApplicant = (applicant: ApplicantLike): Applicant => {
  const resolvedId = getApplicantId(applicant);
  return {
    ...applicant,
    id: resolvedId,
  };
};

const dedupeApplicants = (applicants: Applicant[]): Applicant[] => {
  const byId = new Map<string, Applicant>();

  for (const applicant of applicants as ApplicantLike[]) {
    const normalized = normalizeApplicant(applicant);
    if (!normalized.id) continue;
    byId.set(normalized.id, normalized);
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
      const incoming = normalizeApplicant(action.payload as ApplicantLike);
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
