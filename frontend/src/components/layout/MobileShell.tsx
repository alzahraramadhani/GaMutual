'use client';

import React from 'react';
import BottomNav from './BottomNav';
import AuthGuard from '@/components/auth/AuthGuard';

interface MobileShellProps {
  children: React.ReactNode;
  showNav?: boolean;
  requireAuth?: boolean;
}

export default function MobileShell({
  children,
  showNav = true,
  requireAuth = true,
}: MobileShellProps) {
  const content = (
    <div className="min-h-screen bg-slate-200/70 flex justify-center selection:bg-[#FEA619] selection:text-white">
      <div className="w-full max-w-[430px] min-h-screen bg-[#F8FAFC] shadow-2xl relative pb-28 flex flex-col font-sans">
        <main className="flex-1 w-full flex flex-col">{children}</main>
        {showNav && <BottomNav />}
      </div>
    </div>
  );

  if (requireAuth) {
    return <AuthGuard>{content}</AuthGuard>;
  }

  return content;
}
