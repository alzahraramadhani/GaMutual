'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredToken, getActiveAccountId } from '@/lib/api';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  useEffect(() => {
    const token = getStoredToken();
    const activeId = getActiveAccountId();

    if (!token || !activeId) {
      setIsAuthenticated(false);
      setIsChecking(false);
      router.replace('/login');
    } else {
      setIsAuthenticated(true);
      setIsChecking(false);
    }
  }, [router]);

  if (isChecking || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#251245] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FEA619] flex items-center justify-center text-[#251245] font-extrabold text-2xl animate-pulse">
            G
          </div>
          <p className="text-white/80 text-xs font-medium">Memverifikasi sesi login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
