'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Briefcase, Zap, Settings, Users } from 'lucide-react';

const Sidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Jobs', href: '/jobs', icon: Briefcase },
    { name: 'Screening', href: '/screening', icon: Zap },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0f172a] text-white flex flex-col z-50">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <Zap size={20} className="text-white fill-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">ProofHire</h1>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-slate-800">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
        >
          <Settings size={20} />
          <span className="font-medium">Settings</span>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
