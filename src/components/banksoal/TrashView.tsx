import React, { useState } from "react";
import {
  Trash2,
  RefreshCw,
  RotateCcw,
  AlertTriangle,
  FileText,
  ShieldAlert,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { BankSoal, UserProfile } from "../../types";
import { AppStore } from "../../services/store";
import { toast } from "../ui/Toast";

interface TrashViewProps {
  bankSoalList: BankSoal[];
  currentUser: UserProfile;
  onRefresh: () => void;
}

export const TrashView: React.FC<TrashViewProps> = ({
  bankSoalList,
  currentUser,
  onRefresh,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const isAdmin = currentUser.role === "ADMIN";

  const trashItems = bankSoalList.filter((b) => b.status === "trash");

  const handleRestore = (item: BankSoal) => {
    AppStore.restoreFromTrash(item.id);
    toast.success("Dokumen Dipulihkan", `"${item.title}" kembali ke Bank Soal aktif`);
    onRefresh();
  };

  const handlePermanentDelete = (item: BankSoal) => {
    // Check permission: admin or author
    const canDelete = isAdmin || item.created_by_id === currentUser.id;
    if (!canDelete) {
      toast.error("Akses Ditolak", "Hanya Administrator atau pengunggah soal yang dapat menghapus berkas permanen");
      return;
    }

    if (confirm(`Hapus permanen "${item.title}" (${item.business_id})?\n\nPERINGATAN: Berkas akan benar-benar dihapus dari database dan tidak dapat dipulihkan lagi.`)) {
      AppStore.permanentDelete(item.id);
      toast.warning("Dihapus Permanen", `${item.business_id} - ${item.title}`);
      onRefresh();
    }
  };

  const handleBatchRestore = () => {
    if (selectedIds.length === 0) return;
    selectedIds.forEach((id) => AppStore.restoreFromTrash(id));
    toast.success("Pemulihan Berhasil", `${selectedIds.length} berkas dipulihkan`);
    setSelectedIds([]);
    onRefresh();
  };

  const handleBatchPermanentDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Hapus permanen ${selectedIds.length} berkas yang dipilih?\n\nTindakan ini akan menghapus data selamanya dari database.`)) {
      selectedIds.forEach((id) => AppStore.permanentDelete(id));
      toast.warning("Dihapus Permanen", `${selectedIds.length} berkas dibersihkan dari database`);
      setSelectedIds([]);
      onRefresh();
    }
  };

  const handleEmptyTrash = () => {
    if (trashItems.length === 0) return;
    if (confirm(`Kosongkan Keranjang Sampah (${trashItems.length} dokumen)?\n\nSemua dokumen di keranjang sampah akan dihapus secara permanen!`)) {
      const count = AppStore.emptyTrash();
      toast.warning("Keranjang Sampah Dikosongkan", `${count} dokumen dihapus permanen`);
      setSelectedIds([]);
      onRefresh();
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === trashItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(trashItems.map((t) => t.id));
    }
  };

  return (
    <div id="trash-view" className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Keranjang Sampah</h2>
            <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {trashItems.length} Terhapus Sementara
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Data naskah yang dipindahkan ke sampah tersimpan di sini. Tekan <b>Pulihkan</b> untuk mengembalikan, atau <b>Hapus Permanen</b> untuk membersihkan data selamanya.
          </p>
        </div>

        {trashItems.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {selectedIds.length > 0 ? (
              <>
                <button
                  onClick={handleBatchRestore}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Pulihkan ({selectedIds.length})</span>
                </button>
                <button
                  onClick={handleBatchPermanentDelete}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Permanen ({selectedIds.length})</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleEmptyTrash}
                className="px-3.5 py-2 bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kosongkan Sampah</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Empty State */}
      {trashItems.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-md mx-auto my-8 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Trash2 className="w-7 h-7 text-slate-400" />
          </div>
          <h4 className="text-base font-bold text-white">Keranjang Sampah Kosong</h4>
          <p className="text-xs text-slate-400">
            Tidak ada berkas naskah soal di keranjang sampah.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-3 bg-slate-850 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedIds.length === trashItems.length && trashItems.length > 0}
                onChange={toggleSelectAll}
                className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
              />
              <span>Pilih Semua ({trashItems.length} Dokumen)</span>
            </div>
            {selectedIds.length > 0 && (
              <span className="text-blue-400 font-semibold">{selectedIds.length} dipilih</span>
            )}
          </div>

          <div className="divide-y divide-slate-800">
            {trashItems.map((item) => {
              const isSelected = selectedIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                    isSelected ? "bg-blue-950/20" : "hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(item.id)}
                      className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 shrink-0"
                    />

                    <div className="w-10 h-10 rounded-xl bg-slate-800 text-rose-400 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded">
                          {item.business_id}
                        </span>
                        <span className="text-xs text-slate-400">{item.mata_pelajaran} Kelas {item.kelas} ({item.jenjang})</span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-200 truncate mt-0.5">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {item.file_name} • {item.file_size_formatted} • Diunggah oleh: {item.created_by_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleRestore(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-xl text-xs font-semibold transition-colors border border-blue-500/30"
                      title="Kembalikan dokumen ke repositori aktif"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Pulihkan</span>
                    </button>

                    <button
                      onClick={() => handlePermanentDelete(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl text-xs font-semibold border border-rose-500/30 transition-colors"
                      title="Hapus permanen dari database"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Hapus Permanen</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
