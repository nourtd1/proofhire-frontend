import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Applicant } from '../../types';

interface ApplicantsState {
  applicants: Applicant[];
  loading: boolean;
  error: string | null;
}

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
      state.applicants = action.payload;
    },
    addApplicant: (state, action: PayloadAction<Applicant>) => {
      state.applicants.push(action.payload);
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
