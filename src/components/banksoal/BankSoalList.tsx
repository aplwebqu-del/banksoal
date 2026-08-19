import React, { useState, useMemo } from "react";
import {
  FileText,
  Search,
  Filter,
  Grid,
  List,
  Star,
  Download,
  Eye,
  MoreVertical,
  Trash2,
  History,
  RefreshCw,
  Tag,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Edit,
} from "lucide-react";
import {
  BankSoal,
  UserProfile,
  CategoryMaster,
  TagItem,
} from "../../types";
import { AppStore } from "../../services/store";
import { StorageService } from "../../services/storageService";
import { toast } from "../ui/Toast";

interface BankSoalListProps {
  bankSoalList: BankSoal[];
  currentUser: UserProfile;
  categories: CategoryMaster[];
  tags: TagItem[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onPreview: (item: BankSoal) => void;
  onOpenUpload: () => void;
  onOpenVersionHistory: (item: BankSoal) => void;
  onEditBankSoal: (item: BankSoal) => void;
  favoritesOnly?: boolean;
}

export const BankSoalList: React.FC<BankSoalListProps> = ({
  bankSoalList,
  currentUser,
  categories,
  tags,
  searchQuery,
  onSearchChange,
  onPreview,
  onOpenUpload,
  onOpenVersionHistory,
  onEditBankSoal,
  favoritesOnly = false,
}) => {
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Filters State
  const [selectedSubject, setSelectedSubject] = useState<string>("ALL");
  const [selectedJenjang, setSelectedJenjang] = useState<string>("ALL");
  const [selectedKelas, setSelectedKelas] = useState<string>("ALL");
  const [selectedKurikulum, setSelectedKurikulum] = useState<string>("ALL");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("ALL");
  const [selectedExamType, setSelectedExamType] = useState<string>("ALL");
  const [selectedTag, setSelectedTag] = useState<string>("ALL");
  const [selectedSyncStatus, setSelectedSyncStatus] = useState<string>("ALL");
  const [selectedYear, setSelectedYear] = useState<string>("ALL");

  // Sorting and Pagination
  const [sortBy, setSortBy] = useState<"newest" | "title" | "downloads" | "views">("newest");
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Extract distinct master items
  const subjects = useMemo(() => {
    const list = categories.filter((c) => c.type === "MATA_PELAJARAN").map((c) => c.name);
    return Array.from(new Set(list));
  }, [categories]);

  // Filter & Search Logic
  const filteredList = useMemo(() => {
    return bankSoalList.filter((item) => {
      // Must be active status
      if (item.status !== "active") return false;

      // Favorites only tab check
      if (favoritesOnly && !AppStore.isFavorite(item.id, currentUser.id)) {
        return false;
      }

      // Search Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          item.title.toLowerCase().includes(q) ||
          item.file_name.toLowerCase().includes(q) ||
          item.mata_pelajaran.toLowerCase().includes(q) ||
          item.business_id.toLowerCase().includes(q) ||
          item.jenjang.toLowerCase().includes(q) ||
          item.kelas.toLowerCase().includes(q) ||
          item.kurikulum.toLowerCase().includes(q) ||
          item.bab.toLowerCase().includes(q) ||
          item.topik.toLowerCase().includes(q) ||
          (item.subtopik && item.subtopik.toLowerCase().includes(q)) ||
          item.deskripsi.toLowerCase().includes(q) ||
          item.created_by_name.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q));

        if (!matchesQuery) return false;
      }

      // Subject Filter
      if (selectedSubject !== "ALL" && item.mata_pelajaran !== selectedSubject) return false;

      // Jenjang Filter
      if (selectedJenjang !== "ALL" && item.jenjang !== selectedJenjang) return false;

      // Kelas Filter
      if (selectedKelas !== "ALL" && item.kelas !== selectedKelas) return false;

      // Kurikulum Filter
      if (selectedKurikulum !== "ALL" && item.kurikulum !== selectedKurikulum) return false;

      // Difficulty Filter
      if (selectedDifficulty !== "ALL" && item.tingkat_kesulitan !== selectedDifficulty) return false;

      // Exam Type Filter
      if (selectedExamType !== "ALL" && item.jenis_soal !== selectedExamType) return false;

      // Tag Filter
      if (selectedTag !== "ALL" && !item.tags.includes(selectedTag)) return false;

      // Sync Status Filter
      if (selectedSyncStatus !== "ALL" && item.sync_status !== selectedSyncStatus) return false;

      // Academic Year Filter
      if (selectedYear !== "ALL" && item.tahun_ajaran !== selectedYear) return false;

      return true;
    });
  }, [
    bankSoalList,
    favoritesOnly,
    currentUser.id,
    searchQuery,
    selectedSubject,
    selectedJenjang,
    selectedKelas,
    selectedKurikulum,
    selectedDifficulty,
    selectedExamType,
    selectedTag,
    selectedSyncStatus,
    selectedYear,
  ]);

  // Sort
  const sortedList = useMemo(() => {
    const arr = [...filteredList];
    switch (sortBy) {
      case "newest":
        return arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case "title":
        return arr.sort((a, b) => a.title.localeCompare(b.title));
      case "downloads":
        return arr.sort((a, b) => (b.download_count || 0) - (a.download_count || 0));
      case "views":
        return arr.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
      default:
        return arr;
    }
  }, [filteredList, sortBy]);

  // Pagination
  const totalPages = Math.ceil(sortedList.length / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedList.slice(start, start + pageSize);
  }, [sortedList, currentPage, pageSize]);

  // Handlers
  const handleToggleFavorite = (item: BankSoal, e: React.MouseEvent) => {
    e.stopPropagation();
    const isNowFav = AppStore.toggleFavorite(item.id);
    if (isNowFav) {
      toast.success("Ditambahkan ke Favorit", item.title);
    } else {
      toast.info("Dihapus dari Favorit", item.title);
    }
  };

  const handleDownload = (item: BankSoal, e: React.MouseEvent) => {
    e.stopPropagation();
    AppStore.recordDownload(item.id);
    toast.success("Mengunduh Naskah Soal", `${item.file_name} (${item.file_size_formatted})`);
    if (item.download_url) {
      window.open(item.download_url, "_blank");
    } else if (item.web_view_url) {
      window.open(item.web_view_url, "_blank");
    }
  };

  const handleDelete = (item: BankSoal, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenId(null);
    if (confirm(`Pindahkan "${item.title}" ke Keranjang Sampah?`)) {
      AppStore.moveToTrash(item.id);
      toast.warning("Dipindahkan ke Keranjang Sampah", item.business_id);
    }
  };

  const handleRetrySync = async (item: BankSoal, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpenId(null);
    toast.info("Sinkronisasi Ulang...", item.title);
    const success = await StorageService.retrySync(item);
    if (success) {
      toast.success("Sinkronisasi Berhasil", "Metadata dan status Spreadsheet diperbarui");
    } else {
      toast.error("Sinkronisasi Gagal", "Periksa konfigurasi Google Storage");
    }
  };

  const resetFilters = () => {
    setSelectedSubject("ALL");
    setSelectedJenjang("ALL");
    setSelectedKelas("ALL");
    setSelectedKurikulum("ALL");
    setSelectedDifficulty("ALL");
    setSelectedExamType("ALL");
    setSelectedTag("ALL");
    setSelectedSyncStatus("ALL");
    setSelectedYear("ALL");
    onSearchChange("");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    selectedSubject !== "ALL" ||
    selectedJenjang !== "ALL" ||
    selectedKelas !== "ALL" ||
    selectedKurikulum !== "ALL" ||
    selectedDifficulty !== "ALL" ||
    selectedExamType !== "ALL" ||
    selectedTag !== "ALL" ||
    selectedSyncStatus !== "ALL" ||
    selectedYear !== "ALL" ||
    searchQuery.trim().length > 0;

  return (
    <div id="banksoal-list-view" className="space-y-5">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              {favoritesOnly ? "Koleksi Favorit Saya" : "Bank Soal PDF"}
            </h2>
            <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {sortedList.length} Berkas
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {favoritesOnly
              ? "Daftar naskah dan arsip soal yang Anda tandai sebagai favorit"
              : "Katalog naskah soal tersimpan di Google Drive & terindeks di Spreadsheet"}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Filter Toggle Button */}
          <button
            id="filter-drawer-toggle-btn"
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              hasActiveFilters
                ? "bg-blue-600/20 border-blue-500 text-blue-300"
                : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filter</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            )}
          </button>

          {/* Sort Dropdown */}
          <select
            id="sort-by-select"
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="newest">Terbaru Diupload</option>
            <option value="title">Judul (A-Z)</option>
            <option value="downloads">Paling Banyak Diunduh</option>
            <option value="views">Paling Banyak Dilihat</option>
          </select>

          {/* Grid/Table Switcher */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl p-0.5">
            <button
              id="view-mode-grid-btn"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "grid" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
              title="Tampilan Grid"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              id="view-mode-table-btn"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "table" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
              title="Tampilan Tabel"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            id="list-upload-btn"
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02]"
          >
            + Upload PDF
          </button>
        </div>
      </div>

      {/* Filter Panel (Collapsible) */}
      {showFilterDrawer && (
        <div
          id="filter-panel"
          className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-400" />
              <h4 className="text-sm font-bold text-white">Filter Kategori & Metadata Soal</h4>
            </div>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Reset Semua Filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
            {/* Subject */}
            <div>
              <label className="block text-slate-400 font-medium mb-1">Mata Pelajaran</label>
              <select
                id="filter-subject"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">Semua Mata Pelajaran</option>
                {subjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            {/* Jenjang */}
            <div>
              <label className="block text-slate-400 font-medium mb-1">Jenjang</label>
              <select
                id="filter-jenjang"
                value={selectedJenjang}
                onChange={(e) => setSelectedJenjang(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">Semua Jenjang</option>
                <option value="SD">SD / MI</option>
                <option value="SMP">SMP / MTs</option>
                <option value="SMA">SMA / MA</option>
                <option value="SMK">SMK</option>
              </select>
            </div>

            {/* Kelas */}
            <div>
              <label className="block text-slate-400 font-medium mb-1">Tingkat Kelas</label>
              <select
                id="filter-kelas"
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">Semua Kelas (1-12)</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={String(i + 1)}>
                    Kelas {i + 1}
                  </option>
                ))}
              </select>
            </div>

            {/* Kurikulum */}
            <div>
              <label className="block text-slate-400 font-medium mb-1">Kurikulum</label>
              <select
                id="filter-kurikulum"
                value={selectedKurikulum}
                onChange={(e) => setSelectedKurikulum(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">Semua Kurikulum</option>
                <option value="Kurikulum Merdeka">Kurikulum Merdeka</option>
                <option value="Kurikulum 2013 (K13 Revisi)">Kurikulum 2013 (K13)</option>
                <option value="Cambridge International">Cambridge</option>
              </select>
            </div>

            {/* Jenis Soal */}
            <div>
              <label className="block text-slate-400 font-medium mb-1">Bentuk Soal</label>
              <select
                id="filter-exam-type"
                value={selectedExamType}
                onChange={(e) => setSelectedExamType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">Semua Bentuk Soal</option>
                <option value="Pilihan Ganda">Pilihan Ganda</option>
                <option value="Uraian / Essay">Uraian / Essay</option>
                <option value="Campuran (PG & Essay)">Campuran (PG & Essay)</option>
                <option value="AKM (Asesmen Kompetensi)">AKM (Literasi/Numerasi)</option>
                <option value="HOTS (Higher Order Thinking)">HOTS</option>
              </select>
            </div>

            {/* Tingkat Kesulitan */}
            <div>
              <label className="block text-slate-400 font-medium mb-1">Tingkat Kesulitan</label>
              <select
                id="filter-difficulty"
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">Semua Kesulitan</option>
                <option value="Mudah">Mudah</option>
                <option value="Sedang">Sedang</option>
                <option value="Sulit">Sulit</option>
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-slate-400 font-medium mb-1">Tag Khusus</label>
              <select
                id="filter-tags"
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">Semua Tag</option>
                {tags.map((t) => (
                  <option key={t.id} value={t.name}>
                    #{t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Sinkronisasi */}
            <div>
              <label className="block text-slate-400 font-medium mb-1">Status Sinkronisasi</label>
              <select
                id="filter-sync"
                value={selectedSyncStatus}
                onChange={(e) => setSelectedSyncStatus(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">Semua Status</option>
                <option value="SYNCED">SYNCED (Tersinkron)</option>
                <option value="NEEDS_SYNC">NEEDS_SYNC (Perlu Sync)</option>
                <option value="PARTIAL">PARTIAL (Sebagian)</option>
                <option value="FAILED">FAILED (Gagal)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {paginatedList.length === 0 && (
        <div
          id="banksoal-empty-state"
          className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto my-8 space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {hasActiveFilters ? "Tidak Ada Hasil yang Cocok" : "Belum Ada Bank Soal"}
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              {hasActiveFilters
                ? "Coba ubah kata kunci pencarian atau sesuaikan kombinasi filter."
                : "Upload berkas PDF soal pertama Anda untuk mulai membangun repositori dan arsip pengajar."}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            {hasActiveFilters ? (
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700"
              >
                Reset Filter
              </button>
            ) : (
              <button
                onClick={onOpenUpload}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/30"
              >
                + Upload PDF Pertama
              </button>
            )}
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && paginatedList.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedList.map((item) => {
            const isFav = AppStore.isFavorite(item.id, currentUser.id);
            const isMenuOpen = menuOpenId === item.id;

            return (
              <div
                key={item.id}
                id={`card-banksoal-${item.id}`}
                onClick={() => onPreview(item)}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group cursor-pointer relative"
              >
                <div>
                  {/* Card Header: Business ID & Favorite & Menu */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-bold bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-md">
                        {item.business_id}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          item.tingkat_kesulitan === "Sulit"
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            : item.tingkat_kesulitan === "Sedang"
                            ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        }`}
                      >
                        {item.tingkat_kesulitan}
                      </span>
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleToggleFavorite(item, e)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isFav
                            ? "text-amber-400 bg-amber-400/10 hover:bg-amber-400/20"
                            : "text-slate-400 hover:text-white hover:bg-slate-800"
                        }`}
                        title={isFav ? "Hapus dari Favorit" : "Tambah ke Favorit"}
                      >
                        <Star className={`w-4 h-4 ${isFav ? "fill-amber-400" : ""}`} />
                      </button>

                      {/* Dropdown Menu */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(isMenuOpen ? null : item.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {isMenuOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-20"
                              onClick={() => setMenuOpenId(null)}
                            />
                            <div className="absolute right-0 mt-1 w-48 bg-slate-850 border border-slate-700 rounded-xl shadow-2xl z-30 p-1 text-xs text-slate-200">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuOpenId(null);
                                  onPreview(item);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-800 rounded-lg text-left"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-400" />
                                <span>Lihat Pratinjau PDF</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuOpenId(null);
                                  onOpenVersionHistory(item);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-800 rounded-lg text-left"
                              >
                                <History className="w-3.5 h-3.5 text-purple-400" />
                                <span>Riwayat Versi (v{item.current_version_number})</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuOpenId(null);
                                  onEditBankSoal(item);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-800 rounded-lg text-left"
                              >
                                <Edit className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Edit Metadata</span>
                              </button>
                              <button
                                onClick={(e) => handleRetrySync(item, e)}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-800 rounded-lg text-left"
                              >
                                <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                                <span>Sinkronkan Ulang</span>
                              </button>
                              <div className="border-t border-slate-750 my-1" />
                              <button
                                onClick={(e) => handleDelete(item, e)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:bg-rose-950/40 rounded-lg text-left"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Ke Keranjang Sampah</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Title & Subject */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{item.mata_pelajaran}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-300">Kelas {item.kelas} ({item.jenjang})</span>
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-blue-300 line-clamp-2 leading-snug">
                      {item.title}
                    </h3>
                  </div>

                  {/* Chapter & Topic */}
                  <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                    <span className="text-slate-300 font-medium">{item.bab}</span>
                    {item.topik && <span> — {item.topik}</span>}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {item.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="text-[10px] bg-slate-800/80 text-slate-300 border border-slate-700/60 px-2 py-0.5 rounded-md"
                      >
                        #{t}
                      </span>
                    ))}
                    {item.tags.length > 3 && (
                      <span className="text-[10px] text-slate-400 self-center">
                        +{item.tags.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Footer: Metadata & Actions */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-300">{item.file_size_formatted}</span>
                    <span>•</span>
                    <span>{item.page_count} Hal</span>
                    <span>•</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        item.sync_status === "SYNCED"
                          ? "text-emerald-400 bg-emerald-500/10"
                          : "text-amber-400 bg-amber-500/10"
                      }`}
                    >
                      {item.sync_status}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleDownload(item, e)}
                      className="p-1.5 bg-slate-800 hover:bg-blue-600 hover:text-white rounded-lg text-slate-300 transition-colors"
                      title="Download PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onPreview(item)}
                      className="px-2.5 py-1 bg-blue-600/20 text-blue-300 hover:bg-blue-600 hover:text-white font-semibold rounded-lg transition-colors text-[11px]"
                    >
                      Buka Soal
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && paginatedList.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-850 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">ID & Judul Soal</th>
                  <th className="py-3.5 px-4">Mata Pelajaran</th>
                  <th className="py-3.5 px-4">Kelas & Jenjang</th>
                  <th className="py-3.5 px-4">Bentuk & Kesulitan</th>
                  <th className="py-3.5 px-4">Ukuran</th>
                  <th className="py-3.5 px-4">Sync</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {paginatedList.map((item) => {
                  const isFav = AppStore.isFavorite(item.id, currentUser.id);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => onPreview(item)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-start gap-2.5">
                          <button
                            onClick={(e) => handleToggleFavorite(item, e)}
                            className={`p-1 rounded transition-colors ${
                              isFav ? "text-amber-400" : "text-slate-500 hover:text-slate-300"
                            }`}
                          >
                            <Star className={`w-3.5 h-3.5 ${isFav ? "fill-amber-400" : ""}`} />
                          </button>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono font-bold text-blue-400">
                                {item.business_id}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                v{item.current_version_number}
                              </span>
                            </div>
                            <p className="font-semibold text-white truncate max-w-xs mt-0.5">
                              {item.title}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-200">
                        {item.mata_pelajaran}
                      </td>
                      <td className="py-3 px-4">
                        Kelas {item.kelas} ({item.jenjang})
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-300">{item.jenis_soal}</span>
                        <span className="text-slate-500 block text-[10px]">
                          {item.tingkat_kesulitan}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {item.file_size_formatted}
                        <span className="text-slate-500 block text-[10px]">{item.page_count} Hal</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            item.sync_status === "SYNCED"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {item.sync_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => handleDownload(item, e)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                            title="Download PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onPreview(item)}
                            className="px-2.5 py-1 bg-blue-600/20 text-blue-300 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-semibold transition-colors"
                          >
                            Buka
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Bar */}
      {sortedList.length > pageSize && (
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 px-4 py-3 rounded-2xl text-xs text-slate-400">
          <div>
            Menampilkan {(currentPage - 1) * pageSize + 1} -{" "}
            {Math.min(currentPage * pageSize, sortedList.length)} dari {sortedList.length} naskah
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-white">
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 disabled:opacity-40 disabled:cursor-not-allowed text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
