'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Link from 'next/link';
import { ArrowLeft, Briefcase, CheckCircle2, Loader2, Plus, Sparkles, X } from 'lucide-react';
import api, { getApiErrorMessage } from '@/lib/api';
import { writeOnboardingProgress } from '@/lib/onboarding';
import { addJob, setError } from '@/store/slices/jobsSlice';
import type { AppDispatch } from '@/store';
import type { Job } from '@/types';

type ApiSuccess<T> = { success: true; data: T };
type ApiError = { success: false; message: string };

type BackendJob = {
  _id?: string;
  id?: string;
  title?: string;
  description?: string;
  requirements?: string[];
  skills?: string[];
  experienceLevel?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  status?: 'Open' | 'Closed' | 'Draft';
};

const toIsoString = (d: string | Date | undefined): string => {
  if (!d) return new Date().toISOString();
  if (typeof d === 'string') return d;
  return d.toISOString();
};

const normalizeJob = (raw: BackendJob): Job & { skills?: string[]; experienceLevel?: string } => {
  const id = typeof raw.id === 'string' ? raw.id : typeof raw._id === 'string' ? raw._id : '';
  return {
    id,
    title: typeof raw.title === 'string' ? raw.title : '',
    description: typeof raw.description === 'string' ? raw.description : '',
    requirements: Array.isArray(raw.requirements) ? raw.requirements.filter((x): x is string => typeof x === 'string') : [],
    status: raw.status ?? 'Open',
    createdAt: toIsoString(raw.createdAt),
    updatedAt: toIsoString(raw.updatedAt),
    skills: Array.isArray(raw.skills) ? raw.skills.filter((x): x is string => typeof x === 'string') : [],
    experienceLevel: typeof raw.experienceLevel === 'string' ? raw.experienceLevel : '',
  };
};

type ExperienceLevel = 'Junior' | 'Mid' | 'Senior';

interface FieldErrors {
  title?: string;
  description?: string;
  requirements?: string;
}

const CreateJobPage: React.FC = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Mid');
  const [skillInput, setSkillInput] = useState<string>('');
  const [skills, setSkills] = useState<string[]>([]);
  const [requirementsText, setRequirementsText] = useState<string>('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const requirements = useMemo(
    () => requirementsText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0),
    [requirementsText]
  );

  const addSkill = (): void => {
    const next = skillInput.trim();
    if (!next) return;
    if (skills.some((s) => s.toLowerCase() === next.toLowerCase())) {
      setSkillInput('');
      return;
    }
    setSkills((prev) => [...prev, next]);
    setSkillInput('');
  };

  const removeSkill = (name: string): void => {
    setSkills((prev) => prev.filter((s) => s !== name));
  };

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    if (!title.trim()) next.title = 'Job title is required';
    if (!description.trim()) next.description = 'Job description is required';
    if (description.trim().length > 0 && description.trim().length < 50) {
      next.description = 'Job description must be at least 50 characters';
    }
    return next;
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    setSubmitError(null);
    dispatch(setError(null));

    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        experienceLevel,
        skills,
        requirements,
      };

      const res = await api.post<ApiSuccess<BackendJob> | ApiError>('/api/jobs', payload);
      if (!res.data.success) throw new Error(res.data.message);

      const job = normalizeJob(res.data.data);
      writeOnboardingProgress({ createdJob: true });
      dispatch(addJob(job));
      router.push('/jobs');
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      setSubmitError(message);
      dispatch(setError(message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] py-4 sm:py-10">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link
              href="/jobs"
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
              aria-label="Back to jobs"
            >
              <ArrowLeft size={22} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Create Job</h1>
              <p className="text-slate-500 mt-1">Set up the role once, then move directly into candidate intake and screening.</p>
            </div>
          </div>

          <div className="rounded-3xl bg-slate-900 px-6 py-7 text-white">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
              Role Setup
            </div>
            <h2 className="mt-4 text-3xl font-bold">Design a role recruiters can act on immediately.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              A strong job setup helps ProofHire compare candidates more accurately and keeps the shortlist easier to trust.
            </p>

            <div className="mt-6 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white">
                    <Briefcase size={18} />
                  </div>
                  <div>
                    <div className="font-semibold">Clear hiring signal</div>
                    <div className="mt-1 text-sm text-slate-300">Skills, level, and requirements guide ranking quality.</div>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <div className="font-semibold">Faster recruiter workflow</div>
                    <div className="mt-1 text-sm text-slate-300">Once created, the same role powers intake, screening, and testing.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">Recommended checklist</div>
            <div className="mt-4 space-y-3">
              {[
                'Use a precise title recruiters and candidates both understand.',
                'List the key technologies the role truly depends on.',
                'Keep requirements concrete and easy to verify during screening.',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm text-slate-600">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          data-onboarding="job-form"
          className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 sm:p-8 space-y-6"
        >
          {submitError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3">
              {submitError}
            </div>
          ) : null}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Job Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              type="text"
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              placeholder="e.g. Senior React Developer"
            />
            {errors.title ? <p className="text-sm text-red-600">{errors.title}</p> : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Job Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              placeholder="Describe the role, responsibilities, and what success looks like..."
            />
            {errors.description ? <p className="text-sm text-red-600">{errors.description}</p> : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Experience Level</label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            >
              <option value="Junior">Junior</option>
              <option value="Mid">Mid</option>
              <option value="Senior">Senior</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Required Skills</label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                type="text"
                className="flex-1 px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                placeholder="Type a skill and press Enter"
              />
              <button
                type="button"
                onClick={addSkill}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg font-medium inline-flex items-center justify-center gap-2 transition-colors shadow-sm shadow-indigo-200"
              >
                <Plus size={18} />
                Add
              </button>
            </div>

            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-2">
                {skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => removeSkill(s)}
                      className="text-slate-500 hover:text-slate-800"
                      aria-label={`Remove ${s}`}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Requirements</label>
            <textarea
              value={requirementsText}
              onChange={(e) => setRequirementsText(e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              placeholder="One requirement per line"
            />
            {errors.requirements ? <p className="text-sm text-red-600">{errors.requirements}</p> : null}
          </div>

          <div className="pt-2 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={() => router.push('/jobs')}
              className="px-6 py-3 rounded-lg font-medium text-slate-600 hover:bg-slate-50 transition-colors w-full sm:w-auto"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:hover:bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center justify-center gap-2 transition-colors shadow-sm shadow-indigo-200 w-full sm:w-auto"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Job'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateJobPage;
