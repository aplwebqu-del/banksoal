import React, { useState } from "react";
import {
  Database,
  Cloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Trash2,
  Layers,
  HardDrive,
  FileSpreadsheet,
  Zap,
  X,
  Sparkles,
  Lock,
} from "lucide-react";
import { StorageProfile } from "../../types";
import { AppStore } from "../../services/store";
import { StorageService } from "../../services/storageService";
import { toast } from "../ui/Toast";

interface DatabaseConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToStorage: () => void;
}

export const DatabaseConnectionModal: React.FC<DatabaseConnectionModalProps> = ({
  isOpen,
  onClose,
  onNavigateToStorage,
}) => {
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  if (!isOpen) return null;

  const activeProfile = AppStore.getActiveStorageProfile();
  const isHealthy = activeProfile?.health_status === "HEALTHY";
  const isCloudConnected = AppStore.isCloudDatabaseActive();
  const bankSoalCount = AppStore.getBankSoal().length;

  const handleTestConnection = async () => {
    if (!activeProfile) {
      toast.warning("Belum ada profil penyimpanan aktif");
      return;
    }

    setTesting(true);
    try {
      const result = await StorageService.testConnection(activeProfile);
      setTestResult(result);
      if (result.success) {
        toast.success("Koneksi Database Berhasil!", `Latency: ${result.latency_ms}ms - Google Drive & Sheets Terhubung`);
      } else {
        toast.error("Koneksi Gagal", result.error_message || "Periksa URL Apps Script atau ID Folder/Sheet");
      }
    } catch (err: any) {
      toast.error("Uji Koneksi Gagal", err.message);
    } finally {
      setTesting(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const res = await AppStore.syncWithGoogleSpreadsheet();
      if (res.success) {
        toast.success("Sinkronisasi Selesai", res.message);
      } else {
        toast.info("Status Sinkronisasi", res.message);
      }
    } catch (err: any) {
      toast.error("Gagal Sinkronisasi", err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handlePurgeSampleData = () => {
    if (confirm("Kosongkan semua data contoh/dummy lokal? Aplikasi akan menggunakan 100% database bersih dari Google Drive & Sheets.")) {
      AppStore.purgeSampleData();
      toast.success("Data Contoh Dikosongkan", "Database kini bersih untuk input berkas riil.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div
        id="database-connection-modal"
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shadow-inner">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Status Database & Google Storage
                </h3>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    isCloudConnected
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                  }`}
                >
                  {isCloudConnected ? "Live Cloud DB" : "Offline / Local"}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Penyimpanan Utama: Google Drive (PDF) & Google Sheets (Metadata Index)
              </p>
            </div>
          </div>

          <button
            id="close-db-modal-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Active Profile Banner */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Profil Storage Aktif
                </span>
                <h4 className="text-sm font-bold text-white">
                  {activeProfile ? activeProfile.name : "Belum Dikonfigurasi"}
                </h4>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onNavigateToStorage();
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
              >
                <span>Kelola Profil Storage</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Connection Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {/* Google Drive Card */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                    <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                    <span>Google Drive</span>
                  </div>
                  {activeProfile?.drive_folder_id ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate font-mono">
                  {activeProfile?.drive_folder_id ? activeProfile.drive_folder_id : "Folder ID Belum Ada"}
                </p>
                {activeProfile?.drive_folder_id && (
                  <a
                    href={`https://drive.google.com/drive/folders/${activeProfile.drive_folder_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-blue-400 hover:underline pt-0.5"
                  >
                    <span>Buka Folder Drive</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>

              {/* Google Sheets Card */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Google Sheets</span>
                  </div>
                  {activeProfile?.spreadsheet_id ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate font-mono">
                  {activeProfile?.spreadsheet_id ? activeProfile.spreadsheet_id : "Sheet ID Belum Ada"}
                </p>
                {activeProfile?.spreadsheet_id && (
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${activeProfile.spreadsheet_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-emerald-400 hover:underline pt-0.5"
                  >
                    <span>Buka Spreadsheet</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>

              {/* Apps Script Gateway Card */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Apps Script API</span>
                  </div>
                  {activeProfile?.apps_script_url ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {activeProfile?.apps_script_url ? "URL Web App Terpasang" : "URL Belum Diisi"}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-0.5">
                  <span>Latency:</span>
                  <span className="font-mono text-white">
                    {testResult?.latency_ms || activeProfile?.latency_ms || 120}ms
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Database Actions & Sync Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Test Connection Button */}
            <button
              id="test-db-connection-btn"
              onClick={handleTestConnection}
              disabled={testing}
              className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.01]"
            >
              <RefreshCw className={`w-4 h-4 ${testing ? "animate-spin" : ""}`} />
              <span>{testing ? "Menguji Koneksi..." : "Uji Koneksi & Ping Database"}</span>
            </button>

            {/* Sync Now Button */}
            <button
              id="sync-db-now-btn"
              onClick={handleSyncNow}
              disabled={syncing}
              className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 disabled:opacity-50 text-white text-xs font-bold transition-all hover:scale-[1.01]"
            >
              <Cloud className={`w-4 h-4 text-blue-400 ${syncing ? "animate-pulse" : ""}`} />
              <span>{syncing ? "Sinkronisasi..." : "Sinkronkan Google Sheets"}</span>
            </button>
          </div>

          {/* 7 Tables Audit Shortcut */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Struktur 7 Tabel Database Spreadsheet
                </h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                7 Tabel Terintegrasi
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tabel <span className="text-white font-mono">USERS</span>, <span className="text-white font-mono">BANK_SOAL</span>, <span className="text-white font-mono">CATEGORIES</span>, <span className="text-white font-mono">TAGS</span>, <span className="text-white font-mono">ACTIVITY_LOG</span>, <span className="text-white font-mono">SETTINGS</span>, dan <span className="text-white font-mono">SYNC_LOG</span> dapat diaudit dan dibuat otomatis.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  onClose();
                  onNavigateToStorage();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Buka Panel Audit 7 Tabel</span>
              </button>
            </div>
          </div>

          {/* Clean Real Database Notice & Purge Option */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
            <div className="flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-bold text-amber-300">
                  Mode Database Utama (Google Drive & Sheets)
                </p>
                <p className="text-slate-300 leading-relaxed">
                  Ketika terhubung ke Google Drive dan Google Sheets, berkas PDF akan otomatis diunggah langsung ke folder Drive dan seluruh metadata tersimpan pada sheet <span className="font-mono text-amber-200">BANK_SOAL</span>. Data contoh dummy lokal dapat dikosongkan.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-amber-500/20">
              <span className="text-[11px] text-slate-400">
                Total item saat ini: <strong className="text-white">{bankSoalCount} berkas</strong>
              </span>

              <button
                id="purge-sample-data-btn"
                onClick={handlePurgeSampleData}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kosongkan Data Contoh (Gunakan DB Bersih)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
