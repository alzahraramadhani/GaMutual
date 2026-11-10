'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Instagram, AlertCircle } from 'lucide-react';
import MobileShell from '@/components/layout/MobileShell';
import ChallengeModal from '@/components/modals/ChallengeModal';
import SessionIdModal from '@/components/modals/SessionIdModal';
import { api, setStoredToken, setActiveAccountId } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Challenge & Session modal state
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [tempSessionId, setTempSessionId] = useState('');
  const [contactPoint, setContactPoint] = useState('');
  const [sessionIdModalOpen, setSessionIdModalOpen] = useState(false);

  const handleLoginWithSession = async (user: string, sessionCookie: string) => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const res = await api.login({
        username: user,
        password: sessionCookie,
        remember_device: true,
      });

      if (res.status === 'SUCCESS') {
        setStoredToken(res.session_token);
        if (res.account?.id) {
          setActiveAccountId(res.account.id);
        }
        setSessionIdModalOpen(false);
        router.push('/home');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal masuk dengan sesi Instagram. Periksa kembali sessionid Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await api.login({
        username,
        password,
        remember_device: rememberDevice,
      });

      if (res.status === 'CHALLENGE_REQUIRED') {
        setTempSessionId(res.temporary_session_id);
        setContactPoint(res.contact_point || 'SMS / Email');
        setChallengeOpen(true);
      } else if (res.status === 'SUCCESS') {
        setStoredToken(res.session_token);
        if (res.account?.id) {
          setActiveAccountId(res.account.id);
        }
        router.push('/home');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal masuk. Periksa kembali username dan kata sandi Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyChallenge = async (code: string) => {
    const res = await api.verifyChallenge({
      temporary_session_id: tempSessionId,
      verification_code: code,
    });

    if (res.status === 'SUCCESS') {
      setStoredToken(res.session_token);
      if (res.account_id) {
        setActiveAccountId(res.account_id);
      }
      router.push('/home');
    }
  };

  return (
    <MobileShell showNav={false}>
      <div className="flex-1 flex flex-col justify-center px-6 py-10">
        {/* Brand Logo Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl shadow-lg shadow-purple-900/10 flex items-center justify-center mb-4 transition-transform hover:scale-105 overflow-hidden">
            <img src="/logo.svg" alt="GaMutual Logo" className="w-16 h-16 object-contain" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1E1B4B]">GaMutual</h1>
          <p className="text-xs text-[#6B7280] max-w-[280px] mt-1.5 leading-relaxed">
            Kelola mutual & relasi Instagram Anda dengan aman, cepat, dan transparan
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-600">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-semibold text-[#1E1B4B] mb-1.5">
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
                  placeholder="Masukkan username"
                  required
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#5E3A9B] focus:border-transparent text-[#1E1B4B] placeholder:text-slate-400 transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-semibold text-[#1E1B4B] mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Kata sandi atau cookie sessionid"
                  required
                  className="w-full pl-9 pr-11 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#5E3A9B] focus:border-transparent text-[#1E1B4B] placeholder:text-slate-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="remember"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="w-4 h-4 rounded text-[#5E3A9B] focus:ring-[#5E3A9B] border-slate-300 cursor-pointer accent-[#5E3A9B]"
              />
              <label htmlFor="remember" className="text-xs text-slate-600 cursor-pointer select-none">
                Ingat perangkat ini selama 30 hari
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#251245] to-[#1F1138] text-white font-semibold text-sm hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/20 disabled:opacity-60"
            >
              <span>{isLoading ? 'Sedang Memeriksa...' : 'Masuk Sekarang'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Separator */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <span className="relative bg-white px-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              ATAU MASUK DENGAN
            </span>
          </div>

          {/* Alternative IG button - Open Session ID Modal */}
          <button
            type="button"
            onClick={() => setSessionIdModalOpen(true)}
            className="w-full py-3 px-4 rounded-xl bg-[#F8FAFC] border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
          >
            <Instagram size={16} className="text-[#E1306C]" />
            <span>Masuk dengan Akun Instagram</span>
          </button>
        </div>

        {/* Security Shield Banner */}
        <div className="mt-6 bg-[#F0FDF4] border border-[#DCFCE7] rounded-2xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#10B981] flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#065F46]">Keamanan Terproteksi</h4>
            <p className="text-[11px] text-[#065F46]/80 leading-relaxed mt-0.5">
              Enkripsi end-to-end 256-bit terjamin aman. Token Instagram tidak pernah disimpan secara terbuka.
            </p>
          </div>
        </div>
      </div>

      {/* Challenge Modal */}
      <ChallengeModal
        isOpen={challengeOpen}
        onClose={() => setChallengeOpen(false)}
        temporarySessionId={tempSessionId}
        contactPoint={contactPoint}
        onVerify={handleVerifyChallenge}
      />

      {/* Session ID Modal for Direct Instagram Authentication */}
      <SessionIdModal
        isOpen={sessionIdModalOpen}
        onClose={() => setSessionIdModalOpen(false)}
        onLoginWithSession={handleLoginWithSession}
        isLoading={isLoading}
      />
    </MobileShell>
  );
}
