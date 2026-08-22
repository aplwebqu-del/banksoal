import React from 'react';
import {
  LayoutDashboard,
  Files,
  Upload,
  Star,
  Clock,
  BookOpen,
  Layers,
  GraduationCap,
  Calendar,
  Tag,
  History,
  Users,
  HardDrive,
  FileSpreadsheet,
  Settings,
  Sparkles,
  ChevronRight,
  Shield,
  Cloud,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { UserRole } from '../types';

export type NavView =
  | 'dashboard'
  | 'semua_soal'
  | 'bank-soal'
  | 'upload'
  | 'favorit'
  | 'terbaru'
  | 'kategori_mapel'
  | 'kategori_jenjang'
  | 'kategori_kelas'
  | 'kategori_jenis'
  | 'kategori_tahun'
  | 'tags'
  | 'riwayat'
  | 'admin'
  | 'admin_users'
  | 'admin_categories'
  | 'admin_storage'
  | 'admin_logs'
  | 'settings'
  | 'pengaturan';

export interface SidebarProps {
  currentView?: string;
  activeTab?: string;
  onNavigate?: (view: string, filterOverride?: any) => void;
  onSelectTab?: (tab: string) => void;
  userRole?: UserRole;
  currentUserRole?: UserRole;
  favCount?: number;
  totalSoalCount?: number;
  isOpen: boolean;
  onClose?: () => void;
  onCloseMobile?: () => void;
  onOpenUpload?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  activeTab,
  onNavigate,
  onSelectTab,
  userRole,
  currentUserRole,
  favCount = 0,
  totalSoalCount = 0,
  isOpen,
  onClose,
  onCloseMobile,
  onOpenUpload,
}) => {
  const activeKey = currentView || activeTab || 'dashboard';
  const role = userRole || currentUserRole || 'GURU';

  const navItemClass = (active: boolean) =>
    `group w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all text-left ${
      active
        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-semibold'
        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
    }`;

  const handleNav = (view: string, filterOverride?: any) => {
    if (view === 'upload' && onOpenUpload) {
      onOpenUpload();
    } else {
      if (typeof onNavigate === 'function') {
        onNavigate(view, filterOverride);
      } else if (typeof onSelectTab === 'function') {
        onSelectTab(view);
      }
    }

    if (typeof onCloseMobile === 'function') {
      onCloseMobile();
    } else if (typeof onClose === 'function') {
      onClose();
    }
  };

  const closeMenu = () => {
    if (typeof onCloseMobile === 'function') {
      onCloseMobile();
    } else if (typeof onClose === 'function') {
      onClose();
    }
  };

  const isTabActive = (key: string) => {
    if (key === 'semua_soal' || key === 'bank-soal') {
      return activeKey === 'semua_soal' || activeKey === 'bank-soal';
    }
    if (key === 'settings' || key === 'pengaturan') {
      return activeKey === 'settings' || activeKey === 'pengaturan';
    }
    if (key.startsWith('admin')) {
      return activeKey === key || (key === 'admin' && activeKey.startsWith('admin'));
    }
    if (key.startsWith('kategori_')) {
      const altKey = key.replace('kategori_', 'kategori-');
      return activeKey === key || activeKey === altKey;
    }
    return activeKey === key;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={closeMenu}
        />
      )}

      <aside
        className={`fixed lg:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-slate-900 border-r border-slate-800 text-slate-200 flex flex-col transition-transform duration-200 ease-in-out shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
          {/* Main Home / Dashboard */}
          <div>
            <button
              onClick={() => handleNav('dashboard')}
              className={navItemClass(isTabActive('dashboard'))}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                <span>Dashboard Utama</span>
              </div>
            </button>
          </div>

          {/* BANK SOAL SECTION */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
              <span>Bank Soal</span>
              <Sparkles className="w-3 h-3 text-amber-400" />
            </div>
            <div className="space-y-1">
              <button
                onClick={() => handleNav('bank-soal')}
                className={navItemClass(isTabActive('bank-soal'))}
              >
                <div className="flex items-center gap-3">
                  <Files className="w-4 h-4 text-sky-400" />
                  <span>Semua Bank Soal</span>
                </div>
                {totalSoalCount > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                    {totalSoalCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleNav('upload')}
                className={navItemClass(isTabActive('upload'))}
              >
                <div className="flex items-center gap-3">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Upload PDF Soal</span>
                </div>
              </button>

              <button
                onClick={() => handleNav('favorit')}
                className={navItemClass(isTabActive('favorit'))}
              >
                <div className="flex items-center gap-3">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                  <span>Soal Favorit Saya</span>
                </div>
                {favCount > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                    {favCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleNav('terbaru')}
                className={navItemClass(isTabActive('terbaru'))}
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span>Koleksi Terbaru</span>
                </div>
              </button>

              <button
                onClick={() => handleNav('admin', { defaultTab: 'trash' })}
                className={navItemClass(isTabActive('trash'))}
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>Keranjang Sampah</span>
                </div>
              </button>
            </div>
          </div>

          {/* ORGANISASI & KATEGORI */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Organisasi & Kategori
            </div>
            <div className="space-y-1">
              <button
                onClick={() => handleNav('kategori-mapel')}
                className={navItemClass(isTabActive('kategori_mapel'))}
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-4 h-4 text-rose-400" />
                  <span>Mata Pelajaran</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </button>

              <button
                onClick={() => handleNav('kategori-jenjang')}
                className={navItemClass(isTabActive('kategori_jenjang'))}
              >
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-4 h-4 text-amber-400" />
                  <span>Jenjang (SD/SMP/SMA)</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </button>

              <button
                onClick={() => handleNav('kategori-kelas')}
                className={navItemClass(isTabActive('kategori_kelas'))}
              >
                <div className="flex items-center gap-3">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>Tingkat Kelas (1-12)</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </button>

              <button
                onClick={() => handleNav('kategori-jenis')}
                className={navItemClass(isTabActive('kategori_jenis'))}
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-4 h-4 text-teal-400" />
                  <span>Jenis & Bentuk Ujian</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </button>

              <button
                onClick={() => handleNav('kategori-tahun')}
                className={navItemClass(isTabActive('kategori_tahun'))}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>Tahun Ajaran</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </button>

              <button
                onClick={() => handleNav('kategori-tags')}
                className={navItemClass(isTabActive('tags'))}
              >
                <div className="flex items-center gap-3">
                  <Tag className="w-4 h-4 text-pink-400" />
                  <span>Kumpulan Tags (#)</span>
                </div>
              </button>
            </div>
          </div>

          {/* AKTIVITAS */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Aktivitas
            </div>
            <div className="space-y-1">
              <button
                onClick={() => handleNav('riwayat')}
                className={navItemClass(isTabActive('riwayat'))}
              >
                <div className="flex items-center gap-3">
                  <History className="w-4 h-4 text-slate-400" />
                  <span>Riwayat Aktivitas</span>
                </div>
              </button>
            </div>
          </div>

          {/* ADMIN SECTION */}
          {role === 'ADMIN' && (
            <div>
              <div className="px-3 mb-2 text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                <Shield className="w-3 h-3" />
                <span>Panel Administrator</span>
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => handleNav('admin')}
                  className={navItemClass(isTabActive('admin'))}
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-indigo-400" />
                    <span>Panel Admin & Pengajar</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* PENGATURAN & GOOGLE STORAGE */}
          <div className="pt-2 border-t border-slate-800 space-y-1">
            <button
              onClick={() => handleNav('welcome')}
              className={navItemClass(isTabActive('welcome'))}
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span>Halaman Selamat Datang</span>
              </div>
            </button>

            {role === 'ADMIN' && (
              <>
                <button
                  onClick={() => handleNav('pengaturan')}
                  className={navItemClass(isTabActive('pengaturan'))}
                >
                  <div className="flex items-center gap-3">
                    <Cloud className="w-4 h-4 text-blue-400" />
                    <span>Penyimpanan Google</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                    Multi
                  </span>
                </button>

                <button
                  onClick={() => handleNav('pengaturan')}
                  className="group w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all text-left text-blue-400 hover:bg-blue-950/40 hover:text-blue-300"
                >
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-4 h-4 text-blue-400" />
                    <span>Sinkronisasi Sheets</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">15m auto</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/50 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Bank Soal PDF v2.7</span>
          <span className="text-emerald-400 font-medium">● Multi-Storage Aktif</span>
        </div>
      </aside>
    </>
  );
};

