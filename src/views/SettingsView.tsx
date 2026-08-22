import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  HardDrive,
  Shield,
  Cloud,
  ExternalLink,
  Save,
  Check,
  AlertCircle,
  Code,
  Activity,
  Plus,
  Trash2,
  Edit3,
  Power,
  X,
  FileSpreadsheet,
  FolderOpen,
  Wifi,
  WifiOff,
  AlertTriangle,
  BookOpen,
  Layers,
  Zap,
} from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../components/Toast';
import { GoogleStorageProfile, ConnectionTestResult, MigrationReport, DriveSyncResult } from '../types';
import { IntegrationGuide } from '../components/IntegrationGuide';

/**
 * Helper untuk membersihkan dan mengekstrak ID Folder Google Drive
 */
function extractDriveFolderId(input?: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const match = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];
  return trimmed;
}

/**
 * Helper untuk membersihkan dan mengekstrak ID Google Spreadsheet
 */
function extractSpreadsheetId(input?: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];
  return trimmed;
}

export const SettingsView: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'PROFILES' | 'GUIDE' | 'MAINTENANCE'>('PROFILES');
  const [profiles, setProfiles] = useState<GoogleStorageProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<GoogleStorageProfile | null>(null);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<GoogleStorageProfile | null>(null);
  const [manageProfile, setManageProfile] = useState<GoogleStorageProfile | null>(null);

  // Form State for Add / Edit
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formDriveId, setFormDriveId] = useState('');
  const [formSheetsId, setFormSheetsId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState<number>(1);
  const [formMakeActive, setFormMakeActive] = useState(false);
  const [isSavingForm, setIsSavingForm] = useState(false);

  // Modal in-line live test state
  const [modalTesting, setModalTesting] = useState(false);
  const [modalTestResult, setModalTestResult] = useState<ConnectionTestResult | null>(null);

  // Testing & Diagnostics
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [testedProfileId, setTestedProfileId] = useState<string | null>(null);

  // Sync & Migration
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncReport, setSyncReport] = useState<DriveSyncResult | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationReport, setMigrationReport] = useState<MigrationReport | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setIsLoadingProfiles(true);
    try {
      const res = await api.getStorageProfiles();
      setProfiles(res.profiles || []);
      setActiveProfile(res.active_profile || null);
    } catch (err: any) {
      console.warn('Failed to load storage profiles:', err);
      showToast('Gagal memuat profil Google Storage', 'error');
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  const openAddModal = () => {
    setFormName('');
    setFormUrl('');
    setFormDriveId('');
    setFormSheetsId('');
    setFormDescription('');
    setFormPriority(profiles.length + 1);
    setFormMakeActive(false);
    setModalTestResult(null);
    setShowAddModal(true);
  };

  const openEditModal = (p: GoogleStorageProfile) => {
    setEditingProfile(p);
    setFormName(p.name);
    setFormUrl(p.apps_script_url || '');
    setFormDriveId(p.drive_root_folder_id || p.google_drive_folder_id || '');
    setFormSheetsId(p.spreadsheet_id || p.google_spreadsheet_id || '');
    setFormDescription(p.description || '');
    setFormPriority(p.priority || 1);
    setFormMakeActive(p.is_active);
    setModalTestResult(null);
  };

  const handleTestModalConfig = async () => {
    const cleanDrive = extractDriveFolderId(formDriveId);
    const cleanSheets = extractSpreadsheetId(formSheetsId);
    const url = formUrl.trim();

    if (!url || !url.startsWith('http')) {
      showToast('Masukkan URL Google Apps Script yang valid terlebih dahulu.', 'error');
      return;
    }

    setModalTesting(true);
    setModalTestResult(null);

    try {
      const res = await api.testCustomStorageProfile({
        name: formName || 'Test Config',
        apps_script_url: url,
        drive_root_folder_id: cleanDrive,
        google_drive_folder_id: cleanDrive,
        spreadsheet_id: cleanSheets,
        google_spreadsheet_id: cleanSheets,
      });

      setModalTestResult(res);
      if (res.success) {
        showToast(`Uji Koneksi Berhasil! Respon: ${res.latency_ms} ms`, 'success');
      } else {
        showToast(res.apps_script.message || 'Koneksi belum berhasil terhubung.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal menguji konfigurasi', 'error');
    } finally {
      setModalTesting(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Nama storage wajib diisi.', 'error');
      return;
    }

    const cleanDrive = extractDriveFolderId(formDriveId);
    const cleanSheets = extractSpreadsheetId(formSheetsId);
    const cleanUrl = formUrl.trim();

    if (!cleanUrl || !cleanUrl.startsWith('http')) {
      showToast('URL Google Apps Script Web App wajib diisi.', 'error');
      return;
    }

    if (!cleanDrive) {
      showToast('ID Folder Google Drive wajib diisi.', 'error');
      return;
    }

    if (!cleanSheets) {
      showToast('ID Google Spreadsheet wajib diisi.', 'error');
      return;
    }

    setIsSavingForm(true);
    try {
      if (editingProfile) {
        await api.updateStorageProfile(editingProfile.id, {
          name: formName.trim(),
          apps_script_url: cleanUrl,
          drive_root_folder_id: cleanDrive,
          google_drive_folder_id: cleanDrive,
          spreadsheet_id: cleanSheets,
          google_spreadsheet_id: cleanSheets,
          description: formDescription.trim(),
          priority: formPriority,
          is_active: formMakeActive,
          status: formMakeActive ? 'ACTIVE' : 'INACTIVE',
        });
        showToast(`Profil "${formName}" berhasil diperbarui!`, 'success');
        setEditingProfile(null);
      } else {
        await api.createStorageProfile({
          name: formName.trim(),
          apps_script_url: cleanUrl,
          drive_root_folder_id: cleanDrive,
          google_drive_folder_id: cleanDrive,
          spreadsheet_id: cleanSheets,
          google_spreadsheet_id: cleanSheets,
          description: formDescription.trim(),
          priority: formPriority,
          is_active: formMakeActive,
          status: formMakeActive ? 'ACTIVE' : 'INACTIVE',
        });
        showToast(`Profil Google Storage "${formName}" berhasil ditambahkan!`, 'success');
        setShowAddModal(false);
      }
      await loadProfiles();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan profil storage', 'error');
    } finally {
      setIsSavingForm(false);
    }
  };

  const handleActivateProfile = async (p: GoogleStorageProfile) => {
    if (p.is_active) return;
    try {
      const res = await api.setActiveStorageProfile(p.id);
      showToast(res.message || `Profil "${p.name}" sekarang aktif sebagai Active Storage!`, 'success');
      await loadProfiles();
      if (manageProfile?.id === p.id) {
        setManageProfile((prev) => (prev ? { ...prev, is_active: true, status: 'ACTIVE' } : null));
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal mengaktifkan profil storage', 'error');
    }
  };

  const handleDeactivateProfile = async (p: GoogleStorageProfile) => {
    if (!p.is_active) return;
    try {
      const res = await api.deactivateStorageProfile(p.id);
      showToast(res.message || `Profil "${p.name}" berhasil dinonaktifkan.`, 'success');
      await loadProfiles();
      if (manageProfile?.id === p.id) {
        setManageProfile((prev) => (prev ? { ...prev, is_active: false, status: 'INACTIVE' } : null));
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal menonaktifkan profil storage', 'error');
    }
  };

  const handleDeleteProfile = async (p: GoogleStorageProfile) => {
    if (profiles.length <= 1) {
      showToast('Minimal harus ada 1 profil Google Storage dalam sistem.', 'error');
      return;
    }
    if (!confirm(`Apakah Anda yakin ingin menghapus profil Google Storage "${p.name}"?`)) {
      return;
    }

    try {
      const res = await api.deleteStorageProfile(p.id);
      showToast(res.message || 'Profil berhasil dihapus.', 'success');
      setManageProfile(null);
      await loadProfiles();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus profil storage', 'error');
    }
  };

  const handleTestConnection = async (profileId: string) => {
    setTestingId(profileId);
    setTestResult(null);
    setTestedProfileId(profileId);

    try {
      const res = await api.testStorageProfile(profileId);
      setTestResult(res);
      if (res.success) {
        showToast(`Uji Koneksi Berhasil! Latensi: ${res.latency_ms} ms`, 'success');
      } else {
        showToast(`Uji koneksi gagal: ${res.apps_script.message}`, 'error');
      }
      await loadProfiles();
    } catch (err: any) {
      showToast(err.message || 'Gagal menguji koneksi profil', 'error');
    } finally {
      setTestingId(null);
    }
  };

  const handleSyncDriveAndSheets = async (profileId?: string) => {
    setIsSyncing(true);
    try {
      const res = await api.syncStorageProfile(profileId);
      setSyncReport(res);
      showToast(
        `Sinkronisasi Selesai: ${res.synced_count} file sinkron, ${res.total_scanned} diperiksa.`,
        'success'
      );
      await loadProfiles();
    } catch (err: any) {
      showToast(err.message || 'Gagal menjalankan sinkronisasi', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRunMigration = async () => {
    if (!confirm('Apakah Anda ingin menjalankan migrasi data legacy (JSON/Local) ke Google Storage aktif?')) {
      return;
    }
    setIsMigrating(true);
    try {
      const report = await api.runLegacyMigration();
      setMigrationReport(report);
      showToast(
        `Migrasi Selesai: ${report.success_count} item berhasil dipindahkan ke Google Drive & Sheets!`,
        'success'
      );
      await loadProfiles();
    } catch (err: any) {
      showToast(err.message || 'Gagal menjalankan migrasi legacy', 'error');
    } finally {
      setIsMigrating(false);
    }
  };

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const data = await api.getStats();
      const backupData = {
        exported_at: new Date().toISOString(),
        version: '2.5.0',
        architecture: 'Multi Google Storage Manager (Drive + Sheets + Apps Script)',
        active_storage: activeProfile,
        all_profiles: profiles,
        stats: data,
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_multi_google_storage_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Cadangan metadata database berhasil diekspor!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal mengekspor data cadangan', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const nonActiveProfiles = profiles.filter((p) => !p.is_active);

  const activeDriveId = extractDriveFolderId(
    activeProfile?.drive_root_folder_id || activeProfile?.google_drive_folder_id
  );
  const activeSheetsId = extractSpreadsheetId(
    activeProfile?.spreadsheet_id || activeProfile?.google_spreadsheet_id
  );

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Header & Tabs Navigation */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-2">
              <Cloud className="w-3.5 h-3.5" />
              <span>Multi Google Storage Manager</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Penyimpanan Google Cloud & Integrasi
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Konfigurasi dinamis Google Drive, Google Sheets, Google Apps Script, perutean multi-storage dengan failover otomatis dan panduan integrasi langkah demi langkah.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openAddModal}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/30 transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Storage</span>
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 border-t border-slate-800 pt-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('PROFILES')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'PROFILES'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Profil Penyimpanan ({profiles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('GUIDE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'GUIDE'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Panduan Integrasi & Arsitektur</span>
          </button>

          <button
            onClick={() => setActiveTab('MAINTENANCE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'MAINTENANCE'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sinkronisasi & Pemeliharaan</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PROFIL PENYIMPANAN (MULTI STORAGE PROFILES) */}
      {/* ========================================================================= */}
      {activeTab === 'PROFILES' && (
        <div className="space-y-8 animate-in fade-in duration-150">
          {/* STORAGE AKTIF SECTION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Storage Utama Aktif (Active Storage)</span>
              </h3>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Target utama untuk operasi Upload, Search, Preview, Download & Sync
              </span>
            </div>

            {activeProfile ? (
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/20 border-2 border-emerald-500/60 p-6 rounded-3xl shadow-2xl space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3.5 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-inner">
                      <Cloud className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h4 className="text-lg sm:text-xl font-black text-white">{activeProfile.name}</h4>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-extrabold uppercase tracking-wide flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          ACTIVE
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-[10px] font-bold">
                          Prioritas #{activeProfile.priority || 1}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {activeProfile.description || 'Penyimpanan Google Drive & Google Sheets primer institusi.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTestConnection(activeProfile.id)}
                      disabled={testingId === activeProfile.id}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${testingId === activeProfile.id ? 'animate-spin text-blue-400' : ''}`} />
                      <span>{testingId === activeProfile.id ? 'Menguji...' : 'Uji Koneksi'}</span>
                    </button>

                    <button
                      onClick={() => setManageProfile(activeProfile)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold transition-all cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Kelola</span>
                    </button>
                  </div>
                </div>

                {/* 3 Core Cards: Google Drive, Google Sheets, Apps Script Web App */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1 relative z-10">
                  {/* Card Google Drive */}
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5 hover:border-slate-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                        <FolderOpen className="w-4 h-4 text-amber-400" />
                        <span>Google Drive</span>
                      </span>
                      <span className="text-emerald-400 flex items-center gap-1 font-bold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Terhubung
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-slate-200 font-bold truncate">
                        Folder: {activeProfile.drive_root_name || 'BANK SOAL DIGITAL'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">
                        ID: {activeDriveId || '(Belum diatur)'}
                      </div>
                    </div>
                    {activeDriveId && (
                      <a
                        href={`https://drive.google.com/drive/folders/${activeDriveId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[11px] font-semibold transition-colors"
                      >
                        <span>Buka Google Drive</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {/* Card Google Spreadsheet */}
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5 hover:border-slate-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                        <span>Google Spreadsheet</span>
                      </span>
                      <span className="text-emerald-400 flex items-center gap-1 font-bold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Terhubung
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-slate-200 font-bold truncate">
                        File: {activeProfile.spreadsheet_name || 'BANK SOAL DIGITAL'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">
                        ID: {activeSheetsId || '(Belum diatur)'}
                      </div>
                    </div>
                    {activeSheetsId && (
                      <a
                        href={`https://docs.google.com/spreadsheets/d/${activeSheetsId}/edit`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[11px] font-semibold transition-colors"
                      >
                        <span>Buka Google Spreadsheet</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {/* Card Apps Script Web App */}
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5 hover:border-slate-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                        <Code className="w-4 h-4 text-indigo-400" />
                        <span>Apps Script Web App</span>
                      </span>
                      <span className="text-emerald-400 flex items-center gap-1 font-bold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Terhubung
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-slate-200 font-bold truncate">
                        API Gateway: Online
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>Latensi:</span>
                        <span className="text-emerald-400 font-mono font-bold">
                          {activeProfile.latency_ms ? `${activeProfile.latency_ms} ms` : 'Aktif (< 100ms)'}
                        </span>
                      </div>
                    </div>
                    {activeProfile.apps_script_url && (
                      <a
                        href={activeProfile.apps_script_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[11px] font-semibold transition-colors truncate max-w-full"
                      >
                        <span className="truncate">Cek Endpoint Live</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                <h4 className="text-base font-bold text-white">Belum Ada Storage Aktif yang Terpilih</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Pilih salah satu profil penyimpanan Google di bawah ini untuk dijadikan Active Storage.
                </p>
              </div>
            )}
          </div>

          {/* DAFTAR STORAGE PROFILES LAINNYA / CADANGAN / FAILOVER */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>Penyimpanan Cadangan & Failover ({nonActiveProfiles.length})</span>
              </h3>
              <span className="text-xs text-slate-400">
                Penyimpanan otomatis yang siap mengambil alih ketika kuota penuh
              </span>
            </div>

            {nonActiveProfiles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {nonActiveProfiles.map((p) => {
                  const driveId = extractDriveFolderId(p.drive_root_folder_id || p.google_drive_folder_id);
                  const sheetId = extractSpreadsheetId(p.spreadsheet_id || p.google_spreadsheet_id);

                  return (
                    <div
                      key={p.id}
                      className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
                              <Cloud className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white">{p.name}</h4>
                              <p className="text-[11px] text-slate-400">Prioritas #{p.priority || 2}</p>
                            </div>
                          </div>

                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold uppercase">
                            STANDBY
                          </span>
                        </div>

                        <p className="text-xs text-slate-400">
                          {p.description || 'Penyimpanan cadangan untuk pengujian atau failover.'}
                        </p>

                        <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-slate-400">
                            <span>Drive:</span>
                            <span className="font-mono text-slate-300 truncate max-w-[180px]">{driveId || '(Kosong)'}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-400">
                            <span>Spreadsheet:</span>
                            <span className="font-mono text-slate-300 truncate max-w-[180px]">{sheetId || '(Kosong)'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 gap-2">
                        <button
                          onClick={() => handleActivateProfile(p)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>Jadikan Aktif</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleTestConnection(p.id)}
                            disabled={testingId === p.id}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
                            title="Uji Koneksi"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${testingId === p.id ? 'animate-spin text-blue-400' : ''}`} />
                          </button>

                          <button
                            onClick={() => openEditModal(p)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 transition-colors cursor-pointer"
                            title="Edit Konfigurasi"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteProfile(p)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-rose-400 transition-colors cursor-pointer"
                            title="Hapus Profil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 rounded-3xl bg-slate-900 border border-dashed border-slate-800 text-center text-xs text-slate-400">
                Belum ada penyimpanan cadangan kedua. Klik tombol <strong>+ Tambah Storage</strong> untuk menambah storage failover.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PANDUAN INTEGRASI & ARSITEKTUR */}
      {/* ========================================================================= */}
      {activeTab === 'GUIDE' && <IntegrationGuide />}

      {/* ========================================================================= */}
      {/* TAB 3: SINKRONISASI & PEMELIHARAAN */}
      {/* ========================================================================= */}
      {activeTab === 'MAINTENANCE' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card Sinkronisasi */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 w-fit">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white">Sinkronisasi Drive ↔ Sheets</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Memindai seluruh baris di Google Sheets dan memverifikasi ketersediaan berkas fisik di Google Drive secara real-time.
                </p>
              </div>

              <button
                onClick={() => handleSyncDriveAndSheets()}
                disabled={isSyncing}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 transition-all disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Memindai...' : 'Jalankan Sinkronisasi'}</span>
              </button>
            </div>

            {/* Card Migrasi Legacy */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 w-fit">
                  <Database className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white">Migrasi Data Legacy</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Impor otomatis naskah soal dan metadata lama ke folder Google Drive dan Google Sheets aktif tanpa kehilangan data.
                </p>
              </div>

              <button
                onClick={handleRunMigration}
                disabled={isMigrating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isMigrating ? 'Memigrasikan...' : 'Mulai Migrasi Data'}</span>
              </button>
            </div>

            {/* Card Ekspor Backup */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 w-fit">
                  <Download className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white">Ekspor Cadangan JSON</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Unduh salinan cadangan lengkap seluruh konfigurasi profil storage dan ringkasan metadata dalam format JSON.
                </p>
              </div>

              <button
                onClick={handleExportBackup}
                disabled={isExporting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/30 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExporting ? 'Mengekspor...' : 'Unduh Cadangan JSON'}</span>
              </button>
            </div>
          </div>

          {/* Sync Report Box */}
          {syncReport && (
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Hasil Sinkronisasi Terakhir ({syncReport.sync_id})</span>
                </h4>
                <span className="text-[11px] text-slate-400">{new Date(syncReport.timestamp).toLocaleString('id-ID')}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Total Dipindai</span>
                  <span className="text-lg font-black text-white">{syncReport.total_scanned}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Tersinkron</span>
                  <span className="text-lg font-black text-emerald-400">{syncReport.synced_count}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Menunggu Cloud</span>
                  <span className="text-lg font-black text-amber-400">{syncReport.missing_count}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Status</span>
                  <span className="text-lg font-black text-blue-400">{syncReport.status}</span>
                </div>
              </div>

              <p className="text-xs text-slate-300">{syncReport.details}</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL TAMBAH / EDIT PROFIL GOOGLE STORAGE */}
      {/* ========================================================================= */}
      {(showAddModal || editingProfile) && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cloud className="w-5 h-5 text-blue-400" />
                <span>{editingProfile ? 'Edit Profil Google Storage' : 'Tambah Google Storage'}</span>
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingProfile(null);
                }}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4 text-xs overflow-y-auto">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Nama Storage *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Bank Soal Utama, Bank Soal Cadangan 2025"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Deskripsi (Opsional)</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Keterangan peruntukan storage..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Google Apps Script Web App URL *</label>
                <input
                  type="url"
                  required
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Google Drive Folder ID *</label>
                  <input
                    type="text"
                    required
                    value={formDriveId}
                    onChange={(e) => setFormDriveId(e.target.value)}
                    placeholder="1cYgXdF66T1GKMw3Dkd26J55E5HZPIRBG atau URL"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Google Spreadsheet ID *</label>
                  <input
                    type="text"
                    required
                    value={formSheetsId}
                    onChange={(e) => setFormSheetsId(e.target.value)}
                    placeholder="1xWK5VMJatqMtshx0FnFKZL54N2lQZ7wXoEJCQVT1o9A atau URL"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Prioritas Perutean Failover (1 = Tertinggi)</label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={formPriority}
                  onChange={(e) => setFormPriority(Number(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* In-Modal Test Result Box */}
              {modalTestResult && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span>Hasil Uji Koneksi:</span>
                    <span className="text-emerald-400 font-mono text-[11px]">
                      Latency: {modalTestResult.latency_ms} ms
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Apps Script</span>
                      <span className={`font-semibold ${modalTestResult.apps_script.reachable ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {modalTestResult.apps_script.reachable ? '✓ OK' : '✕ Gagal'}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Drive Folder</span>
                      <span className={`font-semibold ${modalTestResult.google_drive.connected ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {modalTestResult.google_drive.connected ? '✓ Siap' : '✕ Gagal'}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Spreadsheet</span>
                      <span className={`font-semibold ${modalTestResult.google_sheets.connected ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {modalTestResult.google_sheets.connected ? '✓ Siap' : '✕ Gagal'}
                      </span>
                    </div>
                  </div>
                  {modalTestResult.apps_script.message && (
                    <p className="text-[11px] text-slate-300">{modalTestResult.apps_script.message}</p>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="makeActiveCheck"
                  checked={formMakeActive}
                  onChange={(e) => setFormMakeActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded bg-slate-800 border-slate-700 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="makeActiveCheck" className="text-slate-300 font-medium cursor-pointer">
                  Jadikan profil ini sebagai <strong>Active Storage</strong> sekarang
                </label>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleTestModalConfig}
                  disabled={modalTesting}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold border border-slate-700 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${modalTesting ? 'animate-spin text-blue-400' : ''}`} />
                  <span>{modalTesting ? 'Menguji...' : 'Uji Koneksi'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingProfile(null);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-all cursor-pointer"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingForm}
                    className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-md shadow-blue-600/30 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingForm ? 'Menyimpan...' : 'Simpan'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KELOLA PROFIL DETAIL */}
      {manageProfile && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-400" />
                <span>Kelola Profil: {manageProfile.name}</span>
              </h3>
              <button
                onClick={() => setManageProfile(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status Penyimpanan:</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${manageProfile.is_active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                    {manageProfile.is_active ? 'ACTIVE' : 'STANDBY'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Prioritas Failover:</span>
                  <span className="font-mono text-white">#{manageProfile.priority || 1}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Google Drive Folder ID:</span>
                  <span className="font-mono text-amber-300 truncate max-w-[200px]">{manageProfile.drive_root_folder_id || '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Google Spreadsheet ID:</span>
                  <span className="font-mono text-emerald-300 truncate max-w-[200px]">{manageProfile.spreadsheet_id || '-'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    openEditModal(manageProfile);
                    setManageProfile(null);
                  }}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-blue-400" />
                  <span>Edit Konfigurasi</span>
                </button>

                <button
                  onClick={() => handleTestConnection(manageProfile.id)}
                  disabled={testingId === manageProfile.id}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${testingId === manageProfile.id ? 'animate-spin text-blue-400' : 'text-emerald-400'}`} />
                  <span>Uji Koneksi</span>
                </button>
              </div>

              {!manageProfile.is_active && (
                <button
                  onClick={() => handleActivateProfile(manageProfile)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all cursor-pointer shadow-md shadow-emerald-600/30"
                >
                  <Power className="w-4 h-4" />
                  <span>Jadikan Active Storage</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
