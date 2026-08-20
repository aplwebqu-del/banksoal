import React, { useState } from "react";
import {
  Settings,
  Save,
  ShieldCheck,
  Zap,
  Sparkles,
  Database,
  RotateCcw,
  Image as ImageIcon,
  Building,
  Upload,
  Globe,
  Server,
} from "lucide-react";
import { SystemSettings } from "../../types";
import { AppStore } from "../../services/store";
import { toast } from "../ui/Toast";

interface SettingsViewProps {
  settings: SystemSettings;
  onRefresh: () => void;
}

const PRESET_LOGOS = [
  "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=150&auto=format&fit=crop&q=80",
];

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onRefresh }) => {
  const [siteTitle, setSiteTitle] = useState(settings.site_title || "Bank Soal PDF");
  const [schoolName, setSchoolName] = useState(settings.school_name || "SMA Negeri Unggulan 1");
  const [appSubtitle, setAppSubtitle] = useState(settings.app_subtitle || "Repositori & Arsip Soal Pengajar Terpadu");
  const [institutionLogoUrl, setInstitutionLogoUrl] = useState(settings.institution_logo_url || PRESET_LOGOS[0]);
  const [institutionTagline, setInstitutionTagline] = useState(settings.institution_tagline || "Unggul, Berkarakter & Berprestasi");
  const [academicYear, setAcademicYear] = useState(settings.current_academic_year || "2024/2025");
  const [semester, setSemester] = useState(settings.current_semester || "Ganjil");
  const [allowTeacherUpload, setAllowTeacherUpload] = useState(settings.allow_teacher_upload ?? true);
  const [autoSyncSheets, setAutoSyncSheets] = useState(settings.auto_sync_sheets ?? true);
  const [autoFailover, setAutoFailover] = useState(settings.auto_failover ?? true);
  const [enableAiSuggest, setEnableAiSuggest] = useState(settings.enable_ai_suggest ?? true);
  const [connectionMode, setConnectionMode] = useState<"AUTO" | "PROXY" | "DIRECT_GAS">(settings.connection_mode || "AUTO");
  const [maxUploadSizeMb, setMaxUploadSizeMb] = useState(settings.max_upload_size_mb || 50);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file terlalu besar", "Maksimal ukuran file logo adalah 2 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setInstitutionLogoUrl(event.target.result as string);
        toast.success("Foto logo lembaga berhasil dimuat!");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    AppStore.updateSettings({
      site_title: siteTitle.trim(),
      school_name: schoolName.trim(),
      app_subtitle: appSubtitle.trim(),
      institution_logo_url: institutionLogoUrl.trim(),
      institution_tagline: institutionTagline.trim(),
      current_academic_year: academicYear.trim(),
      current_semester: semester,
      allow_teacher_upload: allowTeacherUpload,
      auto_sync_sheets: autoSyncSheets,
      auto_failover: autoFailover,
      enable_ai_suggest: enableAiSuggest,
      connection_mode: connectionMode,
      max_upload_size_mb: Number(maxUploadSizeMb),
    });

    toast.success("Pengaturan & Logo Tersimpan", "Konfigurasi sistem & identitas visual lembaga diperbarui");
    onRefresh();
  };

  const handleResetData = () => {
    if (confirm("Reset ulang data ke contoh awal (Seed Data)? Semua perubahan manual akan dikembalikan.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div id="settings-view" className="space-y-6 max-w-4xl">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-white tracking-tight">Pengaturan Sistem & Branding Lembaga</h2>
        <p className="text-xs text-slate-400 mt-1">
          Kustomisasi logo website/lembaga, identitas sekolah, batasan berkas, sinkronisasi otomatis, dan integrasi AI.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Branding & Logo Lembaga */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 text-xs">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Logo Website & Identitas Lembaga</h3>
          </div>

          {/* Logo Preview & Customizer */}
          <div className="p-4 bg-slate-850 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative group">
              <img
                src={institutionLogoUrl || PRESET_LOGOS[0]}
                alt="Logo Lembaga"
                className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-500/50 bg-slate-800 shadow-lg"
                referrerPolicy="no-referrer"
              />
              <span className="absolute -bottom-2 -right-2 bg-blue-600 text-[9px] font-bold text-white px-1.5 py-0.5 rounded-md shadow">
                Aktif
              </span>
            </div>

            <div className="space-y-2 flex-1">
              <p className="text-slate-300 font-semibold">Ganti Foto Logo Website / Sekolah:</p>
              <div className="flex flex-wrap items-center gap-2">
                <label className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl cursor-pointer font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Berkas Logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileChange}
                    className="hidden"
                  />
                </label>
                <span className="text-slate-400 text-[11px]">atau pilih preset logo pendidikan:</span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                {PRESET_LOGOS.map((logo, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setInstitutionLogoUrl(logo)}
                    className={`w-8 h-8 rounded-xl overflow-hidden border-2 transition-all ${
                      institutionLogoUrl === logo
                        ? "border-blue-400 scale-110 shadow-md"
                        : "border-slate-700 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={logo}
                      alt={`Logo Option ${idx + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Judul Aplikasi Portal</label>
              <input
                type="text"
                value={siteTitle}
                onChange={(e) => setSiteTitle(e.target.value)}
                placeholder="contoh: Bank Soal PDF"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Nama Lembaga / Sekolah</label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="contoh: SMA Negeri Unggulan 1"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Tagline Lembaga</label>
              <input
                type="text"
                value={institutionTagline}
                onChange={(e) => setInstitutionTagline(e.target.value)}
                placeholder="contoh: Unggul, Berkarakter & Berprestasi"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Subjudul / Keterangan Aplikasi</label>
              <input
                type="text"
                value={appSubtitle}
                onChange={(e) => setAppSubtitle(e.target.value)}
                placeholder="contoh: Repositori & Arsip Soal Pengajar Terpadu"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Tahun Akademik & Kurikulum */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 text-xs">
          <h3 className="text-sm font-bold text-white">Tahun Ajaran & Semester</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Tahun Ajaran Aktif</label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2024/2025"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Semester Aktif</label>
              <select
                value={semester}
                onChange={(e: any) => setSemester(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
            </div>
          </div>
        </div>

        {/* Kebijakan Upload & AI */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 text-xs">
          <h3 className="text-sm font-bold text-white">Kebijakan Upload, Storage & Gemini AI</h3>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-slate-850 border border-slate-800 rounded-xl cursor-pointer">
              <div>
                <span className="text-white font-semibold block">Izinkan Guru Mengunggah Naskah Soal</span>
                <span className="text-slate-400 text-[11px]">
                  Bila dinonaktifkan, hanya pengguna berstatus Administrator yang dapat mengunggah file.
                </span>
              </div>
              <input
                type="checkbox"
                checked={allowTeacherUpload}
                onChange={(e) => setAllowTeacherUpload(e.target.checked)}
                className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-850 border border-slate-800 rounded-xl cursor-pointer">
              <div>
                <span className="text-white font-semibold block">
                  Sinkronisasi Otomatis ke Google Spreadsheet (7 Tabel)
                </span>
                <span className="text-slate-400 text-[11px]">
                  Setiap mutasi data diunggah otomatis ke tabel Users, Bank Soal, Categories, Tags, Activity, Settings, Sync Log.
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoSyncSheets}
                onChange={(e) => setAutoSyncSheets(e.target.checked)}
                className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-850 border border-slate-800 rounded-xl cursor-pointer">
              <div>
                <span className="text-white font-semibold block">
                  Automatic Failover Multi-Storage
                </span>
                <span className="text-slate-400 text-[11px]">
                  Otomatis beralih ke profil penyimpanan prioritas berikutnya bila profil utama error atau kuota penuh.
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoFailover}
                onChange={(e) => setAutoFailover(e.target.checked)}
                className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-850 border border-slate-800 rounded-xl cursor-pointer">
              <div>
                <span className="text-white font-semibold block">Gemini 3.7 AI Metadata Suggester</span>
                <span className="text-slate-400 text-[11px]">
                  Ekstraksi kecerdasan buatan untuk mengidentifikasi mata pelajaran, bab, dan tag dari nama file PDF.
                </span>
              </div>
              <input
                type="checkbox"
                checked={enableAiSuggest}
                onChange={(e) => setEnableAiSuggest(e.target.checked)}
                className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
            </label>
          </div>
        </div>

        {/* Mode Koneksi Hosting (Dukungan Vercel & Cloud) */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white">Mode Koneksi Hosting (Dukungan Vercel & Serverless)</h3>
            </div>
            <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-500/30">
              Vercel Ready
            </span>
          </div>

          <p className="text-slate-400 text-[11px]">
            Tentukan metode pengiriman data antara aplikasi dan Google Apps Script saat di-hosting di Vercel, Netlify, Cloud Run, atau server mandiri.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Auto Hybrid */}
            <div
              onClick={() => setConnectionMode("AUTO")}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                connectionMode === "AUTO"
                  ? "bg-blue-600/20 border-blue-500 text-white shadow-sm shadow-blue-500/20"
                  : "bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Otomatis (Hybrid)</span>
                </span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-semibold">
                  Direkomendasikan
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Mencoba Server Proxy terlebih dahulu; jika berjalan di Vercel Static Hosting (404/Serverless), otomatis beralih ke Direct GAS Bridge.
              </p>
            </div>

            {/* Direct GAS */}
            <div
              onClick={() => setConnectionMode("DIRECT_GAS")}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                connectionMode === "DIRECT_GAS"
                  ? "bg-blue-600/20 border-blue-500 text-white shadow-sm shadow-blue-500/20"
                  : "bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <span>Direct GAS Bridge</span>
                </span>
                <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-semibold">
                  Khusus Vercel
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Langsung mengirim request dari browser pengguna ke Google Apps Script dengan Simple Request (CORS Safe) tanpa butuh server Node.js.
              </p>
            </div>

            {/* Backend Proxy */}
            <div
              onClick={() => setConnectionMode("PROXY")}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                connectionMode === "PROXY"
                  ? "bg-blue-600/20 border-blue-500 text-white shadow-sm shadow-blue-500/20"
                  : "bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-purple-400" />
                  <span>Node.js / Express</span>
                </span>
                <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.2 rounded font-semibold">
                  Cloud Run / VPS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Mem-proxy semua komunikasi melalui backend Express lokal/container (cocok untuk Cloud Run, Docker, VPS mandiri).
              </p>
            </div>
          </div>
        </div>

        {/* Save & Reset */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleResetData}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded-xl text-xs font-semibold border border-slate-700 hover:border-rose-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>

          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02]"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Pengaturan & Logo</span>
          </button>
        </div>
      </form>
    </div>
  );
};
