'use client';

import React, { useState } from 'react';
import { X, Key, ExternalLink, HelpCircle, ArrowRight, ShieldCheck, Instagram } from 'lucide-react';

interface SessionIdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginWithSession: (username: string, sessionId: string) => void;
  isLoading: boolean;
}

export default function SessionIdModal({
  isOpen,
  onClose,
  onLoginWithSession,
  isLoading,
}: SessionIdModalProps) {
  const [username, setUsername] = useState('jjahrav');
  const [sessionId, setSessionId] = useState('');
  const [dsUserId, setDsUserId] = useState('');
  const [showTutorial, setShowTutorial] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !sessionId.trim()) return;
    const cleanUser = username.trim().replace(/^@/, '');
    const cleanSession = sessionId.trim();
    const cleanUid = dsUserId.trim();

    // If separate user ID is provided, pass as session||uid
    const finalPayload = cleanUid ? `${cleanSession}||${cleanUid}` : cleanSession;
    onLoginWithSession(cleanUser, finalPayload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative border border-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#251245] to-[#5E3A9B] text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-purple-900/20">
            <Instagram size={22} />
          </div>
          <h3 className="text-lg font-bold text-[#1E1B4B]">Masuk Akun Instagram Asli</h3>
          <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
            Metode instan & paling aman dari blokir Meta menggunakan cookie sesi akun Anda
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1E1B4B] mb-1">
              Username Instagram
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="misal: jjahrav"
                required
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#5E3A9B] text-[#1E1B4B] placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#1E1B4B]">
                Cookie Session ID Instagram
              </label>
              <button
                type="button"
                onClick={() => setShowTutorial(!showTutorial)}
                className="text-[11px] text-purple-700 hover:text-purple-900 flex items-center gap-1 font-medium"
              >
                <HelpCircle size={13} />
                <span>{showTutorial ? 'Tutup panduan' : 'Cara ambil?'}</span>
              </button>
            </div>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Key size={16} />
              </div>
              <input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="Tempel nilai sessionid lengkap dari browser..."
                required
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#5E3A9B] text-[#1E1B4B] placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E1B4B] mb-1">
              User ID Instagram (ds_user_id) <span className="text-slate-400 font-normal">(Opsional)</span>
            </label>
            <input
              type="text"
              value={dsUserId}
              onChange={(e) => setDsUserId(e.target.value)}
              placeholder="Hanya isi jika sessionid di atas tidak ada angka ID di depannya"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#5E3A9B] text-[#1E1B4B] placeholder:text-slate-400"
            />
            <p className="text-[10px] text-slate-500 mt-1 leading-normal">
              💡 Nilai ini dapat dilihat pada baris <b>ds_user_id</b> di menu Cookies.
            </p>
          </div>

          {/* Tutorial Collapsible */}
          {showTutorial && (
            <div className="p-3 bg-purple-50/70 border border-purple-200/60 rounded-2xl text-[11px] text-slate-700 space-y-1.5 leading-relaxed">
              <p className="font-bold text-purple-950 flex items-center gap-1">
                📌 Cara ambil sessionid dari browser (hanya 15 detik):
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-600">
                <li>Buka <a href="https://www.instagram.com" target="_blank" rel="noreferrer" className="text-purple-700 font-semibold underline inline-flex items-center gap-0.5">instagram.com <ExternalLink size={10} /></a> di browser (pastikan sudah login).</li>
                <li>Tekan tombol <b>F12</b> (atau klik kanan $\rightarrow$ pilih <b>Inspect</b>).</li>
                <li>Pilih tab <b>Application</b> (di Chrome/Edge) atau <b>Storage</b> (di Firefox).</li>
                <li>Di sebelah kiri, klik <b>Cookies</b> $\rightarrow$ <code className="bg-purple-100 px-1 py-0.5 rounded text-[10px]">https://www.instagram.com</code>.</li>
                <li>Cari baris bernama <code className="bg-purple-100 font-bold px-1 py-0.5 rounded text-[10px]">sessionid</code>. Klik kanan pada nilai di kolom <b>Value</b> lalu klik <b>Copy Value</b> (atau tekan Ctrl+A lalu Ctrl+C).</li>
                <li><b>Penting:</b> Nilai lengkap sessionid Instagram Web diawali dengan angka ID akun Anda (contoh: <code className="text-[10px] text-purple-900 font-bold">57812938102%3AneBP...</code>). Jika terpotong tanpa angka di depan, salin juga angka di baris <code className="bg-purple-100 font-bold px-1 py-0.5 rounded text-[10px]">ds_user_id</code> ke kolom opsional di atas.</li>
              </ol>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#251245] to-[#5E3A9B] text-white font-semibold text-sm hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20 disabled:opacity-60"
          >
            <span>{isLoading ? 'Menghubungkan Akun...' : 'Hubungkan Sesi Sekarang'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-emerald-700">
          <ShieldCheck size={14} />
          <span>Sesi diverifikasi langsung dengan server resmi Instagram</span>
        </div>
      </div>
    </div>
  );
}
