'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { CheckCircle2, Copy, MapPin, Upload, UserPlus, Users, Zap } from 'lucide-react';
import api, { getApiErrorMessage } from '@/lib/api';
import type { RootState, AppDispatch } from '@/store';
import { setApplicants, setLoading, setError } from '@/store/slices/applicantsSlice';
import { addJob } from '@/store/slices/jobsSlice';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import type { Job } from '@/types';

type ApiSuccess<T> = { success: true; data: T; message?: string };
type ApiSuccessCount<T> = { success: true; data: T; count: number };
type ApiSuccessMessageCount = { success: true; message: string; count: number };
type ApiError = { success: false; message: string };

type BackendJob = {
  _id?: string;
  id?: string;
  title?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  description?: string;
  requirements?: string[];
  status?: 'Open' | 'Closed' | 'Draft';
  skills?: string[];
  experienceLevel?: string;
};

type BackendApplicant = {
  _id?: string;
  id?: string;
  jobId?: string;
  createdAt?: string | Date;
  profile?: unknown;
  source?: 'platform' | 'upload';
  isVerified?: boolean;
};

type AvailabilityStatus = 'Available' | 'Open to Opportunities' | 'Not Available';

type ApplicantUI = {
  id: string;
  jobId: string;
  fullName: string;
  email: string;
  headline: string;
  location: string;
  topSkills: Array<{ name: string; level: string }>;
  availability: AvailabilityStatus;
  source: 'platform' | 'upload';
  isVerified: boolean;
};

type StructuredProfilePayload = {
  firstName: string;
  lastName: string;
  email: string;
  headline: string;
  bio: string;
  location: string;
  skills: Array<{
    name: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
    yearsOfExperience: number;
  }>;
  languages: Array<{
    name: string;
    proficiency: 'Basic' | 'Conversational' | 'Fluent' | 'Native';
  }>;
  experience: Array<{
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    description: string;
    technologies: string[];
    isCurrent: boolean;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startYear: number;
    endYear: number;
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    issueDate: string;
  }>;
  projects?: Array<{
    name: string;
    description: string;
    technologies: string[];
    role: string;
    link?: string;
    startDate: string;
    endDate: string;
  }>;
  availability: {
    status: AvailabilityStatus;
    type: 'Full-time' | 'Part-time' | 'Contract';
    startDate?: string;
  };
  socialLinks?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;

const asString = (v: unknown): string => (typeof v === 'string' ? v : '');

const getAvailability = (profile: Record<string, unknown>): AvailabilityStatus => {
  const availability = profile.availability;
  if (!isRecord(availability)) return 'Available';
  const status = availability.status;
  if (status === 'Available' || status === 'Open to Opportunities' || status === 'Not Available') return status;
  return 'Available';
};

const getSkillBadges = (profile: Record<string, unknown>): Array<{ name: string; level: string }> => {
  const skills = profile.skills;
  if (!Array.isArray(skills)) return [];
  const mapped = skills
    .map((s) => (isRecord(s) ? { name: asString(s.name), level: asString(s.level) } : { name: '', level: '' }))
    .filter((s) => s.name.length > 0);
  return mapped.slice(0, 4).map((s) => ({ name: s.name, level: s.level || 'Intermediate' }));
};

const normalizeApplicantToUI = (raw: BackendApplicant): ApplicantUI => {
  const id = typeof raw.id === 'string' ? raw.id : typeof raw._id === 'string' ? raw._id : '';
  const jobId = typeof raw.jobId === 'string' ? raw.jobId : '';
  const profile = isRecord(raw.profile) ? raw.profile : {};
  const source: 'platform' | 'upload' = raw.source === 'upload' ? 'upload' : 'platform';

  const firstName = asString(profile.firstName);
  const lastName = asString(profile.lastName);
  const fullName = `${firstName} ${lastName}`.trim() || asString(profile.name) || 'Unknown Candidate';
  const email = asString(profile.email);
  const headline = asString(profile.headline) || '';
  const location = asString(profile.location) || '';
  const topSkills = getSkillBadges(profile);
  const availability = getAvailability(profile);

  return {
    id,
    jobId,
    fullName,
    email,
    headline,
    location,
    topSkills,
    availability,
    source,
    isVerified: raw.isVerified === true,
  };
};

const availabilityClasses = (status: AvailabilityStatus): string => {
  if (status === 'Available') return 'bg-emerald-100 text-emerald-700';
  if (status === 'Open to Opportunities') return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-700';
};

const SAMPLE_CSV = `firstName,lastName,email,headline,location,skills
Jane,Doe,jane@example.com,Senior React Developer,New York,"React, TypeScript, Next.js"
Sam,Lee,sam@example.com,Full Stack Engineer,Berlin,"Node.js, MongoDB, Express"
`;

const SAMPLE_JSON_PROFILE = {
  firstName: 'Amara',
  lastName: 'Diallo',
  email: 'amara.diallo@example.com',
  headline: 'Senior React Developer',
  bio: 'Frontend engineer focused on fintech and product delivery.',
  location: 'Dakar, Senegal',
  skills: [
    { name: 'React', level: 'Expert', yearsOfExperience: 5 },
    { name: 'TypeScript', level: 'Advanced', yearsOfExperience: 4 },
    { name: 'Node.js', level: 'Advanced', yearsOfExperience: 3 },
  ],
  languages: [{ name: 'French', proficiency: 'Native' }, { name: 'English', proficiency: 'Fluent' }],
  experience: [
    {
      company: 'PayWave',
      role: 'Senior Frontend Engineer',
      startDate: '2021-02',
      endDate: 'Present',
      description: 'Built customer-facing fintech experiences used by thousands of users.',
      technologies: ['React', 'TypeScript', 'Next.js'],
      isCurrent: true,
    },
  ],
  education: [
    {
      institution: 'Cheikh Anta Diop University',
      degree: 'BSc',
      fieldOfStudy: 'Computer Science',
      startYear: 2014,
      endYear: 2017,
    },
  ],
  certifications: [{ name: 'AWS Cloud Practitioner', issuer: 'AWS', issueDate: '2023-05-01' }],
  projects: [
    {
      name: 'Mobile Money Dashboard',
      description: 'Built a dashboard for African payment operations.',
      technologies: ['React', 'TypeScript', 'Node.js'],
      role: 'Lead Frontend Developer',
      startDate: '2023-01',
      endDate: '2023-11',
    },
  ],
  availability: { status: 'Open to Opportunities', type: 'Full-time' },
  socialLinks: { linkedin: 'https://linkedin.com/in/amara-diallo' },
};

export default function ApplicantsPage(): React.JSX.Element {
  const router = useRouter();
  const params = useParams<{ jobId: string }>();
  const searchParams = useSearchParams();
  const jobId = params.jobId;
  const highlightedApplicantId = searchParams.get('applicantId') ?? '';

  const dispatch = useDispatch<AppDispatch>();
  const { applicants, loading, error } = useSelector((s: RootState) => s.applicants);
  type ApplicantsArray = RootState['applicants']['applicants'];

  const jobFromStore = useSelector((s: RootState) => s.jobs.jobs.find((j) => j.id === jobId));
  const [tab, setTab] = useState<'platform' | 'upload'>('platform');
  const [file, setFile] = useState<File | null>(null);
  const [jsonInput, setJsonInput] = useState<string>('');
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [copiedApplicantId, setCopiedApplicantId] = useState<string | null>(null);

  type JobWithExtras = Job & { skills?: string[]; experienceLevel?: string };
  const normalizeJob = useCallback(
    (raw: BackendJob): JobWithExtras => {
      const toIsoString = (d: string | Date | undefined): string => {
        if (!d) return new Date().toISOString();
        if (typeof d === 'string') return d;
        return d.toISOString();
      };
      const id = typeof raw.id === 'string' ? raw.id : typeof raw._id === 'string' ? raw._id : jobId;
      return {
        id,
        title: typeof raw.title === 'string' ? raw.title : '',
        description: typeof raw.description === 'string' ? raw.description : '',
        requirements: Array.isArray(raw.requirements)
          ? raw.requirements.filter((x): x is string => typeof x === 'string')
          : [],
        status: raw.status ?? 'Open',
        createdAt: toIsoString(raw.createdAt),
        updatedAt: toIsoString(raw.updatedAt),
        skills: Array.isArray(raw.skills) ? raw.skills.filter((x): x is string => typeof x === 'string') : [],
        experienceLevel: typeof raw.experienceLevel === 'string' ? raw.experienceLevel : '',
      };
    },
    [jobId]
  );

  const refresh = useCallback(async (): Promise<void> => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
      const [jobRes, applicantsRes] = await Promise.all([
        api.get<ApiSuccess<BackendJob> | ApiError>(`/api/jobs/${jobId}`),
        api.get<ApiSuccessCount<BackendApplicant[]> | ApiError>(`/api/applicants/${jobId}`),
      ]);

      if (!jobRes.data.success) throw new Error(jobRes.data.message);
      if (!applicantsRes.data.success) throw new Error(applicantsRes.data.message);

      dispatch(addJob(normalizeJob(jobRes.data.data)));
      dispatch(setApplicants(applicantsRes.data.data as unknown as ApplicantsArray));
    } catch (e: unknown) {
      dispatch(setError(getApiErrorMessage(e)));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, jobId, normalizeJob]);

  useEffect(() => {
    const t = setTimeout(() => {
      void refresh();
    }, 0);
    return () => clearTimeout(t);
  }, [refresh]);

  const uiApplicants = useMemo(() => {
    const raw = applicants as unknown as BackendApplicant[];
    return raw.map(normalizeApplicantToUI);
  }, [applicants]);

  const platformApplicants = useMemo(() => uiApplicants.filter((a) => a.source === 'platform'), [uiApplicants]);
  const uploadApplicants = useMemo(() => uiApplicants.filter((a) => a.source === 'upload'), [uiApplicants]);
  const activeList = tab === 'platform' ? platformApplicants : uploadApplicants;
  const applicantsCount = uiApplicants.length;

  useEffect(() => {
    if (!highlightedApplicantId) return;

    const target = document.getElementById(`applicant-${highlightedApplicantId}`);
    if (!target) return;

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightedApplicantId, uiApplicants.length]);

  const submitStructuredProfile = async (): Promise<void> => {
    setProfileError(null);
    setProfileSuccess(null);

    if (!jsonInput.trim()) {
      setProfileError('Paste a structured JSON profile first.');
      return;
    }

    let parsedProfile: StructuredProfilePayload;
    try {
      parsedProfile = JSON.parse(jsonInput) as StructuredProfilePayload;
    } catch {
      setProfileError('Invalid JSON. Please paste a valid structured profile.');
      return;
    }

    setProfileLoading(true);
    try {
      const res = await api.post<ApiSuccess<BackendApplicant> | ApiError>('/api/applicants/profile', {
        jobId,
        profile: parsedProfile,
      });
      if (!res.data.success) throw new Error(res.data.message);

      const fullName = `${parsedProfile.firstName ?? ''} ${parsedProfile.lastName ?? ''}`.trim() || 'Candidate';
      setProfileSuccess(`${fullName} was added successfully.`);
      setJsonInput('');
      await refresh();
    } catch (e: unknown) {
      setProfileError(getApiErrorMessage(e));
    } finally {
      setProfileLoading(false);
    }
  };

  const onUpload = async (): Promise<void> => {
    setUploadError(null);
    setUploadSuccess(null);
    if (!file) {
      setUploadError('Please select a CSV file');
      return;
    }

    setUploadLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('jobId', jobId);

      const res = await api.post<ApiSuccessMessageCount | ApiError>('/api/applicants/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (!res.data.success) throw new Error(res.data.message);

      setUploadSuccess(`${res.data.count} applicants imported successfully`);
      setFile(null);
      await refresh();
    } catch (e: unknown) {
      setUploadError(getApiErrorMessage(e));
    } finally {
      setUploadLoading(false);
    }
  };

  const copyTestLink = async (applicantId: string): Promise<void> => {
    try {
      const base =
        typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_API_URL || '';
      await navigator.clipboard.writeText(`${base}/test/${applicantId}?jobId=${jobId}`);
      setCopiedApplicantId(applicantId);
      window.setTimeout(() => setCopiedApplicantId((current) => (current === applicantId ? null : current)), 2000);
    } catch {
      setCopiedApplicantId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-6">
        <div className="rounded-3xl bg-slate-900 px-6 py-7 text-white sm:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
            Candidate Intake
          </div>
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">{jobFromStore?.title ?? 'Applicants'}</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
            Add structured profiles or import a CSV, then move directly into AI ranking and skill verification for this role.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push(`/screening/${jobId}`)}
              className="bg-white text-slate-900 hover:bg-slate-100 px-5 py-3 rounded-xl font-semibold transition-colors shadow-sm w-full sm:w-auto inline-flex items-center justify-center gap-2"
            >
              <Zap size={18} />
              Run AI Screening
            </button>
            <button
              type="button"
              onClick={() => setTab('platform')}
              className="border border-white/15 bg-white/5 hover:bg-white/10 text-white px-5 py-3 rounded-xl font-semibold transition-colors w-full sm:w-auto"
            >
              Add Candidate
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-4">
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total candidates</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">{applicantsCount}</div>
            <div className="mt-1 text-sm text-slate-500">All profiles attached to this role</div>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Structured profiles</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">{platformApplicants.length}</div>
            <div className="mt-1 text-sm text-slate-500">Profiles pasted from JSON format</div>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Verified</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">{uiApplicants.filter((a) => a.isVerified).length}</div>
            <div className="mt-1 text-sm text-slate-500">Candidates who passed the skill test</div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8 items-start">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Choose how you want to add candidates</h2>
            <p className="mt-1 text-sm text-slate-500">
              Structured JSON is ideal for richer profiles. CSV import is best when onboarding multiple candidates quickly.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTab('platform')}
              className={[
                'px-4 py-2 rounded-full text-sm font-semibold transition-colors',
                tab === 'platform'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50',
              ].join(' ')}
            >
              Structured JSON
            </button>
            <button
              type="button"
              onClick={() => setTab('upload')}
              className={[
                'px-4 py-2 rounded-full text-sm font-semibold transition-colors',
                tab === 'upload'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50',
              ].join(' ')}
            >
              Upload CSV
            </button>
          </div>

          {tab === 'platform' ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Paste a structured candidate profile</h2>
                <p className="text-slate-500 mt-1">
                  Use the official Umurava-style JSON profile, then add the candidate to this job in one click.
                </p>
              </div>

              {profileSuccess ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 px-4 py-3">
                  {profileSuccess}
                </div>
              ) : null}
              {profileError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3">
                  {profileError}
                </div>
              ) : null}

              <textarea
                value={jsonInput}
                onChange={(e) => {
                  setJsonInput(e.target.value);
                  setProfileError(null);
                  setProfileSuccess(null);
                }}
                rows={16}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 font-mono text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                placeholder='Paste a JSON profile here...'
              />

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setJsonInput(JSON.stringify(SAMPLE_JSON_PROFILE, null, 2))}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                >
                  Fill Sample JSON
                </button>
                <button
                  type="button"
                  onClick={() => void submitStructuredProfile()}
                  disabled={profileLoading}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium transition-colors shadow-sm shadow-indigo-200 inline-flex items-center gap-2"
                >
                  <UserPlus size={18} />
                  {profileLoading ? 'Adding Candidate...' : 'Add Candidate'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-slate-900">Import candidates from CSV</h2>
                <p className="text-slate-600">
                  Upload a CSV file with columns: <span className="font-semibold">firstName, lastName, email, headline, location, skills</span>
                </p>
                <a
                  href={`data:text/csv;charset=utf-8,${encodeURIComponent(SAMPLE_CSV)}`}
                  download="proofhire_sample_applicants.csv"
                  className="text-indigo-600 font-semibold hover:underline"
                >
                  Download sample CSV template
                </a>
              </div>

              {uploadSuccess ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 px-4 py-3">
                  {uploadSuccess}
                </div>
              ) : null}
              {uploadError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3">
                  {uploadError}
                </div>
              ) : null}

              <label className="block">
                <div className="flex flex-col items-center justify-center text-center px-6 py-10 border-2 border-dashed border-slate-200 rounded-2xl hover:border-indigo-200 transition-colors cursor-pointer bg-slate-50/50">
                  <div className="bg-white p-4 rounded-full border border-slate-100 mb-3">
                    <Upload size={22} className="text-slate-500" />
                  </div>
                  <p className="text-slate-700 font-semibold">Choose a CSV file</p>
                  <p className="text-slate-500 text-sm mt-1">Only .csv files are supported</p>
                  {file ? <p className="text-slate-600 text-sm mt-3">{file.name}</p> : null}
                </div>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setFile(f);
                    setUploadError(null);
                    setUploadSuccess(null);
                  }}
                />
              </label>

              <button
                type="button"
                onClick={() => void onUpload()}
                disabled={uploadLoading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm shadow-indigo-200"
              >
                {uploadLoading ? 'Importing...' : 'Import Applicants'}
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-5 sm:px-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">
              {tab === 'platform' ? 'Structured Profiles' : 'Uploaded Applicants'}
            </h2>
            <p className="text-slate-500 mt-1">
              {activeList.length} candidate{activeList.length === 1 ? '' : 's'} in this section
            </p>
          </div>

          {loading ? (
            <div className="p-8 animate-pulse h-40" />
          ) : activeList.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center">
              <div className="bg-slate-50 p-6 rounded-full mb-4">
                <Users size={48} className="text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">No candidates yet</h3>
              <p className="text-slate-500 max-w-sm mt-2">
                {tab === 'platform'
                  ? 'Paste a structured JSON profile to add your first candidate.'
                  : 'Upload a CSV file to import candidates in bulk.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {activeList.map((applicant) => (
                <li
                  key={applicant.id}
                  id={`applicant-${applicant.id}`}
                  className={[
                    'p-5 sm:p-6 scroll-mt-24 transition-all',
                    applicant.id === highlightedApplicantId
                      ? 'bg-indigo-50/70 ring-1 ring-indigo-200'
                      : '',
                  ].join(' ')}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900 truncate">{applicant.fullName}</h3>
                        {applicant.isVerified ? <VerifiedBadge size="sm" showLabel={true} /> : null}
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          {applicant.source === 'platform' ? 'JSON Profile' : 'CSV Import'}
                        </span>
                        {applicant.id === highlightedApplicantId ? (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-600 text-white">
                            Open Profile
                          </span>
                        ) : null}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${availabilityClasses(
                            applicant.availability
                          )}`}
                        >
                          {applicant.availability}
                        </span>
                      </div>

                      {applicant.headline ? <p className="text-slate-500 mt-1">{applicant.headline}</p> : null}
                      {applicant.email ? <p className="text-slate-500 mt-1">{applicant.email}</p> : null}
                      {applicant.location ? (
                        <p className="text-slate-500 mt-2 flex items-center gap-2">
                          <MapPin size={16} className="text-slate-400" />
                          {applicant.location}
                        </p>
                      ) : null}

                      {applicant.topSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {applicant.topSkills.map((skill) => (
                            <span
                              key={`${applicant.id}-${skill.name}`}
                              className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700"
                            >
                              {skill.name} {skill.level ? <span className="text-slate-500">({skill.level})</span> : null}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      <div className="flex flex-col gap-3 mt-5 sm:flex-row sm:flex-wrap">
                        <button
                          type="button"
                          disabled={applicant.isVerified}
                          onClick={() => router.push(`/test/${applicant.id}?jobId=${jobId}`)}
                          className={[
                            'px-4 py-3 rounded-lg text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2',
                            applicant.isVerified
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200',
                          ].join(' ')}
                        >
                          <Zap size={16} />
                          {applicant.isVerified ? 'Verified' : 'Take Skill Test'}
                        </button>

                        <button
                          type="button"
                          onClick={() => void copyTestLink(applicant.id)}
                          className="px-4 py-3 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                        >
                          <Copy size={16} />
                          {copiedApplicantId === applicant.id ? 'Link Copied' : 'Copy Test Link'}
                        </button>
                      </div>
                    </div>

                    {applicant.isVerified ? (
                      <div className="hidden sm:block shrink-0 rounded-full bg-emerald-50 p-3 text-emerald-600">
                        <CheckCircle2 size={20} />
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
