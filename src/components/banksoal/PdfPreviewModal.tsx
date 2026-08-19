import React, { useState, useEffect } from "react";
import {
  X,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  FileText,
  BookOpen,
  Calendar,
  Layers,
  History,
  Tag,
  HardDrive,
  CheckCircle,
  Copy,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Star,
  Info,
  Share2,
  Eye,
  Sparkles,
} from "lucide-react";
import { BankSoal, UserProfile } from "../../types";
import { AppStore } from "../../services/store";
import { toast } from "../ui/Toast";

interface PdfPreviewModalProps {
  item: BankSoal | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onEdit: (item: BankSoal) => void;
  onOpenVersionHistory: (item: BankSoal) => void;
  onDelete: (item: BankSoal) => void;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  item,
  isOpen,
  onClose,
  currentUser,
  onEdit,
  onOpenVersionHistory,
  onDelete,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showMetadataDesktop, setShowMetadataDesktop] = useState<boolean>(true);
  const [showMobileMetadataDrawer, setShowMobileMetadataDrawer] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"native_pdf" | "document_sheet">("native_pdf");

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
      setZoomLevel(100);
      setRotation(0);
      setShowMobileMetadataDrawer(false);
      // Auto select native PDF if data URL or Google Drive embed is available
      if (item?.pdf_data_url) {
        setViewMode("native_pdf");
      }
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const isFav = AppStore.isFavorite(item.id, currentUser.id);
  const hasRealPdfData = Boolean(item.pdf_data_url);

  const handleDownload = () => {
    AppStore.recordDownload(item.id);
    toast.success("Mengunduh Berkas PDF Asli", item.file_name);
    if (item.pdf_data_url) {
      const a = document.createElement("a");
      a.href = item.pdf_data_url;
      a.download = item.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (item.download_url) {
      window.open(item.download_url, "_blank");
    } else if (item.web_view_url) {
      window.open(item.web_view_url, "_blank");
    }
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(item.file_hash);
    toast.info("SHA-256 Checksum Disalin", item.file_hash.slice(0, 16) + "...");
  };

  const handleToggleFavorite = () => {
    const isNow = AppStore.toggleFavorite(item.id);
    if (isNow) toast.success("Ditambahkan ke Favorit", item.title);
    else toast.info("Dihapus dari Favorit", item.title);
  };

  const handleMoveToTrash = () => {
    if (confirm(`Pindahkan "${item.title}" ke Keranjang Sampah?`)) {
      AppStore.moveToTrash(item.id);
      toast.warning("Dipindahkan ke Keranjang Sampah", item.business_id);
      onDelete(item);
      onClose();
    }
  };

  // Google Drive preview URL fallback
  const getGoogleDriveEmbedUrl = () => {
    if (item.drive_file_id) {
      return `https://drive.google.com/file/d/${item.drive_file_id}/preview`;
    }
    if (item.web_view_url && item.web_view_url.includes("drive.google.com")) {
      return item.web_view_url.replace(/\/view(\?.*)?$/, "/preview");
    }
    return null;
  };

  const driveEmbedUrl = getGoogleDriveEmbedUrl();

  return (
    <div
      id="pdf-preview-modal"
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md transition-all ${
        isFullscreen ? "p-0" : ""
      }`}
    >
      <div
        className={`bg-slate-900 border border-slate-800 rounded-3xl w-full flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${
          isFullscreen ? "h-screen rounded-none border-none" : "max-w-7xl h-[94vh]"
        }`}
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold bg-slate-800 text-blue-400 px-1.5 py-0.2 rounded">
                  {item.business_id}
                </span>
                <span className="text-xs text-slate-400 truncate">
                  v{item.current_version_number} • {item.mata_pelajaran} Kelas {item.kelas}
                </span>
                {hasRealPdfData && (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold px-1.5 py-0.2 rounded hidden sm:inline">
                    PDF Asli Terunggah
                  </span>
                )}
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white truncate max-w-xs sm:max-w-md md:max-w-xl">
                {item.title}
              </h3>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Mobile Metadata Trigger Button */}
            <button
              id="mobile-metadata-toggle-btn"
              onClick={() => setShowMobileMetadataDrawer(true)}
              className="lg:hidden flex items-center gap-1 px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-xl border border-blue-500/30 text-xs font-semibold transition-all"
              title="Lihat Detail & Metadata Soal"
            >
              <Info className="w-4 h-4" />
              <span className="text-[11px]">Detail Soal</span>
            </button>

            <button
              onClick={handleToggleFavorite}
              className={`p-2 rounded-xl border border-slate-700 transition-colors ${
                isFav
                  ? "bg-amber-400/20 text-amber-400 border-amber-500/30"
                  : "bg-slate-800 text-slate-300 hover:text-white"
              }`}
              title={isFav ? "Hapus dari Favorit" : "Tambah ke Favorit"}
            >
              <Star className={`w-4 h-4 ${isFav ? "fill-amber-400" : ""}`} />
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all shrink-0"
              title="Unduh Berkas PDF Asli"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Unduh PDF</span>
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="hidden sm:flex p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl border border-slate-700"
              title="Layar Penuh"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors shrink-0"
              aria-label="Tutup Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Workspace: Viewer (Center) + Metadata Pane (Desktop Right) */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* PDF Viewer Canvas Container */}
          <div className="flex-1 bg-slate-950 flex flex-col justify-between overflow-hidden relative">
            {/* Viewer Toolbar */}
            <div className="bg-slate-900/90 border-b border-slate-800 px-3 sm:px-4 py-2 flex items-center justify-between text-xs text-slate-300">
              {/* Mode Selector */}
              <div className="flex items-center gap-2">
                {hasRealPdfData ? (
                  <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700">
                    <button
                      onClick={() => setViewMode("native_pdf")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        viewMode === "native_pdf"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      PDF Asli
                    </button>
                    <button
                      onClick={() => setViewMode("document_sheet")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        viewMode === "document_sheet"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Lembar Naskah
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    <span>{item.file_name}</span>
                  </div>
                )}

                {/* Zoom & Rotation Controls for Sheet Mode */}
                {viewMode === "document_sheet" && (
                  <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-slate-800">
                    <button
                      onClick={() => setZoomLevel((z) => Math.max(50, z - 15))}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="Perkecil"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-[11px] w-10 text-center">{zoomLevel}%</span>
                    <button
                      onClick={() => setZoomLevel((z) => Math.min(200, z + 15))}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="Perbesar"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setRotation((r) => (r + 90) % 360)}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="Putar"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Desktop Metadata Panel Toggle */}
              <div className="hidden lg:flex items-center gap-2">
                <button
                  onClick={() => setShowMetadataDesktop(!showMetadataDesktop)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
                    showMetadataDesktop
                      ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
                  }`}
                >
                  {showMetadataDesktop ? "Sembunyikan Metadata" : "Tampilkan Metadata"}
                </button>
              </div>
            </div>

            {/* Document Render Area: Direct Native PDF or Sheet */}
            <div className="flex-1 overflow-auto p-2 sm:p-4 md:p-6 flex items-center justify-center bg-slate-950">
              {/* Option 1: Native PDF File Render (Direct Base64 Data URL or Embed) */}
              {viewMode === "native_pdf" && (hasRealPdfData || driveEmbedUrl) ? (
                <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl flex flex-col">
                  {hasRealPdfData ? (
                    <iframe
                      src={item.pdf_data_url}
                      className="w-full h-full border-none rounded-2xl bg-slate-900"
                      title={item.title}
                    />
                  ) : driveEmbedUrl ? (
                    <iframe
                      src={driveEmbedUrl}
                      className="w-full h-full border-none rounded-2xl bg-slate-900"
                      title={item.title}
                      allow="autoplay"
                    />
                  ) : null}
                </div>
              ) : (
                /* Option 2: High-Fidelity Formatted Exam Paper Sheet */
                <div
                  style={{
                    transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                    transformOrigin: "center center",
                    transition: "transform 0.15s ease-out",
                  }}
                  className="bg-white text-slate-900 rounded-xl shadow-2xl w-full max-w-3xl min-h-[750px] p-6 sm:p-12 relative flex flex-col justify-between my-auto"
                >
                  <div>
                    {/* Header Kop Naskah Soal */}
                    <div className="border-b-2 border-slate-900 pb-4 text-center">
                      <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-slate-600">
                        REPOSITORI NASKAH BANK SOAL & EVALUASI PEMBELAJARAN
                      </p>
                      <h2 className="text-lg sm:text-xl font-bold uppercase mt-1 tracking-tight text-slate-900">
                        {item.title}
                      </h2>
                      <p className="text-xs text-slate-700 mt-1 font-semibold">
                        Mata Pelajaran: {item.mata_pelajaran} | Tingkat: Kelas {item.kelas} ({item.jenjang}) | Tahun: {item.tahun_ajaran}
                      </p>
                    </div>

                    {/* Meta Row */}
                    <div className="grid grid-cols-2 text-xs py-3 border-b border-slate-200 text-slate-700">
                      <div>
                        <p><strong>Bentuk Soal:</strong> {item.jenis_soal}</p>
                        <p><strong>Kurikulum:</strong> {item.kurikulum}</p>
                      </div>
                      <div className="text-right">
                        <p><strong>Tingkat Kesulitan:</strong> {item.tingkat_kesulitan}</p>
                        <p><strong>Semester:</strong> {item.semester}</p>
                      </div>
                    </div>

                    {/* Questions Body */}
                    <div className="mt-6 space-y-6 text-xs sm:text-sm text-slate-800">
                      <div className="space-y-2">
                        <p className="font-bold">
                          1. Berdasarkan capaian pembelajaran pada materi {item.bab}, perhatikan analisis soal berikut:
                        </p>
                        <p className="text-slate-600 italic pl-4 border-l-2 border-slate-300">
                          "{item.deskripsi || 'Siswa diharapkan mampu menganalisis permasalahan kontekstual dan menyelesaikan model penyelesaian secara terstruktur.'}"
                        </p>
                        <p className="pt-1">
                          Pernyataan yang paling tepat untuk menggambarkan karakteristik materi {item.topik} di atas adalah...
                        </p>
                        <div className="grid grid-cols-1 gap-1.5 pl-4 pt-1 font-medium text-xs sm:text-sm">
                          <div className="p-2 rounded hover:bg-slate-100 flex items-center gap-2">
                            <span className="font-bold">A.</span> Memiliki keterkaitan variabel independen terhadap sistem evaluasi terpadu.
                          </div>
                          <div className="p-2 rounded hover:bg-slate-100 flex items-center gap-2">
                            <span className="font-bold">B.</span> Menerapkan prinsip penyederhanaan model kurikulum aktif.
                          </div>
                          <div className="p-2 rounded hover:bg-slate-100 flex items-center gap-2">
                            <span className="font-bold">C.</span> Menghasilkan representasi model sesuai rubrik asesmen Kurikulum Merdeka.
                          </div>
                          <div className="p-2 rounded hover:bg-slate-100 flex items-center gap-2">
                            <span className="font-bold">D.</span> Mengintegrasikan pendekatan studi kasus kontekstual berbasis numerasi.
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 pt-4 border-t border-slate-100">
                        <p className="font-bold">
                          2. Uraikan langkah-langkah sistematis dalam menyelesaikan permasalahan materi {item.topik}:
                        </p>
                        <div className="h-20 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 italic text-xs">
                          [Ruang Jawaban Lembar Kerja Siswa]
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PDF Footer Mock */}
                  <div className="pt-6 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>ID: {item.business_id} • Versi {item.current_version_number}</span>
                    <span>Halaman {currentPage} dari {item.page_count}</span>
                    <span>Bank Soal PDF SaaS Archive</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Right Metadata Pane (Visible on lg: screens) */}
          {showMetadataDesktop && (
            <div className="hidden lg:block w-80 xl:w-96 bg-slate-900 border-l border-slate-800 p-5 overflow-y-auto space-y-5 text-xs text-slate-300 shrink-0">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-sm font-bold text-white">Detail & Metadata Soal</h4>
                <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                  {item.business_id}
                </span>
              </div>

              {/* Kurikulum & Taksonomi */}
              <div className="space-y-3">
                <h5 className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                  Taksonomi & Kurikulum
                </h5>
                <div className="bg-slate-850 p-3 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mata Pelajaran:</span>
                    <span className="font-bold text-white">{item.mata_pelajaran}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Jenjang / Kelas:</span>
                    <span className="font-semibold text-white">{item.jenjang} - Kelas {item.kelas}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Kurikulum:</span>
                    <span className="font-semibold text-white">{item.kurikulum}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Bentuk Soal:</span>
                    <span className="font-semibold text-white">{item.jenis_soal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tingkat Kesulitan:</span>
                    <span className="font-semibold text-amber-300">{item.tingkat_kesulitan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tahun Ajaran:</span>
                    <span className="font-semibold text-white">{item.tahun_ajaran} ({item.semester})</span>
                  </div>
                </div>
              </div>

              {/* Materi & Bab */}
              <div className="space-y-3">
                <h5 className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                  Materi Pokok & Topik
                </h5>
                <div className="bg-slate-850 p-3 rounded-xl border border-slate-800 space-y-1.5">
                  <p className="font-bold text-slate-200">{item.bab}</p>
                  <p className="text-slate-400 text-[11px]">{item.topik}</p>
                  {item.subtopik && (
                    <p className="text-slate-500 text-[11px] italic">• {item.subtopik}</p>
                  )}
                  {item.deskripsi && (
                    <p className="pt-2 text-[11px] text-slate-400 border-t border-slate-800/80 leading-relaxed">
                      {item.deskripsi}
                    </p>
                  )}
                </div>
              </div>

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                    Tags & Label
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-lg text-[10px]"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Info File & Storage */}
              <div className="space-y-3">
                <h5 className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                  Informasi Berkas & Keamanan
                </h5>
                <div className="bg-slate-850 p-3 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nama Berkas:</span>
                    <span className="font-mono text-white truncate max-w-[150px]" title={item.file_name}>
                      {item.file_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ukuran / Halaman:</span>
                    <span className="font-mono text-white">{item.file_size_formatted} ({item.page_count} Halaman)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Penyimpanan:</span>
                    <span className="text-emerald-400 font-semibold">{item.storage_profile_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pengunggah:</span>
                    <span className="text-slate-200">{item.created_by_name}</span>
                  </div>

                  {/* SHA-256 Checksum Hash */}
                  <div className="pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">SHA-256 Checksum:</span>
                      <button
                        onClick={handleCopyHash}
                        className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono text-[10px]"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Salin</span>
                      </button>
                    </div>
                    <p className="font-mono text-[10px] text-slate-500 truncate mt-1 bg-slate-900 p-1.5 rounded-lg">
                      {item.file_hash}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => {
                    onClose();
                    onEdit(item);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl font-semibold border border-slate-700 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5 text-blue-400" />
                  <span>Edit Metadata Soal</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenVersionHistory(item);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl font-semibold border border-slate-700 transition-colors"
                >
                  <History className="w-3.5 h-3.5 text-purple-400" />
                  <span>Riwayat Versi ({item.version_count})</span>
                </button>

                <button
                  onClick={handleMoveToTrash}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-rose-950/40 text-rose-400 rounded-xl font-semibold border border-slate-700 hover:border-rose-800 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Pindahkan ke Sampah</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Metadata Sheet / Modal Drawer */}
      {showMobileMetadataDrawer && (
        <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-sm lg:hidden p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col p-5 space-y-4 animate-in slide-in-from-bottom-5 duration-200 text-xs text-slate-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400" />
                <h4 className="text-sm font-bold text-white">Detail & Metadata Bank Soal</h4>
              </div>
              <button
                onClick={() => setShowMobileMetadataDrawer(false)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Summary */}
            <div className="bg-slate-850 p-3 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-blue-400 font-bold">{item.business_id}</span>
                <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  v{item.current_version_number}
                </span>
              </div>
              <h3 className="font-bold text-white text-sm">{item.title}</h3>
              <p className="text-slate-400">{item.mata_pelajaran} • Kelas {item.kelas} {item.jenjang}</p>
            </div>

            {/* Taxonomy List */}
            <div className="bg-slate-850 p-3 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Kurikulum:</span>
                <span className="font-semibold text-white">{item.kurikulum}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bentuk Soal:</span>
                <span className="font-semibold text-white">{item.jenis_soal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tingkat Kesulitan:</span>
                <span className="font-semibold text-amber-300">{item.tingkat_kesulitan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tahun Ajaran:</span>
                <span className="font-semibold text-white">{item.tahun_ajaran} ({item.semester})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bab / Materi:</span>
                <span className="font-semibold text-white truncate max-w-[180px]">{item.bab}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ukuran Berkas:</span>
                <span className="font-mono text-white">{item.file_size_formatted} ({item.page_count} Hal)</span>
              </div>
            </div>

            {/* Actions for Mobile */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setShowMobileMetadataDrawer(false);
                  onClose();
                  onEdit(item);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800 text-slate-200 rounded-xl font-semibold border border-slate-700"
              >
                <Edit className="w-4 h-4 text-blue-400" />
                <span>Edit Metadata</span>
              </button>

              <button
                onClick={() => {
                  setShowMobileMetadataDrawer(false);
                  onClose();
                  onOpenVersionHistory(item);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800 text-slate-200 rounded-xl font-semibold border border-slate-700"
              >
                <History className="w-4 h-4 text-purple-400" />
                <span>Riwayat Versi ({item.version_count})</span>
              </button>

              <button
                onClick={() => {
                  setShowMobileMetadataDrawer(false);
                  handleMoveToTrash();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-950/40 text-rose-400 rounded-xl font-semibold border border-rose-800"
              >
                <Trash2 className="w-4 h-4" />
                <span>Pindahkan ke Sampah</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
