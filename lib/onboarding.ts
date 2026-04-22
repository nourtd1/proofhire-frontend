'use client';

export type OnboardingStatus = 'pending' | 'completed' | 'dismissed';

export type OnboardingProgress = {
  startedJobCreation: boolean;
  createdJob: boolean;
};

export const ONBOARDING_STATUS_KEY = 'proofhire-onboarding-state';
export const ONBOARDING_PROGRESS_KEY = 'proofhire-onboarding-progress';
export const ONBOARDING_EVENT = 'proofhire:onboarding:progress';

const DEFAULT_PROGRESS: OnboardingProgress = {
  startedJobCreation: false,
  createdJob: false,
};

export const readOnboardingStatus = (): OnboardingStatus => {
  if (typeof window === 'undefined') return 'pending';
  const value = window.localStorage.getItem(ONBOARDING_STATUS_KEY);
  if (value === 'completed' || value === 'dismissed') return value;
  return 'pending';
};

export const writeOnboardingStatus = (value: Exclude<OnboardingStatus, 'pending'>): void => {
  window.localStorage.setItem(ONBOARDING_STATUS_KEY, value);
};

export const readOnboardingProgress = (): OnboardingProgress => {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;

  try {
    const raw = window.localStorage.getItem(ONBOARDING_PROGRESS_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<OnboardingProgress>;
    return {
      startedJobCreation: parsed.startedJobCreation === true,
      createdJob: parsed.createdJob === true,
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
};

export const writeOnboardingProgress = (value: Partial<OnboardingProgress>): OnboardingProgress => {
  const next = {
    ...readOnboardingProgress(),
    ...value,
  };

  window.localStorage.setItem(ONBOARDING_PROGRESS_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(ONBOARDING_EVENT, { detail: next }));
  return next;
};

export const resetOnboardingSession = (): void => {
  window.localStorage.removeItem(ONBOARDING_STATUS_KEY);
  window.localStorage.setItem(ONBOARDING_PROGRESS_KEY, JSON.stringify(DEFAULT_PROGRESS));
  window.dispatchEvent(new CustomEvent(ONBOARDING_EVENT, { detail: DEFAULT_PROGRESS }));
};
