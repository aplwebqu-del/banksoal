import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  GraduationCap,
  Layers,
  FileSpreadsheet,
  Calendar,
  Tag,
  ArrowRight,
  Calculator,
  Languages,
  FlaskConical,
  Atom,
  TestTubes,
  Dna,
  Binary,
  TrendingUp,
  Landmark,
  Compass,
  Music,
  Palette,
  School,
  Sparkles,
  Globe,
  Award,
  Plus,
  Pencil,
  Trash2,
  Search,
  CheckCircle2,
  FolderOpen,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { CategoryItem, StatsOverview } from '../types';
import { api } from '../lib/api';
import { CategoryCrudModal } from '../components/CategoryCrudModal';
import { useToast } from '../components/Toast';

interface CategoriesExplorerViewProps {
  activeSection: 'mapel' | 'jenjang' | 'kelas' | 'jenis' | 'tahun' | 'tags';
  onSelectFilter: (key: string, val: string) => void;
  tagsList?: { tag: string; count: number }[];
  onNavigateSection?: (section: 'mapel' | 'jenjang' | 'kelas' | 'jenis' | 'tahun' | 'tags') => void;
}

// Icon Mapping Resolver
const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Calculator,
  BookOpen,
  Languages,
  FlaskConical,
  Atom,
  TestTubes,
  Dna,
  Binary,
  TrendingUp,
  Landmark,
  Compass,
  Music,
  Palette,
  GraduationCap,
  School,
  Globe,
  Award,
  Sparkles,
  Layers,
  FileSpreadsheet,
};

const DEFAULT_MAPEL: CategoryItem[] = [
  { id: 'c-1', type: 'mata_pelajaran', name: 'Matematika', code: 'MTK', icon: 'Calculator', description: 'Aljabar, Geometri, Trigonometri, Statistika, Kalkulus', color: 'from-blue-600 to-indigo-600' },
  { id: 'c-2', type: 'mata_pelajaran', name: 'Bahasa Indonesia', code: 'BIN', icon: 'BookOpen', description: 'Literasi, Teks Eksposisi, Cerpen, Tata Bahasa, Sastra', color: 'from-rose-600 to-red-600' },
  { id: 'c-3', type: 'mata_pelajaran', name: 'Bahasa Inggris', code: 'BIG', icon: 'Languages', description: 'Reading Comprehension, Grammar, Vocabulary, AKM', color: 'from-violet-600 to-purple-600' },
  { id: 'c-4', type: 'mata_pelajaran', name: 'IPA', code: 'IPA', icon: 'FlaskConical', description: 'Sains Terpadu SMP, Alam, Ekosistem, Energi', color: 'from-teal-600 to-emerald-600' },
  { id: 'c-5', type: 'mata_pelajaran', name: 'IPS', code: 'IPS', icon: 'Globe', description: 'Ilmu Pengetahuan Sosial, Sejarah Sosial, Geografi Terpadu', color: 'from-amber-600 to-orange-600' },
  { id: 'c-6', type: 'mata_pelajaran', name: 'Fisika', code: 'FIS', icon: 'Atom', description: 'Mekanika, Gelombang, Termodinamika, Kelistrikan & Optik', color: 'from-cyan-600 to-blue-600' },
  { id: 'c-7', type: 'mata_pelajaran', name: 'Kimia', code: 'KIM', icon: 'TestTubes', description: 'Stoikiometri, Larutan Asam Basa, Ikatan Kimia, Redoks', color: 'from-pink-600 to-rose-600' },
  { id: 'c-8', type: 'mata_pelajaran', name: 'Biologi', code: 'BIO', icon: 'Dna', description: 'Struktur Sel, Genetika, Metabolisme, Keanekaragaman Hayati', color: 'from-emerald-600 to-green-600' },
  { id: 'c-9', type: 'mata_pelajaran', name: 'Informatika', code: 'INF', icon: 'Binary', description: 'Computational Thinking, Algoritma, Binary, Sistem Komputer', color: 'from-sky-600 to-indigo-600' },
  { id: 'c-10', type: 'mata_pelajaran', name: 'Ekonomi', code: 'EKO', icon: 'TrendingUp', description: 'Akuntansi, Mekanisme Pasar, Uang & Perbankan, Manajemen', color: 'from-amber-600 to-orange-600' },
  { id: 'c-11', type: 'mata_pelajaran', name: 'Sejarah', code: 'SEJ', icon: 'Landmark', description: 'Sejarah Nasional, Kolonialisme, Proklamasi & Kemerdekaan', color: 'from-stone-600 to-zinc-700' },
  { id: 'c-12', type: 'mata_pelajaran', name: 'Geografi', code: 'GEO', icon: 'Compass', description: 'Litosfer, Atmosfer, Hidrosfer, Pemetaan Wilayah GIS', color: 'from-lime-600 to-emerald-600' },
];

const DEFAULT_JENJANG: CategoryItem[] = [
  { id: 'c-20', type: 'jenjang', name: 'SD', title: 'Sekolah Dasar', description: 'Tingkat dasar Kelas 1 sampai Kelas 6', icon: 'GraduationCap', color: 'from-emerald-600 to-teal-600' },
  { id: 'c-21', type: 'jenjang', name: 'SMP', title: 'Sekolah Menengah Pertama', description: 'Tingkat menengah pertama Kelas 7 sampai Kelas 9', icon: 'GraduationCap', color: 'from-blue-600 to-indigo-600' },
  { id: 'c-22', type: 'jenjang', name: 'SMA', title: 'Sekolah Menengah Atas', description: 'Tingkat atas Kelas 10 sampai Kelas 12 (MIPA, IPS, Bahasa)', icon: 'GraduationCap', color: 'from-purple-600 to-violet-600' },
  { id: 'c-23', type: 'jenjang', name: 'SMK', title: 'Sekolah Menengah Kejuruan', description: 'Pendidikan Vokasi & Keahlian Terapan Kelas 10-12', icon: 'GraduationCap', color: 'from-amber-600 to-orange-600' },
];

export const CategoriesExplorerView: React.FC<CategoriesExplorerViewProps> = ({
  activeSection,
  onSelectFilter,
  tagsList = [],
  onNavigateSection,
}) => {
  const { showToast } = useToast();

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // CRUD Modal State
  const [isCrudModalOpen, setIsCrudModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [crudDefaultType, setCrudDefaultType] = useState<'mata_pelajaran' | 'jenjang' | 'jenis_soal'>('mata_pelajaran');

  // Delete Confirmation State
  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [catsRes, statsRes] = await Promise.all([
        api.getCategories(),
        api.getStats().catch(() => null),
      ]);

      if (catsRes && catsRes.categories && catsRes.categories.length > 0) {
        setCategories(catsRes.categories);
      } else {
        setCategories([...DEFAULT_MAPEL, ...DEFAULT_JENJANG]);
      }
      if (statsRes) setStats(statsRes);
    } catch (err: any) {
      console.warn('Using default categories:', err);
      setCategories([...DEFAULT_MAPEL, ...DEFAULT_JENJANG]);
    } finally {
      setLoading(false);
    }
  };

  // Filter categories by type and search
  const currentType = activeSection === 'mapel' ? 'mata_pelajaran' : activeSection === 'jenjang' ? 'jenjang' : activeSection === 'jenis' ? 'jenis_soal' : '';
  
  const filteredCategories = categories.filter((c) => {
    if (currentType && c.type !== currentType) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.code && c.code.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q)) ||
      (c.title && c.title.toLowerCase().includes(q))
    );
  });

  // Count helper
  const getSoalCountForMapel = (mapelName: string) => {
    if (!stats || !stats.by_mapel) return 0;
    const found = stats.by_mapel.find((m) => m.name.toLowerCase() === mapelName.toLowerCase());
    return found ? found.count : 0;
  };

  const getSoalCountForJenjang = (jenjangName: string) => {
    if (!stats || !stats.by_jenjang) return 0;
    const found = stats.by_jenjang.find((j) => j.name.toLowerCase() === jenjangName.toLowerCase());
    return found ? found.count : 0;
  };

  // CRUD Actions
  const handleOpenCreate = (type: 'mata_pelajaran' | 'jenjang' | 'jenis_soal') => {
    setEditingCategory(null);
    setCrudDefaultType(type);
    setIsCrudModalOpen(true);
  };

  const handleOpenEdit = (cat: CategoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategory(cat);
    setCrudDefaultType((cat.type as any) || 'mata_pelajaran');
    setIsCrudModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    setIsDeleting(true);
    try {
      await api.deleteCategory(deletingCategory.id);
      showToast(`Kategori "${deletingCategory.name}" berhasil dihapus.`, 'success');
      setCategories((prev) => prev.filter((c) => c.id !== deletingCategory.id));
      setDeletingCategory(null);
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus kategori', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleModalSuccess = (savedCat: CategoryItem, isNew: boolean) => {
    if (isNew) {
      setCategories((prev) => [...prev, savedCat]);
    } else {
      setCategories((prev) => prev.map((c) => (c.id === savedCat.id ? savedCat : c)));
    }
  };

  // Static items for other sections
  const kelasList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const tahunList = [2026, 2025, 2024, 2023, 2022, 2021];
  const jenisUjianList = [
    { name: 'Pilihan Ganda', desc: 'Format objektif 4-5 opsi pilihan', badge: 'Standar' },
    { name: 'Essay', desc: 'Format uraian analisis dan pembahasan lengkap', badge: 'Uraian' },
    { name: 'Campuran', desc: 'Kombinasi Pilihan Ganda dan Uraian Essay', badge: 'Komprehensif' },
    { name: 'HOTS', desc: 'Higher Order Thinking Skills (Penalaran Kritis)', badge: 'Penalaran' },
    { name: 'AKM', desc: 'Asesmen Kompetensi Minimum (Literasi & Numerasi)', badge: 'Nasional' },
    { name: 'SNBT', desc: 'Persiapan Seleksi Nasional Masuk PTN / UTBK', badge: 'PTN' },
    { name: 'Tryout', desc: 'Simulasi ujian berkala dan evaluasi belajar', badge: 'Simulasi' },
    { name: 'PAS', desc: 'Penilaian Akhir Semester Ganjil', badge: 'Semester 1' },
    { name: 'PAT', desc: 'Penilaian Akhir Tahun Semester Genap', badge: 'Semester 2' },
    { name: 'PTS', desc: 'Penilaian Tengah Semester', badge: 'Mid Term' },
    { name: 'Ujian Sekolah', desc: 'Ujian komprehensif kelulusan akhir sekolah', badge: 'Kelulusan' },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* View Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            {activeSection === 'mapel' && <BookOpen className="w-6 h-6 text-blue-400" />}
            {activeSection === 'jenjang' && <GraduationCap className="w-6 h-6 text-amber-400" />}
            {activeSection === 'kelas' && <Layers className="w-6 h-6 text-purple-400" />}
            {activeSection === 'jenis' && <FileSpreadsheet className="w-6 h-6 text-teal-400" />}
            {activeSection === 'tahun' && <Calendar className="w-6 h-6 text-blue-400" />}
            {activeSection === 'tags' && <Tag className="w-6 h-6 text-pink-400" />}
            <h2 className="text-xl font-bold text-white tracking-tight">
              {activeSection === 'mapel' && 'Kategori Mata Pelajaran'}
              {activeSection === 'jenjang' && 'Klasifikasi Jenjang Pendidikan'}
              {activeSection === 'kelas' && 'Tingkat Kelas (Grade 1 - 12)'}
              {activeSection === 'jenis' && 'Jenis & Format Naskah Ujian'}
              {activeSection === 'tahun' && 'Arsip Tahun Ajaran'}
              {activeSection === 'tags' && 'Kumpulan Tags Populer'}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {activeSection === 'mapel'
              ? 'Kelola master mata pelajaran (CRUD), kode kurikulum, dan jelajahi arsip soal per bidang studi.'
              : activeSection === 'jenjang'
              ? 'Kelola master tingkatan jenjang sekolah (CRUD) dari SD, SMP, SMA, SMK hingga Madrasah.'
              : 'Pilih klasifikasi untuk membuka dan menyaring seluruh bank soal secara instan.'}
          </p>
        </div>

        {/* Action Button for CRUD on Mapel & Jenjang */}
        <div className="flex items-center gap-2.5">
          {activeSection === 'mapel' && (
            <button
              onClick={() => handleOpenCreate('mata_pelajaran')}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Mata Pelajaran</span>
            </button>
          )}

          {activeSection === 'jenjang' && (
            <button
              onClick={() => handleOpenCreate('jenjang')}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-md shadow-amber-600/20 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Jenjang Pendidikan</span>
            </button>
          )}

          {activeSection === 'jenis' && (
            <button
              onClick={() => handleOpenCreate('jenis_soal')}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-md shadow-teal-600/20 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Format Soal</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Search & Filter Toolbar for Mapel and Jenjang */}
      {(activeSection === 'mapel' || activeSection === 'jenjang') && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={`Cari ${activeSection === 'mapel' ? 'mata pelajaran...' : 'jenjang...'}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end text-xs text-slate-400">
            <span>
              Menampilkan <b className="text-white">{filteredCategories.length}</b>{' '}
              {activeSection === 'mapel' ? 'Mata Pelajaran' : 'Jenjang'}
            </span>
            <button
              onClick={loadData}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Segarkan Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. MATA PELAJARAN (CRUD ENABLED) */}
      {/* ========================================================= */}
      {activeSection === 'mapel' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((m) => {
            const IconComp = (m.icon && ICON_MAP[m.icon]) || BookOpen;
            const count = getSoalCountForMapel(m.name);
            const colorGrad = m.color || 'from-blue-600 to-indigo-600';

            return (
              <div
                key={m.id}
                onClick={() => onSelectFilter('mata_pelajaran', m.name)}
                className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 p-5 rounded-2xl shadow-md cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between group relative"
              >
                <div>
                  {/* Top Bar: Icon, Code Badge & CRUD Action Controls */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorGrad} flex items-center justify-center text-white shadow-lg shrink-0`}>
                        <IconComp className="w-6 h-6" />
                      </div>
                      <div>
                        {m.code && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 inline-block mb-1">
                            {m.code}
                          </span>
                        )}
                        <h3 className="font-bold text-white text-base group-hover:text-blue-400 transition-colors leading-tight">
                          {m.name}
                        </h3>
                      </div>
                    </div>

                    {/* Action buttons: Edit & Delete */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleOpenEdit(m, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all"
                        title="Ubah / Edit Mata Pelajaran"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingCategory(m);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                        title="Hapus Mata Pelajaran"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-400 mt-3 leading-relaxed line-clamp-2">
                    {m.description || 'Kumpulan naskah soal, lembar latihan, dan bank soal.'}
                  </p>
                </div>

                {/* Footer stats & Quick Open */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
                    <span><strong className="text-white">{count}</strong> Naskah Soal</span>
                  </span>
                  <div className="flex items-center gap-1 text-blue-400 font-semibold group-hover:translate-x-1 transition-transform">
                    <span>Buka Soal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Quick Add Card */}
          <div
            onClick={() => handleOpenCreate('mata_pelajaran')}
            className="border-2 border-dashed border-slate-800 hover:border-blue-500/60 bg-slate-900/40 hover:bg-blue-600/5 p-5 rounded-2xl cursor-pointer transition-all flex flex-col items-center justify-center text-center group min-h-[170px]"
          >
            <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-blue-600 text-slate-400 group-hover:text-white flex items-center justify-center transition-colors mb-2">
              <Plus className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-300 group-hover:text-white">
              Tambah Mata Pelajaran Baru
            </h4>
            <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
              Klik untuk menambahkan kurikulum atau bidang studi baru
            </p>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. JENJANG PENDIDIKAN (CRUD ENABLED) */}
      {/* ========================================================= */}
      {activeSection === 'jenjang' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredCategories.map((j) => {
            const IconComp = (j.icon && ICON_MAP[j.icon]) || GraduationCap;
            const count = getSoalCountForJenjang(j.name);
            const colorGrad = j.color || 'from-amber-600 to-orange-600';

            return (
              <div
                key={j.id}
                onClick={() => onSelectFilter('jenjang', j.name)}
                className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-6 rounded-2xl shadow-md cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colorGrad} flex items-center justify-center text-white shadow-lg shrink-0`}>
                        <IconComp className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black text-white tracking-tight">{j.name}</span>
                          {j.code && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {j.code}
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-slate-200 text-sm mt-0.5">
                          {j.title || j.description || `Jenjang ${j.name}`}
                        </h3>
                      </div>
                    </div>

                    {/* Edit & Delete Controls */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleOpenEdit(j, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all"
                        title="Ubah / Edit Jenjang"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingCategory(j);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                        title="Hapus Jenjang"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                    {j.description || 'Kumpulan berkas bank soal dan arsip ujian.'}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span><strong className="text-white">{count}</strong> Bank Soal</span>
                  </span>
                  <div className="flex items-center gap-1 text-amber-400 font-semibold group-hover:translate-x-1 transition-transform">
                    <span>Lihat Semua Soal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Quick Add Jenjang Card */}
          <div
            onClick={() => handleOpenCreate('jenjang')}
            className="border-2 border-dashed border-slate-800 hover:border-amber-500/60 bg-slate-900/40 hover:bg-amber-600/5 p-6 rounded-2xl cursor-pointer transition-all flex flex-col items-center justify-center text-center group min-h-[160px]"
          >
            <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-amber-600 text-slate-400 group-hover:text-white flex items-center justify-center transition-colors mb-2">
              <Plus className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-300 group-hover:text-white">
              Tambah Jenjang Pendidikan Baru
            </h4>
            <p className="text-[11px] text-slate-500 mt-1 max-w-[240px]">
              Contoh: MI (Madrasah Ibtidaiyah), MTs, MA, atau Vokasi Khusus
            </p>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. KELAS */}
      {/* ========================================================= */}
      {activeSection === 'kelas' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {kelasList.map((k) => (
            <div
              key={k}
              onClick={() => onSelectFilter('kelas', String(k))}
              className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 p-4 rounded-2xl text-center cursor-pointer transition-all hover:scale-105 group"
            >
              <div className="text-2xl font-black text-white group-hover:text-purple-400 transition-colors">
                {k}
              </div>
              <div className="text-xs font-semibold text-slate-300 mt-1">Kelas {k}</div>
              <span className="text-[10px] text-slate-500 mt-0.5 inline-block">
                {k <= 6 ? 'SD' : k <= 9 ? 'SMP' : 'SMA/SMK'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. JENIS UJIAN */}
      {/* ========================================================= */}
      {activeSection === 'jenis' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {jenisUjianList.map((u) => (
            <div
              key={u.name}
              onClick={() => onSelectFilter('jenis_soal', u.name)}
              className="bg-slate-900 border border-slate-800 hover:border-teal-500/50 p-5 rounded-2xl cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    {u.badge}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-teal-400 transition-colors" />
                </div>
                <h3 className="font-bold text-white text-base group-hover:text-teal-400 transition-colors">
                  {u.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1">{u.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. TAHUN */}
      {/* ========================================================= */}
      {activeSection === 'tahun' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {tahunList.map((t) => (
            <div
              key={t}
              onClick={() => onSelectFilter('tahun', String(t))}
              className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 p-6 rounded-2xl text-center cursor-pointer transition-all hover:scale-105 group"
            >
              <div className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors">
                {t}
              </div>
              <div className="text-xs text-slate-400 mt-1">Tahun Ajaran {t}</div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. TAGS */}
      {/* ========================================================= */}
      {activeSection === 'tags' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="flex flex-wrap gap-2">
            {tagsList.map((t) => (
              <button
                key={t.tag}
                onClick={() => onSelectFilter('tag', t.tag)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-blue-600/20 text-slate-200 hover:text-blue-300 border border-slate-700 hover:border-blue-500/40 text-xs font-medium transition-all"
              >
                <span>{t.tag}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-900 text-slate-400 font-mono">
                  {t.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CRUD Modal (Create / Edit) */}
      <CategoryCrudModal
        isOpen={isCrudModalOpen}
        onClose={() => {
          setIsCrudModalOpen(false);
          setEditingCategory(null);
        }}
        category={editingCategory}
        defaultType={crudDefaultType}
        onSuccess={handleModalSuccess}
      />

      {/* Delete Confirmation Modal */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">
              Hapus Kategori "{deletingCategory.name}"?
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Kategori master ini akan dihapus dari daftar sistem. File bank soal yang sudah terkait tidak akan hilang namun tidak lagi menggunakan referensi kategori ini.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingCategory(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <span>Hapus Kategori</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
