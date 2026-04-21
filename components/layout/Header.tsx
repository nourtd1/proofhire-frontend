'use client';

import React from 'react';
import { Bell, Briefcase, LayoutDashboard, ShieldCheck, Users, Zap } from 'lucide-react';
import { usePathname } from 'next/navigation';

type HeaderMeta = {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const getHeaderMeta = (pathname: string): HeaderMeta => {
  if (pathname.startsWith('/jobs/new')) {
    return {
      title: 'Create a New Role',
      subtitle: 'Define the role, required skills, and hiring criteria before adding candidates.',
      icon: Briefcase,
    };
  }

  if (pathname.startsWith('/jobs')) {
    return {
      title: 'Jobs Workspace',
      subtitle: 'Create, review, and manage the open roles that feed your screening pipeline.',
      icon: Briefcase,
    };
  }

  if (pathname.startsWith('/applicants')) {
    return {
      title: 'Candidate Intake',
      subtitle: 'Add structured profiles, import CSV files, and prepare candidates for AI screening.',
      icon: Users,
    };
  }

  if (pathname.startsWith('/screening')) {
    return {
      title: 'AI Screening',
      subtitle: 'Review ranked candidate recommendations, strengths, gaps, and hiring guidance.',
      icon: Zap,
    };
  }

  if (pathname.startsWith('/test')) {
    return {
      title: 'Skill Verification',
      subtitle: 'Candidates can validate their declared skills through a short guided assessment.',
      icon: ShieldCheck,
    };
  }

  return {
    title: 'Recruiter Dashboard',
    subtitle: 'Track jobs, candidates, and screening activity from one place.',
    icon: LayoutDashboard,
  };
};

const Header = () => {
  const pathname = usePathname();
  const meta = getHeaderMeta(pathname);
  const Icon = meta.icon;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="flex items-center justify-between gap-6 px-8 py-4">
        <div className="flex items-start gap-4 min-w-0">
          <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Icon size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-bold text-slate-900">{meta.title}</h2>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Workspace Ready
              </span>
            </div>
            <p className="mt-1 max-w-3xl text-sm text-slate-500">{meta.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <button
            type="button"
            className="relative rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-emerald-500" />
          </button>

          <div className="h-8 w-px bg-slate-200" />

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
              JD
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-slate-900 leading-none">James Doe</p>
              <p className="mt-1 text-xs text-slate-500">Hiring Manager</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
