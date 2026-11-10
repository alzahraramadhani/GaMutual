'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, ShieldCheck, Search, Users, ExternalLink, RefreshCw } from 'lucide-react';
import MobileShell from '@/components/layout/MobileShell';
import { api, getActiveAccountId } from '@/lib/api';
import { UnfollowerItem } from '@/types';

export default function WhitelistPage() {
  const [items, setItems] = useState<UnfollowerItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeId, setActiveId] = useState<string>('');
  const [togglingPk, setTogglingPk] = useState<string | null>(null);

  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
    setIsLoading(true);
    try {
      const accRes = await api.getAccounts();
      const stored = getActiveAccountId();
      const validStored = stored && accRes.accounts?.some((a: any) => a.id === stored);
      const curId = (validStored ? stored : accRes.active_account_id) || accRes.accounts?.[0]?.id || '';
      setActiveId(curId);

      if (curId) {
        const res = await api.getUnfollowers(curId, { filter: 'all', limit: 100 });
        setItems(res.items || []);
      }
    } catch (err) {
      console.error('Failed to load non-mutual users for whitelist:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (item: UnfollowerItem) => {
    if (!activeId || togglingPk) return;
    const previousState = item.is_whitelisted;
    const newState = !previousState;

    // Optimistic UI update
    setTogglingPk(item.target_ig_pk);
    setItems((prev) =>
      prev.map((it) =>
        it.target_ig_pk === item.target_ig_pk ? { ...it, is_whitelisted: newState } : it
      )
    );

    try {
      await api.toggleWhitelist(activeId, {
        target_ig_pk: item.target_ig_pk,
        target_username: item.target_username,
      });
    } catch (err) {
      console.error('Toggle whitelist failed:', err);
      // Rollback on error
      setItems((prev) =>
        prev.map((it) =>
          it.target_ig_pk === item.target_ig_pk ? { ...it, is_whitelisted: previousState } : it
        )
      );
      alert('Gagal mengubah proteksi akun. Silakan coba lagi.');
    } finally {
      setTogglingPk(null);
    }
  };

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase().trim();
    return items.filter(
      (it) =>
        it.target_username.toLowerCase().includes(q) ||
        (it.target_full_name && it.target_full_name.toLowerCase().includes(q))
    );
  }, [items, searchQuery]);

  const protectedCount = useMemo(() => items.filter((i) => i.is_whitelisted).length, [items]);

  return (
    <MobileShell showNav={true}>
      <div className="flex-1 flex flex-col">
        {/* 1. Curved Plum Header */}
        <div className="bg-[#251245] text-white rounded-b-[36px] pt-6 pb-6 px-5 shadow-xl shadow-purple-950/20">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/home"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all backdrop-blur-sm"
              title="Kembali ke Beranda"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight">List Terlindungi</h1>
              <p className="text-xs text-purple-200/80 mt-0.5">
                Amankan akun tidak follback dari tindakan unfollow
              </p>
            </div>
          </div>

          {/* Status Counter Banner */}
          <div className="bg-white/[0.08] backdrop-blur-md rounded-2xl p-3.5 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-[#FEA619] flex items-center justify-center font-bold">
                <Shield size={16} />
              </div>
              <div>
                <span className="text-[11px] text-purple-200/70 block">Total Diamankan</span>
                <span className="text-sm font-bold text-white">
                  {protectedCount} dari {items.length} Akun
                </span>
              </div>
            </div>
            <button
              onClick={initData}
              disabled={isLoading}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white transition-colors"
              title="Muat ulang data"
            >
              <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* 2. Search Bar */}
        <div className="px-4 -mt-3 z-10">
          <div className="relative">
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
          </div>
        </div>

        {/* 3. Single Stream List of Non-Mutual Users */}
        <div className="px-4 py-4 space-y-2.5 flex-1">
          {isLoading ? (
            <div className="text-center py-16 text-xs text-slate-400 flex flex-col items-center gap-2">
              <RefreshCw size={20} className="animate-spin text-purple-600" />
              <span>Memuat daftar akun tidak follback...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16 text-xs text-slate-500">
              {searchQuery ? 'Tidak ada akun yang sesuai pencarian.' : 'Tidak ada akun tidak follback.'}
            </div>
          ) : (
            filteredItems.map((item) => {
              const isWhitelisted = item.is_whitelisted;
              const isBusy = togglingPk === item.target_ig_pk;

              return (
                <div
                  key={item.target_ig_pk}
                  className={`bg-white rounded-2xl p-3.5 border transition-all flex items-center justify-between shadow-sm ${
                    isWhitelisted ? 'border-amber-200 bg-amber-50/20' : 'border-slate-100 hover:border-slate-200'
                  }`}
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
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          item.target_username
                        )}&background=251245&color=fff&bold=true`;
                      }}
                      className="w-11 h-11 rounded-full object-cover border border-slate-100 shrink-0"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-[#1E1B4B] truncate">
                          {item.target_full_name || item.target_username}
                        </span>
                        {isWhitelisted && (
                          <span className="px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#B45309] text-[9px] font-bold">
                            🛡 Terlindungi
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#6B7280] block truncate">
                        @{item.target_username}
                      </span>
                    </div>
                  </div>

                  {/* Right: Dynamic "Amankan" / "Batalkan" Button */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isWhitelisted ? (
                      <button
                        type="button"
                        onClick={() => handleToggle(item)}
                        disabled={isBusy}
                        className="py-1.5 px-3.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:border-rose-200 text-slate-700 hover:text-rose-600 border border-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-60"
                      >
                        <ShieldCheck size={14} className="text-emerald-600" />
                        <span>Batalkan</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggle(item)}
                        disabled={isBusy}
                        className="py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-[#251245] to-[#5E3A9B] hover:opacity-95 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-md shadow-purple-950/15 active:scale-95 disabled:opacity-60"
                      >
                        <Shield size={14} className="text-[#FEA619]" />
                        <span>Amankan</span>
                      </button>
                    )}

                    {/* Instagram Profile Link */}
                    <a
                      href={item.instagram_url}
                      target="_blank"
                      rel="noreferrer"
                      className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-purple-50 text-slate-400 hover:text-purple-700 flex items-center justify-center transition-colors border border-slate-100"
                      title="Buka profil di Instagram"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </MobileShell>
  );
}
