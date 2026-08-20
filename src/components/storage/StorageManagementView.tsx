import React, { useState } from "react";
import {
  HardDrive,
  Plus,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Edit,
  Trash2,
  ExternalLink,
  Code2,
  Zap,
  Activity,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { StorageProfile, UserProfile, BankSoal } from "../../types";
import { AppStore } from "../../services/store";
import { StorageService, StorageTestResult } from "../../services/storageService";
import { toast } from "../ui/Toast";
import { SpreadsheetAuditSection } from "./SpreadsheetAuditSection";

interface StorageManagementViewProps {
  storageProfiles: StorageProfile[];
  currentUser: UserProfile;
  bankSoalList: BankSoal[];
  onOpenAppsScriptGuide: () => void;
  onRefresh: () => void;
}

export const StorageManagementView: React.FC<StorageManagementViewProps> = ({
  storageProfiles,
  currentUser,
  bankSoalList,
  onOpenAppsScriptGuide,
  onRefresh,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<StorageProfile | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [appsScriptUrl, setAppsScriptUrl] = useState("");
  const [driveFolderId, setDriveFolderId] = useState("");
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [priority, setPriority] = useState(1);
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(false);

  // Testing status state
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{ [id: string]: StorageTestResult }>({});
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  const activeProfile = storageProfiles.find((p) => p.is_active);

  const openAddModal = () => {
    setEditingProfile(null);
    setName("");
    setAppsScriptUrl("");
    setDriveFolderId("");
    setSpreadsheetId("");
    setPriority(storageProfiles.length + 1);
    setDescription("");
    setIsActive(storageProfiles.length === 0);
    setIsModalOpen(true);
  };

  const openEditModal = (profile: StorageProfile) => {
    setEditingProfile(profile);
    setName(profile.name);
    setAppsScriptUrl(profile.apps_script_url);
    setDriveFolderId(profile.drive_folder_id);
    setSpreadsheetId(profile.spreadsheet_id);
    setPriority(profile.priority);
    setDescription(profile.description || "");
    setIsActive(profile.is_active);
    setIsModalOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama Profil Wajib Diisi");
      return;
    }

    if (editingProfile) {
      AppStore.updateStorageProfile(editingProfile.id, {
        name: name.trim(),
        apps_script_url: appsScriptUrl.trim(),
        drive_folder_id: driveFolderId.trim(),
        spreadsheet_id: spreadsheetId.trim(),
        priority: Number(priority),
        description: description.trim(),
        is_active: isActive,
      });
      toast.success("Profil Storage Diperbarui", name);
    } else {
      AppStore.addStorageProfile({
        name: name.trim(),
        apps_script_url: appsScriptUrl.trim(),
        drive_folder_id: driveFolderId.trim(),
        spreadsheet_id: spreadsheetId.trim(),
        priority: Number(priority),
        description: description.trim(),
        is_active: isActive || storageProfiles.length === 0,
      });
      toast.success("Profil Storage Ditambahkan", name);
    }

    setIsModalOpen(false);
    onRefresh();
  };

  const handleSetActive = (profile: StorageProfile) => {
    AppStore.setActiveStorageProfile(profile.id);
    toast.success("Storage Aktif Diubah", `${profile.name} kini menjadi target utama`);
    onRefresh();
  };

  const handleDeleteProfile = (profile: StorageProfile) => {
    if (profile.is_active && storageProfiles.length > 1) {
      toast.error("Tidak Bisa Menghapus", "Ubah storage aktif ke profil lain terlebih dahulu");
      return;
    }
    if (confirm(`Hapus profil storage "${profile.name}"?`)) {
      AppStore.deleteStorageProfile(profile.id);
      toast.warning("Profil Dihapus", profile.name);
      onRefresh();
    }
  };

  const handleTestConnection = async (profile: StorageProfile) => {
    setTestingId(profile.id);
    toast.info("Menguji Koneksi Storage...", profile.name);

    const result = await StorageService.testConnection(profile);
    setTestResults((prev) => ({ ...prev, [profile.id]: result }));
    setTestingId(null);

    if (result.success) {
      toast.success(
        "Koneksi Google Storage Berhasil!",
        `Apps Script, Drive & Spreadsheet terhubung (${result.latency_ms}ms)`
      );
    } else {
      toast.error(
        "Uji Koneksi Gagal",
        result.error_message || "Periksa URL Apps Script dan Hak Akses Folder"
      );
    }
    onRefresh();
  };

  const handleSyncAllMetadata = async () => {
    if (!activeProfile) {
      toast.error("Tidak Ada Storage Aktif", "Pilih salah satu profil sebagai storage aktif");
      return;
    }

    setIsSyncingAll(true);
    toast.info("Memulai Sinkronisasi Massal...", `Menyinkronkan ke Spreadsheet ${activeProfile.name}`);

    try {
      const activeItems = bankSoalList.filter((b) => b.status === "active");
      let syncedCount = 0;

      for (const item of activeItems) {
        await StorageService.retrySync(item);
        syncedCount++;
      }

      toast.success("Sinkronisasi Selesai!", `${syncedCount} naskah berhasil diindeks`);
      setIsSyncingAll(false);
      onRefresh();
    } catch (err: any) {
      setIsSyncingAll(false);
      toast.error("Gagal Sinkronisasi Massal", err.message);
    }
  };

  return (
    <div id="storage-management-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Manajemen Multi-Storage Google
            </h2>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {storageProfiles.length} Profil Terkonfigurasi
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Konfigurasi Google Drive (penyimpanan file PDF), Google Spreadsheet (basis data indeks), dan Google Apps Script Web App gateway.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="open-apps-script-guide-btn"
            onClick={onOpenAppsScriptGuide}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            <Code2 className="w-4 h-4 text-blue-400" />
            <span>Salin Script Google Apps</span>
          </button>

          <button
            id="sync-all-spreadsheet-btn"
            onClick={handleSyncAllMetadata}
            disabled={isSyncingAll}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncingAll ? "animate-spin" : ""}`} />
            <span>{isSyncingAll ? "Menyinkronkan..." : "Sync Semua Soal ke Spreadsheet"}</span>
          </button>

          <button
            id="add-storage-profile-btn"
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Profil Storage</span>
          </button>
        </div>
      </div>

      {/* Storage Architecture Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              1. Google Drive Storage
            </h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Tempat menyimpan file PDF asli secara aman dengan checksum hash SHA-256 untuk mendeteksi duplikasi.
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              2. Google Spreadsheet Index
            </h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Mencatat seluruh indeks naskah, link drive, mata pelajaran, tingkat kelas, dan metadata kurikulum.
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              3. Automatic Failover
            </h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Jika profil storage utama mengalami kuota penuh atau gangguan jaringan, sistem beralih ke profil cadangan secara otomatis.
            </p>
          </div>
        </div>
      </div>

      {/* 7-Table Database Audit & Management Section */}
      <SpreadsheetAuditSection activeProfile={activeProfile} onRefresh={onRefresh} />

      {/* Storage Profile Cards List */}
      <div className="space-y-4">
        {storageProfiles.map((profile) => {
          const testResult = testResults[profile.id];
          const isTesting = testingId === profile.id;

          return (
            <div
              key={profile.id}
              id={`storage-card-${profile.id}`}
              className={`bg-slate-900 border rounded-2xl p-5 sm:p-6 transition-all ${
                profile.is_active
                  ? "border-blue-500/60 shadow-lg shadow-blue-500/5 bg-slate-900/90"
                  : "border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Info & Health */}
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-white">{profile.name}</h3>
                    {profile.is_active ? (
                      <span className="bg-blue-600/30 text-blue-300 border border-blue-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> ACTIVE PRIMARY
                      </span>
                    ) : (
                      <span className="bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        PRIORITY #{profile.priority} (FALLBACK)
                      </span>
                    )}

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        profile.health_status === "HEALTHY"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : profile.health_status === "DEGRADED"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      HEALTH: {profile.health_status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">{profile.description || "Profil penyimpanan Google Drive dan Spreadsheet."}</p>

                  {/* Config details chips */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-[11px] font-mono">
                    <div className="p-2 bg-slate-800/80 rounded-xl border border-slate-700/60 truncate">
                      <span className="text-slate-500 block text-[9px] font-sans font-semibold uppercase">
                        Apps Script URL:
                      </span>
                      <span className="text-slate-300 truncate" title={profile.apps_script_url}>
                        {profile.apps_script_url ? `${profile.apps_script_url.slice(0, 30)}...` : "Belum diisi"}
                      </span>
                    </div>
                    <div className="p-2 bg-slate-800/80 rounded-xl border border-slate-700/60 truncate">
                      <span className="text-slate-500 block text-[9px] font-sans font-semibold uppercase">
                        Drive Folder ID:
                      </span>
                      <span className="text-slate-300 truncate" title={profile.drive_folder_id}>
                        {profile.drive_folder_id || "Belum diisi"}
                      </span>
                    </div>
                    <div className="p-2 bg-slate-800/80 rounded-xl border border-slate-700/60 truncate">
                      <span className="text-slate-500 block text-[9px] font-sans font-semibold uppercase">
                        Spreadsheet ID:
                      </span>
                      <span className="text-slate-300 truncate" title={profile.spreadsheet_id}>
                        {profile.spreadsheet_id || "Belum diisi"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleTestConnection(profile)}
                    disabled={isTesting}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin" : ""}`} />
                    <span>{isTesting ? "Menguji..." : "Uji Koneksi"}</span>
                  </button>

                  {!profile.is_active && (
                    <button
                      onClick={() => handleSetActive(profile)}
                      className="px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white text-xs font-semibold rounded-xl border border-blue-500/30 transition-colors"
                    >
                      Jadikan Aktif
                    </button>
                  )}

                  <button
                    onClick={() => openEditModal(profile)}
                    className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl border border-slate-700"
                    title="Edit Profil"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteProfile(profile)}
                    className="p-2 bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded-xl border border-slate-700"
                    title="Hapus Profil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Real-time Diagnostics Bar (After Testing) */}
              {testResult && (
                <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div
                    className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                      testResult.apps_script.connected
                        ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                        : "bg-rose-950/20 border-rose-500/30 text-rose-300"
                    }`}
                  >
                    {testResult.apps_script.connected ? (
                      <CheckCircle className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <div>
                      <p className="font-bold">Apps Script Gateway</p>
                      <p className="text-[10px] opacity-80">{testResult.apps_script.message}</p>
                    </div>
                  </div>

                  <div
                    className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                      testResult.drive.connected
                        ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                        : "bg-rose-950/20 border-rose-500/30 text-rose-300"
                    }`}
                  >
                    {testResult.drive.connected ? (
                      <CheckCircle className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <div>
                      <p className="font-bold">Google Drive Folder</p>
                      <p className="text-[10px] opacity-80">{testResult.drive.message}</p>
                    </div>
                  </div>

                  <div
                    className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                      testResult.spreadsheet.connected
                        ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                        : "bg-rose-950/20 border-rose-500/30 text-rose-300"
                    }`}
                  >
                    {testResult.spreadsheet.connected ? (
                      <CheckCircle className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <div>
                      <p className="font-bold">Google Spreadsheet</p>
                      <p className="text-[10px] opacity-80">
                        {testResult.spreadsheet.message} ({testResult.latency_ms}ms)
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Edit Storage Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-850">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingProfile ? "Edit Profil Google Storage" : "Tambah Profil Google Storage"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Konfigurasi integrasi Google Apps Script, Drive, dan Spreadsheet
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nama Profil Storage <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Google Storage Utama (Drive SMA)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  URL Web App Google Apps Script
                </label>
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={appsScriptUrl}
                  onChange={(e) => setAppsScriptUrl(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Dihasilkan setelah Anda mendeploy Google Apps Script sebagai Web App (Akses: Siapa Saja).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Google Drive Folder ID
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 1vX8Z9_abc123..."
                    value={driveFolderId}
                    onChange={(e) => setDriveFolderId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Google Spreadsheet ID
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 1SheetId_xyz..."
                    value={spreadsheetId}
                    onChange={(e) => setSpreadsheetId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Urutan Prioritas Failover
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="is-active-chk"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="is-active-chk" className="text-slate-300 font-semibold">
                    Set sebagai Storage Aktif
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Deskripsi / Catatan</label>
                <textarea
                  rows={2}
                  placeholder="Catatan tujuan atau akun Google yang digunakan..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-md shadow-blue-600/30"
                >
                  Simpan Profil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
