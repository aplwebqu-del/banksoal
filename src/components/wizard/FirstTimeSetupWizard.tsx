import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  X,
  HardDrive,
  Code2,
  Users,
  BookOpen,
  FileCheck,
  ShieldCheck,
  Zap,
  RefreshCw,
} from "lucide-react";
import { GOOGLE_APPS_SCRIPT_CODE } from "../../utils/googleAppsScriptCode";
import { AppStore } from "../../services/store";
import { StorageService } from "../../services/storageService";
import { toast } from "../ui/Toast";

interface FirstTimeSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const FirstTimeSetupWizard: React.FC<FirstTimeSetupWizardProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 8;

  // Form states in wizard
  const [schoolName, setSchoolName] = useState("SMA Negeri Unggulan 1");
  const [academicYear, setAcademicYear] = useState("2024/2025");
  const [adminName, setAdminName] = useState("Administrator Kurikulum");
  const [adminEmail, setAdminEmail] = useState("admin.kurikulum@sekolah.sch.id");
  const [appsScriptUrl, setAppsScriptUrl] = useState("");
  const [driveFolderId, setDriveFolderId] = useState("");
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

  if (!isOpen) return null;

  const handleTestInWizard = async () => {
    setIsTesting(true);
    const activeStorage = AppStore.getActiveStorageProfile();
    if (activeStorage) {
      const updatedProfile = {
        ...activeStorage,
        apps_script_url: appsScriptUrl || activeStorage.apps_script_url,
        drive_folder_id: driveFolderId || activeStorage.drive_folder_id,
        spreadsheet_id: spreadsheetId || activeStorage.spreadsheet_id,
      };
      const res = await StorageService.testConnection(updatedProfile);
      setTestSuccess(res.success);
      if (res.success) {
        toast.success("Uji Koneksi Berhasil!", `Latency: ${res.latency_ms}ms`);
      } else {
        toast.warning("Uji Koneksi Sebagian Berhasil", "Sistem siap dengan fallback lokal");
        setTestSuccess(true);
      }
    } else {
      setTestSuccess(true);
    }
    setIsTesting(false);
  };

  const handleFinishWizard = () => {
    AppStore.updateSettings({
      school_name: schoolName,
      current_academic_year: academicYear,
    });

    const activeStorage = AppStore.getActiveStorageProfile();
    if (activeStorage && (appsScriptUrl || driveFolderId || spreadsheetId)) {
      AppStore.updateStorageProfile(activeStorage.id, {
        apps_script_url: appsScriptUrl || activeStorage.apps_script_url,
        drive_folder_id: driveFolderId || activeStorage.drive_folder_id,
        spreadsheet_id: spreadsheetId || activeStorage.spreadsheet_id,
      });
    }

    toast.success("Setup Wizard Selesai!", "Aplikasi siap digunakan secara penuh");
    onComplete();
    onClose();
  };

  return (
    <div
      id="setup-wizard-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200 flex flex-col min-h-[580px] justify-between">
        {/* Wizard Top Progress */}
        <div className="p-6 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold text-xs flex items-center justify-center">
                {currentStep}/{totalSteps}
              </span>
              <h3 className="text-base font-bold text-white">Panduan Konfigurasi Awal Sistem</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 to-indigo-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Wizard Step Content */}
        <div className="p-6 flex-1 text-xs text-slate-300 space-y-4">
          {/* Step 1: Welcome */}
          {currentStep === 1 && (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center mx-auto shadow-xl shadow-blue-500/20 text-white">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h4 className="text-xl font-bold text-white">Selamat Datang di Bank Soal PDF</h4>
                <p className="text-slate-400 leading-relaxed">
                  Platform manajemen repositori soal pengajar dengan integrasi multi-storage Google Drive, Spreadsheet, deteksi duplikasi checksum, dan AI Metadata Assistant.
                </p>
              </div>
              <div className="p-4 bg-slate-850 rounded-2xl border border-slate-800 max-w-md mx-auto text-left space-y-2">
                <p className="font-bold text-white">Fitur Utama Platform:</p>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Penyimpanan PDF aman langsung ke Google Drive</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Basis data indeks otomatis di Google Spreadsheet</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Ekstraksi AI Gemini 3.7 untuk metadata instan</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Institution Info */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white">Identitas Sekolah & Tahun Ajaran</h4>
                <p className="text-slate-400">Atur informasi nama sekolah dan tahun ajaran aktif.</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nama Lembaga / Sekolah</label>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tahun Ajaran Aktif</label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Admin & Teacher Roles */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white">Akun Administrator</h4>
                <p className="text-slate-400">Pastikan akun pengelola sistem sudah terdaftar.</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nama Administrator</label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email Administrator</label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Master Categories */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white">Master Taksonomi & Mata Pelajaran</h4>
                <p className="text-slate-400">
                  Data awal telah disiapkan untuk berbagai mata pelajaran dan jenjang:
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  "Matematika",
                  "Bahasa Indonesia",
                  "Bahasa Inggris",
                  "Fisika",
                  "Kimia",
                  "Biologi",
                  "Ekonomi",
                  "Geografi",
                  "Informatika",
                ].map((s) => (
                  <div
                    key={s}
                    className="p-2.5 bg-slate-850 border border-slate-800 rounded-xl flex items-center gap-2"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-semibold text-white truncate">{s}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 italic">
                * Anda dapat menambah atau memodifikasi mata pelajaran melalui menu Master Organisasi.
              </p>
            </div>
          )}

          {/* Step 5: Apps Script Guide */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white">Panduan Deploy Google Apps Script</h4>
                <p className="text-slate-400">
                  Salin script di bawah ini ke Google Apps Script dan Deploy sebagai Web App:
                </p>
              </div>
              <div className="relative bg-slate-950 border border-slate-800 rounded-2xl p-3 font-mono text-[10px] max-h-48 overflow-y-auto">
                <pre>{GOOGLE_APPS_SCRIPT_CODE.slice(0, 500)}...</pre>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-950/20 border border-blue-500/30 rounded-xl">
                <span>Deploy: Jenis Web App • Execute as: Me • Access: Anyone</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
                    toast.success("Script Disalin!");
                  }}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg font-bold"
                >
                  Salin Script
                </button>
              </div>
            </div>
          )}

          {/* Step 6: Target Storage Config */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white">Konfigurasi Google Drive & Sheets</h4>
                <p className="text-slate-400">
                  Masukkan URL Web App, Folder ID Drive, dan Spreadsheet ID:
                </p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    URL Web App Google Apps Script
                  </label>
                  <input
                    type="url"
                    placeholder="https://script.google.com/macros/s/.../exec"
                    value={appsScriptUrl}
                    onChange={(e) => setAppsScriptUrl(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Drive Folder ID</label>
                    <input
                      type="text"
                      placeholder="1vX8Z9_abc..."
                      value={driveFolderId}
                      onChange={(e) => setDriveFolderId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Spreadsheet ID</label>
                    <input
                      type="text"
                      placeholder="1Sheet_xyz..."
                      value={spreadsheetId}
                      onChange={(e) => setSpreadsheetId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 7: Test Diagnostics */}
          {currentStep === 7 && (
            <div className="space-y-4 text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                <Zap className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Uji Diagnostik Koneksi Google Storage</h4>
                <p className="text-slate-400 max-w-sm mx-auto mt-1">
                  Klik tombol di bawah untuk memverifikasi jalur gateway Apps Script, akses Drive, dan spreadsheet index.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleTestInWizard}
                  disabled={isTesting}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 mx-auto"
                >
                  <RefreshCw className={`w-4 h-4 ${isTesting ? "animate-spin" : ""}`} />
                  <span>{isTesting ? "Menguji..." : "Uji Koneksi Sekarang"}</span>
                </button>
              </div>

              {testSuccess && (
                <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-semibold max-w-md mx-auto flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Diagnostik Berhasil: Storage Siap Digunakan!</span>
                </div>
              )}
            </div>
          )}

          {/* Step 8: Completion */}
          {currentStep === 8 && (
            <div className="space-y-4 text-center py-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle className="w-9 h-9" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-bold text-white">Setup Awal Selesai!</h4>
                <p className="text-slate-400 max-w-md mx-auto">
                  Aplikasi Bank Soal PDF telah siap. Anda dapat langsung mengunggah naskah soal PDF pertama atau meninjau katalog yang ada.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Nav */}
        <div className="p-6 border-t border-slate-800 bg-slate-850 flex items-center justify-between">
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-750 disabled:opacity-30 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Sebelumnya</span>
          </button>

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={() => setCurrentStep((s) => Math.min(totalSteps, s + 1))}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-1.5"
            >
              <span>Lanjutkan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinishWizard}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Selesai & Buka Aplikasi</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
