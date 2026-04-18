import React from 'react';
import Link from 'next/link';
import { Plus, Briefcase, Search } from 'lucide-react';
import JobCard from '@/components/jobs/JobCard';

const JobsPage = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Jobs</h1>
          <p className="text-slate-500 mt-1">Manage all your active and draft job descriptions.</p>
        </div>
        <Link href="/jobs/new" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm shadow-indigo-200">
          <Plus size={20} />
          Create Job
        </Link>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50"
            placeholder="Filter jobs..."
          />
        </div>
        <select className="bg-slate-50/50 border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
          <option>All Status</option>
          <option>Open</option>
          <option>Closed</option>
          <option>Draft</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Empty state placeholder */}
        <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
          <div className="bg-slate-50 p-6 rounded-full mb-4">
            <Briefcase size={48} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No jobs yet</h3>
          <p className="text-slate-500 max-w-sm mt-2">Get started by creating your first job description to start screening talent.</p>
          <Link href="/jobs/new" className="mt-6 text-indigo-600 font-semibold hover:underline">
            Create your first job →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default JobsPage;
