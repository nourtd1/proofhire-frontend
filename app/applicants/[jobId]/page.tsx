'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { MapPin, Upload, Users } from 'lucide-react';
import api from '@/lib/api';
import type { RootState, AppDispatch } from '@/store';
import { setApplicants, setLoading, setError } from '@/store/slices/applicantsSlice';
import { addJob } from '@/store/slices/jobsSlice';
import type { Job } from '@/types';

type ApiSuccess<T> = { success: true; data: T };
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
};

type AvailabilityStatus = 'Available' | 'Open to Opportunities' | 'Not Available';

type ApplicantUI = {
  id: string;
  jobId: string;
  fullName: string;
  headline: string;
  location: string;
  topSkills: Array<{ name: string; level: string }>;
  availability: AvailabilityStatus;
  source: 'platform' | 'upload';
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
  return mapped.slice(0, 3).map((s) => ({ name: s.name, level: s.level || 'Intermediate' }));
};

const normalizeApplicantToUI = (raw: BackendApplicant): ApplicantUI => {
  const id = typeof raw.id === 'string' ? raw.id : typeof raw._id === 'string' ? raw._id : '';
  const jobId = typeof raw.jobId === 'string' ? raw.jobId : '';
  const profile = isRecord(raw.profile) ? raw.profile : {};
  const source: 'platform' | 'upload' = raw.source === 'upload' ? 'upload' : 'platform';

  const firstName = asString(profile.firstName);
  const lastName = asString(profile.lastName);
  const fullName = `${firstName} ${lastName}`.trim() || asString(profile.name) || 'Unknown';
  const headline = asString(profile.headline) || '';
  const location = asString(profile.location) || '';
  const topSkills = getSkillBadges(profile);
  const availability = getAvailability(profile);

  return { id, jobId, fullName, headline, location, topSkills, availability, source };
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

export default function ApplicantsPage(): React.JSX.Element {
  const router = useRouter();
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId;

  const dispatch = useDispatch<AppDispatch>();
  const { applicants, loading, error } = useSelector((s: RootState) => s.applicants);
  type ApplicantsArray = RootState['applicants']['applicants'];

  const jobFromStore = useSelector((s: RootState) => s.jobs.jobs.find((j) => j.id === jobId));
  const [tab, setTab] = useState<'platform' | 'upload'>('platform');
  const [file, setFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

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

      // Keep job details in Redux (server state)
      dispatch(addJob(normalizeJob(jobRes.data.data)));

      // Store server state in Redux (as-is), UI derives from it.
      dispatch(setApplicants(applicantsRes.data.data as unknown as ApplicantsArray));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to load applicants';
      dispatch(setError(message));
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
      setUploadError(e instanceof Error ? e.message : 'Failed to import applicants');
    } finally {
      setUploadLoading(false);
    }
  };

  const applicantsCount = uiApplicants.length;

  const activeList = tab === 'platform' ? platformApplicants : uploadApplicants;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{jobFromStore?.title ?? 'Applicants'}</h1>
          <p className="text-slate-500 mt-1">{applicantsCount} applicants</p>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/screening/${jobId}`)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm shadow-indigo-200"
        >
          Screen Now
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3">
          {error}
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTab('platform')}
          className={[
            'px-4 py-2 rounded-full text-sm font-semibold transition-colors',
            tab === 'platform' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50',
          ].join(' ')}
        >
          Platform Profiles
        </button>
        <button
          type="button"
          onClick={() => setTab('upload')}
          className={[
            'px-4 py-2 rounded-full text-sm font-semibold transition-colors',
            tab === 'upload' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50',
          ].join(' ')}
        >
          Upload CSV
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 animate-pulse h-40" />
      ) : null}

      {!loading && tab === 'platform' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {activeList.length === 0 ? (
            <div className="p-20 flex flex-col items-center justify-center text-center">
              <div className="bg-slate-50 p-6 rounded-full mb-4">
                <Users size={48} className="text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">No applicants yet</h3>
              <p className="text-slate-500 max-w-sm mt-2">No applicants yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {activeList.map((a) => (
                <li key={a.id} className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-slate-900 truncate">{a.fullName}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${availabilityClasses(a.availability)}`}>
                          {a.availability}
                        </span>
                      </div>
                      {a.headline ? <p className="text-slate-500 mt-1">{a.headline}</p> : null}
                      {a.location ? (
                        <p className="text-slate-500 mt-2 flex items-center gap-2">
                          <MapPin size={16} className="text-slate-400" />
                          {a.location}
                        </p>
                      ) : null}
                      {a.topSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {a.topSkills.map((s) => (
                            <span
                              key={s.name}
                              className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700"
                            >
                              {s.name} {s.level ? <span className="text-slate-500">({s.level})</span> : null}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {!loading && tab === 'upload' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6">
          <div className="space-y-2">
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

          <div className="pt-6 border-t border-slate-100">
            <h3 className="font-bold text-slate-900 mb-2">Imported Applicants</h3>
            {uploadApplicants.length === 0 ? (
              <p className="text-slate-500 text-sm">No imported applicants yet.</p>
            ) : (
              <p className="text-slate-500 text-sm">{uploadApplicants.length} uploaded applicants</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
