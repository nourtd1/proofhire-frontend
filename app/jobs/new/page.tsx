'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Link from 'next/link';
import { ArrowLeft, Plus, X, Loader2 } from 'lucide-react';
import api from '@/lib/api';
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

type ExperienceLevel = 'Junior' | 'Mid-Level' | 'Senior' | 'Lead';

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
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Mid-Level');
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
      dispatch(addJob(job));
      router.push('/jobs');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create job';
      setSubmitError(message);
      dispatch(setError(message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-start justify-center py-10">
      <div className="w-full max-w-[680px]">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/jobs"
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
            aria-label="Back to jobs"
          >
            <ArrowLeft size={22} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Create Job</h1>
            <p className="text-slate-500 mt-1">Define the role and requirements to start screening.</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6">
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
              <option value="Mid-Level">Mid-Level</option>
              <option value="Senior">Senior</option>
              <option value="Lead">Lead</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Required Skills</label>
            <div className="flex items-center gap-2">
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
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                placeholder="Type a skill and press Enter"
              />
              <button
                type="button"
                onClick={addSkill}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center gap-2 transition-colors shadow-sm shadow-indigo-200"
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

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/jobs')}
              className="px-6 py-2 rounded-lg font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:hover:bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium inline-flex items-center gap-2 transition-colors shadow-sm shadow-indigo-200"
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
