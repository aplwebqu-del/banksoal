import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ToastProvider, useToast } from './components/Toast';
import { UploadModal } from './components/UploadModal';
import { EditSoalModal } from './components/EditSoalModal';
import { PdfViewerModal } from './components/PdfViewerModal';
import { LoginModal } from './components/LoginModal';
import { HomeDashboardView } from './views/HomeDashboardView';
import { BankSoalListView } from './views/BankSoalListView';
import { CategoriesExplorerView } from './views/CategoriesExplorerView';
import { FavoritesView } from './views/FavoritesView';
import { HistoryView } from './views/HistoryView';
import { AdminPanelView } from './views/AdminPanelView';
import { SettingsView } from './views/SettingsView';
import { WelcomeLoginView } from './views/WelcomeLoginView';
import { api } from './lib/api';
import { BankSoal, User, StatsOverview, FilterParams } from './types';

const MainApp: React.FC = () => {
  const { showToast } = useToast();

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [adminInitialTab, setAdminInitialTab] = useState<'users' | 'trash' | 'health' | 'categories' | 'drive_sync' | 'storage' | 'audit'>('users');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);

  // Global Current User - Dra. Hj. Nurhayati, M.Pd. (ADMIN)
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'u-1',
    name: 'Dra. Hj. Nurhayati, M.Pd.',
    email: 'nurhayati@sekolah.sch.id',
    role: 'ADMIN',
    school_institution: 'SMA Negeri 1 Teladan',
    subject: 'Manajemen Kurikulum & Matematika',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  });

  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  // Global Modals State
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [editingSoal, setEditingSoal] = useState<BankSoal | null>(null);
  const [previewSoal, setPreviewSoal] = useState<BankSoal | null>(null);

  // Shared Data States
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [activeFilters, setActiveFilters] = useState<FilterParams>({});
  const [tagsList, setTagsList] = useState<{ tag: string; count: number }[]>([]);

  // Load Initial Session & Users
  useEffect(() => {
    api.getCurrentUser()
      .then((res) => {
        if (res?.user) {
          setCurrentUser(res.user);
        }
      })
      .catch(() => {});

    api.getUsers()
      .then((res) => {
        if (res?.users) {
          setAvailableUsers(res.users);
        }
      })
      .catch(() => {});
  }, []);

  // Load Initial Global Stats & Tags
  useEffect(() => {
    loadGlobalData();
  }, [currentUser]);

  const loadGlobalData = async () => {
    try {
      const [statsResult, tagsResult] = await Promise.allSettled([
        api.getStats(),
        api.getTags(),
      ]);
      if (statsResult.status === 'fulfilled' && statsResult.value) {
        setStats(statsResult.value);
      }
      if (tagsResult.status === 'fulfilled' && tagsResult.value?.tags) {
        setTagsList(tagsResult.value.tags);
      }
    } catch (err: any) {
      console.error('Error loading global data:', err);
    }
  };

  const handleGlobalSearchSubmit = (query: string) => {
    setActiveFilters((prev) => ({ ...prev, search: query }));
    setActiveTab('bank-soal');
  };

  const handleSelectMapelFromHome = (mapel: string) => {
    if (mapel === 'Semua') {
      setActiveFilters({});
    } else {
      setActiveFilters({ mata_pelajaran: mapel });
    }
    setActiveTab('bank-soal');
  };

  const handleCategoryFilterSelect = (key: string, val: string) => {
    setActiveFilters({ [key]: val });
    setActiveTab('bank-soal');
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      const res = await api.toggleFavorite(id);
      showToast(
        res.is_favorite
          ? 'Soal berhasil ditambahkan ke daftar Favorit!'
          : 'Soal dihapus dari daftar Favorit.',
        'success'
      );
      loadGlobalData();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengubah status favorit', 'error');
    }
  };

  const handleDeleteSoal = async (id: string, judul: string) => {
    if (!confirm(`Apakah Anda yakin ingin memindahkan bank soal "${judul}" ke keranjang sampah?`)) {
      return;
    }
    try {
      await api.deleteBankSoal(id);
      showToast(`Bank soal "${judul}" dipindahkan ke keranjang sampah.`, 'success');
      loadGlobalData();
      if (previewSoal?.id === id) setPreviewSoal(null);
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus bank soal', 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      showToast('Anda telah keluar dari sesi.', 'info');
    } catch {
      showToast('Anda telah keluar dari sesi.', 'info');
    }
    setIsLoggedIn(false);
    setActiveTab('welcome');
  };

  // Render Split Welcome & Login View if not logged in or on welcome screen
  if (!isLoggedIn || activeTab === 'welcome') {
    return (
      <WelcomeLoginView
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsLoggedIn(true);
          setActiveTab('dashboard');
          loadGlobalData();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        availableUsers={availableUsers}
        onSwitchUser={(user) => {
          setCurrentUser(user);
          showToast(`Akun aktif dialihkan ke: ${user.name} (${user.role})`, 'info');
        }}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
        searchQuery={globalSearch}
        onSearchChange={setGlobalSearch}
        onSearchSubmit={handleGlobalSearchSubmit}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onNavigateToStorageSettings={() => {
          setAdminInitialTab('storage');
          setActiveTab('admin');
        }}
        onDataRefreshed={() => {
          loadGlobalData();
        }}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          currentView={activeTab}
          onNavigate={(view, filterOverride) => {
            if (view === 'terbaru') {
              setActiveFilters({ sortBy: 'terbaru' });
              setActiveTab('bank-soal');
            } else if (view === 'semua_soal') {
              setActiveFilters({});
              setActiveTab('bank-soal');
            } else if (view === 'admin' && filterOverride?.defaultTab) {
              setAdminInitialTab(filterOverride.defaultTab);
              setActiveTab('admin');
            } else if (view === 'admin_users') {
              setAdminInitialTab('users');
              setActiveTab('admin');
            } else if (view === 'admin_categories') {
              setAdminInitialTab('categories');
              setActiveTab('admin');
            } else if (view === 'admin_storage') {
              setAdminInitialTab('storage');
              setActiveTab('admin');
            } else if (view === 'admin_logs') {
              setAdminInitialTab('audit');
              setActiveTab('admin');
            } else {
              setActiveTab(view);
            }
          }}
          onSelectTab={setActiveTab}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onCloseMobile={() => setIsSidebarOpen(false)}
          currentUserRole={currentUser.role}
          userRole={currentUser.role}
          favCount={stats?.soal_favorit || 0}
          totalSoalCount={stats?.total_soal || 0}
          onOpenUpload={() => setIsUploadOpen(true)}
        />

        {/* Content View Canvas */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* View 1: Home Dashboard */}
            {activeTab === 'dashboard' && (
              <HomeDashboardView
                stats={stats}
                searchQuery={globalSearch}
                onSearchChange={setGlobalSearch}
                onSearchSubmit={handleGlobalSearchSubmit}
                onSelectMapel={handleSelectMapelFromHome}
                onPreviewSoal={(soal) => setPreviewSoal(soal)}
                onToggleFavorite={handleToggleFavorite}
                onNavigateAll={() => {
                  setActiveFilters({});
                  setActiveTab('bank-soal');
                }}
                onOpenUpload={() => setIsUploadOpen(true)}
              />
            )}

            {/* View 2: All Bank Soal Directory */}
            {activeTab === 'bank-soal' && (
              <BankSoalListView
                key={JSON.stringify(activeFilters)}
                initialFilters={activeFilters}
                currentUser={currentUser}
                onPreview={(soal) => setPreviewSoal(soal)}
                onEdit={(soal) => setEditingSoal(soal)}
                onDelete={handleDeleteSoal}
                onToggleFavorite={handleToggleFavorite}
                onOpenUpload={() => setIsUploadOpen(true)}
              />
            )}

            {/* View 3: Categories & Organization Explorer */}
            {activeTab.startsWith('kategori-') && (
              <CategoriesExplorerView
                activeSection={activeTab.replace('kategori-', '') as any}
                onSelectFilter={handleCategoryFilterSelect}
                tagsList={tagsList}
              />
            )}

            {/* View 4: Favorites */}
            {activeTab === 'favorit' && (
              <FavoritesView
                currentUser={currentUser}
                onPreview={(soal) => setPreviewSoal(soal)}
                onToggleFavorite={handleToggleFavorite}
                onNavigateAll={() => {
                  setActiveFilters({});
                  setActiveTab('bank-soal');
                }}
              />
            )}

            {/* View 5: Activity History */}
            {activeTab === 'riwayat' && <HistoryView />}

            {/* View 6: Admin Panel */}
            {activeTab === 'admin' && (
              <AdminPanelView
                currentUser={currentUser}
                initialTab={adminInitialTab}
                onSwitchUser={(user) => {
                  setCurrentUser(user);
                  showToast(`Akun aktif: ${user.name} (${user.role})`, 'info');
                }}
                onPreviewSoal={(soal) => setPreviewSoal(soal)}
              />
            )}

            {/* View 7: Settings */}
            {activeTab === 'pengaturan' && <SettingsView />}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      {/* 0. Login / Authentication Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        currentUser={currentUser}
        availableUsers={availableUsers}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          loadGlobalData();
        }}
      />

      {/* 1. Upload Bank Soal Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={(newSoal) => {
          loadGlobalData();
          setPreviewSoal(newSoal);
          setActiveTab('bank-soal');
        }}
        currentUser={currentUser}
      />

      {/* 2. Edit Metadata Modal */}
      <EditSoalModal
        soal={editingSoal}
        onClose={() => setEditingSoal(null)}
        onSuccess={(updated) => {
          loadGlobalData();
          if (previewSoal?.id === updated.id) {
            setPreviewSoal(updated);
          }
        }}
      />

      {/* 3. Interactive PDF Viewer Modal */}
      <PdfViewerModal
        soal={previewSoal}
        onClose={() => setPreviewSoal(null)}
        onToggleFavorite={handleToggleFavorite}
        onEdit={(soal) => {
          setPreviewSoal(null);
          setEditingSoal(soal);
        }}
        onDelete={handleDeleteSoal}
        currentUser={currentUser}
      />

      {/* 4. Login with Password Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsLoginOpen(false);
          loadGlobalData();
          showToast(`Berhasil masuk sebagai ${user.name} (${user.role})`, 'success');
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
