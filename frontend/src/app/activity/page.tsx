'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserMinus,
  UserPlus,
  Instagram,
  Clock,
  Filter,
} from 'lucide-react';
import MobileShell from '@/components/layout/MobileShell';
import { api, getActiveAccountId, getStoredToken, clearAuthSession } from '@/lib/api';
import { ActivitiesResponse } from '@/types';

export default function ActivityPage() {
  const router = useRouter();
  const [data, setData] = useState<ActivitiesResponse | null>(null);
  const [filter, setFilter] = useState<'all' | 'unfollowed' | 'follower_baru'>('all');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const accId = getActiveAccountId();
    const token = getStoredToken();
    if (!token || !accId) {
      router.replace('/login');
      return;
    }
    loadActivities(filter);
  }, [filter, router]);

  const loadActivities = async (f: string) => {
    const accId = getActiveAccountId();
    const token = getStoredToken();
    if (!token || !accId) {
      router.replace('/login');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.getActivities(accId, f);
      setData(res);
    } catch (err: any) {
      console.error('Failed to load activities:', err);
      if (err?.status === 401 || err?.status === 404) {
        clearAuthSession();
        router.replace('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const highlights = data?.highlights;
  const groups = data?.groups || [];

  return (
    <MobileShell showNav={true}>
      <div className="flex-1 flex flex-col p-4 space-y-4">
        {/* Header */}
        <div className="pt-2">
          <h1 className="text-xl font-bold tracking-tight text-[#1E1B4B]">Riwayat Aktivitas</h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Pantau pergerakan relasi akun secara real-time
          </p>
        </div>

        {/* 2 Highlight Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Highlight 1: Unfollowed */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] text-[#6B7280] block font-medium">Hari ini</span>
              <span className="text-2xl font-extrabold text-[#1E1B4B] tracking-tight block mt-0.5">
                {highlights?.unfollowed_today ?? 0} Akun
              </span>
              <span className="text-[11px] font-semibold text-rose-500 mt-1 block">Unfollowed</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
              <UserMinus size={20} />
            </div>
          </div>

          {/* Highlight 2: Follower Baru */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] text-[#6B7280] block font-medium">Hari ini</span>
              <span className="text-2xl font-extrabold text-[#1E1B4B] tracking-tight block mt-0.5">
                {(highlights?.new_followers_today ?? 0) > 0 ? `+${highlights?.new_followers_today}` : '0'} Akun
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 mt-1 block">Follower Baru</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center shrink-0">
              <UserPlus size={20} />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
              filter === 'all'
                ? 'bg-[#251245] text-white shadow-purple-950/20'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilter('unfollowed')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
              filter === 'unfollowed'
                ? 'bg-[#251245] text-white shadow-purple-950/20'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Unfollowed
          </button>
          <button
            onClick={() => setFilter('follower_baru')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
              filter === 'follower_baru'
                ? 'bg-[#251245] text-white shadow-purple-950/20'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Follower Baru
          </button>
        </div>

        {/* Timeline Grouped by Date */}
        <div className="space-y-4 pt-1">
          {isLoading ? (
            <div className="text-center py-12 text-xs text-slate-400">
              Memuat riwayat aktivitas...
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500">
              Belum ada riwayat aktivitas yang tercatat.
            </div>
          ) : (
            groups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-2.5">
                {/* Date Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#5E3A9B]" />
                    <h3 className="text-xs font-bold text-[#1E1B4B]">{group.date_title}</h3>
                  </div>
                  <span className="text-[11px] text-[#6B7280]">
                    {group.activity_count} Aktivitas
                  </span>
                </div>

                {/* Items in this date */}
                <div className="space-y-2">
                  {group.items.map((item) => {
                    const isUnfollow = item.tag_color === 'red';

                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex items-center justify-between"
                      >
                        {/* Avatar with status floating dot */}
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div className="relative shrink-0">
                            <img
                              src={
                                item.target_pic_url ||
                                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
                              }
                              alt={item.target_username}
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.target_username)}&background=251245&color=fff&bold=true`;
                              }}
                              className="w-10 h-10 rounded-full object-cover border border-slate-100"
                            />
                            <div
                              className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-bold ${
                                isUnfollow ? 'bg-rose-500' : 'bg-emerald-500'
                              }`}
                            >
                              {isUnfollow ? '-' : '+'}
                            </div>
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-[#1E1B4B] truncate">
                                {item.target_full_name || item.target_username}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  isUnfollow
                                    ? 'bg-[#FEE2E2] text-[#991B1B]'
                                    : 'bg-[#D1FAE5] text-[#065F46]'
                                }`}
                              >
                                {isUnfollow ? '👤- Unfollowed' : '👤+ Follower Baru'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[11px] text-[#6B7280]">
                                @{item.target_username}
                              </span>
                              <span className="text-[10px] text-slate-400">•</span>
                              <span className="text-[11px] text-slate-400">
                                {item.timestamp_wib}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Instagram Link */}
                        <a
                          href={item.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-[#E1306C] transition-colors shrink-0"
                          title="Buka Instagram"
                        >
                          <Instagram size={15} />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </MobileShell>
  );
}
