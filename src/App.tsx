/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { AppStore } from "./services/store";
import {
  BankSoal,
  StorageProfile,
  UserProfile,
  CategoryMaster,
  TagItem,
  ActivityHistory,
  AuditLog,
  SystemSettings,
} from "./types";
import { Navbar } from "./components/layout/Navbar";
import { Sidebar } from "./components/layout/Sidebar";
import { DashboardView } from "./components/dashboard/DashboardView";
import { BankSoalList } from "./components/banksoal/BankSoalList";
import { TrashView } from "./components/banksoal/TrashView";
import { UploadPdfModal } from "./components/banksoal/UploadPdfModal";
import { PdfPreviewModal } from "./components/banksoal/PdfPreviewModal";
import { VersionHistoryModal } from "./components/banksoal/VersionHistoryModal";
import { EditMetadataModal } from "./components/banksoal/EditMetadataModal";
import { StorageManagementView } from "./components/storage/StorageManagementView";
import { AppsScriptGuideModal } from "./components/storage/AppsScriptGuideModal";
import { MasterOrganizationView } from "./components/master/MasterOrganizationView";
import { ActivityHistoryView } from "./components/activity/ActivityHistoryView";
import { AuditLogView } from "./components/activity/AuditLogView";
import { UserManagementView } from "./components/admin/UserManagementView";
import { SystemHealthView } from "./components/admin/SystemHealthView";
import { SettingsView } from "./components/admin/SettingsView";
import { FirstTimeSetupWizard } from "./components/wizard/FirstTimeSetupWizard";
import { SplitLoginPage } from "./components/SplitLoginPage";
import { ToastContainer } from "./components/ui/Toast";

export default function App() {
  // Authentication status
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(AppStore.isLoggedIn());

  // App state from Store
  const [bankSoalList, setBankSoalList] = useState<BankSoal[]>([]);
  const [storageProfiles, setStorageProfiles] = useState<StorageProfile[]>([]);
  const [categories, setCategories] = useState<CategoryMaster[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [activities, setActivities] = useState<ActivityHistory[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile>(AppStore.getCurrentUser());
  const [settings, setSettings] = useState<SystemSettings>(AppStore.getSettings());

  // Navigation & Search
  const [currentView, setCurrentView] = useState<string>("dashboard");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [previewItem, setPreviewItem] = useState<BankSoal | null>(null);
  const [versionHistoryItem, setVersionHistoryItem] = useState<BankSoal | null>(null);
  const [editItem, setEditItem] = useState<BankSoal | null>(null);
  const [isAppsScriptGuideOpen, setIsAppsScriptGuideOpen] = useState<boolean>(false);
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState<boolean>(false);

  const refreshAllState = () => {
    setIsLoggedIn(AppStore.isLoggedIn());
    setBankSoalList(AppStore.getBankSoalList());
    setStorageProfiles(AppStore.getStorageProfiles());
    setCategories(AppStore.getCategories());
    setTags(AppStore.getTags());
    setActivities(AppStore.getActivities());
    setAuditLogs(AppStore.getAuditLogs());
    setCurrentUser(AppStore.getCurrentUser());
    setSettings(AppStore.getSettings());
  };

  useEffect(() => {
    // 1. Initial State & Subscribe
    refreshAllState();
    const unsubscribe = AppStore.subscribe(() => {
      refreshAllState();
    });

    // 2. Fetch Central Global Configuration across all devices (Vercel, Mobile, Desktop)
    AppStore.initGlobalConfig().then((result) => {
      if (result.success && result.isConfigured) {
        refreshAllState();
      }
    });

    // 3. User Activity Tracking for 10-Minute Inactivity Auto Logout
    let lastThrottledTime = 0;
    const handleUserActivity = () => {
      const now = Date.now();
      // Throttle updating storage to once every 5 seconds
      if (now - lastThrottledTime > 5000) {
        lastThrottledTime = now;
        AppStore.touchActivity();
      }
    };

    const activityEvents = ["mousedown", "mousemove", "keydown", "touchstart", "scroll", "click"];
    activityEvents.forEach((ev) => window.addEventListener(ev, handleUserActivity, { passive: true }));

    // 4. Timer Interval checking 10-minute inactivity timeout
    const interval = setInterval(() => {
      const logged = AppStore.isLoggedIn();
      if (!logged && isLoggedIn) {
        setIsLoggedIn(false);
        refreshAllState();
      }
    }, 3000);

    return () => {
      unsubscribe();
      activityEvents.forEach((ev) => window.removeEventListener(ev, handleUserActivity));
      clearInterval(interval);
    };
  }, [isLoggedIn]);

  // When user is not logged in, show the split login page
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 font-sans">
        <ToastContainer />
        <SplitLoginPage
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setIsLoggedIn(true);
            refreshAllState();
          }}
        />
      </div>
    );
  }

  const activeStorage = storageProfiles.find((s) => s.is_active);

  const stats = {
    totalBankSoal: bankSoalList.filter((b) => b.status === "active").length,
    totalFavorites: bankSoalList.filter(
      (b) => b.status === "active" && AppStore.isFavorite(b.id, currentUser.id)
    ).length,
    totalTrash: bankSoalList.filter((b) => b.status === "trash").length,
    totalStorage: storageProfiles.length,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Toast notifications */}
      <ToastContainer />

      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        activeStorage={activeStorage}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (
            currentView !== "banksoal" &&
            currentView !== "favorites" &&
            currentView !== "dashboard"
          ) {
            setCurrentView("banksoal");
          }
        }}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenSetupWizard={() => setIsSetupWizardOpen(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
        onNavigate={(view) => setCurrentView(view)}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* App Sidebar */}
        <Sidebar
          currentView={currentView}
          onNavigate={(view) => setCurrentView(view)}
          currentUser={currentUser}
          stats={stats}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Content View Area */}
        <main
          id="main-content-area"
          className="flex-1 lg:pl-64 p-4 sm:p-6 lg:p-8 min-w-0 transition-all overflow-x-hidden"
        >
          {/* Dynamic Views */}
          {currentView === "dashboard" && (
            <DashboardView
              bankSoalList={bankSoalList}
              storageProfiles={storageProfiles}
              categories={categories}
              activities={activities}
              auditLogs={auditLogs}
              currentUser={currentUser}
              onNavigate={(view) => setCurrentView(view)}
              onOpenUpload={() => setIsUploadOpen(true)}
              onSelectBankSoal={(item) => setPreviewItem(item)}
              onSearchChange={(q) => {
                setSearchQuery(q);
                setCurrentView("banksoal");
              }}
            />
          )}

          {currentView === "banksoal" && (
            <BankSoalList
              bankSoalList={bankSoalList}
              currentUser={currentUser}
              categories={categories}
              tags={tags}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onPreview={(item) => setPreviewItem(item)}
              onOpenUpload={() => setIsUploadOpen(true)}
              onOpenVersionHistory={(item) => setVersionHistoryItem(item)}
              onEditBankSoal={(item) => setEditItem(item)}
            />
          )}

          {currentView === "favorites" && (
            <BankSoalList
              bankSoalList={bankSoalList}
              currentUser={currentUser}
              categories={categories}
              tags={tags}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onPreview={(item) => setPreviewItem(item)}
              onOpenUpload={() => setIsUploadOpen(true)}
              onOpenVersionHistory={(item) => setVersionHistoryItem(item)}
              onEditBankSoal={(item) => setEditItem(item)}
              favoritesOnly={true}
            />
          )}

          {currentView === "trash" && (
            <TrashView
              bankSoalList={bankSoalList}
              currentUser={currentUser}
              onRefresh={refreshAllState}
            />
          )}

          {currentView.startsWith("master-") && (
            <MasterOrganizationView
              initialTab={
                currentView === "master-mapel"
                  ? "MATA_PELAJARAN"
                  : currentView === "master-jenjang"
                  ? "JENJANG"
                  : currentView === "master-kelas"
                  ? "TINGKAT_KELAS"
                  : currentView === "master-kurikulum"
                  ? "KURIKULUM"
                  : currentView === "master-ujian"
                  ? "JENIS_UJIAN"
                  : currentView === "master-tahun"
                  ? "TAHUN_AJARAN"
                  : "TAGS"
              }
              categories={categories}
              tags={tags}
              onRefresh={refreshAllState}
            />
          )}

          {currentView === "activity-history" && (
            <ActivityHistoryView activities={activities} />
          )}

          {currentView === "audit-logs" && currentUser.role === "ADMIN" && (
            <AuditLogView auditLogs={auditLogs} />
          )}

          {currentView === "users" && currentUser.role === "ADMIN" && (
            <UserManagementView currentUser={currentUser} onRefresh={refreshAllState} />
          )}

          {currentView === "storage" && currentUser.role === "ADMIN" && (
            <StorageManagementView
              storageProfiles={storageProfiles}
              currentUser={currentUser}
              bankSoalList={bankSoalList}
              onOpenAppsScriptGuide={() => setIsAppsScriptGuideOpen(true)}
              onRefresh={refreshAllState}
            />
          )}

          {currentView === "system-health" && currentUser.role === "ADMIN" && (
            <SystemHealthView
              storageProfiles={storageProfiles}
              bankSoalList={bankSoalList}
              onRefresh={refreshAllState}
            />
          )}

          {currentView === "apps-script-guide" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                <div>
                  <h2 className="text-xl font-bold text-white">Panduan Google Apps Script</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Panduan dan template kode integrasi Google Apps Script
                  </p>
                </div>
                <button
                  onClick={() => setIsAppsScriptGuideOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Buka Dialog Panduan & Salin Kode
                </button>
              </div>
            </div>
          )}

          {currentView === "settings" && currentUser.role === "ADMIN" && (
            <SettingsView settings={settings} onRefresh={refreshAllState} />
          )}
        </main>
      </div>

      {/* Upload PDF Modal */}
      {isUploadOpen && (
        <UploadPdfModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onSuccess={() => {
            refreshAllState();
            setCurrentView("banksoal");
          }}
          onOpenExisting={(existingItem) => {
            setPreviewItem(existingItem);
          }}
          categories={categories}
          tags={tags}
          storageProfiles={storageProfiles}
          currentUser={currentUser}
        />
      )}

      {/* PDF Preview & Inspector Modal */}
      {previewItem && (
        <PdfPreviewModal
          item={previewItem}
          isOpen={Boolean(previewItem)}
          onClose={() => setPreviewItem(null)}
          currentUser={currentUser}
          onEdit={(item) => setEditItem(item)}
          onOpenVersionHistory={(item) => setVersionHistoryItem(item)}
          onDelete={(item) => {
            AppStore.moveToTrash(item.id);
            refreshAllState();
            setPreviewItem(null);
          }}
        />
      )}

      {/* Version History Modal */}
      {versionHistoryItem && (
        <VersionHistoryModal
          item={versionHistoryItem}
          isOpen={Boolean(versionHistoryItem)}
          onClose={() => setVersionHistoryItem(null)}
          currentUser={currentUser}
        />
      )}

      {/* Edit Metadata Modal */}
      {editItem && (
        <EditMetadataModal
          item={editItem}
          isOpen={Boolean(editItem)}
          onClose={() => setEditItem(null)}
          categories={categories}
          tags={tags}
          onUpdated={() => {
            refreshAllState();
          }}
        />
      )}

      {/* Apps Script Guide Modal */}
      {isAppsScriptGuideOpen && (
        <AppsScriptGuideModal
          isOpen={isAppsScriptGuideOpen}
          onClose={() => setIsAppsScriptGuideOpen(false)}
        />
      )}

      {/* First Time Setup Wizard */}
      {isSetupWizardOpen && (
        <FirstTimeSetupWizard
          isOpen={isSetupWizardOpen}
          onClose={() => setIsSetupWizardOpen(false)}
          onComplete={() => {
            refreshAllState();
          }}
        />
      )}
    </div>
  );
}
