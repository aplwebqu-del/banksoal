import React, { useState } from "react";
import {
  FileText,
  Search,
  Upload,
  ChevronDown,
  Shield,
  GraduationCap,
  Sparkles,
  Menu,
  X,
  Settings,
  Database,
  LogOut,
  UserCheck,
  Building,
} from "lucide-react";
import { UserProfile, StorageProfile } from "../../types";
import { AppStore } from "../../services/store";
import { DatabaseConnectionModal } from "../storage/DatabaseConnectionModal";

interface NavbarProps {
  currentUser: UserProfile;
  activeStorage?: StorageProfile;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenUpload: () => void;
  onOpenSetupWizard: () => void;
  onToggleMobileMenu: () => void;
  isMobileMenuOpen: boolean;
  onNavigate: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeStorage,
  searchQuery,
  onSearchChange,
  onOpenUpload,
  onOpenSetupWizard,
  onToggleMobileMenu,
  isMobileMenuOpen,
  onNavigate,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showDbModal, setShowDbModal] = useState(false);
  const settings = AppStore.getSettings();

  const handleLogout = () => {
    setShowUserDropdown(false);
    AppStore.logout();
  };

  const isCloudConnected = AppStore.isCloudDatabaseActive();

  return (
    <header
      id="main-navbar"
      className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand / Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              id="mobile-menu-btn"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Toggle Navigation"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <button
              id="brand-logo-btn"
              onClick={() => onNavigate("dashboard")}
              className="flex items-center gap-3 text-left group focus:outline-none"
            >
              {settings.institution_logo_url ? (
                <img
                  src={settings.institution_logo_url}
                  alt={settings.school_name || "Logo Sekolah"}
                  className="w-10 h-10 rounded-xl object-cover border border-slate-700 shadow-md group-hover:scale-105 transition-transform bg-slate-800"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight text-white">
                    {settings.site_title || "Bank Soal PDF"}
                  </span>
                  <span className="text-[10px] uppercase font-semibold tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded">
                    SaaS v2.5
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium truncate max-w-[200px]">
                  {settings.school_name || "Repositori & Arsip Soal Pengajar"}
                </p>
              </div>
            </button>
          </div>

          {/* Center Search Bar & Upload Menu directly beside each other */}
          <div className="flex-1 max-w-2xl hidden md:flex items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="navbar-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cari judul soal, mapel, kelas, bab, topik, kurikulum, tags..."
                className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Menu Upload positioned right beside search bar */}
            <button
              id="navbar-upload-pdf-btn"
              onClick={onOpenUpload}
              title="Unggah Naskah Bank Soal PDF Baru"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-95 shrink-0"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden lg:inline">Upload PDF</span>
            </button>
          </div>

          {/* Right Action Items: Connection Icon beside User Bio */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mobile Upload Button */}
            <button
              id="mobile-upload-btn"
              onClick={onOpenUpload}
              className="md:hidden p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md"
              aria-label="Upload PDF"
            >
              <Upload className="w-4 h-4" />
            </button>

            {/* Connection Status Icon Button - Positioned visible beside User Bio */}
            <button
              id="navbar-connect-database-btn"
              onClick={() => setShowDbModal(true)}
              title={
                isCloudConnected
                  ? "Koneksi Google Database Aktif (Google Drive & 7 Tabel Sheets)"
                  : "Koneksi Database Belum Dikonfigurasi - Klik untuk Hubungkan"
              }
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all hover:scale-[1.02] ${
                isCloudConnected
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
                  : "bg-slate-800/90 border-slate-700 text-slate-300 hover:bg-slate-750 hover:text-white"
              }`}
            >
              <div className="relative">
                <Database className={`w-4 h-4 ${isCloudConnected ? "text-emerald-400" : "text-blue-400"}`} />
                <span
                  className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${
                    isCloudConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                  }`}
                />
              </div>
              <span className="hidden sm:inline">
                {isCloudConnected ? "Google DB: Terhubung" : "Connection"}
              </span>
            </button>

            {/* User Bio & Profile Menu with Avatar Photo */}
            <div className="relative">
              <button
                id="user-profile-menu-btn"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all"
              >
                {currentUser.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-lg object-cover border border-slate-600 bg-slate-700"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                    {currentUser.name.slice(0, 2)}
                  </div>
                )}
                <div className="hidden xl:block text-left">
                  <div className="text-xs font-semibold text-white leading-tight flex items-center gap-1.5">
                    <span className="truncate max-w-[140px]">{currentUser.name}</span>
                    {currentUser.role === "ADMIN" ? (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold px-1 py-0.2 rounded">
                        ADMIN
                      </span>
                    ) : (
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold px-1 py-0.2 rounded">
                        GURU
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                    {currentUser.role === "ADMIN" ? "Full Access" : currentUser.subject_specialty || "Pengajar"}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 hidden xl:block" />
              </button>

              {/* User Dropdown Panel */}
              {showUserDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserDropdown(false)}
                  />
                  <div
                    id="user-dropdown-panel"
                    className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-2 text-slate-200"
                  >
                    <div className="p-3 border-b border-slate-800 flex items-center gap-3">
                      {currentUser.avatar_url ? (
                        <img
                          src={currentUser.avatar_url}
                          alt={currentUser.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-700 bg-slate-800"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white">
                          {currentUser.name.slice(0, 2)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              currentUser.role === "ADMIN"
                                ? "bg-amber-500/20 text-amber-300"
                                : "bg-emerald-500/20 text-emerald-300"
                            }`}
                          >
                            {currentUser.role}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            @{currentUser.username || currentUser.email.split("@")[0]}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="py-2 space-y-1">
                      {currentUser.role === "ADMIN" && (
                        <>
                          <button
                            id="nav-user-management-btn"
                            onClick={() => {
                              setShowUserDropdown(false);
                              onNavigate("users");
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-blue-400 hover:bg-blue-950/40 rounded-xl transition-colors text-left"
                          >
                            <UserCheck className="w-4 h-4 text-blue-400" />
                            <div>
                              <p className="font-semibold text-white">Kelola Pengguna & Switch Akun</p>
                              <p className="text-[10px] text-slate-400">Ganti akun & ubah password guru</p>
                            </div>
                          </button>

                          <button
                            id="setup-wizard-launch-btn"
                            onClick={() => {
                              setShowUserDropdown(false);
                              onOpenSetupWizard();
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-xl transition-colors text-left"
                          >
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            <span>Setup Wizard Pertama Kali</span>
                          </button>

                          <button
                            id="nav-settings-btn"
                            onClick={() => {
                              setShowUserDropdown(false);
                              onNavigate("settings");
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-xl transition-colors text-left"
                          >
                            <Building className="w-4 h-4 text-amber-400" />
                            <span>Pengaturan Logo & Lembaga</span>
                          </button>
                        </>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <button
                        id="nav-logout-btn"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-950/30 rounded-xl transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Keluar / Logout</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Database Connection Center Modal */}
      <DatabaseConnectionModal
        isOpen={showDbModal}
        onClose={() => setShowDbModal(false)}
        onNavigateToStorage={() => onNavigate("storage")}
      />
    </header>
  );
};
