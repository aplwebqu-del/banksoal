import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Grid,
  List,
  SlidersHorizontal,
  RotateCcw,
  FileText,
  Download,
  Eye,
  Star,
  Edit,
  Trash2,
  Calendar,
  Layers,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Sparkles,
  Tag,
  Plus,
  BookOpen,
} from 'lucide-react';
import { BankSoal, FilterParams, User } from '../types';
import { api } from '../lib/api';
import { formatBytes, formatDate, getDifficultyColor, getSubjectColor } from '../lib/utils';
import { useToast } from '../components/Toast';

interface BankSoalListViewProps {
  initialFilters?: FilterParams;
  currentUser: User;
  onPreview: (soal: BankSoal) => void;
  onEdit: (soal: BankSoal) => void;
  onDelete: (id: string, judul: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenUpload: () => void;
}

export const BankSoalListView: React.FC<BankSoalListViewProps> = ({
  initialFilters,
  currentUser,
  onPreview,
  onEdit,
  onDelete,
  onToggleFavorite,
  onOpenUpload,
}) => {
  const { showToast } = useToast();

  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [loading, setLoading] = useState(false);

  // Filters State
  const [filters, setFilters] = useState<FilterParams>({
    search: initialFilters?.search || '',
    mata_pelajaran: initialFilters?.mata_pelajaran || '',
    jenjang: initialFilters?.jenjang || '',
    kelas: initialFilters?.kelas || '',
    tahun: initialFilters?.tahun || '',
    semester: initialFilters?.semester || '',
    tingkat_kesulitan: initialFilters?.tingkat_kesulitan || '',
    jenis_soal: initialFilters?.jenis_soal || '',
    tag: initialFilters?.tag || '',
    is_favorite: initialFilters?.is_favorite,
    sortBy: 'terbaru',
    page: 1,
    limit: 12,
  });

  const [data, setData] = useState<{
    items: BankSoal[];
    total: number;
    page: number;
    totalPages: number;
  }>({
    items: [],
    total: 0,
    page: 1,
    totalPages: 1,
  });

  const [availableTags, setAvailableTags] = useState<{ tag: string; count: number }[]>([]);

  // Fetch available tags once
  useEffect(() => {
    api.getTags().then((res) => setAvailableTags(res.tags)).catch(() => {});
  }, []);

  // Fetch bank soal whenever filters change
  useEffect(() => {
    loadBankSoal();
  }, [filters]);

  const loadBankSoal = async () => {
    setLoading(true);
    try {
      const res = await api.getBankSoal(filters);
      setData(res);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat bank soal', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof FilterParams, val: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: val,
      page: 1, // Reset page on filter change
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      mata_pelajaran: '',
      jenjang: '',
      kelas: '',
      tahun: '',
      semester: '',
      tingkat_kesulitan: '',
      jenis_soal: '',
      tag: '',
      is_favorite: undefined,
      sortBy: 'terbaru',
      page: 1,
      limit: 12,
    });
  };

  const activeFilterCount = [
    filters.mata_pelajaran,
    filters.jenjang,
    filters.kelas,
    filters.tahun,
    filters.semester,
    filters.tingkat_kesulitan,
    filters.jenis_soal,
    filters.tag,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400" />
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Cari judul, materi, topik, kelas, tahun, atau kata kunci..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={() => setShowFilterDrawer(!showFilterDrawer)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                showFilterDrawer || activeFilterCount > 0
                  ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filter Lanjutan</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* View Switcher Card / Table */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setViewMode('card')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'card'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Tampilan Card"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Tampilan Tabel"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Advanced Filters Drawer */}
        {showFilterDrawer && (
          <div className="pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs animate-in fade-in duration-150">
            {/* Mapel */}
            <div>
              <label className="font-semibold text-slate-400 mb-1 block">Mata Pelajaran</label>
              <select
                value={filters.mata_pelajaran || ''}
                onChange={(e) => handleFilterChange('mata_pelajaran', e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Semua Mapel</option>
                <option value="Matematika">Matematika</option>
                <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                <option value="Bahasa Inggris">Bahasa Inggris</option>
                <option value="IPA">IPA</option>
                <option value="IPS">IPS</option>
                <option value="Fisika">Fisika</option>
                <option value="Kimia">Kimia</option>
                <option value="Biologi">Biologi</option>
                <option value="Informatika">Informatika</option>
                <option value="Ekonomi">Ekonomi</option>
                <option value="Sejarah">Sejarah</option>
                <option value="Geografi">Geografi</option>
              </select>
            </div>

            {/* Jenjang */}
            <div>
              <label className="font-semibold text-slate-400 mb-1 block">Jenjang</label>
              <select
                value={filters.jenjang || ''}
                onChange={(e) => handleFilterChange('jenjang', e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Semua Jenjang</option>
                <option value="SD">SD</option>
                <option value="SMP">SMP</option>
                <option value="SMA">SMA</option>
                <option value="SMK">SMK</option>
              </select>
            </div>

            {/* Kelas */}
            <div>
              <label className="font-semibold text-slate-400 mb-1 block">Kelas</label>
              <select
                value={filters.kelas || ''}
                onChange={(e) => handleFilterChange('kelas', e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Semua Kelas</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((k) => (
                  <option key={k} value={String(k)}>
                    Kelas {k}
                  </option>
                ))}
              </select>
            </div>

            {/* Tingkat Kesulitan */}
            <div>
              <label className="font-semibold text-slate-400 mb-1 block">Tingkat Kesulitan</label>
              <select
                value={filters.tingkat_kesulitan || ''}
                onChange={(e) => handleFilterChange('tingkat_kesulitan', e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Semua Tingkat</option>
                <option value="Mudah">Mudah</option>
                <option value="Sedang">Sedang</option>
                <option value="Sulit">Sulit / HOTS</option>
              </select>
            </div>

            {/* Jenis Soal */}
            <div>
              <label className="font-semibold text-slate-400 mb-1 block">Jenis / Format Soal</label>
              <select
                value={filters.jenis_soal || ''}
                onChange={(e) => handleFilterChange('jenis_soal', e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Semua Jenis</option>
                <option value="Pilihan Ganda">Pilihan Ganda</option>
                <option value="Essay">Essay</option>
                <option value="HOTS">HOTS</option>
                <option value="AKM">AKM</option>
                <option value="SNBT">SNBT / UTBK</option>
                <option value="Tryout">Tryout</option>
                <option value="PAS">PAS</option>
                <option value="PAT">PAT</option>
                <option value="PTS">PTS</option>
              </select>
            </div>

            {/* Tahun */}
            <div>
              <label className="font-semibold text-slate-400 mb-1 block">Tahun Soal</label>
              <select
                value={filters.tahun || ''}
                onChange={(e) => handleFilterChange('tahun', e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Semua Tahun</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>
            </div>

            {/* Reset Button */}
            <div className="col-span-full flex items-center justify-between pt-2">
              <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-400">
                <span>Tag Populer:</span>
                {availableTags.slice(0, 5).map((t) => (
                  <button
                    key={t.tag}
                    onClick={() => handleFilterChange('tag', t.tag)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                  >
                    {t.tag}
                  </button>
                ))}
              </div>
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Semua Filter</span>
              </button>
            </div>
          </div>
        )}

        {/* Results Header: Count & Sorting */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-xs text-slate-400 border-t border-slate-800/80">
          <div>
            Menampilkan <span className="font-bold text-white">{data.items.length}</span> dari{' '}
            <span className="font-bold text-white">{data.total}</span> bank soal
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="shrink-0">Urutkan:</span>
            <select
              value={filters.sortBy || 'terbaru'}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:ring-1 focus:ring-blue-500"
            >
              <option value="terbaru">Terbaru Diunggah</option>
              <option value="terlama">Terlama Diunggah</option>
              <option value="a-z">Judul (A - Z)</option>
              <option value="z-a">Judul (Z - A)</option>
              <option value="download_count">Paling Banyak Diunduh</option>
              <option value="view_count">Paling Banyak Dilihat</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area: Cards vs Table */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs">Memuat daftar bank soal...</p>
        </div>
      ) : data.items.length === 0 ? (
        /* Empty State */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="font-mono text-2xl text-slate-500 font-bold">[]</div>
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">Tidak Menemukan Soal yang Sesuai</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Tidak ada dokumen yang cocok dengan kata kunci atau kombinasi filter Anda saat ini di penyimpanan Google Drive.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            <button
              onClick={handleResetFilters}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
            >
              Reset Filter Pencarian
            </button>
            <button
              onClick={onOpenUpload}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30"
            >
              Upload PDF Soal Baru
            </button>
          </div>
        </div>
      ) : viewMode === 'card' ? (
        /* CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.items.map((soal) => {
            const diffColor = getDifficultyColor(soal.tingkat_kesulitan);
            const canEdit = currentUser.role === 'ADMIN' || currentUser.id === soal.uploaded_by;

            return (
              <div
                key={soal.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all hover:shadow-2xl hover:scale-[1.01] group relative"
              >
                <div>
                  {/* Card Header: Subject badge, Class, and Favorite button */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {soal.mata_pelajaran}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {soal.jenjang} • Kelas {soal.kelas}
                      </span>
                    </div>

                    <button
                      onClick={() => onToggleFavorite(soal.id)}
                      className={`p-1.5 rounded-lg border transition-all ${
                        soal.is_favorite
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                      title={soal.is_favorite ? 'Hapus dari Favorit' : 'Tambah ke Favorit'}
                    >
                      <Star className={`w-4 h-4 ${soal.is_favorite ? 'fill-amber-400' : ''}`} />
                    </button>
                  </div>

                  {/* Title & Clickable trigger */}
                  <h3
                    onClick={() => onPreview(soal)}
                    className="font-bold text-white text-base leading-snug group-hover:text-blue-400 transition-colors cursor-pointer line-clamp-2"
                  >
                    {soal.judul}
                  </h3>

                  {/* Chapter & Topic */}
                  <div className="mt-2.5 text-xs text-slate-400 space-y-1">
                    <p className="truncate">
                      <span className="text-slate-500">Bab:</span> {soal.bab}
                    </p>
                    <p className="truncate">
                      <span className="text-slate-500">Topik:</span> {soal.topik}
                    </p>
                  </div>

                  {/* Badges: Difficulty, Year, Question format */}
                  <div className="flex flex-wrap gap-1.5 mt-3 text-[11px]">
                    <span
                      className={`px-2 py-0.5 rounded-md border font-semibold ${diffColor.bg} ${diffColor.text} ${diffColor.border}`}
                    >
                      {soal.tingkat_kesulitan}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      {soal.jenis_soal}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      Tahun {soal.tahun}
                    </span>
                    {soal.version > 1 && (
                      <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                        v{soal.version}
                      </span>
                    )}
                  </div>

                  {/* Tags */}
                  {soal.tags && soal.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {soal.tags.slice(0, 3).map((t, i) => (
                        <span
                          key={i}
                          onClick={() => handleFilterChange('tag', t)}
                          className="text-[10px] text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800 cursor-pointer hover:text-blue-300"
                        >
                          {t}
                        </span>
                      ))}
                      {soal.tags.length > 3 && (
                        <span className="text-[10px] text-slate-500 self-center">
                          +{soal.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer: Metadata & Actions */}
                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="min-w-0">
                    <div className="font-medium text-slate-300 truncate">{soal.uploaded_by_name}</div>
                    <div className="text-[10px] text-slate-400">
                      {soal.jumlah_halaman} Hlm • {formatBytes(soal.ukuran_file)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onPreview(soal)}
                      className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-semibold transition-all flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>

                    <a
                      href={`/api/bank-soal/${soal.id}/download`}
                      download={soal.nama_file}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </a>

                    {canEdit && (
                      <button
                        onClick={() => onEdit(soal)}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                        title="Edit Metadata"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}

                    {canEdit && (
                      <button
                        onClick={() => onDelete(soal.id, soal.judul)}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
                        title="Hapus Soal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[11px] font-bold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">Judul Bank Soal</th>
                  <th className="px-4 py-3.5">Mata Pelajaran</th>
                  <th className="px-3 py-3.5">Kelas</th>
                  <th className="px-3 py-3.5">Tahun</th>
                  <th className="px-3 py-3.5">Kesulitan</th>
                  <th className="px-4 py-3.5">Pengajar</th>
                  <th className="px-3 py-3.5">Upload</th>
                  <th className="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {data.items.map((soal) => {
                  const diffColor = getDifficultyColor(soal.tingkat_kesulitan);
                  const canEdit = currentUser.role === 'ADMIN' || currentUser.id === soal.uploaded_by;

                  return (
                    <tr key={soal.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3.5 font-semibold text-white max-w-xs">
                        <div
                          onClick={() => onPreview(soal)}
                          className="cursor-pointer hover:text-blue-400 truncate flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                          <span className="truncate">{soal.judul}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-normal truncate mt-0.5">
                          {soal.bab} • {formatBytes(soal.ukuran_file)}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-medium">{soal.mata_pelajaran}</td>
                      <td className="px-3 py-3.5">
                        {soal.jenjang} - {soal.kelas}
                      </td>
                      <td className="px-3 py-3.5 font-mono">{soal.tahun}</td>
                      <td className="px-3 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${diffColor.bg} ${diffColor.text} ${diffColor.border}`}
                        >
                          {soal.tingkat_kesulitan}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-300">{soal.uploaded_by_name}</td>
                      <td className="px-3 py-3.5 text-slate-400">{formatDate(soal.created_at)}</td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onPreview(soal)}
                            className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white transition-colors"
                            title="Preview Dokumen"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={`/api/bank-soal/${soal.id}/download`}
                            download={soal.nama_file}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                            title="Download PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => onToggleFavorite(soal.id)}
                            className={`p-1.5 rounded-lg ${
                              soal.is_favorite ? 'text-amber-400' : 'text-slate-500 hover:text-white'
                            }`}
                          >
                            <Star className={`w-3.5 h-3.5 ${soal.is_favorite ? 'fill-amber-400' : ''}`} />
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => onEdit(soal)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                              title="Edit"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canEdit && (
                            <button
                              onClick={() => onDelete(soal.id, soal.judul)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* Pagination Controls */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 text-xs text-slate-400">
          <div>
            Halaman <span className="font-bold text-white">{data.page}</span> dari{' '}
            <span className="font-bold text-white">{data.totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleFilterChange('page', Math.max(1, data.page - 1))}
              disabled={data.page <= 1}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => handleFilterChange('page', pageNum)}
                className={`w-8 h-8 rounded-xl font-semibold transition-all ${
                  pageNum === data.page
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => handleFilterChange('page', Math.min(data.totalPages, data.page + 1))}
              disabled={data.page >= data.totalPages}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
