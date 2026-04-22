'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MapPin,
} from 'lucide-react';
import type { ScreeningResultWithApplicant } from '@/types';
import VerifiedBadge from '@/components/ui/VerifiedBadge';

interface ResultCardProps {
  result: ScreeningResultWithApplicant;
  animationDelay?: number; // ms
}

const getAccentBorder = (rec: ScreeningResultWithApplicant['recommendation']): string => {
  if (rec === 'Hire') return 'border-l-4 border-l-green-500';
  if (rec === 'Maybe') return 'border-l-4 border-l-yellow-400';
  return 'border-l-4 border-l-red-400';
};

const getRecommendationBadge = (rec: ScreeningResultWithApplicant['recommendation']): string => {
  if (rec === 'Hire') return 'bg-green-100 text-green-700 border border-green-200';
  if (rec === 'Maybe') return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
  return 'bg-red-100 text-red-700 border border-red-200';
};

type AvailabilityStatus = 'Available' | 'Open to Opportunities' | 'Not Available';

const getAvailabilityBadge = (status: AvailabilityStatus): string => {
  if (status === 'Available') return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
  if (status === 'Open to Opportunities') return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
  return 'bg-gray-100 text-gray-600 border border-gray-200';
};

const getRankClasses = (rank: number): string => {
  if (rank === 1) return 'bg-yellow-400 text-yellow-900';
  if (rank === 2) return 'bg-gray-300 text-gray-700';
  if (rank === 3) return 'bg-amber-600 text-amber-100';
  return 'bg-gray-100 text-gray-600';
};

const clamp = (n: number, min: number, max: number): number => Math.max(min, Math.min(max, n));

const ResultCard: React.FC<ResultCardProps> = ({ result, animationDelay = 0 }) => {
  const [open, setOpen] = useState<boolean>(false);
  const applicant = result.applicantId as unknown as { isVerified?: boolean; profile: unknown };
  const profile = applicant.profile as unknown as {
    firstName?: string;
    lastName?: string;
    headline?: string;
    location?: string;
    availability?: { status?: AvailabilityStatus };
    skills?: Array<{ name: string; level: string }>;
  };

  const fullName = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || 'Unknown Candidate';
  const location = profile.location ?? '';
  const availability: AvailabilityStatus = profile.availability?.status ?? 'Available';

  const score = clamp(result.matchScore, 0, 100);
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - score / 100);
  const ringColor = score >= 75 ? '#22c55e' : score >= 50 ? '#eab308' : '#ef4444';

  const topSkills = useMemo(() => {
    const skills = Array.isArray(profile.skills) ? profile.skills : [];
    return skills.slice(0, 4);
  }, [profile.skills]);

  return (
    <div
      className={[
        'bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200',
        getAccentBorder(result.recommendation),
        'animate-fade-in-up',
      ].join(' ')}
      style={{ animationDelay: `${animationDelay}ms`, animationFillMode: 'forwards' }}
    >
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4 min-w-0">
            <div
              className={[
                'w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0',
                getRankClasses(result.rank),
              ].join(' ')}
            >
              #{result.rank}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="text-lg font-semibold text-gray-800 truncate">{fullName}</div>
                {applicant.isVerified === true ? <VerifiedBadge size="sm" showLabel={true} /> : null}
              </div>
              <div className="text-sm text-gray-500 truncate">{profile.headline ?? ''}</div>
              <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{location || 'Location not provided'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 lg:flex-col lg:items-center shrink-0">
            <div className="relative w-[72px] h-[72px]">
              <svg width="72" height="72" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r={radius} stroke="#e5e7eb" strokeWidth="8" fill="none" />
                <circle
                  cx="36"
                  cy="36"
                  r={radius}
                  stroke={ringColor}
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  transform="rotate(-90 36 36)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <div className="font-bold text-gray-800 leading-none">{score}</div>
                <div className="text-xs text-gray-400 leading-none">%</div>
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-2">Match Score</div>
          </div>

          <div className="flex flex-col items-start gap-2 shrink-0 lg:items-end">
            <span
              className={[
                'px-4 py-1.5 rounded-full text-sm font-semibold uppercase tracking-wide',
                getRecommendationBadge(result.recommendation),
              ].join(' ')}
            >
              {result.recommendation}
            </span>

            <span
              className={[
                'px-3 py-1 rounded-full text-xs font-semibold',
                getAvailabilityBadge(availability),
              ].join(' ')}
            >
              {availability}
            </span>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="text-indigo-600 text-sm font-medium inline-flex items-center gap-1"
              aria-expanded={open}
            >
              {open ? 'Hide Details' : 'View Details'}
              {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div
          className={[
            'transition-all duration-300 overflow-hidden',
            open ? 'max-h-[1400px] opacity-100' : 'max-h-0 opacity-0',
          ].join(' ')}
        >
          <div className="border-t border-gray-100 mt-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Strengths
                </div>
                <ul className="space-y-2">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-green-400 leading-none mt-1">●</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-orange-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  Areas to Develop
                </div>
                <ul className="space-y-2">
                  {result.gaps.map((g, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-orange-400 leading-none mt-1">▲</span>
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-4 bg-indigo-50 rounded-lg p-3 border-l-2 border-indigo-300">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Brain className="w-4 h-4 text-indigo-400" />
                AI Analysis
              </div>
              <p className="text-sm text-gray-500 italic">{result.reasoning}</p>
            </div>

            <div className="mt-4">
              <div className="text-xs text-gray-400 uppercase tracking-wide">Top Skills</div>
              <div className="flex flex-wrap gap-2 mt-2">
                {topSkills.length === 0 ? (
                  <span className="text-sm text-gray-500">No skills listed</span>
                ) : (
                  topSkills.map((s) => (
                    <span
                      key={s.name}
                      className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full"
                    >
                      {s.name} ({s.level})
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;
