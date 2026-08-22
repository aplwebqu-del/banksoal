import React, { useState } from 'react';
import {
  BookMarked,
  Shield,
  Cloud,
  Sparkles,
  Lock,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  LogIn,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { User } from '../types';
import { api } from '../lib/api';
import { useToast } from '../components/Toast';

interface WelcomeLoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export const WelcomeLoginView: React.FC<WelcomeLoginViewProps> = ({
  onLoginSuccess,
}) => {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Silakan masukkan alamat email akun Anda.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.login(email.trim(), password);
      showToast(`Selamat datang kembali, ${res.user.name}!`, 'success');
      onLoginSuccess(res.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal login. Periksa email dan kata sandi Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Brand Header */}
      <header className="h-16 px-6 sm:px-10 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25 font-bold">
            <BookMarked className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg tracking-tight text-white">Bank Soal Digital</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                Cloud Primary
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Sistem Manajemen & Repositori Naskah Ujian Terpadu</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Google Drive & Sheets Online</span>
          </div>
        </div>
      </header>

      {/* Split View Container */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto">
        {/* ========================================================================= */}
        {/* LEFT PANEL: Halaman Selamat Datang & Showcase Platform */}
        {/* ========================================================================= */}
        <section className="flex-1 p-6 sm:p-10 lg:p-14 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/40 border-b lg:border-b-0 lg:border-r border-slate-800/80">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-0"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-0"></div>

          <div className="relative z-10 max-w-2xl space-y-8 my-auto">
            {/* Institution Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Platform Bank Soal Kurikulum Merdeka & Nasional</span>
            </div>

            {/* Hero Title & Subtitle */}
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
                Selamat Datang di <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400">
                  Portal Bank Soal Digital
                </span>
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
                Wadah terpusat bagi bapak/ibu guru untuk mengunggah, mengkategorikan, menyunting, dan mendistribusikan naskah soal PDF dengan penyimpanan permanen terhubung langsung ke Google Drive dan Google Spreadsheet.
              </p>
            </div>

            {/* Key Feature Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors space-y-2">
                <div className="flex items-center gap-2.5 text-blue-400">
                  <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Cloud Storage Terhubung</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Berkas tersimpan rapi di Google Drive per mapel & kelas, terindeks 5 tab database di Google Spreadsheet.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors space-y-2">
                <div className="flex items-center gap-2.5 text-indigo-400">
                  <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Kurikulum Merdeka & HOTS</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Kategori lengkap Fase A hingga F (SD, SMP, SMA, SMK), jenis soal AKM, UTBK-SNBT, dan asesmen sumatif.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors space-y-2">
                <div className="flex items-center gap-2.5 text-purple-400">
                  <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Ekstraksi Cerdas AI Gemini</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Deteksi otomatis nama berkas PDF untuk mengisi judul, mapel, jenjang, kelas, dan topik secara instan.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors space-y-2">
                <div className="flex items-center gap-2.5 text-emerald-400">
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <Shield className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Keamanan Berbasis Peran</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Otentikasi aman untuk Staf Kurikulum (Admin) dan Guru Pengajar dengan pencatatan audit log lengkap.
                </p>
              </div>
            </div>

            {/* Quick Stat Pill Overview */}
            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Penyimpanan Utama: <strong>Google Cloud</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
                <span>Pencarian Cepat & Filter Multi-Kriteria</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                <span>Pratinjau PDF Built-in</span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="relative z-10 pt-8 mt-8 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/40">
            <span>© 2026 Bank Soal Digital Indonesia • Versi 2.5.0</span>
            <span>Didukung oleh Google Apps Script Engine</span>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* RIGHT PANEL: Halaman Login / Otentikasi */}
        {/* ========================================================================= */}
        <section className="w-full lg:w-[480px] xl:w-[520px] p-6 sm:p-10 flex flex-col justify-center bg-slate-900/90 backdrop-blur-xl shrink-0">
          <div className="w-full max-w-md mx-auto space-y-6">
            {/* Form Header */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                <Lock className="w-3.5 h-3.5" />
                <span>Portal Autentikasi Pengajar & Staf</span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Masuk ke Akun Anda</h2>
              <p className="text-xs text-slate-400">
                Gunakan alamat email dan kata sandi terdaftar untuk mengakses repositori bank soal.
              </p>
            </div>

            {/* Error Alert */}
            {errorMsg && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Official Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Alamat Email Akun
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="nama@sekolah.sch.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Kata Sandi
                  </label>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Masukkan kata sandi..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Ingat sesi saya</span>
                </label>
                <span className="text-blue-400 hover:underline cursor-pointer">Lupa kata sandi?</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] text-white font-semibold text-sm shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Masuk ke Bank Soal</span>
                  </>
                )}
              </button>
            </form>

            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 text-xs text-slate-400 space-y-1.5">
              <div className="flex items-center gap-2 text-slate-300 font-semibold">
                <Shield className="w-4 h-4 text-blue-400" />
                <span>Keamanan & Akses Terproteksi</span>
              </div>
              <p className="leading-relaxed">
                Hanya akun pengajar dan staf institusi terdaftar yang dapat mengelola repositori bank soal. Hubungi administrator kurikulum jika mengalami kendala akses.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
