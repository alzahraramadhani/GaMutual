'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredToken, getActiveAccountId } from '@/lib/api';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = getStoredToken();
    const activeId = getActiveAccountId();
    if (token && activeId) {
      router.replace('/home');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#251245] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <img src="/logo.svg" alt="GaMutual Logo" className="w-16 h-16 animate-pulse" />
        <p className="text-white/80 text-sm font-medium">Memuat GaMutual...</p>
      </div>
    </div>
  );
}
