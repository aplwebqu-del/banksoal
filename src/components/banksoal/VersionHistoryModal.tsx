import React, { useState } from "react";
import {
  X,
  History,
  Upload,
  FileText,
  Clock,
  CheckCircle,
  Download,
  ArrowRight,
  ShieldCheck,
  Plus,
} from "lucide-react";
import { BankSoal, BankSoalVersion, UserProfile } from "../../types";
import { AppStore, computeFileHash, formatBytes } from "../../services/store";
import { toast } from "../ui/Toast";

interface VersionHistoryModalProps {
  item: BankSoal | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  item,
  isOpen,
  onClose,
  currentUser,
}) => {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [changeNote, setChangeNote] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen || !item) return null;

  const versions = AppStore.getVersions(item.id);

  const handleUploadNewVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFile) {
      toast.error("File Diperlukan", "Pilih file PDF revisi baru");
      return;
    }

    setIsUploading(true);
    try {
      const hash = await computeFileHash(newFile);

      AppStore.createNewVersion(item.id, {
        file_name: newFile.name,
        file_hash: hash,
        file_size: newFile.size,
        file_size_formatted: formatBytes(newFile.size),
        change_note: changeNote.trim() || `Pembaruan naskah oleh ${currentUser.name}`,
      });

      toast.success(
        "Versi Baru Berhasil Dibuat",
        `Versi ${item.current_version_number + 1} aktif untuk ${item.business_id}`
      );
      setShowUploadForm(false);
      setNewFile(null);
      setChangeNote("");
      setIsUploading(false);
    } catch (err: any) {
      setIsUploading(false);
      toast.error("Gagal Mengunggah Versi Baru", err.message);
    }
  };

  return (
    <div
      id="version-history-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Riwayat Versi Naskah Soal</h3>
              <p className="text-xs text-slate-400">
                [{item.business_id}] {item.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Upload New Version Toggle */}
          {!showUploadForm ? (
            <button
              onClick={() => setShowUploadForm(true)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-750 border border-dashed border-slate-700 hover:border-purple-500 rounded-2xl text-xs font-semibold text-purple-300 flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Unggah Naskah Revisi Baru (v{item.current_version_number + 1})</span>
            </button>
          ) : (
            <form
              onSubmit={handleUploadNewVersion}
              className="bg-slate-850 border border-slate-800 p-4 rounded-2xl space-y-3"
            >
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Unggah Versi Revisi Naskah Baru
              </h4>
              <div>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  required
                  onChange={(e) => setNewFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Catatan perubahan (Contoh: Koreksi kunci jawaban & soal no 14)"
                  value={changeNote}
                  onChange={(e) => setChangeNote(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-medium rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg shadow-md"
                >
                  {isUploading ? "Mengunggah..." : "Simpan Revisi"}
                </button>
              </div>
            </form>
          )}

          {/* Timeline of Versions */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Daftar Riwayat Revisi
            </h4>

            <div className="space-y-3">
              {versions.map((ver) => {
                const isCurrent = ver.version_number === item.current_version_number;

                return (
                  <div
                    key={ver.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isCurrent
                        ? "bg-purple-950/20 border-purple-500/40 shadow-sm"
                        : "bg-slate-850 border-slate-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isCurrent
                              ? "bg-purple-600 text-white"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          v{ver.version_number}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-sm font-bold text-white">{ver.file_name}</h5>
                            {isCurrent && (
                              <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-bold px-1.5 py-0.2 rounded">
                                VERSI AKTIF
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {ver.change_note || "Naskah awal dibuat"}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2 font-mono">
                            <span>{ver.file_size_formatted}</span>
                            <span>•</span>
                            <span>Oleh {ver.created_by_name}</span>
                            <span>•</span>
                            <span>
                              {new Date(ver.created_at).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <button
                          onClick={() => {
                            toast.info("Mengunduh Versi Naskah", `v${ver.version_number}`);
                          }}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors"
                          title="Unduh versi ini"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
