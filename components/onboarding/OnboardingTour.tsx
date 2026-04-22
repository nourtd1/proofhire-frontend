'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Sparkles, X } from 'lucide-react';
import {
  ONBOARDING_EVENT,
  type OnboardingProgress,
  readOnboardingProgress,
  readOnboardingStatus,
  resetOnboardingSession,
  writeOnboardingStatus,
} from '@/lib/onboarding';

type TourStep = {
  route: string;
  target: string;
  title: string;
  description: string;
  cta: string;
  requirement?: keyof OnboardingProgress;
  lockedMessage?: string;
};

type HighlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const TOUR_STEPS: TourStep[] = [
  {
    route: '/dashboard',
    target: '[data-onboarding="dashboard-next-steps"]',
    title: 'Here is the workflow you will follow',
    description: 'ProofHire guides recruiters through one clear sequence: create a role, add candidates, then run screening and verification.',
    cta: 'Next: create a job',
  },
  {
    route: '/dashboard',
    target: '[data-onboarding="dashboard-create-job"]',
    title: 'Start here: create your first job',
    description: 'Click the highlighted button to open the job creation form. Fill in the title, description, experience level and required skills.',
    cta: 'Next: job form',
  },
  {
    route: '/jobs/new',
    target: '[data-onboarding="job-form"]',
    title: 'Set up the role details here',
    description: 'Fill in the title, description, experience level, required skills, and requirements, then submit the form to create your first job.',
    cta: 'Next: applicants',
  },
  {
    route: '/applicants',
    target: '[data-onboarding="applicants-workspace"]',
    title: 'This is where you manage applications',
    description: 'Once a job exists, open its applicant workspace to add candidate profiles, import CSVs, and prepare people for screening.',
    cta: 'Next: AI screening',
  },
  {
    route: '/screening',
    target: '[data-onboarding="screening-workspace"]',
    title: 'Run AI screening from here',
    description: 'After jobs and applicants are ready, this area helps you move into ranking, review, and decision support.',
    cta: 'Finish onboarding',
  },
];


const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export default function OnboardingTour(): React.JSX.Element | null {
  const pathname = usePathname();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null);
  const [progress, setProgress] = useState<OnboardingProgress>({
    startedJobCreation: false,
    createdJob: false,
  });

  const currentStep = TOUR_STEPS[stepIndex];
  const isLastStep = stepIndex === TOUR_STEPS.length - 1;
  const isStepUnlocked = currentStep.requirement ? progress[currentStep.requirement] : true;

  const cardStyle = useMemo(() => {
    if (!highlightRect || typeof window === 'undefined') {
      return { bottom: 24, right: 24 } as const;
    }

    const cardWidth = Math.min(380, window.innerWidth - 32);
    const preferredTop = highlightRect.top + highlightRect.height + 20;
    const maxTop = Math.max(16, window.innerHeight - 280);
    const top = clamp(preferredTop, 16, maxTop);

    return {
      top,
      left: clamp(highlightRect.left, 16, Math.max(16, window.innerWidth - cardWidth - 16)),
      width: cardWidth,
    };
  }, [highlightRect]);

  useEffect(() => {
    setIsMounted(true);
    setProgress(readOnboardingProgress());
    if (readOnboardingStatus() === 'pending') {
      setShowWelcome(true);
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const startTour = (): void => {
      setShowWelcome(false);
      setStepIndex(0);
      setIsActive(true);
    };

    const handleExternalStart = (): void => {
      resetOnboardingSession();
      setProgress(readOnboardingProgress());
      startTour();
    };

    const handleProgressChange = (event: Event): void => {
      const next = (event as CustomEvent<OnboardingProgress>).detail ?? readOnboardingProgress();
      setProgress(next);
    };

    window.addEventListener('proofhire:onboarding:start', handleExternalStart as EventListener);
    window.addEventListener(ONBOARDING_EVENT, handleProgressChange as EventListener);
    return () => {
      window.removeEventListener('proofhire:onboarding:start', handleExternalStart as EventListener);
      window.removeEventListener(ONBOARDING_EVENT, handleProgressChange as EventListener);
    };
  }, [isMounted]);

  useEffect(() => {
    if (!isMounted || !isActive) return;
    if (!isStepUnlocked) return;
    if (stepIndex >= TOUR_STEPS.length - 1) return;
    if (currentStep.requirement) {
      setStepIndex((prev) => prev + 1);
    }
  }, [currentStep.requirement, isActive, isMounted, isStepUnlocked, stepIndex]);

  useEffect(() => {
    if (!isMounted || !isActive) return;
    if (currentStep.requirement && isStepUnlocked) return;
    if (pathname !== currentStep.route) {
      router.push(currentStep.route);
    }
  }, [currentStep.requirement, currentStep.route, isActive, isMounted, isStepUnlocked, pathname, router]);

  useEffect(() => {
    if (!isMounted || !isActive || pathname !== currentStep.route) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const updateHighlight = (): void => {
      const target = document.querySelector<HTMLElement>(currentStep.target);
      if (!target) {
        setHighlightRect(null);
        return;
      }

      target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      const rect = target.getBoundingClientRect();
      setHighlightRect({
        top: Math.max(rect.top - 10, 12),
        left: Math.max(rect.left - 10, 12),
        width: rect.width + 20,
        height: rect.height + 20,
      });
    };

    timeoutId = setTimeout(updateHighlight, 250);
    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight, true);

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight, true);
    };
  }, [currentStep.route, currentStep.target, isActive, isMounted, pathname]);

  if (!isMounted) return null;

  const closeTour = (state: 'completed' | 'dismissed'): void => {
    writeOnboardingStatus(state);
    setIsActive(false);
    setShowWelcome(false);
    setHighlightRect(null);
  };

  const goToNextStep = (): void => {
    if (!isStepUnlocked) return;
    if (isLastStep) {
      closeTour('completed');
      return;
    }
    setStepIndex((prev) => prev + 1);
  };

  const goToPrevStep = (): void => {
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <>
      {showWelcome ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 px-4">
          <div className="w-full max-w-xl rounded-[28px] bg-white p-6 shadow-2xl sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">
              <Sparkles size={14} />
              First-time guide
            </div>
            <h2 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">Welcome to ProofHire</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              We can guide new users through the platform step by step: create a job, understand the workflow, open the applicant workspace, and discover screening.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setShowWelcome(false);
                  setIsActive(true);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                Start guided tour
                <ArrowRight size={18} />
              </button>
              <button
                type="button"
                onClick={() => closeTour('dismissed')}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isActive ? (
        <div className="pointer-events-none fixed inset-0 z-[110]">
          <div className="absolute inset-0 bg-slate-950/55" />

          {highlightRect ? (
            <div
              className="absolute rounded-[28px] border-2 border-indigo-400 bg-transparent shadow-[0_0_0_9999px_rgba(15,23,42,0.55)] transition-all duration-300"
              style={{
                top: highlightRect.top,
                left: highlightRect.left,
                width: highlightRect.width,
                height: highlightRect.height,
              }}
            />
          ) : null}

          <div className="pointer-events-auto absolute rounded-[28px] border border-slate-200 bg-white p-5 shadow-2xl" style={cardStyle}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">
                  Step {stepIndex + 1} of {TOUR_STEPS.length}
                </div>
                <h3 className="mt-2 text-lg font-bold text-slate-900">{currentStep.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => closeTour('dismissed')}
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close onboarding"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-600">{currentStep.description}</p>

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={goToPrevStep}
                disabled={stepIndex === 0}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft size={16} />
                Back
              </button>

              <button
                type="button"
                onClick={goToNextStep}
                disabled={!isStepUnlocked}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {currentStep.cta}
                <ArrowRight size={16} />
              </button>
            </div>

            {!isStepUnlocked && currentStep.lockedMessage ? (
              <p className="mt-3 text-xs font-medium text-amber-700">{currentStep.lockedMessage}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
