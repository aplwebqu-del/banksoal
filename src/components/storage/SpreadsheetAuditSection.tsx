import React, { useState, useEffect } from "react";
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Sparkles,
  DownloadCloud,
  UploadCloud,
  TableProperties,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Users,
  FileText,
  Layers,
  Tag,
  History,
  Settings,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { StorageProfile } from "../../types";
import { StorageService, TableAuditInfo, SpreadsheetAuditResult } from "../../services/storageService";
import { toast } from "../ui/Toast";

interface SpreadsheetAuditSectionProps {
  activeProfile?: StorageProfile;
  onRefresh: () => void;
}

const TABLE_ICONS: Record<string, React.ReactNode> = {
  USERS: <Users className="w-4 h-4 text-blue-400" />,
  BANK_SOAL: <FileText className="w-4 h-4 text-emerald-400" />,
  CATEGORIES: <Layers className="w-4 h-4 text-indigo-400" />,
  TAGS: <Tag className="w-4 h-4 text-teal-400" />,
  ACTIVITY_LOG: <History className="w-4 h-4 text-fuchsia-400" />,
  SETTINGS: <Settings className="w-4 h-4 text-amber-400" />,
  SYNC_LOG: <Zap className="w-4 h-4 text-cyan-400" />,
};

const TABLE_SCHEMAS: Record<string, { columns: string[]; purpose: string }> = {
  USERS: {
    columns: ["USER_ID", "NAMA_LENGKAP", "EMAIL", "ROLE", "NIP", "SEKOLAH", "SPESIALISASI_MAPEL", "STATUS", "TERAKHIR_LOGIN", "TANGGAL_DIBUAT"],
    purpose: "Menyimpan data otentikasi, profil guru, NIP, peran (Admin/Guru), dan riwayat akses pengajar.",
  },
  BANK_SOAL: {
    columns: ["ID_BISNIS", "JUDUL_SOAL", "MATA_PELAJARAN", "JENJANG", "KELAS", "KURIKULUM", "BAB_TOPIK", "JENIS_SOAL", "KESULITAN", "TAHUN_AJARAN", "SEMESTER", "TAGS", "NAMA_FILE", "DRIVE_FILE_ID", "DRIVE_LINK", "UKURAN_FILE", "PENGUNGGAH", "STATUS", "JUMLAH_DOWNLOAD", "JUMLAH_VIEW", "TANGGAL_UPLOAD", "TIMESTAMP_SYNC"],
    purpose: "Indeks master naskah soal PDF, link direct Google Drive, tingkat kesulitan, jenis ujian, dan tags.",
  },
  CATEGORIES: {
    columns: ["ID_KATEGORI", "TIPE", "KODE", "NAMA_KATEGORI", "DESKRIPSI", "WARNA", "URUTAN", "TANGGAL_DIBUAT"],
    purpose: "Master taksonomi: Mata Pelajaran, Jenjang (SD/SMP/SMA/SMK), Tingkat Kelas, Jenis Ujian, dan Kurikulum.",
  },
  TAGS: {
    columns: ["ID_TAG", "NAMA_TAG", "WARNA", "JUMLAH_PENGGUNAAN", "TANGGAL_DIBUAT"],
    purpose: "Label kata kunci penunjang pencarian cepat (e.g. HOTS, SNBT, Literasi, Aljabar).",
  },
  ACTIVITY_LOG: {
    columns: ["LOG_ID", "USER_ID", "NAMA_USER", "ROLE", "AKSI", "TIPE_TARGET", "TARGET_ID", "TARGET_TITLE", "RINCIAN_DETAIL", "TIMESTAMP"],
    purpose: "Audit trail pencatatan aktivitas: siapa mengunggah, mengedit, melihat, atau mengunduh naskah.",
  },
  SETTINGS: {
    columns: ["SETTING_KEY", "SETTING_VALUE", "KETERANGAN", "TIPE_DATA", "TERAKHIR_DIUBAH"],
    purpose: "Parameter sistem: identitas sekolah, tahun ajaran aktif, semester, pembatasan ukuran berkas, dan AI toggle.",
  },
  SYNC_LOG: {
    columns: ["SYNC_ID", "STORAGE_PROFILE_ID", "NAMA_STORAGE", "BANK_SOAL_ID", "JUDUL_SOAL", "AKSI_SYNC", "STATUS", "JUMLAH_RETRY", "PESAN_ERROR", "TIMESTAMP"],
    purpose: "Log diagnosa kesehatan sinkronisasi Google Drive dan Google Sheets.",
  },
};

export const SpreadsheetAuditSection: React.FC<SpreadsheetAuditSectionProps> = ({
  activeProfile,
  onRefresh,
}) => {
  const [auditResult, setAuditResult] = useState<SpreadsheetAuditResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [expandedTable, setExpandedTable] = useState<string | null>(null);

  const handleRunAudit = async () => {
    if (!activeProfile || !activeProfile.apps_script_url) {
      toast.error("Profil Belum Dikonfigurasi", "Masukkan URL Google Apps Script dan ID Spreadsheet terlebih dahulu");
      return;
    }

    setIsAuditing(true);
    toast.info("Mengaudit 7 Tabel...", "Memeriksa ketersediaan sheet pada Google Spreadsheet...");

    try {
      const result = await StorageService.auditSpreadsheetTables(activeProfile);
      setAuditResult(result);
      if (result.success) {
        if (result.all_tables_ready) {
          toast.success("Audit Selesai!", `Semua 7 tabel (${result.existing_tables_count}/7) tersedia di Spreadsheet.`);
        } else {
          toast.warning("Audit Selesai", `Ditemukan ${result.missing_tables_count} tabel yang belum dibuat. Klik 'Inisialisasi 7 Tabel' untuk membuatnya.`);
        }
      } else {
        toast.error("Audit Gagal", result.message);
      }
    } catch (err: any) {
      toast.error("Gagal Mengaudit Spreadsheet", err.message);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleInitTables = async () => {
    if (!activeProfile || !activeProfile.apps_script_url) {
      toast.error("Profil Belum Dikonfigurasi", "Konfigurasikan Google Apps Script terlebih dahulu");
      return;
    }

    setIsInitializing(true);
    toast.info("Menginisialisasi 7 Tabel...", "Membuat sheet, header berwarna, dan mengisi data awal ke Spreadsheet...");

    try {
      const res = await StorageService.initializeAllTables(activeProfile);
      if (res.success) {
        toast.success("7 Tabel Berhasil Dibuat!", "Spreadsheet kini terstruktur lengkap dengan data awal.");
        handleRunAudit();
        onRefresh();
      } else {
        toast.error("Inisialisasi Gagal", res.message);
      }
    } catch (err: any) {
      toast.error("Gagal Inisialisasi", err.message);
    } finally {
      setIsInitializing(false);
    }
  };

  const handlePullAllData = async () => {
    if (!activeProfile || !activeProfile.apps_script_url) {
      toast.error("Profil Belum Dikonfigurasi", "Konfigurasikan Google Apps Script terlebih dahulu");
      return;
    }

    setIsPulling(true);
    toast.info("Menarik Data dari Spreadsheet...", "Memuat data dari seluruh 7 tabel ke aplikasi...");

    try {
      const res = await StorageService.fetchAllTablesFromSpreadsheet(activeProfile);
      if (res.success) {
        toast.success("Berhasil Tarik Data!", res.message);
        handleRunAudit();
        onRefresh();
      } else {
        toast.error("Gagal Tarik Data", res.message);
      }
    } catch (err: any) {
      toast.error("Gagal Tarik Data", err.message);
    } finally {
      setIsPulling(false);
    }
  };

  const handlePushAllData = async () => {
    if (!activeProfile || !activeProfile.apps_script_url) {
      toast.error("Profil Belum Dikonfigurasi", "Konfigurasikan Google Apps Script terlebih dahulu");
      return;
    }

    if (!confirm("Apakah Anda yakin ingin mengekspor seluruh data lokal ke Google Spreadsheet?")) {
      return;
    }

    setIsPushing(true);
    toast.info("Menyinkronkan ke Spreadsheet...", "Mengunggah seluruh data 7 tabel ke Spreadsheet...");

    try {
      const res = await StorageService.pushAllTablesToSpreadsheet(activeProfile);
      if (res.success) {
        toast.success("Ekspor Berhasil!", res.message);
        handleRunAudit();
        onRefresh();
      } else {
        toast.error("Gagal Ekspor", res.message);
      }
    } catch (err: any) {
      toast.error("Gagal Ekspor", err.message);
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div id="spreadsheet-audit-section" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Audit & Sinkronisasi 7 Tabel Database Spreadsheet
            </h3>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Sistem Bank Soal mengelola 7 tabel database terpadu langsung di Google Spreadsheet untuk memastikan data tersimpan permanen di cloud (tanpa ketergantungan localStorage).
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="audit-tables-btn"
            onClick={handleRunAudit}
            disabled={isAuditing}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? "animate-spin text-blue-400" : "text-slate-400"}`} />
            <span>{isAuditing ? "Mengaudit..." : "Jalankan Audit"}</span>
          </button>

          <button
            id="init-all-tables-btn"
            onClick={handleInitTables}
            disabled={isInitializing}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isInitializing ? "Memproses..." : "Inisialisasi & Buat Otomatis 7 Tabel"}</span>
          </button>

          <button
            id="pull-all-tables-btn"
            onClick={handlePullAllData}
            disabled={isPulling}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50"
            title="Tarik seluruh data dari Spreadsheet ke aplikasi"
          >
            <DownloadCloud className="w-3.5 h-3.5" />
            <span>{isPulling ? "Menarik..." : "Tarik Data"}</span>
          </button>

          <button
            id="push-all-tables-btn"
            onClick={handlePushAllData}
            disabled={isPushing}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all disabled:opacity-50"
            title="Ekspor seluruh data aplikasi ke Spreadsheet"
          >
            <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isPushing ? "Mengekspor..." : "Ekspor ke Sheet"}</span>
          </button>
        </div>
      </div>

      {/* Audit Summary Status Box */}
      {auditResult && (
        <div className={`p-4 rounded-xl border ${
          auditResult.all_tables_ready
            ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
            : "bg-amber-950/20 border-amber-500/30 text-amber-300"
        } flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs`}>
          <div className="flex items-center gap-3">
            {auditResult.all_tables_ready ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <div>
              <p className="font-semibold text-white">
                {auditResult.message}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Spreadsheet: <span className="text-slate-300 font-mono">{auditResult.spreadsheet_name || activeProfile?.spreadsheet_id}</span> ({auditResult.existing_tables_count} dari 7 tabel terdeteksi)
              </p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 ${
            auditResult.all_tables_ready
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
              : "bg-amber-500/20 text-amber-300 border-amber-500/40"
          }`}>
            {auditResult.all_tables_ready ? "DATABASE SIAP (7/7)" : `PERLU INISIALISASI (${auditResult.missing_tables_count} BELUM ADA)`}
          </span>
        </div>
      )}

      {/* 7 Tables Grid Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {Object.keys(TABLE_SCHEMAS).map((tableKey) => {
          const schema = TABLE_SCHEMAS[tableKey];
          const auditInfo = auditResult?.tables?.find((t) => t.id === tableKey);
          const isExists = auditInfo ? auditInfo.exists : false;
          const isPopulated = auditInfo ? auditInfo.status === "POPULATED" : false;
          const rowCount = auditInfo ? auditInfo.row_count : 0;
          const isExpanded = expandedTable === tableKey;

          return (
            <div
              key={tableKey}
              id={`table-card-${tableKey.toLowerCase()}`}
              className={`bg-slate-950/70 border rounded-xl p-4 transition-all ${
                isExists
                  ? "border-slate-800 hover:border-slate-700"
                  : "border-amber-500/20 bg-amber-950/5"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                    {TABLE_ICONS[tableKey] || <Database className="w-4 h-4 text-blue-400" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white tracking-wide font-mono">
                      {tableKey}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {tableKey === "USERS" && "Data Pengguna & Guru"}
                      {tableKey === "BANK_SOAL" && "Naskah Soal & Indeks Drive"}
                      {tableKey === "CATEGORIES" && "Master Mapel & Kurikulum"}
                      {tableKey === "TAGS" && "Tag & Kategori HOTS/PTS"}
                      {tableKey === "ACTIVITY_LOG" && "Audit Trail & Aktivitas"}
                      {tableKey === "SETTINGS" && "Pengaturan & Profil Sekolah"}
                      {tableKey === "SYNC_LOG" && "Riwayat Sinkronisasi Storage"}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                {auditResult ? (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                      isPopulated
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : isExists
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}
                  >
                    {isPopulated ? `${rowCount} Baris` : isExists ? "Siap / Kosong" : "Belum Ada"}
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-400 border border-slate-700/50">
                    7 Kolom
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed line-clamp-2">
                {schema.purpose}
              </p>

              {/* Column list toggle */}
              <div className="mt-3 pt-3 border-t border-slate-900 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setExpandedTable(isExpanded ? null : tableKey)}
                  className="text-[11px] font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                >
                  <TableProperties className="w-3 h-3" />
                  <span>{schema.columns.length} Kolom Header</span>
                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                <span className="text-[10px] text-slate-500 font-mono">
                  {auditInfo?.name || tableKey}
                </span>
              </div>

              {/* Expanded column details */}
              {isExpanded && (
                <div className="mt-2.5 p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Daftar Kolom:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {schema.columns.map((col) => (
                      <span
                        key={col}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Cloud-First Persistence Assurance Banner */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong className="text-white">Arsitektur Cloud-First Aktif:</strong> Setiap aksi penambahan soal, pengeditan user, ataupun perubahan konfigurasi otomatis tersimpan ke Google Drive & 7 tabel Spreadsheet.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[11px] text-emerald-400 font-semibold">Realtime Sync Ready</span>
        </div>
      </div>
    </div>
  );
};
