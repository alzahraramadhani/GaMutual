'use client';

import React from 'react';
import { AlertTriangle, X, Shield, ShieldAlert, Lock, Unlock } from 'lucide-react';
import { UnfollowerItem } from '@/types';

interface UnfollowConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: UnfollowerItem | null;
  remainingQuota: number;
  onConfirm: () => void;
  onToggleWhitelist?: (target: UnfollowerItem) => void;
  isLoading?: boolean;
}

export default function UnfollowConfirmModal({
  isOpen,
  onClose,
  target,
  remainingQuota,
  onConfirm,
  onToggleWhitelist,
  isLoading = false,
}: UnfollowConfirmModalProps) {
  if (!isOpen || !target) return null;

  const isProtected = target.is_whitelisted;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-[360px] bg-white rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
            isProtected ? 'bg-amber-100 text-[#F59E0B]' : 'bg-amber-50 text-[#FEA619]'
          }`}>
            {isProtected ? <ShieldAlert size={28} /> : <AlertTriangle size={28} />}
          </div>

          <h3 className="text-base font-bold text-[#1E1B4B] mb-2">
            {isProtected ? 'Akun Terlindungi' : 'Konfirmasi Tindakan'}
          </h3>

          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            {isProtected ? (
              <span>
                Akun <strong className="text-[#1E1B4B]">@{target.target_username}</strong> berada dalam{' '}
                <strong className="text-[#F59E0B]">List Terlindungi</strong>. Buka perlindungan terlebih dahulu jika ingin berhenti mengikuti akun ini.
              </span>
            ) : (
              <span>
                Yakin ingin berhenti mengikuti{' '}
                <strong className="text-[#1E1B4B]">@{target.target_username}</strong>?
              </span>
            )}
          </p>

          <div className="w-full bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl p-2.5 mb-5 flex items-center justify-center gap-2 text-xs text-[#065F46] font-medium">
            <Shield size={15} className="text-[#10B981]" />
            <span>Sisa kuota aman hari ini: {remainingQuota} aksi</span>
          </div>

          <div className="w-full grid grid-cols-2 gap-2.5">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              Batal
            </button>

            {isProtected ? (
              <button
                onClick={() => onToggleWhitelist && onToggleWhitelist(target)}
                disabled={isLoading}
                className="w-full py-2.5 px-2 rounded-xl bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#92400E] font-semibold text-xs transition-colors flex items-center justify-center gap-1 border border-[#FCD34D]"
              >
                <Unlock size={13} />
                <span>Buka Proteksi</span>
              </button>
            ) : (
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className="w-full py-2.5 px-3 rounded-xl bg-[#FEA619] hover:bg-[#E59514] text-white font-semibold text-xs transition-colors shadow-md shadow-amber-500/20 disabled:opacity-50"
              >
                {isLoading ? 'Memproses...' : 'Ya, Unfollow'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
