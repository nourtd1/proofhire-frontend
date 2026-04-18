import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ScreeningResultWithApplicant } from '../../types';

interface ScreeningState {
  results: ScreeningResultWithApplicant[];
  loading: boolean;
  error: string | null;
  triggered: boolean;
}

const initialState: ScreeningState = {
  results: [],
  loading: false,
  error: null,
  triggered: false,
};

const screeningSlice = createSlice({
  name: 'screening',
  initialState,
  reducers: {
    setResults: (state, action: PayloadAction<ScreeningResultWithApplicant[]>) => {
      state.results = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setTriggered: (state, action: PayloadAction<boolean>) => {
      state.triggered = action.payload;
    },
  },
});

export const { setResults, setLoading, setError, setTriggered } = screeningSlice.actions;
export default screeningSlice.reducer;
