'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  Lock,
  Clock,
  RefreshCw,
  Shield,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  UserPlus,
  Handshake,
  Heart,
  UserX,
  ExternalLink,
} from 'lucide-react';
import MobileShell from '@/components/layout/MobileShell';
import SwitchAccountModal from '@/components/modals/SwitchAccountModal';
import { api, getActiveAccountId, setActiveAccountId } from '@/lib/api';
import { HomeDashboardResponse, AccountSwitcherItem } from '@/types';

export default function HomePage() {
  const [data, setData] = useState<HomeDashboardResponse | null>(null);
  const [accounts, setAccounts] = useState<AccountSwitcherItem[]>([]);
  const [activeId, setActiveId] = useState<string>('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modals
  const [switchModalOpen, setSwitchModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (targetId?: string) => {
    setIsLoading(true);
    try {
      // 1. Load accounts list
      const accRes = await api.getAccounts(targetId);
      setAccounts(accRes.accounts || []);
      const storedId = getActiveAccountId();
      const validStored = storedId && accRes.accounts?.some((a: any) => a.id === storedId);
      const currentActive = targetId || (validStored ? storedId : accRes.active_account_id) || 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d';
      setActiveId(currentActive);
      setActiveAccountId(currentActive);

      // 2. Load dashboard
      const dash = await api.getDashboard(currentActive);
      setData(dash);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      // Fallback state if server is loading or offline
      setData({
        profile: {
          id: activeId,
          username: 'jjahrav',
          full_name: 'jjahrav',
          profile_pic_url: '',
          follower_count: 0,
          following_count: 0,
          last_synced_text: 'Belum disinkronisasi',
          is_encrypted: true,
        },
        anti_ban: {
          used_today: 0,
          quota_limit: 40,
          remaining_quota: 40,
          status_text: 'Status: Aman',
          speed_status: 'Kecepatan algoritma anti-banned aktif',
        },
        relation_analysis: {
          tidak_follback_count: 0,
          unfollowers_baru: { count: 0, badge: '0 hari ini' },
          followers_baru: { count: 0, badge: '0 baru' },
          mutuals: { count: 0, badge: 'Sahabat' },
          belum_difollow: { count: 0, badge: 'Fans' },
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncNow = async () => {
    if (!activeId || isSyncing) return;
    setIsSyncing(true);
    try {
      await api.syncNow(activeId);
      await loadData(activeId);
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSelectAccount = (newId: string) => {
    setActiveId(newId);
    setActiveAccountId(newId);
    loadData(newId);
  };

  const profile = data?.profile;
  const antiBan = data?.anti_ban;
  const relations = data?.relation_analysis;

  const quotaPercent = Math.min(100, Math.round(((antiBan?.used_today || 0) / (antiBan?.quota_limit || 40)) * 100));

  return (
    <MobileShell showNav={true}>
      <div className="p-4 space-y-4">
        {/* 0. Top Bar Branding GaMutual */}
        <div className="flex items-center justify-between pt-1 pb-0.5 px-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#251245] flex items-center justify-center text-white font-bold shadow-md shadow-purple-950/20">
              <span className="text-sm font-extrabold text-[#FEA619]">G</span>
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-[#251245]">GaMutual</h1>
          </div>
        </div>

        {/* 1. Header Profil Card (Dark Purple) */}
        <div className="bg-gradient-to-br from-[#251245] via-[#2A1550] to-[#1F1138] rounded-3xl p-5 text-white shadow-xl shadow-purple-950/20">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3.5">
              <img
                src={profile?.profile_pic_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'}
                alt={profile?.username || 'Avatar'}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.username || 'G')}&background=251245&color=fff&bold=true`;
                }}
                className="w-14 h-14 rounded-full object-cover border-2 border-white/20 shadow-inner"
              />
              <div>
                <h2 className="text-base font-bold text-white leading-tight">
                  {profile?.full_name || profile?.username || 'jjahrav'}
                </h2>
                <span className="text-xs text-purple-200/80">@{profile?.username || 'jjahrav'}</span>
              </div>
            </div>

            {/* Switch Account Button */}
            <button
              onClick={() => setSwitchModalOpen(true)}
              className="bg-white/10 hover:bg-white/20 text-white/90 text-xs px-3 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1.5 backdrop-blur-sm"
            >
              <span>⇄</span>
              <span>Ganti Akun</span>
            </button>
          </div>

          {/* Followers & Following Stat Boxes */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <span className="block text-[11px] uppercase tracking-wider text-purple-200/70 font-medium">
                  Followers
                </span>
                <span className="text-2xl font-bold tracking-tight text-white mt-0.5 block">
                  {profile?.follower_count?.toLocaleString('id-ID') || '1.345'}
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-purple-200">
                <Users size={18} />
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <span className="block text-[11px] uppercase tracking-wider text-purple-200/70 font-medium">
                  Following
                </span>
                <span className="text-2xl font-bold tracking-tight text-white mt-0.5 block">
                  {profile?.following_count?.toLocaleString('id-ID') || '842'}
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-purple-200">
                <UserCheck size={18} />
              </div>
            </div>
          </div>

          {/* Card Footer: Encrypted & Sync text */}
          <div className="flex items-center justify-between text-[11px] text-purple-200/70 pt-2 border-t border-white/10">
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <Lock size={13} />
              <span>End-to-End Encrypted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={13} />
              <span>{profile?.last_synced_text || 'Sync 10 mnt lalu'}</span>
            </div>
          </div>
        </div>

        {/* 2. Tombol "Sinkronisasi Sekarang" (Amber Orange) */}
        <button
          onClick={handleSyncNow}
          disabled={isSyncing}
          className="w-full py-3.5 px-4 rounded-2xl bg-[#FEA619] hover:bg-[#E59514] active:scale-[0.99] text-[#1E1B4B] font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 disabled:opacity-75"
        >
          <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
          <span>{isSyncing ? 'Menyinkronkan Instagram...' : 'Sinkronisasi Sekarang'}</span>
        </button>

        {/* 3. Card Tambah List Terlindungi (Whitelist Banner) */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#6B21A8] flex items-center justify-center">
              <Shield size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#1E1B4B]">Tambah List Terlindungi</h4>
              <p className="text-[11px] text-[#6B7280]">Amankan akun dari unfollow</p>
            </div>
          </div>
          <Link
            href="/whitelist"
            className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#F3E8FF] hover:bg-[#E9D5FF] text-[#6B21A8] transition-colors"
          >
            Atur List &gt;
          </Link>
        </div>

        {/* 5. Hero Card: Tidak Follback (GaMutual) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-[#5E3A9B] flex items-center justify-center">
                  <UserX size={16} />
                </div>
                <h3 className="text-sm font-bold text-[#1E1B4B]">Tidak Follback (GaMutual)</h3>
              </div>
              <p className="text-xs text-[#6B7280]">Akun yang kamu ikuti tanpa mengikuti balik</p>
            </div>
          </div>

          <div className="flex items-baseline justify-between mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-[#1E1B4B] tracking-tight">
                {relations?.tidak_follback_count || 184}
              </span>
              <span className="text-sm font-semibold text-slate-500">Akun</span>
            </div>

            <Link
              href="/unfollower"
              className="px-4 py-2 rounded-xl bg-[#1E1B4B] hover:bg-[#251245] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-slate-900/10"
            >
              <span>Buka Daftar</span>
              <ExternalLink size={14} />
            </Link>
          </div>
        </div>

        {/* 6. Grid 2x2: Analisis Relasi */}
        <div className="grid grid-cols-2 gap-3 pb-4">
          {/* Card 1: Unfollowers Baru */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#1E1B4B]">Unfollowers Baru</span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center">
                <TrendingDown size={16} />
              </div>
            </div>
            <div>
              <span className="text-3xl font-bold text-[#1E1B4B] block tracking-tight">
                {relations?.unfollowers_baru?.count || 12}
              </span>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 font-semibold text-[10px]">
                {relations?.unfollowers_baru?.badge || '-2 hari ini'}
              </span>
            </div>
          </div>

          {/* Card 2: Followers Baru */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#1E1B4B]">Followers Baru</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#10B981] flex items-center justify-center">
                <UserPlus size={16} />
              </div>
            </div>
            <div>
              <span className="text-3xl font-bold text-[#1E1B4B] block tracking-tight">
                +{relations?.followers_baru?.count || 28}
              </span>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-emerald-50 text-[#065F46] font-semibold text-[10px]">
                {relations?.followers_baru?.badge || '+8 baru'}
              </span>
            </div>
          </div>

          {/* Card 3: Mutuals Akun */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#1E1B4B]">Mutuals Akun</span>
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-[#5E3A9B] flex items-center justify-center">
                <Handshake size={16} />
              </div>
            </div>
            <div>
              <span className="text-3xl font-bold text-[#1E1B4B] block tracking-tight">
                {relations?.mutuals?.count || 658}
              </span>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-purple-50 text-[#5E3A9B] font-semibold text-[10px]">
                {relations?.mutuals?.badge || 'Sahabat'}
              </span>
            </div>
          </div>

          {/* Card 4: Belum Difollow (Fans) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#1E1B4B]">Belum Difollow</span>
              <div className="w-7 h-7 rounded-lg bg-pink-50 text-pink-500 flex items-center justify-center">
                <Heart size={16} />
              </div>
            </div>
            <div>
              <span className="text-3xl font-bold text-[#1E1B4B] block tracking-tight">
                {relations?.belum_difollow?.count || 34}
              </span>
              <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-pink-50 text-pink-600 font-semibold text-[10px]">
                {relations?.belum_difollow?.badge || 'Fans'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Switch Account Modal */}
      <SwitchAccountModal
        isOpen={switchModalOpen}
        onClose={() => setSwitchModalOpen(false)}
        accounts={accounts}
        activeId={activeId}
        onSelectAccount={handleSelectAccount}
      />
    </MobileShell>
  );
}
