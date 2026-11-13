'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserX,
  UserCheck,
  UserPlus,
  Search,
  ExternalLink,
  CheckCircle2,
  Circle,
  ArrowLeft,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  FileText,
  Filter,
  Copy,
  Check,
  Info,
} from 'lucide-react';
import MobileShell from '@/components/layout/MobileShell';
import {
  OfflineAnalysisResult,
  RawAccountEntry,
  getAnalysisCache,
  setAnalysisCache,
} from '@/lib/instagramDataParser';

type ActiveTab = 'tidak_follback' | 'mutuals' | 'fans';
type CheckFilter = 'all' | 'pending' | 'done';

export default function OfflineAnalysisPage() {
  const router = useRouter();

  const [data, setData] = useState<OfflineAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('tidak_follback');
  const [searchQuery, setSearchQuery] = useState('');
  const [checkFilter, setCheckFilter] = useState<CheckFilter>('all');
  const [copied, setCopied] = useState(false);

  // Completed checklist stored in localStorage so it persists
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({});

  // Pagination for fast rendering on accounts with thousands of entries
  const PAGE_SIZE = 50;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      // 1. Load analysis data from in-memory cache or sessionStorage
      const cached = getAnalysisCache();
      if (cached) {
        setData(cached);
      }

      // 2. Load checklist state from localStorage
      const savedChecks = localStorage.getItem('gamutual_offline_checklist');
      if (savedChecks) {
        setCompletedMap(JSON.parse(savedChecks));
      }
    } catch (e) {
      console.error('Failed to load offline analysis data:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleCheck = (username: string) => {
    const key = username.toLowerCase();
    setCompletedMap((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('gamutual_offline_checklist', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const handleResetChecklist = () => {
    if (confirm('Apakah Anda yakin ingin mengatur ulang tanda checklist?')) {
      setCompletedMap({});
      localStorage.removeItem('gamutual_offline_checklist');
    }
  };

  const handleCopyUsernames = (accounts: RawAccountEntry[]) => {
    const text = accounts.map((a) => `@${a.username}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUploadAgain = () => {
    setAnalysisCache(null);
    router.push('/');
  };

  // Current tab account list
  const currentTabAccounts = useMemo(() => {
    if (!data) return [];
    switch (activeTab) {
      case 'tidak_follback':
        return data.tidakFollback;
      case 'mutuals':
        return data.mutuals;
      case 'fans':
        return data.fans;
      default:
        return [];
    }
  }, [data, activeTab]);

  // Filtered by search and checklist
  const filteredAccounts = useMemo(() => {
    let result = currentTabAccounts;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((acc) => acc.username.toLowerCase().includes(q));
    }

    // Check filter (only applicable for tidak_follback tab primarily)
    if (activeTab === 'tidak_follback' && checkFilter !== 'all') {
      result = result.filter((acc) => {
        const isDone = !!completedMap[acc.username.toLowerCase()];
        return checkFilter === 'done' ? isDone : !isDone;
      });
    }

    return result;
  }, [currentTabAccounts, searchQuery, checkFilter, activeTab, completedMap]);

  // Reset pagination when tab, search, or checklist filter changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeTab, searchQuery, checkFilter]);

  const displayedAccounts = useMemo(() => {
    return filteredAccounts.slice(0, visibleCount);
  }, [filteredAccounts, visibleCount]);

  // Checklist counts for tidak_follback
  const completedStats = useMemo(() => {
    if (!data) return { done: 0, total: 0, percent: 0 };
    const total = data.tidakFollbackCount;
    let done = 0;
    for (const acc of data.tidakFollback) {
      if (completedMap[acc.username.toLowerCase()]) {
        done++;
      }
    }
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { done, total, percent };
  }, [data, completedMap]);

  if (isLoading) {
    return (
      <MobileShell showNav={false} requireAuth={false}>
        <div className="min-h-screen bg-[#251245] flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3 text-white">
            <div className="w-12 h-12 rounded-2xl bg-[#FEA619] flex items-center justify-center text-[#251245] font-black text-2xl animate-pulse">
              G
            </div>
            <p className="text-sm font-medium text-purple-200">Menyiapkan data analisis...</p>
          </div>
        </div>
      </MobileShell>
    );
  }

  // Empty state if user navigated without data
  if (!data) {
    return (
      <MobileShell showNav={false} requireAuth={false}>
        <div className="flex flex-col min-h-screen px-4 py-8 items-center justify-center text-center">
          <div className="w-16 h-16 rounded-3xl bg-purple-100 text-[#5E3A9B] flex items-center justify-center mb-4">
            <FileText size={32} />
          </div>
          <h2 className="text-lg font-bold text-[#1E1B4B]">Belum Ada Data Hasil Analisis</h2>
          <p className="text-xs text-slate-500 max-w-[280px] mt-1.5 leading-relaxed">
            Silakan unggah berkas .zip atau .json Instagram Anda di halaman depan terlebih dahulu.
          </p>
          <button
            onClick={() => router.push('/')}
            className="mt-6 py-3 px-6 rounded-xl bg-gradient-to-r from-[#251245] to-[#1F1138] text-white font-semibold text-xs shadow-lg shadow-indigo-950/20 hover:opacity-95 transition-all flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            <span>Ke Halaman Unggah</span>
          </button>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell showNav={false} requireAuth={false}>
      <div className="flex flex-col min-h-screen px-4 pt-4 pb-8 space-y-4 font-sans">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => router.push('/')}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm"
            aria-label="Kembali ke Beranda"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="text-center">
            <h1 className="text-sm font-bold text-[#1E1B4B]">Hasil Analisis Data</h1>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center justify-center gap-1">
              <ShieldCheck size={11} />
              <span>Offline Safe Mode</span>
            </span>
          </div>

          <button
            onClick={handleUploadAgain}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm"
            title="Unggah Ulang File"
            aria-label="Unggah Ulang"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* Hero Card: Summary Metrics */}
        <div className="bg-gradient-to-br from-[#251245] via-[#2A1550] to-[#1F1138] rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
          {/* Subtle glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#FEA619]/15 rounded-full blur-2xl pointer-events-none" />

          {/* Hero Counter: Tidak Follback */}
          <div className="text-center pb-4 border-b border-white/10">
            <span className="inline-block text-[11px] font-semibold tracking-wider uppercase text-purple-200/80 mb-1">
              Tidak Follback Anda
            </span>
            <div className="flex items-center justify-center gap-2">
              <span className="text-4xl font-extrabold text-[#FEA619] tracking-tight">
                {data.tidakFollbackCount.toLocaleString('id-ID')}
              </span>
              <span className="text-xs text-purple-200/90 font-medium">akun</span>
            </div>
            <p className="text-[11px] text-purple-200/70 mt-1">
              Akun yang Anda ikuti, tetapi mereka tidak mengikuti balik
            </p>
          </div>

          {/* 2 Sub Metric Boxes */}
          <div className="grid grid-cols-2 gap-2.5 pt-3.5">
            {/* Mutuals */}
            <button
              onClick={() => setActiveTab('mutuals')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                activeTab === 'mutuals'
                  ? 'bg-white/15 border-white/30 ring-2 ring-white/20'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between text-purple-200 mb-1">
                <span className="text-[10px] font-medium uppercase tracking-wider">Mutuals</span>
                <UserCheck size={14} />
              </div>
              <span className="text-xl font-bold text-white block">
                {data.mutualCount.toLocaleString('id-ID')}
              </span>
              <span className="text-[10px] text-purple-200/70">Saling Mengikuti</span>
            </button>

            {/* Fans / Belum Difollow */}
            <button
              onClick={() => setActiveTab('fans')}
              className={`p-3 rounded-2xl border text-left transition-all ${
                activeTab === 'fans'
                  ? 'bg-white/15 border-white/30 ring-2 ring-white/20'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between text-purple-200 mb-1">
                <span className="text-[10px] font-medium uppercase tracking-wider">Fans</span>
                <UserPlus size={14} />
              </div>
              <span className="text-xl font-bold text-white block">
                {data.fansCount.toLocaleString('id-ID')}
              </span>
              <span className="text-[10px] text-purple-200/70">Belum Anda Follow</span>
            </button>
          </div>
        </div>

        {/* Action Header: Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-2xl">
          <button
            onClick={() => setActiveTab('tidak_follback')}
            className={`flex-1 py-2 px-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'tidak_follback'
                ? 'bg-[#251245] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tidak Follback ({data.tidakFollbackCount})
          </button>
          <button
            onClick={() => setActiveTab('mutuals')}
            className={`flex-1 py-2 px-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'mutuals'
                ? 'bg-[#251245] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mutual ({data.mutualCount})
          </button>
          <button
            onClick={() => setActiveTab('fans')}
            className={`flex-1 py-2 px-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'fans'
                ? 'bg-[#251245] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Fans ({data.fansCount})
          </button>
        </div>

        {/* Progress Tracker (Only for 'tidak_follback' tab) */}
        {activeTab === 'tidak_follback' && data.tidakFollbackCount > 0 && (
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#1E1B4B] flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-emerald-600" />
                <span>Progres Unfollow Manual</span>
              </span>
              <span className="font-bold text-[#5E3A9B]">
                {completedStats.done} / {completedStats.total} selesai ({completedStats.percent}%)
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${completedStats.percent}%` }}
              />
            </div>

            {/* Checklist Filter & Tools */}
            <div className="flex items-center justify-between pt-1 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Filter:</span>
                <button
                  onClick={() => setCheckFilter('all')}
                  className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                    checkFilter === 'all'
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setCheckFilter('pending')}
                  className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                    checkFilter === 'pending'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Belum Selesai ({completedStats.total - completedStats.done})
                </button>
                <button
                  onClick={() => setCheckFilter('done')}
                  className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                    checkFilter === 'done'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Selesai ({completedStats.done})
                </button>
              </div>

              {completedStats.done > 0 && (
                <button
                  onClick={handleResetChecklist}
                  className="text-slate-400 hover:text-rose-500 text-[10px] underline"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        )}

        {/* Search Bar & Copy Action */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Cari @username di tab ${
                activeTab === 'tidak_follback'
                  ? 'Tidak Follback'
                  : activeTab === 'mutuals'
                  ? 'Mutual'
                  : 'Fans'
              }...`}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#5E3A9B] focus:border-transparent text-[#1E1B4B] placeholder:text-slate-400 shadow-sm"
            />
          </div>

          <button
            onClick={() => handleCopyUsernames(filteredAccounts)}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors shadow-sm shrink-0"
            title="Salin daftar username yang tampil"
          >
            {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
          </button>
        </div>

        {/* Account List */}
        <div className="space-y-2">
          {filteredAccounts.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 shadow-sm">
              <p className="text-xs font-semibold text-slate-700">Tidak ada akun yang ditemukan</p>
              <p className="text-[11px] text-slate-400 mt-1">
                {searchQuery ? 'Coba gunakan kata kunci pencarian yang lain' : 'Daftar ini kosong'}
              </p>
            </div>
          ) : (
            displayedAccounts.map((account, idx) => {
              const isChecked = !!completedMap[account.username.toLowerCase()];
              const profileUrl = `https://www.instagram.com/${encodeURIComponent(account.username)}/`;

              return (
                <div
                  key={`${account.username}-${idx}`}
                  className={`bg-white rounded-2xl p-3 border transition-all flex items-center justify-between gap-3 shadow-sm ${
                    isChecked
                      ? 'border-emerald-200 bg-emerald-50/20 opacity-75'
                      : 'border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  {/* Avatar & Username */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Initial Placeholder Avatar */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0 ${
                        isChecked
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gradient-to-br from-[#251245] to-[#5E3A9B] text-white shadow-sm'
                      }`}
                    >
                      {account.username.slice(0, 2)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-bold truncate block ${
                            isChecked ? 'line-through text-slate-400' : 'text-[#1E1B4B]'
                          }`}
                        >
                          @{account.username}
                        </span>
                        {isChecked && (
                          <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                            Selesai
                          </span>
                        )}
                      </div>
                      {account.dateStr && (
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Mengikuti sejak: {account.dateStr}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions: Buka Profil & Checklist */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Buka Profil Button */}
                    <a
                      href={profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-2.5 rounded-xl border border-slate-200 hover:border-[#5E3A9B] hover:bg-purple-50/50 text-[#5E3A9B] text-xs font-medium flex items-center gap-1 transition-colors"
                      title="Buka profil di tab baru"
                    >
                      <span>Buka Profil</span>
                      <ExternalLink size={12} />
                    </a>

                    {/* Checklist Toggle (for tidak_follback) */}
                    {activeTab === 'tidak_follback' && (
                      <button
                        onClick={() => toggleCheck(account.username)}
                        className={`py-1.5 px-2.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                          isChecked
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                        title={isChecked ? 'Tandai belum selesai' : 'Tandai sudah di-unfollow'}
                      >
                        {isChecked ? (
                          <>
                            <CheckCircle2 size={13} />
                            <span>Selesai</span>
                          </>
                        ) : (
                          <>
                            <Circle size={13} />
                            <span>Tandai Selesai</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Pagination Controls */}
          {filteredAccounts.length > visibleCount && (
            <div className="pt-2 pb-1 text-center space-y-2">
              <p className="text-[11px] text-slate-500">
                Menampilkan {displayedAccounts.length} dari {filteredAccounts.length} akun
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredAccounts.length))}
                  className="py-2 px-3.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#5E3A9B] text-xs font-semibold border border-purple-200 transition-colors"
                >
                  Muat 50 Akun Lagi
                </button>
                <button
                  type="button"
                  onClick={() => setVisibleCount(filteredAccounts.length)}
                  className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                >
                  Tampilkan Semua ({filteredAccounts.length})
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="pt-2 pb-4 space-y-2">
          <button
            onClick={handleUploadAgain}
            className="w-full py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw size={14} />
            <span>Unggah Ulang File Lain</span>
          </button>

          <button
            onClick={() => router.push('/')}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#251245] to-[#1F1138] hover:opacity-95 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/20"
          >
            <ArrowLeft size={14} />
            <span>Kembali ke Beranda GaMutual</span>
          </button>
        </div>
      </div>
    </MobileShell>
  );
}
