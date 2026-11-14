'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  FileArchive,
  FileJson,
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Info,
  Lock,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import MobileShell from '@/components/layout/MobileShell';
import InstagramDownloadTutorialModal from '@/components/modals/InstagramDownloadTutorialModal';
import { getStoredToken, getActiveAccountId, getActiveUsername, setActiveUsername, api } from '@/lib/api';
import {
  parseInstagramZip,
  parseInstagramAccountList,
  identifyJsonType,
  computeAnalysis,
  setAnalysisCache,
  RawAccountEntry,
} from '@/lib/instagramDataParser';

export default function LandingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active session detection
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [loggedUsername, setLoggedUsername] = useState<string | null>(null);

  // Drag & drop state
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Staged JSON files (if user uploads following and followers separately)
  const [stagedFollowing, setStagedFollowing] = useState<RawAccountEntry[] | null>(null);
  const [stagedFollowingName, setStagedFollowingName] = useState<string | null>(null);
  const [stagedFollowers, setStagedFollowers] = useState<RawAccountEntry[] | null>(null);
  const [stagedFollowersName, setStagedFollowersName] = useState<string | null>(null);

  // Modal
  const [tutorialOpen, setTutorialOpen] = useState(false);

  // Check stored credentials
  useEffect(() => {
    const token = getStoredToken();
    const activeId = getActiveAccountId();
    if (token && activeId) {
      setHasActiveSession(true);
      const cached = getActiveUsername();
      if (cached) {
        setLoggedUsername(cached);
      } else {
        // Try to fetch active account username
        api
          .getAccounts(activeId)
          .then((res) => {
            const acc = res.accounts?.find((a: any) => a.id === activeId) || res.accounts?.[0];
            if (acc?.username) {
              setLoggedUsername(acc.username);
              setActiveUsername(acc.username);
            }
          })
          .catch(() => {
            // Ignore error
          });
      }
    }
  }, []);

  const handleProcessFiles = async (fileList: FileList | File[]) => {
    setErrorMessage(null);
    const files = Array.from(fileList);
    if (!files || files.length === 0) return;

    // Check if any ZIP file is present
    const zipFile = files.find(
      (f) =>
        f.name.toLowerCase().endsWith('.zip') ||
        f.type === 'application/zip' ||
        f.type === 'application/x-zip-compressed' ||
        f.type.includes('zip')
    );

    if (zipFile) {
      setIsProcessing(true);
      setProcessingStatus(`Mengekstrak dan membaca ${zipFile.name}...`);
      try {
        const result = await parseInstagramZip(zipFile);
        setAnalysisCache(result);
        router.push('/offline-analysis');
        return;
      } catch (err: any) {
        console.error(err);
        setErrorMessage(err.message || 'Gagal memproses file ZIP. Pastikan file adalah arsip data dari Instagram.');
        setIsProcessing(false);
        setProcessingStatus('');
        return;
      }
    }

    // Process JSON files
    const jsonFiles = files.filter((f) => f.name.toLowerCase().endsWith('.json') || f.type.includes('json'));

    if (jsonFiles.length === 0) {
      setErrorMessage('Format file tidak didukung. Harap unggah file .zip atau .json dari Instagram.');
      return;
    }

    setIsProcessing(true);
    setProcessingStatus(`Membaca ${jsonFiles.length} file JSON...`);

    try {
      let currentFollowing = stagedFollowing ? [...stagedFollowing] : null;
      let currentFollowers = stagedFollowers ? [...stagedFollowers] : null;
      const followingFileNames: string[] = stagedFollowingName ? [stagedFollowingName] : [];
      const followersFileNames: string[] = stagedFollowersName ? [stagedFollowersName] : [];

      for (const file of jsonFiles) {
        const text = await file.text();
        let parsed: any;
        try {
          parsed = JSON.parse(text);
        } catch {
          throw new Error(`File ${file.name} bukan format JSON yang valid.`);
        }

        const type = identifyJsonType(file.name, parsed);

        if (type === 'both') {
          const flw = parseInstagramAccountList(parsed.relationships_following || parsed.following);
          const flr = parseInstagramAccountList(parsed.relationships_followers || parsed.followers);
          const res = computeAnalysis(flw, flr, 'json', [file.name]);
          setAnalysisCache(res);
          router.push('/offline-analysis');
          return;
        } else if (type === 'following') {
          const list = parseInstagramAccountList(parsed);
          currentFollowing = (currentFollowing || []).concat(list);
          if (!followingFileNames.includes(file.name)) followingFileNames.push(file.name);
        } else if (type === 'followers') {
          const list = parseInstagramAccountList(parsed);
          currentFollowers = (currentFollowers || []).concat(list);
          if (!followersFileNames.includes(file.name)) followersFileNames.push(file.name);
        } else {
          // Generic or unrecognized file name - attempt to parse
          const list = parseInstagramAccountList(parsed);
          if (currentFollowing === null) {
            currentFollowing = list;
            followingFileNames.push(file.name);
          } else if (currentFollowers === null) {
            currentFollowers = list;
            followersFileNames.push(file.name);
          } else {
            currentFollowers = currentFollowers.concat(list);
            followersFileNames.push(file.name);
          }
        }
      }

      // Check if both sides have been provided (even if one of them is empty e.g. 0 following/followers)
      if (currentFollowing !== null && currentFollowers !== null) {
        const allNames = [...followingFileNames, ...followersFileNames];
        const res = computeAnalysis(currentFollowing, currentFollowers, 'json', allNames);
        setAnalysisCache(res);
        router.push('/offline-analysis');
        return;
      }

      // If only one side is loaded, stage it
      if (currentFollowing !== null && currentFollowers === null) {
        setStagedFollowing(currentFollowing);
        setStagedFollowingName(followingFileNames.join(', '));
        setIsProcessing(false);
        setProcessingStatus('');
        return;
      }

      if (currentFollowers !== null && currentFollowing === null) {
        setStagedFollowers(currentFollowers);
        setStagedFollowersName(followersFileNames.join(', '));
        setIsProcessing(false);
        setProcessingStatus('');
        return;
      }

      throw new Error('Tidak dapat menemukan data akun dalam file yang diunggah.');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses file JSON.');
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFiles(e.target.files);
      e.target.value = '';
    }
  };

  const resetStagedFiles = () => {
    setStagedFollowing(null);
    setStagedFollowingName(null);
    setStagedFollowers(null);
    setStagedFollowersName(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <MobileShell showNav={false} requireAuth={false}>
      <div className="flex flex-col min-h-screen px-4 pt-5 pb-8 space-y-4">
        {/* Top Header Card */}
        <div className="bg-gradient-to-br from-[#251245] via-[#2A1550] to-[#1F1138] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          {/* Subtle decorative glow */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#FEA619]/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#5E3A9B]/30 rounded-full blur-2xl pointer-events-none" />

          {/* Top Bar Brand */}
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FEA619] flex items-center justify-center text-[#251245] font-extrabold text-xl shadow-md shadow-amber-500/20">
                G
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">GaMutual</span>
            </div>
            <span className="text-[11px] font-semibold bg-white/10 text-purple-200 px-2.5 py-1 rounded-full border border-white/15">
              v1.0 Safe Edition
            </span>
          </div>

          {/* Centered Slogan */}
          <div className="text-center py-2 relative z-10">
            <h1 className="text-lg font-bold text-white leading-snug">
              Kelola mutual Instagram Anda dengan aman, cepat, dan transparan
            </h1>
            <p className="text-xs text-purple-200/80 mt-2 font-normal leading-relaxed">
              Analisis siapa yang tidak follback tanpa perlu memberikan kata sandi atau akun berisiko terkena suspend.
            </p>
          </div>

          {/* Logged-in session shortcut if active */}
          {hasActiveSession && (
            <div className="mt-4 pt-3 border-t border-white/10 relative z-10">
              <Link
                href="/home"
                className="w-full bg-[#FEA619] hover:bg-[#E59514] text-[#1E1B4B] font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-between transition-colors shadow-md shadow-amber-500/30 group"
              >
                <span className="flex items-center gap-2 truncate">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-700 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-800"></span>
                  </span>
                  <span>
                    Lanjutkan sesi sebagai{' '}
                    <span className="font-extrabold">@{loggedUsername || 'Akun Anda'}</span>
                  </span>
                </span>
                <span className="group-hover:translate-x-1 transition-transform">➔</span>
              </Link>
            </div>
          )}
        </div>

        {/* Safe Mode Feature Badge */}
        <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-2xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div className="flex-1">
            <h2 className="text-xs font-bold text-emerald-950">Analisis Offline & 100% Aman</h2>
            <p className="text-[11px] text-emerald-800 leading-tight mt-0.5">
              File diproses langsung di browser Anda. Tidak ada data yang dikirim ke server.
            </p>
          </div>
        </div>

        {/* Drag & Drop Upload Zone */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-[#1E1B4B]">Unggah Data Instagram</h2>
            <p className="text-[11px] text-slate-500">Mendukung berkas .zip atau .json</p>
          </div>

          {/* Staged file progress (if user uploaded 1 file first) */}
          {(stagedFollowing || stagedFollowers) && (
            <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1E1B4B]">Progres File Unggahan:</span>
                <button
                  onClick={resetStagedFiles}
                  className="text-[11px] text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1"
                >
                  <XCircle size={12} />
                  <span>Batal</span>
                </button>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    {stagedFollowing ? (
                      <CheckCircle2 size={14} className="text-emerald-600" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block" />
                    )}
                    Following:
                  </span>
                  <span className="font-semibold text-slate-800">
                    {stagedFollowing
                      ? `${stagedFollowing.length} akun (${stagedFollowingName})`
                      : 'Menunggu following.json...'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    {stagedFollowers ? (
                      <CheckCircle2 size={14} className="text-emerald-600" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block" />
                    )}
                    Followers:
                  </span>
                  <span className="font-semibold text-slate-800">
                    {stagedFollowers
                      ? `${stagedFollowers.length} akun (${stagedFollowersName})`
                      : 'Menunggu followers_1.json...'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Dropzone Box */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed transition-all p-6 text-center flex flex-col items-center justify-center min-h-[170px] select-none ${
              isDragging
                ? 'border-[#FEA619] bg-amber-50/60 scale-[1.01]'
                : 'border-slate-300 hover:border-[#5E3A9B] hover:bg-slate-50/80 bg-slate-50/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".zip,.json,application/zip,application/json,application/x-zip-compressed"
              onChange={handleFileChange}
              className="hidden"
            />

            {isProcessing ? (
              <div className="flex flex-col items-center gap-2.5">
                <RefreshCw size={32} className="animate-spin text-[#5E3A9B]" />
                <p className="text-xs font-semibold text-[#1E1B4B]">
                  {processingStatus || 'Sedang memproses berkas...'}
                </p>
                <p className="text-[11px] text-slate-500">Menganalisis daftar mutuals...</p>
              </div>
            ) : (
              <>
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2.5 transition-colors ${
                    isDragging ? 'bg-[#FEA619] text-white' : 'bg-purple-100 text-[#5E3A9B]'
                  }`}
                >
                  <UploadCloud size={24} />
                </div>
                <h3 className="text-xs font-bold text-[#1E1B4B]">
                  {stagedFollowing && !stagedFollowers
                    ? 'Tarik & letakkan followers_1.json di sini'
                    : stagedFollowers && !stagedFollowing
                    ? 'Tarik & letakkan following.json di sini'
                    : 'Tarik & letakkan berkas ZIP atau JSON'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 max-w-[260px] leading-relaxed">
                  atau <span className="text-[#5E3A9B] font-semibold underline underline-offset-2">pilih dari HP/laptop</span>
                </p>
                <div className="flex items-center gap-2 mt-3 text-[10px] text-slate-400 font-medium">
                  <span className="bg-slate-200/80 px-2 py-0.5 rounded-md text-slate-600">.ZIP</span>
                  <span>•</span>
                  <span className="bg-slate-200/80 px-2 py-0.5 rounded-md text-slate-600">followers_1.json</span>
                  <span>•</span>
                  <span className="bg-slate-200/80 px-2 py-0.5 rounded-md text-slate-600">following.json</span>
                </div>
              </>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 flex items-start gap-2.5 text-rose-800 text-xs animate-in fade-in">
              <AlertTriangle size={16} className="text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Guide Helper Trigger */}
          <button
            type="button"
            onClick={() => setTutorialOpen(true)}
            className="w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <HelpCircle size={15} className="text-[#5E3A9B]" />
            <span>Panduan Cara Unduh Data Instagram</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative py-2 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-300" />
          </div>
          <div className="relative bg-[#F8FAFC] px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            — atau —
          </div>
        </div>

        {/* Login Option Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 space-y-3.5">
          <div>
            <h2 className="text-sm font-bold text-[#1E1B4B]">Masuk Langsung dengan Instagram</h2>
            <p className="text-[11px] text-slate-500">
              Sinkronisasi data otomatis dengan akun Instagram Anda
            </p>
          </div>

          {/* Risk Warning Badge */}
          <div className="bg-amber-50 border border-amber-300/80 rounded-2xl p-3 flex items-start gap-2.5 text-amber-900">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong className="font-semibold block text-amber-950 mb-0.5">⚠️ Perhatian:</strong>
              Metode login langsung menggunakan cookie berisiko memicu pembatasan/peringatan otomatisasi dari Meta (Instagram).
            </div>
          </div>

          {/* Action Button to /login */}
          <Link
            href="/login"
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#251245] to-[#1F1138] hover:opacity-95 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/20"
          >
            <Lock size={14} className="text-[#FEA619]" />
            <span>Masuk dengan Akun Instagram</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Footer info */}
        <div className="text-center pt-2 pb-4">
          <p className="text-[11px] text-slate-400">
            GaMutual &bull; Instagram Relationship & Mutual Tracker
          </p>
        </div>
      </div>

      {/* Tutorial Bottom Sheet Modal */}
      <InstagramDownloadTutorialModal
        isOpen={tutorialOpen}
        onClose={() => setTutorialOpen(false)}
      />
    </MobileShell>
  );
}
