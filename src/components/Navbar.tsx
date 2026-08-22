import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Upload,
  User,
  ShieldCheck,
  GraduationCap,
  ChevronDown,
  Check,
  BookMarked,
  Menu,
  LogIn,
  LogOut,
  KeyRound,
  Cloud,
  RefreshCw,
  Database,
  FolderCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  ArrowDownToLine,
  ExternalLink,
  X,
  Radio,
} from 'lucide-react';
import { User as UserType, AutoSyncStatus } from '../types';
import { api } from '../lib/api';
import { useToast } from './Toast';
import { formatDate } from '../lib/utils';

export interface NavbarProps {
  currentUser: UserType;
  availableUsers?: UserType[];
  onSwitchUser: (user: UserType) => void;
  onOpenUpload: () => void;
  onOpenLogin?: () => void;
  onLogout?: () => void;
  onSearchFocus?: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit?: (q: string) => void;
  onToggleSidebar?: () => void;
  onNavigateToStorageSettings?: () => void;
  onDataRefreshed?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  availableUsers: initialUsers,
  onSwitchUser,
  onOpenUpload,
  onOpenLogin,
  onLogout,
  onSearchFocus,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onToggleSidebar,
  onNavigateToStorageSettings,
  onDataRefreshed,
}) => {
  const { showToast } = useToast();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [usersList, setUsersList] = useState<UserType[]>(initialUsers || []);

  // Auto-Sync & Live Connection State
  const [syncStatus, setSyncStatus] = useState<AutoSyncStatus | null>(null);
  const [isPullingData, setIsPullingData] = useState(false);
  const [isFullSyncing, setIsFullSyncing] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(900);
  const lastAcknowledgeRef = useRef<number>(0);

  // Poll sync status & live pulse
  const fetchSyncStatus = async (silent = true) => {
    try {
      const res = await api.getAutoSyncStatus();
      setSyncStatus(res);

      // Check if auto-sync found new items in background
      if (res.new_items_found_last_sync > 0 && Date.now() - lastAcknowledgeRef.current > 15000) {
        lastAcknowledgeRef.current = Date.now();
        showToast(
          `Auto-Sync Berkala: ${res.last_sync_summary}`,
          'success',
          'Soal Baru Disinkronkan'
        );
        api.acknowledgeSync().catch(() => {});
        if (onDataRefreshed) onDataRefreshed();
      }

      // Calculate countdown to next run
      if (res.next_sync_time) {
        const diffSec = Math.max(0, Math.floor((new Date(res.next_sync_time).getTime() - Date.now()) / 1000));
        setCountdownSeconds(diffSec);
      }
    } catch (err: any) {
      if (!silent) {
        showToast('Gagal memverifikasi status Google Storage', 'error');
      }
    }
  };

  useEffect(() => {
    fetchSyncStatus(true);
    const interval = setInterval(() => {
      fetchSyncStatus(true);
    }, 30000); // 30 detik polling

    // Timer detik untuk hitung mundur auto-sync 15 menit
    const secTimer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 900));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(secTimer);
    };
  }, []);

  useEffect(() => {
    if (initialUsers && initialUsers.length > 0) {
      setUsersList(initialUsers);
    } else {
      api.getUsers()
        .then((res) => setUsersList(res.users))
        .catch(() => {});
    }
  }, [initialUsers]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearchSubmit) {
      onSearchSubmit(searchQuery);
    }
  };

  // Action: Tarik Data dari Spreadsheet Sekarang
  const handlePullData = async () => {
    setIsPullingData(true);
    try {
      const res = await api.pullDataFromSheets();
      if (res.success) {
        showToast(
          res.message || `Berhasil menarik ${res.total} soal dari Google Sheets.`,
          'success',
          'Tarik Data Berhasil'
        );
        fetchSyncStatus(true);
        if (onDataRefreshed) onDataRefreshed();
      } else {
        showToast(res.message || 'Gagal menarik data dari Google Sheets', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal terhubung ke Google Sheets', 'error');
    } finally {
      setIsPullingData(false);
    }
  };

  // Action: Sinkronkan Google Drive & Sheets Terpadu
  const handleFullSync = async () => {
    setIsFullSyncing(true);
    try {
      const res = await api.triggerAutoSync();
      if (res.success) {
        showToast(
          'Sinkronisasi dua arah Google Drive & Sheets berhasil diselesaikan.',
          'success',
          'Sinkronisasi Selesai'
        );
        fetchSyncStatus(true);
        if (onDataRefreshed) onDataRefreshed();
      } else {
        showToast('Sinkronisasi Google Drive gagal', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal melakukan sinkronisasi Google Drive & Sheets', 'error');
    } finally {
      setIsFullSyncing(false);
    }
  };

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const isOnline = Boolean(syncStatus?.connection?.online);
  const isSyncing = Boolean(syncStatus?.is_syncing || isPullingData || isFullSyncing);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-3 sm:px-6 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      {/* Left: Hamburger & Brand */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden transition-colors"
            title="Buka Navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/20 font-bold text-lg">
            <BookMarked className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white text-sm sm:text-base">Bank Soal PDF</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider hidden sm:inline-block">
                Drive & Sheets
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">Repositori Tunggal Google Drive & Spreadsheet</p>
          </div>
        </div>
      </div>

      {/* Global Quick Search Bar */}
      <div className="flex-1 max-w-lg mx-3 sm:mx-4 hidden md:block">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari judul, mapel, kelas, bab, atau topik... (Tekan Enter)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={onSearchFocus}
            className="w-full pl-10 pr-20 py-2 text-sm bg-slate-800/80 hover:bg-slate-800 focus:bg-slate-800 text-slate-100 placeholder-slate-400 rounded-xl border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner"
          />
          {onSearchSubmit && (
            <button
              onClick={() => onSearchSubmit(searchQuery)}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all"
            >
              Cari
            </button>
          )}
        </div>
      </div>

      {/* Right Controls: Live Pulse Status, Pull Data, Upload & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live Pulse Indicator Badge */}
        <button
          onClick={() => setShowSyncModal(true)}
          className={`relative flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98] ${
            isSyncing
              ? 'bg-blue-950/60 border-blue-700/60 text-blue-300 shadow-sm shadow-blue-500/10'
              : isOnline
              ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300 shadow-sm shadow-emerald-500/10 hover:bg-emerald-950/60'
              : 'bg-amber-950/40 border-amber-700/50 text-amber-300 shadow-sm shadow-amber-500/10 hover:bg-amber-950/60'
          }`}
          title="Klik untuk melihat status koneksi Google Drive & Sheets dan opsi sinkronisasi"
        >
          {isSyncing ? (
            <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
          ) : isOnline ? (
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          ) : (
            <span className="relative flex h-2.5 w-2.5">
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
          )}

          <div className="flex items-center gap-1.5">
            <span className="hidden sm:inline font-semibold">
              {isSyncing ? 'Sinkronisasi...' : isOnline ? 'Google Storage: Online' : 'Google Storage: Offline'}
            </span>
            <span className="sm:hidden font-semibold">
              {isSyncing ? 'Sync' : isOnline ? 'Online' : 'Offline'}
            </span>
            {isOnline && syncStatus?.connection?.latency_ms ? (
              <span className="hidden xl:inline text-[10px] opacity-75 font-mono">
                ({syncStatus.connection.latency_ms}ms)
              </span>
            ) : null}
          </div>
        </button>

        {/* Quick Pull Data from Sheets Button */}
        <button
          onClick={handlePullData}
          disabled={isPullingData || isSyncing}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 rounded-xl border border-slate-700 hover:border-slate-600 transition-all disabled:opacity-50"
          title="Tarik Data Terkini dari Google Sheets Database"
        >
          <ArrowDownToLine className={`w-3.5 h-3.5 text-emerald-400 ${isPullingData ? 'animate-bounce' : ''}`} />
          <span>Tarik Sheets</span>
        </button>

        {/* Upload PDF Button */}
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02]"
        >
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Upload PDF</span>
        </button>

        {/* User Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-all"
          >
            <div className="relative">
              <img
                src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                alt={currentUser.name}
                className="w-7 h-7 rounded-lg object-cover border border-slate-600"
              />
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-slate-900 ${
                  currentUser.role === 'ADMIN' ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
              />
            </div>
            <div className="text-left hidden lg:block">
              <div className="text-xs font-semibold text-white leading-tight flex items-center gap-1.5">
                <span className="truncate max-w-[120px]">{currentUser.name.split(',')[0]}</span>
                {currentUser.role === 'ADMIN' ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                {currentUser.role}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* User Menu Modal / Dropdown */}
          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2.5 border-b border-slate-700 mb-2">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Sesi Pengguna Aktif</p>
                  <p className="text-sm font-bold text-white truncate mt-0.5">{currentUser.name}</p>
                  <p className="text-xs text-slate-300 truncate">{currentUser.email}</p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{currentUser.school_institution || currentUser.institution || 'Pengajar Terdaftar'}</p>
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                        currentUser.role === 'ADMIN'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {currentUser.role === 'ADMIN' ? 'Hak Akses Administrator' : 'Hak Akses Pengajar / Guru'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  {onOpenLogin && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenLogin();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-600/20 hover:text-blue-200 rounded-xl transition-all"
                    >
                      <KeyRound className="w-4 h-4 text-blue-400" />
                      <span>Ganti Akun / Masuk dengan Sandi</span>
                    </button>
                  )}
                  {onLogout && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 rounded-xl transition-all"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" />
                      <span>Keluar (Logout)</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Live Storage & Auto-Sync Diagnostics Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-slate-800/80 border-b border-slate-700/80">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${
                  isOnline
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                }`}>
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Live Pulse Status Google Storage
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                      isOnline
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      {isOnline ? 'Terhubung (Online)' : 'Belum Terhubung / Offline'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Single source of truth penyimpanan Google Drive & Google Sheets
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSyncModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Profile Card */}
              <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Profil Penyimpanan Aktif</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {syncStatus?.connection?.profile_name || 'Google Storage Profile'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Latensi Respons</div>
                  <div className="text-sm font-mono font-bold text-emerald-400">
                    {syncStatus?.connection?.latency_ms ? `${syncStatus.connection.latency_ms} ms` : '—'}
                  </div>
                </div>
              </div>

              {/* Real Connection Diagnostics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Apps Script Card */}
                <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/60">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-1.5">
                    <Cloud className="w-4 h-4 text-blue-400" />
                    <span>Google Apps Script Web App</span>
                  </div>
                  <div className="text-xs text-slate-400 truncate">
                    {syncStatus?.connection?.apps_script_url ? (
                      <span className="font-mono text-slate-300 text-[11px] truncate block">
                        {syncStatus.connection.apps_script_url.slice(0, 45)}...
                      </span>
                    ) : (
                      <span className="text-amber-400 italic">Belum dikonfigurasi</span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px]">
                    {syncStatus?.connection?.apps_script_url ? (
                      isOnline ? (
                        <span className="text-emerald-400 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Web App Merespons Normal
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" /> Gagal menghubungi endpoint
                        </span>
                      )
                    ) : (
                      <span className="text-slate-400">Masukkan URL Web App pada Pengaturan</span>
                    )}
                  </div>
                </div>

                {/* Google Sheets DB Card */}
                <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/60">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-1.5">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <span>Google Sheets Database</span>
                  </div>
                  <div className="text-xs text-slate-400 truncate">
                    {syncStatus?.connection?.spreadsheet_id ? (
                      <span className="font-mono text-slate-300 text-[11px] truncate block">
                        ID: {syncStatus.connection.spreadsheet_id}
                      </span>
                    ) : (
                      <span className="text-slate-400">Spreadsheet ID belum diisi</span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-300">
                    <span>Index Metadata: Sheet BANK_SOAL, USERS, CATEGORIES</span>
                  </div>
                </div>
              </div>

              {/* Auto-Sync Background Scheduler Section */}
              <div className="p-4 bg-blue-950/30 border border-blue-800/40 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-blue-200">Auto-Sync Berkala Latar Belakang (Setiap 15 Menit)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 text-[10px] font-semibold border border-blue-500/30">
                    Aktif Otomatis
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs text-slate-300 mt-3 pt-3 border-t border-blue-900/40">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Waktu Sinkronisasi Terakhir:</span>
                    <span className="font-medium text-white">
                      {syncStatus?.last_sync_time ? formatDate(syncStatus.last_sync_time) : 'Belum berjalan'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Hitung Mundur Sinkronisasi:</span>
                    <span className="font-mono font-bold text-amber-300">
                      {formatCountdown(countdownSeconds)}
                    </span>
                  </div>
                </div>

                {syncStatus?.last_sync_summary && (
                  <div className="mt-2.5 p-2 bg-slate-900/60 rounded-lg text-xs text-slate-300 border border-slate-800">
                    <span className="text-slate-400">Catatan Sinkronisasi Terakhir:</span>{' '}
                    <span className="text-blue-300">{syncStatus.last_sync_summary}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="p-4 bg-slate-800/80 border-t border-slate-700/80 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePullData}
                  disabled={isPullingData || isSyncing}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl transition-all disabled:opacity-50 shadow-sm"
                >
                  <ArrowDownToLine className={`w-4 h-4 ${isPullingData ? 'animate-bounce' : ''}`} />
                  <span>{isPullingData ? 'Menarik Data...' : 'Tarik Data dari Spreadsheet'}</span>
                </button>

                <button
                  onClick={handleFullSync}
                  disabled={isFullSyncing || isSyncing}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl transition-all disabled:opacity-50 shadow-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${isFullSyncing ? 'animate-spin' : ''}`} />
                  <span>{isFullSyncing ? 'Menyinkronkan...' : 'Sinkronkan Drive & Sheets'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {onNavigateToStorageSettings && currentUser.role === 'ADMIN' && (
                  <button
                    onClick={() => {
                      setShowSyncModal(false);
                      onNavigateToStorageSettings();
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors"
                  >
                    <span>Pengaturan Storage</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={() => fetchSyncStatus(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-colors"
                >
                  Uji Ulang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

