import React from 'react';
import {
  Search,
  BookOpen,
  FileText,
  Download,
  Star,
  HardDrive,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Eye,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { BankSoal, StatsOverview } from '../types';
import { formatBytes, formatDate, getDifficultyColor } from '../lib/utils';

interface HomeDashboardViewProps {
  stats: StatsOverview | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: (q: string) => void;
  onSelectMapel: (mapel: string) => void;
  onPreviewSoal: (soal: BankSoal) => void;
  onToggleFavorite: (id: string) => void;
  onNavigateAll: () => void;
  onOpenUpload: () => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f43f5e'];

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({
  stats,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onSelectMapel,
  onPreviewSoal,
  onToggleFavorite,
  onNavigateAll,
  onOpenUpload,
}) => {
  const quickSubjects = [
    'Semua',
    'Matematika',
    'Bahasa Indonesia',
    'Bahasa Inggris',
    'IPA',
    'IPS',
    'Fisika',
    'Kimia',
    'Biologi',
    'Informatika',
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearchSubmit(searchQuery);
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-200">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 p-6 md:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Pusat Repositori Digital Pengajar</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Temukan Bank Soal Anda <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
              Dalam Hitungan Detik
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Simpan, kelola, dan temukan kembali seluruh soal PDF pengajar yang tersebar di laptop, WhatsApp, Drive, dan flashdisk dalam satu database terpadu.
          </p>

          {/* Prominent Search Bar */}
          <div className="pt-2">
            <div className="relative max-w-2xl mx-auto flex items-center shadow-2xl">
              <Search className="absolute left-4 w-5 h-5 text-blue-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Cari judul, materi, topik, kelas, tahun, atau kata kunci..."
                className="w-full pl-12 pr-28 py-3.5 text-sm sm:text-base bg-slate-900/90 hover:bg-slate-900 focus:bg-slate-900 border-2 border-slate-700 focus:border-blue-500 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all backdrop-blur-md"
              />
              <button
                onClick={() => onSearchSubmit(searchQuery)}
                className="absolute right-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-600/30 transition-all"
              >
                Cari Soal
              </button>
            </div>
          </div>

          {/* Quick Filter Subject Pills */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-3">
            {quickSubjects.map((sub) => (
              <button
                key={sub}
                onClick={() => onSelectMapel(sub)}
                className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800/80 hover:bg-blue-600/30 text-slate-300 hover:text-white border border-slate-700/80 hover:border-blue-500/40 transition-all shadow-sm"
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metric Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Total Bank Soal</span>
              <FileText className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white mt-2">{stats.total_soal}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">{stats.total_pdf} Berkas PDF</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Bulan Ini</span>
              <Calendar className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-2">
              +{stats.soal_bulan_ini}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Soal Baru Terverifikasi</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Mata Pelajaran</span>
              <BookOpen className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-purple-400 mt-2">
              {stats.total_mata_pelajaran}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Semua Jenjang SD-SMA</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Soal Favorit</span>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400/30" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 mt-2">
              {stats.soal_favorit}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Ditandai Guru</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Total Diunduh</span>
              <Download className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-teal-400 mt-2">
              {stats.total_download}x
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{stats.total_views}x Dilihat</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Storage Terpakai</span>
              <HardDrive className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-400 mt-2">
              {formatBytes(stats.total_storage_bytes)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Tersimpan Aman</p>
          </div>
        </div>
      )}

      {/* Analytics Visual Charts Grid */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: Bank Soal Berdasarkan Mata Pelajaran */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <span>Distribusi Bank Soal per Mata Pelajaran</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Jumlah dokumen soal terdaftar di repositori menurut bidang studi
                </p>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.by_mapel} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [`${value} Dokumen`, 'Jumlah Soal']}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Bank Soal Berdasarkan Tingkat Kesulitan */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>Tingkat Kesulitan Soal</span>
              </h3>
              <p className="text-xs text-slate-400">Komposisi Mudah, Sedang, dan HOTS/Sulit</p>
            </div>

            <div className="h-48 w-full my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.by_kesulitan}
                    dataKey="count"
                    nameKey="level"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                  >
                    {stats.by_kesulitan.map((entry, index) => {
                      let color = '#f59e0b';
                      if (entry.level === 'Mudah') color = '#10b981';
                      if (entry.level === 'Sulit') color = '#ef4444';
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-300">Mudah</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-300">Sedang</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-slate-300">Sulit/HOTS</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Two Columns: Bank Soal Terbaru & Bank Soal Terpopuler */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Terbaru */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">Bank Soal Terbaru</h3>
              </div>
              <button
                onClick={onNavigateAll}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {stats.recent_uploads.map((soal) => {
                const diffColor = getDifficultyColor(soal.tingkat_kesulitan);
                return (
                  <div
                    key={soal.id}
                    onClick={() => onPreviewSoal(soal)}
                    className="p-3.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-blue-600/10 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                          {soal.judul}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span>{soal.mata_pelajaran}</span>
                          <span>•</span>
                          <span>Kelas {soal.kelas} ({soal.jenjang})</span>
                          <span>•</span>
                          <span>{formatDate(soal.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${diffColor.bg} ${diffColor.text} ${diffColor.border}`}
                      >
                        {soal.tingkat_kesulitan}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Terpopuler / Paling Banyak Digunakan */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-white text-base">Paling Sering Digunakan & Diunduh</h3>
              </div>
              <button
                onClick={onNavigateAll}
                className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold"
              >
                <span>Eksplorasi</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {stats.top_downloaded.map((soal, idx) => (
                <div
                  key={soal.id}
                  onClick={() => onPreviewSoal(soal)}
                  className="p-3.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center shrink-0 border border-slate-700">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-teal-400 transition-colors">
                        {soal.judul}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>{soal.mata_pelajaran}</span>
                        <span>•</span>
                        <span>Oleh {soal.uploaded_by_name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 shrink-0">
                    <div className="flex items-center gap-1 text-teal-400 font-semibold">
                      <Download className="w-3.5 h-3.5" />
                      <span>{soal.download_count}x</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
