'use client';

import React from 'react';
import { Bell, Search, User } from 'lucide-react';

const Header = () => {
  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="relative w-96">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search size={18} />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          placeholder="Search for jobs or applicants..."
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
        </button>
        <div className="h-8 w-px bg-slate-200 mx-2"></div>
        <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm">
            JD
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-slate-900 leading-none">James Doe</p>
            <p className="text-xs text-slate-500 mt-1">Hiring Manager</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
