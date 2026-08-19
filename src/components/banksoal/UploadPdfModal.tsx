import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Upload,
  FileText,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Clock,
  HardDrive,
  RefreshCw,
  Eye,
  Layers,
  ArrowRight,
  BookOpen,
  Calendar,
  Tag,
  ShieldCheck,
  Check,
  Bot,
  Zap,
} from "lucide-react";
import {
  BankSoal,
  CategoryMaster,
  TagItem,
  StorageProfile,
  UserProfile,
  AiMetadataSuggestion,
  JenjangType,
  ExamType,
  DifficultyLevel,
} from "../../types";
import { AppStore, computeFileHash, formatBytes } from "../../services/store";
import { getAiMetadataSuggestions } from "../../services/aiService";
import { StorageService } from "../../services/storageService";
import { toast } from "../ui/Toast";

interface UploadPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newItem: BankSoal) => void;
  onOpenExisting: (item: BankSoal) => void;
  categories: CategoryMaster[];
  tags: TagItem[];
  storageProfiles: StorageProfile[];
  currentUser: UserProfile;
}

export const UploadPdfModal: React.FC<UploadPdfModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenExisting,
  categories,
  tags,
  storageProfiles,
  currentUser,
}) => {
  // Global settings from Store
  const systemSettings = AppStore.getSettings();
  const isAiGlobalEnabled = systemSettings.enable_ai_suggest ?? true;

  // Steps: 1: select_file, 2: ai_review, 3: final_form, 4: uploading
  const [step, setStep] = useState<number>(1);
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>("");
  const [fileHash, setFileHash] = useState<string>("");
  const [pageCount, setPageCount] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User choice: Whether to use AI auto-fill on upload
  const [useAiAutofill, setUseAiAutofill] = useState<boolean>(isAiGlobalEnabled);

  // Duplicate state
  const [duplicateItem, setDuplicateItem] = useState<BankSoal | null>(null);

  // AI Suggestion State
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiSuggestion, setAiSuggestion] = useState<AiMetadataSuggestion | null>(null);
  const [aiConfidence, setAiConfidence] = useState<number>(0);
  const [aiSource, setAiSource] = useState<string>("");

  // Form Fields State
  const [title, setTitle] = useState<string>("");
  const [mataPelajaran, setMataPelajaran] = useState<string>("Matematika");
  const [jenjang, setJenjang] = useState<JenjangType>("SMA");
  const [kelas, setKelas] = useState<string>("10");
  const [kurikulum, setKurikulum] = useState<string>("Kurikulum Merdeka");
  const [bab, setBab] = useState<string>("");
  const [topik, setTopik] = useState<string>("");
  const [subtopik, setSubtopik] = useState<string>("");
  const [jenisSoal, setJenisSoal] = useState<ExamType>("Pilihan Ganda");
  const [tingkatKesulitan, setTingkatKesulitan] = useState<DifficultyLevel>("Sedang");
  const [tahunAjaran, setTahunAjaran] = useState<string>(systemSettings.current_academic_year || "2024/2025");
  const [semester, setSemester] = useState<"Ganjil" | "Genap">((systemSettings.current_semester as any) || "Ganjil");
  const [sumber, setSumber] = useState<string>(currentUser.name);
  const [deskripsi, setDeskripsi] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState<string>("");
  const [storageProfileId, setStorageProfileId] = useState<string>("");

  // Saving state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [uploadProgressText, setUploadProgressText] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFile(null);
      setFileBase64("");
      setFileHash("");
      setDuplicateItem(null);
      setAiSuggestion(null);
      setUseAiAutofill(isAiGlobalEnabled);
      setTahunAjaran(systemSettings.current_academic_year || "2024/2025");
      setSemester((systemSettings.current_semester as any) || "Ganjil");
    }
  }, [isOpen, isAiGlobalEnabled]);

  // Target Storage
  const activeStorage = storageProfiles.find((s) => s.is_active) || storageProfiles[0];

  // Helper subjects
  const subjects = categories.filter((c) => c.type === "MATA_PELAJARAN").map((c) => c.name);

  if (!isOpen) return null;

  // File Processing & Validation
  const processFile = async (selectedFile: File) => {
    // 1. Validation
    if (!selectedFile.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Format File Tidak Valid", "Hanya berkas PDF (.pdf) yang diperbolehkan");
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      toast.error("Ukuran Berkas Terlalu Besar", "Maksimal ukuran file PDF adalah 50 MB");
      return;
    }

    if (selectedFile.size === 0) {
      toast.error("Berkas Kosong", "File PDF yang diunggah tidak memiliki data (0 Bytes)");
      return;
    }

    setFile(selectedFile);
    const cleanTitle = selectedFile.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
    setTitle(cleanTitle);

    // 2. Read base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = (e.target?.result as string).split(",")[1] || "";
      setFileBase64(base64Data);

      // Estimate page count
      const approxPages = Math.max(1, Math.min(Math.round(selectedFile.size / (150 * 1024)), 40));
      setPageCount(approxPages);
    };
    reader.readAsDataURL(selectedFile);

    // 3. Compute SHA-256 Hash
    try {
      const hash = await computeFileHash(selectedFile);
      setFileHash(hash);

      // 4. Duplicate Check
      const existing = AppStore.checkDuplicate(hash);
      if (existing) {
        setDuplicateItem(existing);
        return;
      }
    } catch (err) {
      console.warn("Hash computation issue:", err);
    }

    // 5. Decision: Run AI or go directly to manual form
    if (isAiGlobalEnabled && useAiAutofill) {
      triggerAiExtraction(selectedFile);
    } else {
      // Manual input route
      setStep(3);
      toast.info("Mode Input Manual", "Silakan lengkapi metadata naskah soal.");
    }
  };

  const triggerAiExtraction = async (targetFile: File) => {
    setDuplicateItem(null);
    setIsAiLoading(true);
    setStep(2);

    const result = await getAiMetadataSuggestions({
      fileName: targetFile.name,
      fileTitle: targetFile.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
    });

    setIsAiLoading(false);
    if (result.suggestion) {
      setAiSuggestion(result.suggestion);
      setAiConfidence(result.confidence);
      setAiSource(result.source);

      // Apply suggestions to form state
      const s = result.suggestion;
      if (s.mataPelajaran) setMataPelajaran(s.mataPelajaran);
      if (s.jenjang) setJenjang(s.jenjang);
      if (s.kelas) setKelas(s.kelas);
      if (s.kurikulum) setKurikulum(s.kurikulum);
      if (s.bab) setBab(s.bab);
      if (s.topik) setTopik(s.topik);
      if (s.subtopik) setSubtopik(s.subtopik || "");
      if (s.jenisSoal) setJenisSoal(s.jenisSoal);
      if (s.tingkatKesulitan) setTingkatKesulitan(s.tingkatKesulitan);
      if (s.tahun) setTahunAjaran(s.tahun);
      if (s.semester) setSemester(s.semester);
      if (s.deskripsi) setDeskripsi(s.deskripsi);
      if (s.tags && Array.isArray(s.tags)) setSelectedTags(s.tags);
    }
  };

  const handleApplyAiSuggestion = () => {
    setStep(3);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTagInput.trim()) {
      e.preventDefault();
      const val = newTagInput.trim().replace(/^#/, "");
      if (!selectedTags.includes(val)) {
        setSelectedTags([...selectedTags, val]);
      }
      setNewTagInput("");
    }
  };

  const handleRemoveTag = (tagName: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tagName));
  };

  // Submit and Upload to Google Drive & Store
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    if (!title.trim()) {
      toast.error("Judul Wajib Diisi", "Masukkan judul yang deskriptif untuk naskah soal");
      return;
    }

    setIsSubmitting(true);
    setUploadProgressText("Memvalidasi checksum & mengunggah ke Google Drive...");

    try {
      const selectedStorage =
        storageProfiles.find((s) => s.id === storageProfileId) || activeStorage;

      const payload = {
        title: title.trim(),
        file_name: file.name,
        file_hash: fileHash,
        file_size: file.size,
        file_size_formatted: formatBytes(file.size),
        page_count: pageCount,
        storage_profile_id: selectedStorage?.id || "strg-primary-01",
        storage_profile_name: selectedStorage?.name || "Google Storage Utama",
        mata_pelajaran: mataPelajaran,
        jenjang,
        kelas,
        kurikulum,
        bab: bab || `Bab 1: Materi Pokok ${mataPelajaran}`,
        topik: topik || "Latihan dan Asesmen Soal",
        subtopik: subtopik || "",
        jenis_soal: jenisSoal,
        tingkat_kesulitan: tingkatKesulitan,
        tahun_ajaran: tahunAjaran,
        semester,
        sumber: sumber || currentUser.name,
        deskripsi: deskripsi || `Naskah Bank Soal ${mataPelajaran} Kelas ${kelas} ${jenjang}.`,
        tags: selectedTags.length > 0 ? selectedTags : [mataPelajaran, `Kelas ${kelas}`, jenjang],
      };

      setUploadProgressText("Menyimpan ke Google Drive & menyinkronkan Google Spreadsheet Index...");

      // Execute upload with failover
      const uploadResult = await StorageService.uploadWithFailover(payload, fileBase64);

      // Create Bank Soal record in database
      const createdItem = AppStore.createBankSoal({
        ...payload,
        file_url: uploadResult.webViewUrl,
        pdf_data_url: fileBase64 ? `data:application/pdf;base64,${fileBase64}` : undefined,
        drive_file_id: uploadResult.driveFileId,
        web_view_url: uploadResult.webViewUrl,
        storage_profile_id: uploadResult.storageProfileUsed.id,
        storage_profile_name: uploadResult.storageProfileUsed.name,
        sync_status: uploadResult.syncStatus,
      });

      setIsSubmitting(false);
      toast.success(
        "Bank Soal Berhasil Disimpan!",
        `${createdItem.business_id} - ${createdItem.title}`
      );
      onSuccess(createdItem);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      toast.error("Gagal Menyimpan Bank Soal", err.message || "Terjadi kesalahan upload");
    }
  };

  const handleSaveAsNewVersion = () => {
    if (!duplicateItem || !file) return;

    AppStore.createNewVersion(duplicateItem.id, {
      file_name: file.name,
      file_hash: fileHash,
      file_size: file.size,
      file_size_formatted: formatBytes(file.size),
      pdf_data_url: fileBase64 ? `data:application/pdf;base64,${fileBase64}` : undefined,
      change_note: `Revisi naskah baru diunggah oleh ${currentUser.name}`,
    });

    toast.success("Versi Baru Berhasil Disimpan", `Dirilis untuk ${duplicateItem.business_id}`);
    onSuccess(duplicateItem);
    onClose();
  };

  return (
    <div
      id="upload-pdf-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header with AI Selector on Right */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 border-b border-slate-800 bg-slate-850 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">Upload Bank Soal PDF</h3>
              <p className="text-xs text-slate-400">
                Arsipkan naskah soal terintegrasi Google Drive & Cloud Database
              </p>
            </div>
          </div>

          {/* Right Controls: AI Auto-fill Switch & Close Button */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* AI Toggle on Top-Right */}
            {isAiGlobalEnabled ? (
              <div
                onClick={() => setUseAiAutofill(!useAiAutofill)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer transition-all ${
                  useAiAutofill
                    ? "bg-purple-600/20 border-purple-500/50 text-purple-300 shadow-sm shadow-purple-600/20"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
                }`}
                title="Pilih apakah ingin menggunakan AI untuk mengisi metadata secara otomatis"
              >
                <Sparkles className={`w-3.5 h-3.5 ${useAiAutofill ? "text-purple-400 fill-purple-400" : "text-slate-400"}`} />
                <div className="text-[11px] font-semibold flex items-center gap-1.5">
                  <span>AI Auto-Fill:</span>
                  <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                    useAiAutofill ? "bg-purple-600 text-white" : "bg-slate-700 text-slate-300"
                  }`}>
                    {useAiAutofill ? "ON" : "OFF"}
                  </span>
                </div>
              </div>
            ) : (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-medium"
                title="Fitur AI dinonaktifkan oleh Administrator di Pengaturan Sistem"
              >
                <Bot className="w-3 h-3 text-slate-400" />
                <span>AI Dinonaktifkan</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6">
          {/* Step 1: File Selection & Drag Drop */}
          {step === 1 && !duplicateItem && (
            <div className="space-y-5">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    processFile(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-blue-500 bg-blue-500/10 scale-[1.01]"
                    : "border-slate-700 hover:border-blue-500 hover:bg-slate-800/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      processFile(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-white mb-1">
                  Tarik & Lepas Berkas PDF Soal ke Sini
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                  atau klik untuk memilih file PDF dari perangkat Anda (Maksimal 50 MB)
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all">
                  <Upload className="w-4 h-4" />
                  <span>Pilih File PDF</span>
                </div>
              </div>

              {/* Status Banner */}
              <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <HardDrive className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-slate-300 font-semibold">
                      Penyimpanan: {activeStorage?.name}
                    </p>
                    <p className="text-slate-400 text-[11px]">
                      Mode Upload: {isAiGlobalEnabled && useAiAutofill ? "AI Ekstraksi Otomatis Aktif" : "Input Form Manual"}
                    </p>
                  </div>
                </div>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  READY
                </span>
              </div>
            </div>
          )}

          {/* Duplicate Warning Dialog */}
          {duplicateItem && (
            <div className="space-y-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-amber-300">
                    File yang Sama Sudah Ada di Bank Soal
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Sistem mendeteksi checksum SHA-256 identik dengan dokumen soal yang sudah tersimpan:
                  </p>
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-700 mt-2 space-y-1">
                    <p className="text-xs font-bold text-white">
                      [{duplicateItem.business_id}] {duplicateItem.title}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Diupload oleh {duplicateItem.created_by_name} pada{" "}
                      {new Date(duplicateItem.created_at).toLocaleDateString("id-ID")} • Versi {duplicateItem.current_version_number}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDuplicateItem(null);
                    setFile(null);
                    setStep(1);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Batalkan Upload
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onOpenExisting(duplicateItem);
                    onClose();
                  }}
                  className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold rounded-xl border border-blue-500/30 flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4" />
                  <span>Lihat Dokumen Lama</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveAsNewVersion}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Layers className="w-4 h-4" />
                  <span>Simpan Sebagai Versi Baru ({duplicateItem.version_count + 1})</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: AI Suggestions Review */}
          {step === 2 && !duplicateItem && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Hasil Analisis Gemini AI</h4>
                    <p className="text-xs text-slate-400">
                      Rekomendasi taksonomi & kurikulum berdasarkan nama naskah
                    </p>
                  </div>
                </div>

                {aiConfidence > 0 && (
                  <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold rounded-full">
                    Akurasi: {Math.round(aiConfidence * 100)}%
                  </span>
                )}
              </div>

              {isAiLoading ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm font-semibold text-white">
                    Memproses Ekstraksi Cerdas Gemini AI...
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Menganalisis mata pelajaran, kurikulum, bab, dan tag dari berkas "{file?.name}"
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-850 rounded-2xl border border-slate-800 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block">Mata Pelajaran:</span>
                      <span className="font-bold text-white">{mataPelajaran}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Jenjang & Kelas:</span>
                      <span className="font-bold text-white">
                        {jenjang} - Kelas {kelas}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Kurikulum:</span>
                      <span className="font-bold text-white">{kurikulum}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Bentuk Soal:</span>
                      <span className="font-bold text-white">{jenisSoal}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Tingkat Kesulitan:</span>
                      <span className="font-bold text-white">{tingkatKesulitan}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Tahun Ajaran:</span>
                      <span className="font-bold text-white">
                        {tahunAjaran} ({semester})
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 text-xs">
                    <span className="text-slate-400 block mb-1">Rekomendasi Tag:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTags.map((t) => (
                        <span
                          key={t}
                          className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-md font-medium"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                    >
                      Ubah / Sesuaikan Form
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyAiSuggestion}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Gunakan Saran & Lanjutkan</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Full Metadata Review Form */}
          {step === 3 && (
            <form onSubmit={handleFinalSubmit} className="space-y-4">
              {/* Optional on-demand AI button if user skipped or wants to re-run */}
              {isAiGlobalEnabled && file && (
                <div className="p-3 bg-purple-950/20 border border-purple-800/40 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-purple-300">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Ingin bantuan AI untuk mengisi otomatis bidang form ini?</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => triggerAiExtraction(file)}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1.5"
                  >
                    <Zap className="w-3 h-3" />
                    <span>Ekstrak dengan AI</span>
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Judul Naskah Soal <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Naskah PTS Matematika Peminatan Kelas 11 SMA Semester Ganjil"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Mata Pelajaran */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Mata Pelajaran <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={mataPelajaran}
                    onChange={(e) => setMataPelajaran(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {subjects.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Jenjang & Kelas */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Jenjang</label>
                    <select
                      value={jenjang}
                      onChange={(e: any) => setJenjang(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="SD">SD / MI</option>
                      <option value="SMP">SMP / MTs</option>
                      <option value="SMA">SMA / MA</option>
                      <option value="SMK">SMK</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Kelas</label>
                    <select
                      value={kelas}
                      onChange={(e) => setKelas(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {[...Array(12)].map((_, i) => (
                        <option key={i + 1} value={String(i + 1)}>
                          Kelas {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Kurikulum */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kurikulum</label>
                  <select
                    value={kurikulum}
                    onChange={(e) => setKurikulum(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Kurikulum Merdeka">Kurikulum Merdeka</option>
                    <option value="Kurikulum 2013 (K13 Revisi)">Kurikulum 2013 (K13 Revisi)</option>
                    <option value="Cambridge International">Cambridge International</option>
                  </select>
                </div>

                {/* Bentuk Soal */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Bentuk Soal</label>
                  <select
                    value={jenisSoal}
                    onChange={(e: any) => setJenisSoal(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Pilihan Ganda">Pilihan Ganda</option>
                    <option value="Uraian / Essay">Uraian / Essay</option>
                    <option value="Campuran (PG & Essay)">Campuran (PG & Essay)</option>
                    <option value="AKM (Asesmen Kompetensi)">AKM (Literasi/Numerasi)</option>
                    <option value="HOTS (Higher Order Thinking)">HOTS</option>
                  </select>
                </div>

                {/* Bab */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Bab / Materi Pokok</label>
                  <input
                    type="text"
                    value={bab}
                    onChange={(e) => setBab(e.target.value)}
                    placeholder="Contoh: Bab 2: Sistem Persamaan Linear"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Topik & Subtopik */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Topik Utama</label>
                  <input
                    type="text"
                    value={topik}
                    onChange={(e) => setTopik(e.target.value)}
                    placeholder="Contoh: Metode Eliminasi Gauss"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Tingkat Kesulitan */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tingkat Kesulitan</label>
                  <select
                    value={tingkatKesulitan}
                    onChange={(e: any) => setTingkatKesulitan(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Mudah">Mudah (C1-C2)</option>
                    <option value="Sedang">Sedang (C3-C4)</option>
                    <option value="Sulit">Sulit / HOTS (C5-C6)</option>
                  </select>
                </div>

                {/* Tahun Ajaran & Semester */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Tahun Ajaran</label>
                    <input
                      type="text"
                      value={tahunAjaran}
                      onChange={(e) => setTahunAjaran(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Semester</label>
                    <select
                      value={semester}
                      onChange={(e: any) => setSemester(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Ganjil">Ganjil</option>
                      <option value="Genap">Genap</option>
                    </select>
                  </div>
                </div>

                {/* Tags */}
                <div className="md:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Tags & Label Kategori (Tekan Enter untuk menambah)
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-800 border border-slate-700 rounded-xl min-h-[42px]">
                    {selectedTags.map((t) => (
                      <span
                        key={t}
                        className="bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs px-2 py-0.5 rounded-md flex items-center gap-1"
                      >
                        #{t}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(t)}
                          className="hover:text-white"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder="Ketik tag lalu tekan enter..."
                      className="bg-transparent text-xs text-white focus:outline-none flex-1 min-w-[140px]"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                >
                  Kembali Ganti File
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{uploadProgressText || "Menyimpan..."}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Simpan ke Bank Soal</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
