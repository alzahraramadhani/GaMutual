'use client';

import React, { useEffect } from 'react';
import { X, ExternalLink, ShieldCheck, Download, Smartphone, Clock, CheckCircle2 } from 'lucide-react';

interface InstagramDownloadTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InstagramDownloadTutorialModal({
  isOpen,
  onClose,
}: InstagramDownloadTutorialModalProps) {
  const [touchStartY, setTouchStartY] = React.useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const diffY = e.changedTouches[0].clientY - touchStartY;
    if (diffY > 60) {
      onClose();
    }
    setTouchStartY(null);
  };

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const steps = [
    {
      num: 1,
      title: 'Buka Menu Pengaturan Instagram',
      desc: 'Buka aplikasi Instagram di HP atau Web → Masuk ke tab Profil Anda → Ketuk menu garis tiga (≡) di pojok kanan atas.',
    },
    {
      num: 2,
      title: 'Akses Pusat Akun (Accounts Center)',
      desc: 'Pilih Pusat Akun (Accounts Center) → Gulir ke bawah lalu ketuk menu Informasi dan Izin Anda (Your information and permissions).',
    },
    {
      num: 3,
      title: 'Pilih Unduh Informasi Anda',
      desc: 'Ketuk Unduh Informasi Anda (Download your information) → Ketuk tombol Unduh atau transfer informasi.',
    },
    {
      num: 4,
      title: 'Pilih Data Pengikut & Mengikuti',
      desc: 'Pilih opsi Beberapa informasi Anda → Centang kategori Pengikut dan Mengikuti (Followers and Following).',
    },
    {
      num: 5,
      title: 'Pilih Format JSON & Sepanjang Waktu',
      desc: 'Pilih Unduh ke Perangkat. Pastikan Format diubah ke JSON (bukan HTML) dan Rentang Tanggal disetel ke Sepanjang Waktu (All Time), lalu ketuk Buat File.',
    },
    {
      num: 6,
      title: 'Unggah File ke GaMutual',
      desc: 'Setelah Meta selesai menyiapkan (Anda akan menerima email/notifikasi), unduh berkas ZIP atau file JSON tersebut dan masukkan ke kotak unggah di GaMutual.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Bottom Sheet Drawer */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-full max-w-[430px] bg-white rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl z-10 overflow-hidden animate-in slide-in-from-bottom duration-300"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 cursor-grab" onClick={onClose}>
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#5E3A9B] flex items-center justify-center font-bold">
              <Download size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1E1B4B]">Panduan Unduh Data</h2>
              <p className="text-[11px] text-slate-500">Langkah resmi ekspor data dari Instagram</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors"
            aria-label="Tutup"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-6 py-4 space-y-4 text-sm text-slate-700">
          {/* Safe Info Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-start gap-3 text-emerald-900">
            <ShieldCheck size={20} className="text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-semibold block text-emerald-950 mb-0.5">Metode 100% Aman & Resmi</span>
              Metode ini menggunakan fitur ekspor data resmi dari Instagram. Akun Anda tidak perlu login, tidak ada risiko password bocor, dan file diproses secara offline di perangkat Anda.
            </div>
          </div>

          {/* Steps List */}
          <div className="space-y-3.5 pt-1">
            {steps.map((s) => (
              <div key={s.num} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#5E3A9B] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-sm">
                  {s.num}
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-[#1E1B4B]">{s.title}</h4>
                  <p className="text-[12px] text-slate-600 leading-relaxed mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Timing Note */}
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 flex items-start gap-2.5 text-amber-900">
            <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong className="font-semibold">Catatan Estimasi Waktu:</strong> Instagram biasanya membutuhkan waktu 5–15 menit untuk memproses file unduhan. Meta akan mengirim tautan unduh ke alamat email akun Anda.
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
          <a
            href="https://accountscenter.instagram.com/info_and_permissions/dyi/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Buka Pusat Akun Web</span>
            <ExternalLink size={13} />
          </a>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-3 rounded-xl bg-[#5E3A9B] hover:bg-[#4C2E7F] text-white text-xs font-semibold transition-colors flex items-center justify-center shadow-md shadow-purple-900/20"
          >
            Saya Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}
