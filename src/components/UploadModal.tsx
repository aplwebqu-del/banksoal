import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  Trash2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Plus,
  Layers,
  BookOpen,
  Info,
  Cloud,
  Database,
  ExternalLink,
} from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from './Toast';
import { formatBytes } from '../lib/utils';
import { BankSoal, User } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newSoal: BankSoal) => void;
  currentUser: User;
}

interface UploadedFileItem {
  id: string;
  file: File;
  status: 'Menunggu' | 'Uploading' | 'Berhasil' | 'Gagal';
  error?: string;
  file_id?: string;
  folder_id?: string;
  drive_folder_path?: string;
  web_view_url?: string;
  download_url?: string;
  storage_path?: string;
  file_hash?: string;
  pageCount?: number;
  ukuran_file?: number;
  is_duplicate?: boolean;
  duplicate_item?: BankSoal;
  metadata: {
    judul: string;
    mata_pelajaran: string;
    jenjang: string;
    kelas: string;
    kurikulum: string;
    bab: string;
    topik: string;
    subtopik: string;
    jenis_soal: string;
    tingkat_kesulitan: string;
    tahun: number;
    semester: string;
    sumber: string;
    pembuat_pengajar: string;
    deskripsi: string;
    tags: string[];
  };
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentUser,
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filesQueue, setFilesQueue] = useState<UploadedFileItem[]>([]);
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Upload Progress Tracking State
  const [uploadProgress, setUploadProgress] = useState<{
    isActive: boolean;
    percent: number;
    stage: string;
    detail: string;
    successMessage?: string;
  }>({
    isActive: false,
    percent: 0,
    stage: '',
    detail: '',
  });

  // Duplicate Resolution Modal State
  const [duplicateModal, setDuplicateModal] = useState<{
    fileItem: UploadedFileItem;
    existingItem: BankSoal;
  } | null>(null);

  if (!isOpen) return null;

  const currentFileItem = filesQueue[activeFileIndex];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(Array.from(e.target.files));
    }
  };

  const addFilesToQueue = async (rawFiles: File[]) => {
    const validPdfFiles = rawFiles.filter((f) => {
      const isPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        showToast(`File "${f.name}" dilewati karena bukan PDF.`, 'error');
      }
      return isPdf;
    });

    if (validPdfFiles.length === 0) return;

    setIsProcessing(true);

    const newItems: UploadedFileItem[] = [];

    for (const f of validPdfFiles) {
      const cleanTitle = f.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
      // Default initial metadata
      const initialMeta = {
        judul: cleanTitle.replace(/\b\w/g, (l) => l.toUpperCase()),
        mata_pelajaran: 'Matematika',
        jenjang: 'SMP',
        kelas: '9',
        kurikulum: 'Kurikulum Merdeka',
        bab: 'Latihan Soal Mandiri',
        topik: 'Bank Soal Semester',
        subtopik: '',
        jenis_soal: 'Pilihan Ganda',
        tingkat_kesulitan: 'Sedang',
        tahun: new Date().getFullYear(),
        semester: 'Ganjil',
        sumber: 'Dokumen Pengajar',
        pembuat_pengajar: currentUser.name,
        deskripsi: `Kumpulan bank soal ${f.name} untuk bahan latihan dan penilaian siswa.`,
        tags: ['#BankSoal', '#Kelas9', '#SMP'],
      };

      newItems.push({
        id: `item-${Date.now()}-${Math.random()}`,
        file: f,
        status: 'Menunggu',
        drive_folder_path: 'BANK SOAL DIGITAL / Matematika / Kelas 9',
        metadata: initialMeta,
      });
    }

    setFilesQueue((prev) => [...prev, ...newItems]);
    setIsProcessing(false);

    // Upload files to Google Drive backend
    uploadFilesBatch(newItems);
  };

  const uploadFilesBatch = async (items: UploadedFileItem[]) => {
    for (let i = 0; i < items.length; i++) {
      const itm = items[i];
      setUploadProgress({
        isActive: true,
        percent: 25,
        stage: 'Membaca Berkas PDF',
        detail: `Membaca & menganalisis halaman PDF "${itm.file.name}"...`,
      });

      const formData = new FormData();
      formData.append('files', itm.file);

      try {
        setUploadProgress({
          isActive: true,
          percent: 55,
          stage: 'Mengunggah ke Google Drive',
          detail: `Mengalirkan file "${itm.file.name}" (${formatBytes(itm.file.size)}) ke penyimpanan Google Drive...`,
        });

        const res = await api.uploadFiles(formData);
        
        setUploadProgress({
          isActive: true,
          percent: 85,
          stage: 'Memverifikasi Google Drive',
          detail: `Memverifikasi hash identifikasi berkas dan struktur folder...`,
        });

        if (res.files && res.files[0]) {
          const backendFile = res.files[0];
          setFilesQueue((prev) =>
            prev.map((item) =>
              item.id === itm.id
                ? {
                    ...item,
                    status: 'Menunggu',
                    file_id: backendFile.file_id,
                    folder_id: backendFile.folder_id,
                    web_view_url: backendFile.web_view_url,
                    download_url: backendFile.download_url,
                    storage_path: backendFile.storage_path,
                    file_hash: backendFile.file_hash,
                    pageCount: backendFile.jumlah_halaman,
                    ukuran_file: backendFile.ukuran_file,
                    drive_folder_path: backendFile.drive_folder_path,
                    is_duplicate: backendFile.is_duplicate,
                    duplicate_item: backendFile.duplicate_item,
                    metadata: {
                      ...item.metadata,
                      ...(backendFile.suggested_metadata || {}),
                    },
                  }
                : item
            )
          );

          setUploadProgress({
            isActive: true,
            percent: 100,
            stage: 'Tersimpan Sementara di Drive',
            detail: `Berkas siap. Silakan lengkapi metadata di bawah untuk menyimpan ke database Google Sheets.`,
            successMessage: `File tersimpan di Google Drive (ID: ${backendFile.file_id?.slice(0, 14)}...)`,
          });

          if (backendFile.is_duplicate && backendFile.duplicate_item) {
            setDuplicateModal({
              fileItem: itm,
              existingItem: backendFile.duplicate_item,
            });
          }
        }
      } catch (err: any) {
        setUploadProgress({
          isActive: false,
          percent: 0,
          stage: 'Gagal',
          detail: err.message || 'Gagal memproses upload ke Google Drive',
        });

        setFilesQueue((prev) =>
          prev.map((item) =>
            item.id === itm.id
              ? {
                  ...item,
                  status: 'Gagal',
                  error: err.message || 'Gagal memproses upload ke Google Drive',
                }
              : item
          )
        );
      }
    }
  };

  const removeFileFromQueue = (index: number) => {
    setFilesQueue((prev) => prev.filter((_, idx) => idx !== index));
    if (activeFileIndex >= filesQueue.length - 1) {
      setActiveFileIndex(Math.max(0, filesQueue.length - 2));
    }
  };

  const handleMetadataChange = (field: string, value: any) => {
    if (!currentFileItem) return;
    setFilesQueue((prev) =>
      prev.map((item, idx) => {
        if (idx === activeFileIndex) {
          const updatedMeta = {
            ...item.metadata,
            [field]: value,
          };
          const mapel = field === 'mata_pelajaran' ? value : updatedMeta.mata_pelajaran;
          const kls = field === 'kelas' ? value : updatedMeta.kelas;
          return {
            ...item,
            drive_folder_path: `BANK SOAL DIGITAL / ${mapel || 'Umum'} / Kelas ${kls || '10'}`,
            metadata: updatedMeta,
          };
        }
        return item;
      })
    );
  };

  const handleAddTag = () => {
    if (!tagInput.trim() || !currentFileItem) return;
    const formatted = tagInput.trim().startsWith('#') ? tagInput.trim() : `#${tagInput.trim()}`;
    if (!currentFileItem.metadata.tags.includes(formatted)) {
      handleMetadataChange('tags', [...currentFileItem.metadata.tags, formatted]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!currentFileItem) return;
    handleMetadataChange(
      'tags',
      currentFileItem.metadata.tags.filter((t) => t !== tagToRemove)
    );
  };

  const handleAiAutoFill = async () => {
    if (!currentFileItem) return;
    setIsAiSuggesting(true);
    try {
      const res = await api.suggestMetadata(currentFileItem.file.name, currentFileItem.metadata.deskripsi);
      if (res.metadata) {
        setFilesQueue((prev) =>
          prev.map((item, idx) =>
            idx === activeFileIndex
              ? {
                  ...item,
                  drive_folder_path: `BANK SOAL DIGITAL / ${res.metadata.mata_pelajaran || item.metadata.mata_pelajaran} / Kelas ${res.metadata.kelas || item.metadata.kelas}`,
                  metadata: {
                    ...item.metadata,
                    ...res.metadata,
                  },
                }
              : item
          )
        );
        showToast('Metadata berhasil diisi otomatis oleh AI!', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal mengisi otomatis metadata', 'error');
    } finally {
      setIsAiSuggesting(false);
    }
  };

  const handleSaveCurrent = async () => {
    if (!currentFileItem) return;

    const { metadata } = currentFileItem;
    if (!metadata.judul.trim() || !metadata.mata_pelajaran || !metadata.kelas) {
      showToast('Harap lengkapi field wajib: Judul Soal, Mata Pelajaran, dan Kelas.', 'error');
      return;
    }

    setIsProcessing(true);
    setUploadProgress({
      isActive: true,
      percent: 35,
      stage: 'Memvalidasi Metadata',
      detail: `Memvalidasi metadata dan relasi kurikulum untuk "${metadata.judul}"...`,
    });

    try {
      const payload = {
        judul: metadata.judul,
        nama_file: currentFileItem.file.name,
        file_id: currentFileItem.file_id,
        folder_id: currentFileItem.folder_id,
        web_view_url: currentFileItem.web_view_url,
        download_url: currentFileItem.download_url,
        storage_path: currentFileItem.storage_path,
        file_hash: currentFileItem.file_hash,
        mata_pelajaran: metadata.mata_pelajaran,
        jenjang: metadata.jenjang,
        kelas: metadata.kelas,
        kurikulum: metadata.kurikulum,
        bab: metadata.bab,
        topik: metadata.topik,
        subtopik: metadata.subtopik,
        jenis_soal: metadata.jenis_soal,
        tingkat_kesulitan: metadata.tingkat_kesulitan,
        tahun: metadata.tahun,
        semester: metadata.semester,
        sumber: metadata.sumber,
        pembuat_pengajar: metadata.pembuat_pengajar,
        deskripsi: metadata.deskripsi,
        tags: metadata.tags,
        jumlah_halaman: currentFileItem.pageCount || 1,
        ukuran_file: currentFileItem.ukuran_file || currentFileItem.file.size,
      };

      setUploadProgress({
        isActive: true,
        percent: 75,
        stage: 'Menyimpan ke Google Sheets',
        detail: `Menulis baris rekaman baru ke Spreadsheet (Tabel BANK_SOAL)...`,
      });

      const res = await api.createBankSoal(payload);

      setUploadProgress({
        isActive: true,
        percent: 100,
        stage: 'Berhasil Disimpan',
        detail: 'Data berhasil ditulis di database Google Sheets dan berkas terarsip di Google Drive.',
        successMessage: `Data berhasil ditulis di database Google Sheets & Google Drive (${res.item.judul})`,
      });

      showToast(
        `Sukses: Data telah berhasil ditulis di database Google Sheets & Google Drive! (${res.item.judul})`,
        'success',
        'Data Berhasil Disimpan'
      );
      onSuccess(res.item);

      // Remove from queue after brief display
      setTimeout(() => {
        const remaining = filesQueue.filter((_, idx) => idx !== activeFileIndex);
        setFilesQueue(remaining);
        if (remaining.length === 0) {
          onClose();
        } else {
          setActiveFileIndex(0);
        }
      }, 500);
    } catch (err: any) {
      setUploadProgress({
        isActive: false,
        percent: 0,
        stage: 'Gagal Menyimpan',
        detail: err.message || 'Gagal menyimpan bank soal ke Google Sheets',
      });
      showToast(err.message || 'Gagal menyimpan bank soal ke Google Sheets', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Save As New Version to existing duplicate
  const handleSaveAsVersion = async () => {
    if (!duplicateModal) return;
    const { fileItem, existingItem } = duplicateModal;

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', fileItem.file);
      formData.append('catatan', `Pembaruan dari file ${fileItem.file.name}`);

      const res = await api.uploadVersion(existingItem.id, formData);
      showToast(`Berhasil memperbarui sebagai Versi ${res.item.version} pada "${existingItem.judul}"!`, 'success');
      onSuccess(res.item);
      setDuplicateModal(null);
      setFilesQueue((prev) => prev.filter((it) => it.id !== fileItem.id));
      if (filesQueue.length <= 1) onClose();
    } catch (err: any) {
      showToast(err.message || 'Gagal menambahkan versi dokumen', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl h-[92vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Upload Bank Soal PDF ke Google Drive</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono text-[10px] border border-blue-500/30">
                  Google Drive + Sheets Architecture
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Unggah berkas PDF, otomatis simpan ke folder Google Drive berstruktur, dan indeks metadata ke Google Sheets.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Column: Dropzone & File Queue */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/40 p-4 flex flex-col gap-3 overflow-y-auto">
            {/* Drag & Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-700 hover:border-blue-500/50 bg-slate-900/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="application/pdf"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Upload className="w-8 h-8 mx-auto text-blue-400 mb-2" />
              <p className="text-xs font-semibold text-white">Tarik & Lepas File PDF ke Sini</p>
              <p className="text-[11px] text-slate-400 mt-1">atau klik untuk memilih dari komputer</p>
              <span className="inline-block mt-2 text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                Auto-Sync ke Google Drive & Sheets
              </span>
            </div>

            {/* File Queue List */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
                <span>Antrean Berkas ({filesQueue.length})</span>
                {filesQueue.length > 0 && (
                  <button
                    onClick={() => setFilesQueue([])}
                    className="text-[11px] text-rose-400 hover:underline"
                  >
                    Hapus Semua
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filesQueue.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">
                    Belum ada file PDF yang dipilih. Silakan upload file pertama Anda.
                  </div>
                ) : (
                  filesQueue.map((item, idx) => {
                    const isSelected = idx === activeFileIndex;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setActiveFileIndex(idx)}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between gap-2 ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500 text-blue-100 shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-white truncate">{item.file.name}</p>
                            <p className="text-[10px] text-slate-400">
                              {formatBytes(item.file.size)}
                              {item.pageCount ? ` • ${item.pageCount} Hal` : ''}
                            </p>
                            {item.file_id && (
                              <p className="text-[9px] font-mono text-emerald-400 truncate">
                                Drive ID: {item.file_id.slice(0, 10)}...
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {item.is_duplicate && (
                            <span title="Terdeteksi duplikat" className="p-1 text-amber-400">
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFileFromQueue(idx);
                            }}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                            title="Hapus file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Metadata Form & Google Drive Destination */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-900 space-y-6">
            {currentFileItem ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Metadata Soal:</span>
                      <span className="text-blue-400 truncate max-w-sm">{currentFileItem.file.name}</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Lengkapi data klasifikasi agar tersimpan rapi pada indeks Google Sheets.
                    </p>
                  </div>

                  <button
                    onClick={handleAiAutoFill}
                    disabled={isAiSuggesting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 shrink-0"
                  >
                    {isAiSuggesting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    )}
                    <span>Isi Otomatis dengan AI</span>
                  </button>
                </div>

                {/* Upload & Database Write Progress Indicator Card */}
                {uploadProgress.isActive && (
                  <div className="p-4 bg-slate-800/90 border border-blue-500/40 rounded-xl shadow-lg animate-in fade-in space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {uploadProgress.percent < 100 ? (
                          <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        <span className="font-bold text-white">{uploadProgress.stage}</span>
                      </div>
                      <span className="font-mono font-bold text-blue-300">{uploadProgress.percent}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-700/80 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 h-2.5 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress.percent}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-slate-300">{uploadProgress.detail}</p>
                    
                    {uploadProgress.successMessage && (
                      <div className="pt-1 text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{uploadProgress.successMessage}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Google Drive Destination Badge */}
                <div className="p-3 bg-blue-950/30 border border-blue-500/30 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <Cloud className="w-4 h-4 text-blue-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
                        Lokasi Folder Google Drive:
                      </span>
                      <span className="font-mono text-white text-xs truncate block">
                        {currentFileItem.drive_folder_path}
                      </span>
                    </div>
                  </div>
                  {currentFileItem.file_id && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30 shrink-0">
                      File ID: {currentFileItem.file_id.slice(0, 12)}...
                    </span>
                  )}
                </div>

                {/* Duplicate Notice Banner */}
                {currentFileItem.is_duplicate && currentFileItem.duplicate_item && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-bold text-amber-300">File ini Terdeteksi Sudah Tersimpan di Katalog</div>
                      <p className="mt-0.5">
                        Ditemukan file yang sama persis: "
                        <span className="font-semibold text-white">
                          {currentFileItem.duplicate_item.judul}
                        </span>
                        ". Anda dapat memperbarui versi dokumen atau tetap menyimpannya sebagai item baru.
                      </p>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() =>
                            setDuplicateModal({
                              fileItem: currentFileItem,
                              existingItem: currentFileItem.duplicate_item!,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400"
                        >
                          Simpan Sebagai Versi Baru
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Judul */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="font-semibold text-slate-300 flex items-center justify-between">
                      <span>
                        Judul Bank Soal <span className="text-rose-400">*Wajib</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      value={currentFileItem.metadata.judul}
                      onChange={(e) => handleMetadataChange('judul', e.target.value)}
                      placeholder="Contoh: Matematika Kelas 9 — Persamaan Kuadrat dan Fungsi"
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                    />
                  </div>

                  {/* Mata Pelajaran */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300">
                      Mata Pelajaran <span className="text-rose-400">*Wajib</span>
                    </label>
                    <select
                      value={currentFileItem.metadata.mata_pelajaran}
                      onChange={(e) => handleMetadataChange('mata_pelajaran', e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
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

                  {/* Jenjang & Kelas */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-300">
                        Jenjang <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={currentFileItem.metadata.jenjang}
                        onChange={(e) => handleMetadataChange('jenjang', e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="SD">SD</option>
                        <option value="SMP">SMP</option>
                        <option value="SMA">SMA</option>
                        <option value="SMK">SMK</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-300">
                        Kelas <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={currentFileItem.metadata.kelas}
                        onChange={(e) => handleMetadataChange('kelas', e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="1">Kelas 1</option>
                        <option value="2">Kelas 2</option>
                        <option value="3">Kelas 3</option>
                        <option value="4">Kelas 4</option>
                        <option value="5">Kelas 5</option>
                        <option value="6">Kelas 6</option>
                        <option value="7">Kelas 7</option>
                        <option value="8">Kelas 8</option>
                        <option value="9">Kelas 9</option>
                        <option value="10">Kelas 10</option>
                        <option value="11">Kelas 11</option>
                        <option value="12">Kelas 12</option>
                      </select>
                    </div>
                  </div>

                  {/* Bab & Topik */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300">Bab / Materi Pokok</label>
                    <input
                      type="text"
                      value={currentFileItem.metadata.bab}
                      onChange={(e) => handleMetadataChange('bab', e.target.value)}
                      placeholder="Contoh: Persamaan dan Fungsi Kuadrat"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300">Topik / Subtopik</label>
                    <input
                      type="text"
                      value={currentFileItem.metadata.topik}
                      onChange={(e) => handleMetadataChange('topik', e.target.value)}
                      placeholder="Contoh: Akar Persamaan Kuadrat & Diskriminan"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Jenis Soal & Tingkat Kesulitan */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300">Jenis Soal</label>
                    <select
                      value={currentFileItem.metadata.jenis_soal}
                      onChange={(e) => handleMetadataChange('jenis_soal', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Pilihan Ganda">Pilihan Ganda</option>
                      <option value="Essay">Essay</option>
                      <option value="Campuran">Campuran</option>
                      <option value="HOTS">HOTS</option>
                      <option value="AKM">AKM</option>
                      <option value="SNBT">SNBT / UTBK</option>
                      <option value="Tryout">Tryout</option>
                      <option value="PAS">Penilaian Akhir Semester (PAS)</option>
                      <option value="PAT">Penilaian Akhir Tahun (PAT)</option>
                      <option value="PTS">Penilaian Tengah Semester (PTS)</option>
                      <option value="Ujian Sekolah">Ujian Sekolah</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300">Tingkat Kesulitan</label>
                    <select
                      value={currentFileItem.metadata.tingkat_kesulitan}
                      onChange={(e) => handleMetadataChange('tingkat_kesulitan', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Mudah">Mudah</option>
                      <option value="Sedang">Sedang</option>
                      <option value="Sulit">Sulit (HOTS/Olimpiade)</option>
                    </select>
                  </div>

                  {/* Tahun & Semester */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300">Tahun Penyusunan</label>
                    <input
                      type="number"
                      value={currentFileItem.metadata.tahun}
                      onChange={(e) => handleMetadataChange('tahun', parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300">Semester</label>
                    <select
                      value={currentFileItem.metadata.semester}
                      onChange={(e) => handleMetadataChange('semester', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Ganjil">Semester Ganjil</option>
                      <option value="Genap">Semester Genap</option>
                      <option value="Semua">Semua Semester</option>
                    </select>
                  </div>

                  {/* Kurikulum & Sumber */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300">Kurikulum</label>
                    <select
                      value={currentFileItem.metadata.kurikulum}
                      onChange={(e) => handleMetadataChange('kurikulum', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Kurikulum Merdeka">Kurikulum Merdeka</option>
                      <option value="Kurikulum 2013">Kurikulum 2013 (K13 Revisi)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-300">Sumber / Pembuat</label>
                    <input
                      type="text"
                      value={currentFileItem.metadata.sumber}
                      onChange={(e) => handleMetadataChange('sumber', e.target.value)}
                      placeholder="Contoh: MGMP Matematika / Ujian Sekolah Mandiri"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Tags */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="font-semibold text-slate-300">Tags (#)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        placeholder="Ketik tag (misal: #HOTS, #PersamaanKuadrat) lalu tekan Enter"
                        className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold"
                      >
                        + Tambah
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {currentFileItem.metadata.tags.map((t, i) => (
                        <span
                          key={i}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-800 text-slate-300 border border-slate-700"
                        >
                          <span>{t}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(t)}
                            className="text-slate-500 hover:text-rose-400"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Deskripsi */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="font-semibold text-slate-300">Deskripsi / Catatan Tambahan</label>
                    <textarea
                      rows={2}
                      value={currentFileItem.metadata.deskripsi}
                      onChange={(e) => handleMetadataChange('deskripsi', e.target.value)}
                      placeholder="Tuliskan petunjuk pengerjaan, cakupan butir soal, atau kisi-kisi ringkas..."
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-blue-400" />
                    <span>Target: Indeks Google Sheets (Tabel BANK_SOAL)</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveCurrent}
                      disabled={isProcessing}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      <span>Simpan ke Bank Soal</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
                <FileText className="w-12 h-12 mb-3 text-slate-600" />
                <p className="font-semibold text-slate-400">Pilih Berkas PDF di Sebelah Kiri</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Tarik berkas PDF ke kotak upload untuk mengisi metadata dan menyimpannya.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Duplicate Resolution Modal Dialog */}
        {duplicateModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-md w-full shadow-2xl text-slate-100 space-y-4">
              <div className="flex items-center gap-3 text-amber-400">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="font-bold text-base text-white">File Terindikasi Duplikat</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                File <span className="font-semibold text-white">{duplicateModal.fileItem.file.name}</span> memiliki
                sidik jari hash identik dengan bank soal:
              </p>
              <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 text-xs">
                <div className="font-bold text-blue-400">{duplicateModal.existingItem.judul}</div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  {duplicateModal.existingItem.mata_pelajaran} • Kelas {duplicateModal.existingItem.kelas} • Versi{' '}
                  {duplicateModal.existingItem.version}
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-2 text-xs">
                <button
                  onClick={handleSaveAsVersion}
                  className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white transition-colors text-center"
                >
                  Simpan Sebagai Versi Baru Dokumen Tersebut
                </button>
                <button
                  onClick={() => setDuplicateModal(null)}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 font-medium text-slate-300 transition-colors"
                >
                  Lanjutkan Sebagai Dokumen Terpisah
                </button>
                <button
                  onClick={() => {
                    removeFileFromQueue(activeFileIndex);
                    setDuplicateModal(null);
                  }}
                  className="w-full py-2 px-3 text-rose-400 hover:underline text-[11px] text-center"
                >
                  Batalkan Upload File Ini
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
