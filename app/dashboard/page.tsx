import React from 'react';
import { Users, Briefcase, Zap, TrendingUp } from 'lucide-react';

const DashboardPage = () => {
  const stats = [
    { name: 'Active Jobs', value: '12', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Total Applicants', value: '458', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { name: 'Screening in Progress', value: '24', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-100' },
    { name: 'Average Match Score', value: '82%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back, James. Here's what's happening with your hiring pipeline.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-4">
              <div className={`${stat.bg} ${stat.color} p-3 rounded-lg`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.name}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-96 flex flex-col items-center justify-center text-center">
            <div className="bg-slate-50 p-4 rounded-full mb-4">
                <TrendingUp size={48} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Performance Over Time</h3>
            <p className="text-slate-500 max-w-xs mt-2">Charts and detailed metrics will appear here once you start screening applicants.</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-96 flex flex-col items-center justify-center text-center">
            <div className="bg-slate-50 p-4 rounded-full mb-4">
                <Briefcase size={48} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Recent Job Activity</h3>
            <p className="text-slate-500 max-w-xs mt-2">Your latest job postings and application trends will be listed here.</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
