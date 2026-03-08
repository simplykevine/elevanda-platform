'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/app/store/auth.store';
import DashboardLayout from '@/app/SharedComponents/layout/components/DashboardLayout';
import Spinner from '@/app/SharedComponents/ui/Spinner';

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace('/login');
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" className="text-slate-400" />
      </div>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}