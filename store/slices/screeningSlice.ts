import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ScreeningResult } from '../../types';

interface ScreeningState {
  results: ScreeningResult[];
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
    setResults: (state, action: PayloadAction<ScreeningResult[]>) => {
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
