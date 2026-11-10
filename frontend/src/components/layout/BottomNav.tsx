'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, UserMinus, ArrowLeftRight } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const tabs = [
    { name: 'Home', href: '/home', icon: Home },
    { name: 'Unfollower', href: '/unfollower', icon: UserMinus },
    { name: 'Activity', href: '/activity', icon: ArrowLeftRight },
  ];

  return (
    <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[90%] max-w-[390px] bg-[#1F1138]/95 backdrop-blur-md rounded-full px-2 py-1.5 shadow-2xl z-50 flex items-center justify-between border border-white/10">
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.href);
        const Icon = tab.icon;

        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={`flex items-center gap-2 rounded-full transition-all duration-200 ${
              isActive
                ? 'bg-[#5E3A9B] text-white px-5 py-2 font-medium shadow-md shadow-purple-900/40 text-xs'
                : 'text-slate-400 hover:text-white px-4 py-2 text-xs font-normal'
            }`}
          >
            <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
            <span className={isActive ? 'inline' : 'hidden sm:inline'}>{tab.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
