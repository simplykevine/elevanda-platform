'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CreditCard,
  BookOpen,
  CheckSquare,
  Calendar,
  LogOut,
} from 'lucide-react';
import { cn } from '../../../../utils/cn';
import { useAuth } from '../../../../hooks/useAuth';
const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/fees', label: 'Fees', icon: CreditCard },
  { href: '/grades', label: 'Grades', icon: BookOpen },
  { href: '/attendance', label: 'Attendance', icon: CheckSquare },
  { href: '/timetable', label: 'Timetable', icon: Calendar },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <aside className="flex h-full w-60 flex-col border-r border-slate-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
          <span className="text-xs font-bold text-white">E</span>
        </div>
        <span className="text-base font-semibold text-slate-900">Elevanda</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-slate-200 p-3">
        <div className="mb-1 rounded-lg px-3 py-2">
          <p className="truncate text-sm font-medium text-slate-900">{user?.full_name}</p>
          <p className="truncate text-xs text-slate-500 capitalize">{user?.role}</p>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700"
        >
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    </aside>
  );
}