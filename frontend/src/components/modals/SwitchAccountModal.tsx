'use client';

import React from 'react';
import { X, Check, Plus, User, LogOut } from 'lucide-react';
import { AccountSwitcherItem } from '@/types';
import { clearAuthSession } from '@/lib/api';
import Link from 'next/link';

interface SwitchAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: AccountSwitcherItem[];
  activeId: string;
  onSelectAccount: (accountId: string) => void;
}

export default function SwitchAccountModal({
  isOpen,
  onClose,
  accounts,
  activeId,
  onSelectAccount,
}: SwitchAccountModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-[390px] bg-white rounded-3xl p-6 shadow-2xl relative animate-in fade-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-[#1E1B4B]">Ganti Akun Instagram</h3>
            <p className="text-xs text-[#6B7280]">Pilih akun yang ingin Anda pantau</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="py-4 space-y-3 max-h-[300px] overflow-y-auto">
          {accounts.map((acc) => {
            const isActive = acc.id === activeId || acc.is_active;

            return (
              <div
                key={acc.id}
                onClick={() => {
                  onSelectAccount(acc.id);
                  onClose();
                }}
                className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border ${
                  isActive
                    ? 'border-[#5E3A9B] bg-purple-50/50'
                    : 'border-slate-100 hover:border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  {acc.profile_pic_url ? (
                    <img
                      src={acc.profile_pic_url}
                      alt={acc.username}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(acc.username)}&background=251245&color=fff&bold=true`;
                      }}
                      className="w-11 h-11 rounded-full object-cover border border-purple-200"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                      <User size={20} />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm text-[#1E1B4B]">
                        {acc.full_name || acc.username}
                      </span>
                    </div>
                    <span className="text-xs text-[#6B7280]">@{acc.username}</span>
                  </div>
                </div>

                {isActive && (
                  <div className="w-6 h-6 rounded-full bg-[#5E3A9B] text-white flex items-center justify-center">
                    <Check size={14} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
          <Link
            href="/login"
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-[#5E3A9B]/40 text-[#5E3A9B] hover:bg-purple-50 transition-colors text-sm font-semibold"
          >
            <Plus size={18} />
            <span>Tambah Akun Baru</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              clearAuthSession();
              window.location.href = '/login';
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors text-xs font-semibold"
          >
            <LogOut size={16} />
            <span>Keluar dari Akun</span>
          </button>
        </div>
      </div>
    </div>
  );
}
