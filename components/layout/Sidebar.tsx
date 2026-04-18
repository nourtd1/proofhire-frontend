'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Briefcase, Zap } from 'lucide-react';

const Sidebar = () => {
  const pathname = usePathname();

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/jobs', label: 'Jobs', icon: Briefcase },
    { href: '/screening', label: 'Screening', icon: Zap },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0f172a] text-white flex flex-col z-50">
      <div className="p-6">
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-white">Proof</span>
              <span className="text-indigo-400">Hire</span>
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-2">AI Talent Screening</p>
        </div>

        <nav className="space-y-1">
          {navLinks.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6">
        <div className="bg-indigo-900 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-semibold">ProofHire</div>
              <div className="text-indigo-300 text-xs mt-1">
                Don&apos;t just claim it. <span className="font-semibold">Prove it.</span>
              </div>
            </div>
            <Zap className="w-5 h-5 text-indigo-400" />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
