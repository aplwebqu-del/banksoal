import React, { useState } from "react";
import {
  FolderArchive,
  FileText,
  BookOpen,
  GraduationCap,
  HardDrive,
  CheckCircle,
  RefreshCw,
  Star,
  Download,
  Upload,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  Search,
} from "lucide-react";
import {
  BankSoal,
  StorageProfile,
  CategoryMaster,
  ActivityHistory,
  AuditLog,
  UserProfile,
} from "../../types";

interface DashboardViewProps {
  bankSoalList: BankSoal[];
  storageProfiles: StorageProfile[];
  categories: CategoryMaster[];
  activities: ActivityHistory[];
  auditLogs: AuditLog[];
  currentUser: UserProfile;
  onNavigate: (view: string) => void;
  onOpenUpload: () => void;
  onSelectBankSoal: (item: BankSoal) => void;
  onSearchChange?: (q: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  bankSoalList,
  storageProfiles,
  categories,
  activities,
  auditLogs,
  currentUser,
  onNavigate,
  onOpenUpload,
  onSelectBankSoal,
  onSearchChange,
}) => {
  const [localSearch, setLocalSearch] = useState("");

  const handleExecuteSearch = (query: string) => {
    if (onSearchChange) {
      onSearchChange(query);
    }
    onNavigate("banksoal");
  };

  const activeBankSoal = bankSoalList.filter((b) => b.status === "active");
  const totalDownloads = activeBankSoal.reduce((sum, b) => sum + (b.download_count || 0), 0);
  const activeStorage = storageProfiles.find((s) => s.is_active);
  const healthyStorages = storageProfiles.filter((s) => s.health_status === "HEALTHY").length;
  const needsSyncCount = activeBankSoal.filter(
    (b) => b.sync_status === "NEEDS_SYNC" || b.sync_status === "FAILED" || b.sync_status === "PENDING"
  ).length;

  // Subjects distribution
  const subjectCounts: { [key: string]: number } = {};
  activeBankSoal.forEach((b) => {
    subjectCounts[b.mata_pelajaran] = (subjectCounts[b.mata_pelajaran] || 0) + 1;
  });

  // Jenjang distribution
  const jenjangCounts = {
    SD: activeBankSoal.filter((b) => b.jenjang === "SD").length,
    SMP: activeBankSoal.filter((b) => b.jenjang === "SMP").length,
    SMA: activeBankSoal.filter((b) => b.jenjang === "SMA").length,
    SMK: activeBankSoal.filter((b) => b.jenjang === "SMK").length,
  };

  // Difficulty distribution
  const difficultyCounts = {
    Mudah: activeBankSoal.filter((b) => b.tingkat_kesulitan === "Mudah").length,
    Sedang: activeBankSoal.filter((b) => b.tingkat_kesulitan === "Sedang").length,
    Sulit: activeBankSoal.filter((b) => b.tingkat_kesulitan === "Sulit").length,
  };

  // Exam type distribution
  const examTypeCounts: { [key: string]: number } = {};
  activeBankSoal.forEach((b) => {
    examTypeCounts[b.jenis_soal] = (examTypeCounts[b.jenis_soal] || 0) + 1;
  });

  const recentItems = activeBankSoal.slice(0, 5);

  return (
    <div id="dashboard-view-container" className="space-y-6">
      {/* Quick Search & Discovery Hero: TEMUKAN BANK SOAL DENGAN CEPAT */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 border border-slate-800 p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-semibold mb-2">
                <Search className="w-3.5 h-3.5" />
                <span>Pencarian Cerdas & Terindeks</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase">
                TEMUKAN BANK SOAL DENGAN CEPAT
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Cari naskah ujian berdasarkan judul dokumen, mata pelajaran, jenjang, kelas, kurikulum, bab materi, atau tag ujian.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                id="dash-quick-upload-btn"
                onClick={onOpenUpload}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-95"
              >
                <Upload className="w-4 h-4" />
                <span>Upload PDF Baru</span>
              </button>
            </div>
          </div>

          {/* Search Input Box */}
          <div className="flex flex-col sm:flex-row gap-2 max-w-3xl">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                id="dash-search-input"
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleExecuteSearch(localSearch);
                  }
                }}
                placeholder="Ketik kata kunci: contoh 'Matematika Kelas 10', 'Fisika HOTS', 'PTS Semester 1'..."
                className="w-full pl-12 pr-10 py-3 bg-slate-900/90 border border-slate-700/90 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-inner"
              />
              {localSearch && (
                <button
                  onClick={() => setLocalSearch("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              id="dash-submit-search-btn"
              onClick={() => handleExecuteSearch(localSearch)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all hover:scale-[1.02] flex items-center justify-center gap-2 shrink-0"
            >
              <Search className="w-4 h-4" />
              <span>Cari Soal</span>
            </button>
          </div>

          {/* Quick Filter Tag Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-300">
            <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-400" />
              Pencarian Cepat:
            </span>
            {[
              "Matematika",
              "Bahasa Indonesia",
              "Bahasa Inggris",
              "Fisika",
              "Kimia",
              "Biologi",
              "Kelas 10",
              "Kelas 12",
              "Kurikulum Merdeka",
              "HOTS",
              "PTS / PAS",
            ].map((chip) => (
              <button
                key={chip}
                id={`dash-chip-${chip.replace(/\s+/g, "-").toLowerCase()}`}
                onClick={() => handleExecuteSearch(chip)}
                className="px-2.5 py-1 bg-slate-800/80 hover:bg-blue-600 hover:text-white text-slate-300 border border-slate-700/80 rounded-lg transition-all text-[11px] font-medium"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Bank Soal */}
        <div
          onClick={() => onNavigate("banksoal")}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Bank Soal</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FolderArchive className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">{activeBankSoal.length}</p>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">Aktif</span> di repositori
          </p>
        </div>

        {/* Card 2: Total Unduhan */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Unduhan</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">{totalDownloads}</p>
          <p className="text-[11px] text-slate-400 mt-1">Dicatat via audit log</p>
        </div>

        {/* Card 3: Storage Profile */}
        <div
          onClick={() => onNavigate("storage")}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Google Storage</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">
            {healthyStorages} / {storageProfiles.length}
          </p>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            <span>Active: {activeStorage?.name.split(" ")[0] || "Ready"}</span>
          </p>
        </div>

        {/* Card 4: Mata Pelajaran */}
        <div
          onClick={() => onNavigate("master-mapel")}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Mata Pelajaran</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">
            {Object.keys(subjectCounts).length}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Kategori terdata</p>
        </div>

        {/* Card 5: Sync Status */}
        <div
          onClick={() => onNavigate("storage")}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Status Sinkronisasi</span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                needsSyncCount > 0 ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"
              }`}
            >
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">
            {needsSyncCount === 0 ? "100%" : `${activeBankSoal.length - needsSyncCount}/${activeBankSoal.length}`}
          </p>
          <p
            className={`text-[11px] mt-1 ${
              needsSyncCount > 0 ? "text-amber-400 font-semibold" : "text-emerald-400"
            }`}
          >
            {needsSyncCount > 0 ? `${needsSyncCount} perlu sync` : "Semua terindeks"}
          </p>
        </div>
      </div>

      {/* Main Content Grid: Charts & Recent Files */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Distribution & Analytics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Distribution by Subject */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Distribusi Mata Pelajaran</h3>
                <p className="text-xs text-slate-400">Jumlah arsip soal berdasarkan mata pelajaran</p>
              </div>
              <button
                onClick={() => onNavigate("master-mapel")}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
              >
                Lihat Semua <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(subjectCounts).length > 0 ? (
                Object.entries(subjectCounts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 6)
                  .map(([subject, count]) => {
                    const percentage = Math.round((count / activeBankSoal.length) * 100) || 0;
                    return (
                      <div
                        key={subject}
                        onClick={() => onNavigate("banksoal")}
                        className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition-all cursor-pointer"
                      >
                        <p className="text-xs font-semibold text-white truncate">{subject}</p>
                        <div className="flex items-baseline justify-between mt-2">
                          <span className="text-lg font-bold text-blue-400">{count} Soal</span>
                          <span className="text-[11px] text-slate-400">{percentage}%</span>
                        </div>
                        <div className="w-full bg-slate-700/60 rounded-full h-1.5 mt-2 overflow-hidden">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{ width: `${Math.min(percentage * 2, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="col-span-3 py-6 text-center text-slate-500 text-xs">
                  Belum ada data mata pelajaran. Upload PDF untuk memulai.
                </div>
              )}
            </div>
          </div>

          {/* Breakdown by Jenjang & Difficulty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Jenjang */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h4 className="text-sm font-bold text-white mb-3">Distribusi Jenjang Pendidikan</h4>
              <div className="space-y-2.5">
                {[
                  { label: "SMA / MA", count: jenjangCounts.SMA, color: "bg-blue-500" },
                  { label: "SMP / MTs", count: jenjangCounts.SMP, color: "bg-emerald-500" },
                  { label: "SD / MI", count: jenjangCounts.SD, color: "bg-rose-500" },
                  { label: "SMK", count: jenjangCounts.SMK, color: "bg-amber-500" },
                ].map((item) => {
                  const pct = activeBankSoal.length > 0 ? Math.round((item.count / activeBankSoal.length) * 100) : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300 font-medium">{item.label}</span>
                        <span className="text-slate-400 font-semibold">{item.count} PDF ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div className={`${item.color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tingkat Kesulitan */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h4 className="text-sm font-bold text-white mb-3">Tingkat Kesulitan Soal</h4>
              <div className="space-y-2.5">
                {[
                  { label: "Mudah (C1-C2)", count: difficultyCounts.Mudah, color: "bg-emerald-500" },
                  { label: "Sedang (C3-C4)", count: difficultyCounts.Sedang, color: "bg-blue-500" },
                  { label: "Sulit / HOTS (C5-C6)", count: difficultyCounts.Sulit, color: "bg-purple-500" },
                ].map((item) => {
                  const pct = activeBankSoal.length > 0 ? Math.round((item.count / activeBankSoal.length) * 100) : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300 font-medium">{item.label}</span>
                        <span className="text-slate-400 font-semibold">{item.count} PDF ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div className={`${item.color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Bank Soal Cards */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Arsip Soal Terbaru</h3>
                <p className="text-xs text-slate-400">Dokumen PDF yang baru ditambahkan ke repositori</p>
              </div>
              <button
                onClick={() => onNavigate("banksoal")}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
              >
                Lihat Semua Arsip <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-800/80">
              {recentItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectBankSoal(item)}
                  className="py-3 flex items-start justify-between gap-3 hover:bg-slate-800/50 px-2 rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                          {item.business_id}
                        </span>
                        <span className="text-xs font-semibold text-blue-400">{item.mata_pelajaran}</span>
                        <span className="text-xs text-slate-500">• Kelas {item.kelas} ({item.jenjang})</span>
                      </div>
                      <h5 className="text-sm font-semibold text-slate-200 group-hover:text-white truncate mt-0.5">
                        {item.title}
                      </h5>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span>{item.file_size_formatted}</span>
                        <span>•</span>
                        <span>{item.page_count} Hal</span>
                        <span>•</span>
                        <span>{item.created_by_name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.sync_status === "SYNCED"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {item.sync_status}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1">{item.download_count || 0} Unduhan</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Storage Status & Activity Feed */}
        <div className="space-y-6">
          {/* Active Storage Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Active Storage Profile
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>

            {activeStorage ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{activeStorage.name}</h4>
                    <p className="text-xs text-slate-400">Priority {activeStorage.priority} (Primary)</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-800/60 rounded-xl space-y-2 text-xs border border-slate-700/60">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Google Drive:</span>
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Terhubung
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Google Spreadsheet:</span>
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Terindeks
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Apps Script Gateway:</span>
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> {activeStorage.latency_ms || 145}ms
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate("storage")}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-slate-200 rounded-xl border border-slate-700 transition-colors"
                >
                  Kelola Storage Profiles
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-amber-400 mb-2">Belum ada storage aktif</p>
                <button
                  onClick={() => onNavigate("storage")}
                  className="text-xs text-blue-400 underline"
                >
                  Tambah Storage Sekarang
                </button>
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>Aktivitas Terbaru</span>
              </h3>
              <button
                onClick={() => onNavigate("activity-history")}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium"
              >
                Selengkapnya
              </button>
            </div>

            <div className="space-y-3">
              {activities.length > 0 ? (
                activities.slice(0, 6).map((act) => (
                  <div key={act.id} className="flex items-start gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 font-medium truncate">{act.item_title}</p>
                      <p className="text-slate-400 text-[11px]">{act.details}</p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(act.timestamp).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 text-center py-4">Belum ada aktivitas tercatat</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
