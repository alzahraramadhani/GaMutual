'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Shield,
  Instagram,
  RefreshCw,
  Check,
  AlertCircle,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import MobileShell from '@/components/layout/MobileShell';
import UnfollowConfirmModal from '@/components/unfollower/UnfollowConfirmModal';
import { api, getActiveAccountId, getStoredToken, clearAuthSession } from '@/lib/api';
import { UnfollowerItem, AntiBanInfo } from '@/types';

export default function UnfollowerPage() {
  const router = useRouter();
  const [items, setItems] = useState<UnfollowerItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [whitelistedCount, setWhitelistedCount] = useState<number>(0);
  const [antiBan, setAntiBan] = useState<AntiBanInfo>({
    used_today: 0,
    quota_limit: 40,
    remaining_quota: 40,
    status: 'Status: Aman',
  });

  const [activeFilter, setActiveFilter] = useState<'all' | 'whitelisted'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeId, setActiveId] = useState<string>('');

  // Cooldown countdown state
  const [cooldownCountdown, setCooldownCountdown] = useState<number | null>(null);

  // Confirm Modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [targetItem, setTargetItem] = useState<UnfollowerItem | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    const accId = getActiveAccountId();
    const token = getStoredToken();
    if (!token || !accId) {
      router.replace('/login');
      return;
    }
    setActiveId(accId);
    loadUnfollowers(accId, activeFilter, searchQuery);
  }, [activeFilter, router]);

  // Handle countdown timer tick
  useEffect(() => {
    if (cooldownCountdown === null || cooldownCountdown <= 0) return;
    const interval = setInterval(() => {
      setCooldownCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownCountdown]);

  const loadUnfollowers = async (accId: string, filter: string, search?: string) => {
    setIsLoading(true);
    try {
      const res = await api.getUnfollowers(accId, {
        filter,
        search,
        page: 1,
        limit: 50,
      });
      setItems(res.items || []);
      setTotalCount(res.total_count ?? 0);
      setWhitelistedCount(res.whitelisted_count ?? 0);
      if (res.anti_ban) setAntiBan(res.anti_ban);
    } catch (err: any) {
      console.error('Failed to load unfollowers:', err);
      if (err?.status === 401 || err?.status === 404) {
        clearAuthSession();
        router.replace('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadUnfollowers(activeId, activeFilter, searchQuery);
  };

  const openConfirmDialog = (item: UnfollowerItem) => {
    if (item.unfollow_state === 'COMPLETED' || cooldownCountdown !== null) return;
    setTargetItem(item);
    setConfirmModalOpen(true);
  };

  const handleToggleWhitelist = async (item: UnfollowerItem) => {
    try {
      const res = await api.toggleWhitelist(activeId, {
        target_ig_pk: item.target_ig_pk,
        target_username: item.target_username,
      });
      const newStatus = res.is_whitelisted;
      setItems((prev) =>
        prev.map((i) =>
          i.target_ig_pk === item.target_ig_pk ? { ...i, is_whitelisted: newStatus } : i
        )
      );
      setWhitelistedCount((prev) => (newStatus ? prev + 1 : Math.max(0, prev - 1)));
      if (targetItem && targetItem.target_ig_pk === item.target_ig_pk) {
        setTargetItem({ ...targetItem, is_whitelisted: newStatus });
      }
    } catch (err: any) {
      alert(err?.message || 'Gagal mengubah status proteksi');
    }
  };

  const executeUnfollow = async () => {
    if (!targetItem) return;
    setIsActionLoading(true);

    try {
      const res = await api.unfollow(activeId, {
        target_ig_pk: targetItem.target_ig_pk,
        target_username: targetItem.target_username,
      });

      // Mark target as completed
      setItems((prev) =>
        prev.map((i) =>
          i.target_ig_pk === targetItem.target_ig_pk
            ? { ...i, unfollow_state: 'COMPLETED' }
            : i
        )
      );

      // Update anti-ban quota
      if (res.quota) {
        setAntiBan((prev) => ({
          ...prev,
          used_today: res.quota.used_today,
          remaining_quota: res.quota.remaining_quota,
        }));
      }

      // Start global cooldown timer (e.g. 10s)
      const seconds = res.cooldown_seconds || 10;
      setCooldownCountdown(seconds);

      setConfirmModalOpen(false);
    } catch (err: any) {
      if (err?.status === 429) {
        const remaining = err?.data?.detail?.remaining_cooldown_seconds || 8;
        setCooldownCountdown(remaining);
      }
      alert(err?.message || 'Gagal melakukan unfollow.');
      setConfirmModalOpen(false);
    } finally {
      setIsActionLoading(false);
    }
  };

  const quotaPercent = Math.min(
    100,
    Math.round((antiBan.used_today / (antiBan.quota_limit || 40)) * 100)
  );

  return (
    <MobileShell showNav={true}>
      <div className="flex-1 flex flex-col">
        {/* 1. Curved Header Plum */}
        <div className="bg-[#251245] text-white rounded-b-[36px] pt-7 pb-6 px-5 shadow-xl shadow-purple-950/20">
          <div className="mb-4">
            <h1 className="text-xl font-bold tracking-tight">Daftar Unfollower</h1>
            <p className="text-xs text-purple-200/80 mt-0.5">
              Daftar yang meng-unfollow dan tidak follow balik
            </p>
          </div>

          {/* Anti-Ban Status Box in Header */}
          <div className="bg-white/[0.08] backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Shield size={15} className="text-[#10B981]" />
                <span className="text-xs font-semibold text-white">Batas Tindakan Anti-Ban</span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-semibold text-[10px] rounded-full">
                Status: Aman
              </span>
            </div>

            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-[#10B981] rounded-full transition-all duration-500"
                style={{ width: `${quotaPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-purple-200/70">
              <span>Digunakan hari ini: {antiBan.used_today}/40 aksi</span>
              <span className="font-semibold text-white">Sisa kuota: {antiBan.remaining_quota}</span>
            </div>
          </div>
        </div>

        {/* 2. Search Bar & Filter Tabs */}
        <div className="px-4 -mt-3 space-y-3 z-10">
          {/* Floating Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari username atau nama..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-slate-200 text-xs text-[#1E1B4B] placeholder:text-slate-400 shadow-md shadow-slate-200/50 focus:outline-none focus:ring-2 focus:ring-[#5E3A9B]"
            />
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </form>

          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                activeFilter === 'all'
                  ? 'bg-[#251245] text-white shadow-purple-950/20'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Semua ({totalCount})
            </button>
            <button
              onClick={() => setActiveFilter('whitelisted')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                activeFilter === 'whitelisted'
                  ? 'bg-[#251245] text-white shadow-purple-950/20'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>🛡</span>
              <span>Terlindungi ({whitelistedCount})</span>
            </button>
          </div>
        </div>

        {/* 3. User Cards List */}
        <div className="px-4 py-4 space-y-2.5 flex-1">
          {isLoading ? (
            <div className="text-center py-12 text-xs text-slate-400">
              Memuat data non-mutual...
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500">
              Tidak ada akun yang sesuai kriteria pencarian.
            </div>
          ) : (
            items.map((item) => {
              const isCompleted = item.unfollow_state === 'COMPLETED';
              const isInCooldown = cooldownCountdown !== null && !isCompleted;

              return (
                <div
                  key={item.target_ig_pk}
                  className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-sm flex items-center justify-between transition-all"
                >
                  {/* Left: Avatar & Info */}
                  <div className="flex items-center gap-3 min-w-0 pr-2">
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
                      className="w-11 h-11 rounded-full object-cover border border-slate-100 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-[#1E1B4B] truncate">
                          {item.target_full_name || item.target_username}
                        </span>
                        {item.is_whitelisted && (
                          <button
                            type="button"
                            onClick={() => handleToggleWhitelist(item)}
                            title="Klik untuk membuka proteksi"
                            className="px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#F59E0B] hover:bg-[#FDE68A] text-[9px] font-bold transition-colors cursor-pointer"
                          >
                            🛡 Terlindungi
                          </button>
                        )}
                      </div>
                      <span className="text-[11px] text-[#6B7280] block truncate">
                        @{item.target_username}
                      </span>
                    </div>
                  </div>

                  {/* Right: Unfollow State Button & Instagram Shortcut */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Unfollow Button */}
                    {isCompleted ? (
                      <div className="px-3 py-1.5 rounded-xl bg-[#D1FAE5] text-[#065F46] font-bold text-xs flex items-center gap-1">
                        <Check size={13} />
                        <span>Selesai</span>
                      </div>
                    ) : isInCooldown ? (
                      <button
                        disabled
                        className="px-3 py-1.5 rounded-xl bg-[#EDE9FE] text-[#6D28D9] font-bold text-xs flex items-center gap-1.5 animate-pulse cursor-not-allowed"
                      >
                        <RefreshCw size={12} className="animate-spin" />
                        <span>Jeda Aman {cooldownCountdown}s</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => openConfirmDialog(item)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#FEA619] hover:bg-[#E59514] active:scale-95 text-[#1E1B4B] font-bold text-xs shadow-sm shadow-amber-500/20 transition-all"
                      >
                        Unfollow
                      </button>
                    )}

                    {/* Instagram Profile Link */}
                    <a
                      href={item.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-[#E1306C] transition-colors"
                      title="Buka Instagram"
                    >
                      <Instagram size={15} />
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 4. Smart Anti-Ban Info Box */}
        <div className="px-4 pb-4">
          <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-3.5 flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-purple-100 text-[#5E3A9B] flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck size={14} />
            </div>
            <p className="text-[11px] text-[#5E3A9B]/90 leading-relaxed">
              <strong className="font-semibold">Proteksi Akun Cerdas Aktif</strong> — GaMutual
              membatasi laju unfollow secara otomatis dengan interval dinamis 8–15 detik untuk mematuhi
              regulasi algoritma Instagram.
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <UnfollowConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        target={targetItem}
        remainingQuota={antiBan.remaining_quota}
        onConfirm={executeUnfollow}
        onToggleWhitelist={handleToggleWhitelist}
        isLoading={isActionLoading}
      />
    </MobileShell>
  );
}
