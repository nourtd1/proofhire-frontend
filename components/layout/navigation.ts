import { Briefcase, LayoutDashboard, Users, Zap } from 'lucide-react'

export const navigationItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/applicants', label: 'Applications', icon: Users },
  { href: '/screening', label: 'Screening', icon: Zap },
] as const
