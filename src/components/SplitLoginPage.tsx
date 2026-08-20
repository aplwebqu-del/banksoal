import React, { useState, useEffect } from "react";
import {
  FileText,
  Shield,
  Sparkles,
  FileSpreadsheet,
  Lock,
  ArrowRight,
  Zap,
  Database,
  Search,
  KeyRound,
  Mail,
  Eye,
  EyeOff,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { UserProfile } from "../types";
import { AppStore } from "../services/store";
import { toast } from "./ui/Toast";

interface SplitLoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const SplitLoginPage: React.FC<SplitLoginPageProps> = ({ onLoginSuccess }) => {
  const settings = AppStore.getSettings();
  const [identifierInput, setIdentifierInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [expiredReason, setExpiredReason] = useState<string | null>(AppStore.getExpiredReason());
  const isCloudConnected = AppStore.isCloudDatabaseActive();
  const activeStorage = AppStore.getActiveStorageProfile();

  useEffect(() => {
    // Attempt to load global config on login page mount
    AppStore.initGlobalConfig();
    const reason = AppStore.getExpiredReason();
    if (reason) {
      setExpiredReason(reason);
    }
  }, []);

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifierInput.trim()) {
      toast.error("Username, Email, atau NIP Wajib Diisi");
      return;
    }
    if (!passwordInput.trim()) {
      toast.error("Kata Sandi Wajib Diisi");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const result = AppStore.authenticate(identifierInput, passwordInput);
      setIsLoading(false);

      if (result.success && result.user) {
        AppStore.clearExpiredReason();
        toast.success("Login Berhasil!", `Selamat datang kembali, ${result.user.name}`);
        onLoginSuccess(result.user);
      } else {
        toast.error("Gagal Masuk", result.message || "Kredensial tidak cocok.");
      }
    }, 350);
  };

  return (
    <div
      id="split-login-page"
      className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col lg:flex-row selection:bg-blue-600 selection:text-white"
    >
      {/* Left Column: Visual Showcase & Brand Highlights */}
      <div className="w-full lg:w-7/12 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
        {/* Ambient background glows */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header & Institution Branding */}
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3.5">
            {settings.institution_logo_url ? (
              <img
                src={settings.institution_logo_url}
                alt="Logo Lembaga"
                className="w-12 h-12 rounded-2xl object-cover border border-slate-700 shadow-xl shadow-blue-500/10 bg-slate-800"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-xl shadow-blue-500/20">
                <FileText className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">
                  {settings.site_title || "Bank Soal PDF"}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">
                  Portal Resmi
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                {settings.school_name || "SMA Negeri Unggulan 1"} • {settings.app_subtitle || "Repositori & Arsip Soal Pengajar"}
              </p>
            </div>
          </div>

          <div className="pt-6 space-y-3 max-w-xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Temukan, Kelola & Arsipkan Bank Soal dengan Cepat
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Repositori digital naskah ujian guru terintegrasi cloud database Google Spreadsheet 7 tabel & Google Drive dengan deteksi duplicate hash SHA-256.
            </p>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="relative z-10 my-8 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 space-y-2 backdrop-blur-sm">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Pencarian Cepat Berindeks
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Temukan naskah soal berdasarkan mata pelajaran, jenjang, kelas, kurikulum, bab, dan tags dalam hitungan detik.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 space-y-2 backdrop-blur-sm">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              7 Tabel Database Cloud
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tersinkronisasi otomatis ke Google Spreadsheet (Users, Bank Soal, Categories, Tags, Activity, Settings, Sync Log).
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 space-y-2 backdrop-blur-sm">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              SHA-256 Anti-Duplikasi
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Deteksi otomatis berkas kembar dengan checksum hash kriptografis sebelum file terunggah.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 space-y-2 backdrop-blur-sm">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              AI Metadata Assistant
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Rekomendasi otomatis taksonomi soal dan materi ujian bertenaga model Gemini terintegrasi.
            </p>
          </div>
        </div>

        {/* Footer Notes */}
        <div className="relative z-10 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Sistem Otentikasi & Hak Akses Pengajar Terproteksi</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">v2.5 Production</span>
        </div>
      </div>

      {/* Right Column: Secure Form Login (Strictly Credentials Login) */}
      <div className="w-full lg:w-5/12 bg-slate-950 p-6 sm:p-10 lg:p-12 pt-8 sm:pt-12 lg:pt-14 flex flex-col justify-start items-center overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="space-y-2 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Autentikasi Terenkripsi</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Masuk ke Repositori Soal
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Gunakan Username / Email dan Kata Sandi Anda untuk masuk ke sistem.
            </p>
          </div>

          {/* Session Expired Notice if 10-min timeout happened */}
          {expiredReason === "INACTIVITY_10_MIN" && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-200 text-xs flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-amber-300">Sesi Keluar Otomatis (10 Menit Tidak Aktif)</p>
                <p className="text-[11px] text-amber-200/80 leading-relaxed">
                  Demi keamanan data bank soal sekolah, sesi login Anda diakhiri secara otomatis setelah 10 menit tanpa aktivitas. Silakan masuk kembali.
                </p>
              </div>
            </div>
          )}

          {/* Form Login */}
          <form onSubmit={handleFormLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span>Username / Email / NIP Pengajar:</span>
              </label>
              <input
                id="login-identifier-input"
                type="text"
                value={identifierInput}
                onChange={(e) => setIdentifierInput(e.target.value)}
                placeholder="Masukkan username atau email"
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Kata Sandi:</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-slate-400 hover:text-blue-400 flex items-center gap-1"
                >
                  {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showPassword ? "Sembunyikan" : "Lihat Sandi"}</span>
                </button>
              </div>
              <div className="relative">
                <input
                  id="login-password-input"
                  type={showPassword ? "text" : "password"}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Masukkan kata sandi akun"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              id="form-login-submit-btn"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.01] active:scale-98 flex items-center justify-center gap-2 mt-3"
            >
              <span>{isLoading ? "Memverifikasi Kredensial..." : "Masuk ke Sistem Bank Soal"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Database Notice */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 flex items-center gap-3">
            <Database className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="leading-relaxed text-[11px]">
              Tersambung ke database Google Spreadsheet 7 tabel dengan proteksi hak akses berbasis peran (RBAC).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
