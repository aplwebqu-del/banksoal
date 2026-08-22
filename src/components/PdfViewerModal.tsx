import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Star,
  Edit,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  FileText,
  Calendar,
  Layers,
  GraduationCap,
  BookOpen,
  User,
  History,
  Tag,
  Share2,
  ChevronLeft,
  ChevronRight,
  Info,
  CheckCircle2,
  RotateCw,
  Cloud,
  Copy,
  Check,
} from 'lucide-react';
import { BankSoal, User as UserType } from '../types';
import { formatBytes, formatDate, getDifficultyColor, getSubjectColor } from '../lib/utils';
import { useToast } from './Toast';

interface PdfViewerModalProps {
  soal: BankSoal | null;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onEdit: (soal: BankSoal) => void;
  currentUser: UserType;
  onSelectRelated?: (soalId: string) => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  soal,
  onClose,
  onToggleFavorite,
  onEdit,
  currentUser,
}) => {
  const { showToast } = useToast();
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'metadata' | 'versions' | 'content' | 'gdrive'>('metadata');
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [copiedFileId, setCopiedFileId] = useState(false);

  useEffect(() => {
    setZoom(100);
    setRotation(0);
    setSelectedVersion(null);
    setActiveTab('metadata');
  }, [soal?.id]);

  if (!soal) return null;

  const diffColors = getDifficultyColor(soal.tingkat_kesulitan);
  const canEdit = currentUser.role === 'ADMIN' || currentUser.id === soal.uploaded_by;

  const previewUrl = selectedVersion
    ? `/api/bank-soal/${soal.id}/preview?v=${selectedVersion}`
    : `/api/bank-soal/${soal.id}/preview`;

  const downloadUrl = `/api/bank-soal/${soal.id}/download`;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.origin + previewUrl);
    showToast('Tautan dokumen berhasil disalin ke papan klip!', 'success');
  };

  const handleCopyFileId = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFileId(true);
    showToast('ID Berkas Google Drive disalin!', 'success');
    setTimeout(() => setCopiedFileId(false), 2000);
  };

  const toggleFullscreen = () => {
    const elem = document.getElementById('pdf-modal-container');
    if (!elem) return;

    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const driveDirectUrl =
    soal.web_view_url ||
    (soal.file_id ? `https://drive.google.com/file/d/${soal.file_id}/view` : undefined);

  return (
    <div
      id="pdf-modal-container"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-7xl h-[94vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Top Modal Navigation Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/90 border-b border-slate-700">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white truncate">{soal.judul}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{soal.nama_file}</span>
                <span>•</span>
                <span>{formatBytes(soal.ukuran_file)}</span>
                <span>•</span>
                <span>{soal.jumlah_halaman} Halaman</span>
                {soal.version > 1 && (
                  <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-semibold text-[10px]">
                    Versi {selectedVersion || soal.version}
                  </span>
                )}
                {soal.file_id && (
                  <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                    <Cloud className="w-2.5 h-2.5" />
                    <span>Drive: {soal.file_id.slice(0, 8)}...</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onToggleFavorite(soal.id)}
              className={`p-2 rounded-xl border transition-all ${
                soal.is_favorite
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title={soal.is_favorite ? 'Hapus dari Favorit' : 'Tambah ke Favorit'}
            >
              <Star className={`w-4 h-4 ${soal.is_favorite ? 'fill-amber-400' : ''}`} />
            </button>

            {driveDirectUrl && (
              <a
                href={driveDirectUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-blue-400 transition-all hidden sm:flex items-center gap-1 text-xs"
                title="Buka Langsung di Google Drive"
              >
                <Cloud className="w-4 h-4" />
                <span className="hidden md:inline">Buka di Drive</span>
              </a>
            )}

            {canEdit && (
              <button
                onClick={() => onEdit(soal)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all"
                title="Edit Metadata Soal"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-all hidden sm:block"
              title="Salin Tautan"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <a
              href={downloadUrl}
              download={soal.nama_file}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </a>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 hover:text-rose-400 border border-slate-700 text-slate-400 transition-all ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Split View (PDF Viewer Left + Metadata Inspector Right) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Column: PDF Frame & Toolbar */}
          <div className="flex-1 flex flex-col bg-slate-950/60 min-w-0 border-r border-slate-800">
            {/* Viewer Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom((prev) => Math.max(50, prev - 15))}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  title="Perkecil (Zoom Out)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="font-mono text-slate-300 w-12 text-center">{zoom}%</span>
                <button
                  onClick={() => setZoom((prev) => Math.min(200, prev + 15))}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  title="Perbesar (Zoom In)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                <div className="h-4 w-px bg-slate-700 mx-1" />

                <button
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  title="Putar Dokumen (Rotate)"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Buka Dokumen di Tab Baru"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tab Baru</span>
                </a>

                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  title="Layar Penuh"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Embedded PDF Canvas / Viewer */}
            <div className="flex-1 overflow-auto p-2 sm:p-4 flex items-center justify-center bg-slate-950">
              <div
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.15s ease-out',
                  width: '100%',
                  height: '100%',
                }}
                className="w-full h-full flex flex-col"
              >
                <object
                  data={`${previewUrl}#toolbar=0&navpanes=0`}
                  type="application/pdf"
                  className="w-full h-full rounded-xl bg-white shadow-2xl border border-slate-700"
                >
                  <iframe
                    src={`${previewUrl}#toolbar=0`}
                    title={soal.judul}
                    className="w-full h-full rounded-xl bg-white"
                  />
                </object>
              </div>
            </div>
          </div>

          {/* Right Column: Metadata Inspector & Version Tabs */}
          <div className="w-full lg:w-96 flex flex-col bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800">
            {/* Sidebar Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950/40 text-xs font-semibold overflow-x-auto">
              <button
                onClick={() => setActiveTab('metadata')}
                className={`flex-1 py-3 text-center border-b-2 whitespace-nowrap px-3 transition-all ${
                  activeTab === 'metadata'
                    ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Metadata
              </button>
              <button
                onClick={() => setActiveTab('gdrive')}
                className={`flex-1 py-3 text-center border-b-2 whitespace-nowrap px-3 transition-all ${
                  activeTab === 'gdrive'
                    ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Cloud Drive
              </button>
              <button
                onClick={() => setActiveTab('versions')}
                className={`flex-1 py-3 text-center border-b-2 whitespace-nowrap px-3 transition-all ${
                  activeTab === 'versions'
                    ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Versi ({1 + (soal.versions?.length || 0)})
              </button>
              <button
                onClick={() => setActiveTab('content')}
                className={`flex-1 py-3 text-center border-b-2 whitespace-nowrap px-3 transition-all ${
                  activeTab === 'content'
                    ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Teks
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
              {activeTab === 'metadata' && (
                <>
                  {/* Badges Overview */}
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {soal.mata_pelajaran}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {soal.jenjang} • Kelas {soal.kelas}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${diffColors.bg} ${diffColors.text} ${diffColors.border}`}
                    >
                      Kesulitan: {soal.tingkat_kesulitan}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      {soal.jenis_soal}
                    </span>
                  </div>

                  {/* Curriculum & Chapter details */}
                  <div className="bg-slate-800/60 rounded-xl p-3.5 border border-slate-700/80 space-y-2.5">
                    <div>
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Bab / Materi Pokok
                      </div>
                      <div className="font-semibold text-white mt-0.5">{soal.bab}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Topik & Subtopik
                      </div>
                      <div className="text-slate-200 mt-0.5">
                        {soal.topik} {soal.subtopik ? `— ${soal.subtopik}` : ''}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/60 text-xs">
                      <div>
                        <span className="text-slate-400">Kurikulum:</span>
                        <p className="font-medium text-slate-200">{soal.kurikulum}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Semester/Tahun:</span>
                        <p className="font-medium text-slate-200">
                          {soal.semester} ({soal.tahun})
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {soal.deskripsi && (
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Deskripsi & Cakupan
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                        {soal.deskripsi}
                      </p>
                    </div>
                  )}

                  {/* Uploader info */}
                  <div className="bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300 font-bold">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">{soal.uploaded_by_name}</div>
                        <div className="text-slate-400 text-[11px]">
                          Diunggah: {formatDate(soal.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-[11px] text-slate-400">
                      <div>{soal.view_count}x Dilihat</div>
                      <div className="text-emerald-400 font-medium">{soal.download_count}x Diunduh</div>
                    </div>
                  </div>

                  {/* Tags */}
                  {soal.tags && soal.tags.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" />
                        <span>Kumpulan Tags</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {soal.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-md text-xs bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-500 transition-colors"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* TAB: GOOGLE DRIVE & SHEETS METRICS */}
              {activeTab === 'gdrive' && (
                <div className="space-y-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cloud className="w-4 h-4 text-blue-400" />
                        <span className="font-bold text-white">Google Drive Integration</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {soal.sync_status || 'SYNCED'}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[11px] text-slate-400 block font-semibold">
                        Google Drive File ID:
                      </span>
                      <div className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-emerald-400">
                        <span className="truncate flex-1">{soal.file_id || 'LOCAL_STORED'}</span>
                        {soal.file_id && (
                          <button
                            onClick={() => handleCopyFileId(soal.file_id!)}
                            className="p-1 text-slate-400 hover:text-white"
                            title="Salin File ID"
                          >
                            {copiedFileId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[11px] text-slate-400 block font-semibold">
                        Struktur Path Folder Google Drive:
                      </span>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-mono">
                        BANK SOAL DIGITAL / {soal.mata_pelajaran} / Kelas {soal.kelas}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[11px] text-slate-400 block font-semibold">
                        SHA-256 File Hash (Integritas):
                      </span>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[10px] text-slate-400 truncate">
                        {soal.file_hash || '-'}
                      </div>
                    </div>

                    {driveDirectUrl && (
                      <a
                        href={driveDirectUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka Berkas Asli di Google Drive</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'versions' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">
                    Sistem melacak setiap pembaruan berkas PDF sehingga versi terdahulu tetap dapat diakses.
                  </p>

                  <div
                    onClick={() => setSelectedVersion(null)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedVersion === null
                        ? 'bg-blue-600/20 border-blue-500/50 text-blue-200 ring-1 ring-blue-500/30'
                        : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">
                        Versi {soal.version} (Versi Terkini)
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                        Aktif
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {formatDate(soal.updated_at || soal.created_at)} • {formatBytes(soal.ukuran_file)} •{' '}
                      {soal.jumlah_halaman} Halaman
                    </div>
                  </div>

                  {soal.versions && soal.versions.length > 0 ? (
                    soal.versions.map((ver) => (
                      <div
                        key={ver.version_number}
                        onClick={() => setSelectedVersion(ver.version_number)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedVersion === ver.version_number
                            ? 'bg-blue-600/20 border-blue-500/50 text-blue-200 ring-1 ring-blue-500/30'
                            : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">
                            Versi {ver.version_number}
                          </span>
                          <span className="text-[10px] text-slate-400">Arsip</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {formatDate(ver.uploaded_at)} • {formatBytes(ver.ukuran_file)} •{' '}
                          {ver.jumlah_halaman} Halaman
                        </div>
                        {ver.catatan && (
                          <div className="text-[11px] text-slate-300 mt-1.5 italic bg-slate-900/50 p-2 rounded">
                            "{ver.catatan}"
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-500">
                      Belum ada riwayat versi sebelumnya untuk dokumen ini.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'content' && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Ekstraksi Teks / Kunci Pencarian
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed max-h-96 overflow-y-auto whitespace-pre-wrap">
                    {soal.extracted_text ||
                      'Teks dokumen diindeks otomatis untuk mendukung pencarian full-text pada judul, bab, topik, dan butir soal.'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
