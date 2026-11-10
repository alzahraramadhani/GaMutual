'use client';

import React, { useEffect, useState } from 'react';
import { X, ShieldCheck, ShieldAlert, Trash2, User } from 'lucide-react';
import { api } from '@/lib/api';

interface WhitelistItem {
  target_ig_pk: string;
  target_username: string;
  target_full_name: string;
  target_pic_url: string;
  reason?: string;
  instagram_url?: string;
}

interface ManageWhitelistModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
  onUpdate?: () => void;
}

export default function ManageWhitelistModal({
  isOpen,
  onClose,
  accountId,
  onUpdate,
}: ManageWhitelistModalProps) {
  const [items, setItems] = useState<WhitelistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && accountId) {
      loadWhitelist();
    }
  }, [isOpen, accountId]);

  const loadWhitelist = async () => {
    setIsLoading(true);
    try {
      const res = await api.getWhitelist(accountId);
      setItems(res.items || []);
    } catch (err) {
      console.error('Failed to load whitelist:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (item: WhitelistItem) => {
    try {
      await api.toggleWhitelist(accountId, {
        target_ig_pk: item.target_ig_pk,
        target_username: item.target_username,
      });
      setItems((prev) => prev.filter((i) => i.target_ig_pk !== item.target_ig_pk));
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Failed to toggle whitelist:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-[400px] bg-white rounded-3xl p-6 shadow-2xl relative animate-in fade-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#6B21A8] flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1E1B4B]">List Terlindungi (Whitelist)</h3>
              <p className="text-xs text-[#6B7280]">{items.length} akun diamankan dari unfollow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="py-4 space-y-3 max-h-[320px] overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8 text-xs text-slate-400">Memuat akun terlindungi...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              Belum ada akun di List Terlindungi. Buka halaman Unfollower untuk menambahkan proteksi akun.
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.target_ig_pk}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  {item.target_pic_url ? (
                    <img
                      src={item.target_pic_url}
                      alt={item.target_username}
                      className="w-10 h-10 rounded-full object-cover border border-purple-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                      <User size={18} />
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-[#1E1B4B]">
                      {item.target_full_name || item.target_username}
                    </h4>
                    <span className="text-[11px] text-[#6B7280]">@{item.target_username}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleRemove(item)}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                  title="Hapus dari Proteksi"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#1E1B4B] font-semibold text-xs transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
