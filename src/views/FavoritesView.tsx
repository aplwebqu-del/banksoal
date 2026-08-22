import React, { useState, useEffect } from 'react';
import { Star, FileText, Download, Eye, Trash2, BookOpen } from 'lucide-react';
import { BankSoal, User } from '../types';
import { api } from '../lib/api';
import { formatBytes, formatDate, getDifficultyColor } from '../lib/utils';
import { useToast } from '../components/Toast';

interface FavoritesViewProps {
  currentUser: User;
  onPreview: (soal: BankSoal) => void;
  onToggleFavorite: (id: string) => void;
  onNavigateAll: () => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  currentUser,
  onPreview,
  onToggleFavorite,
  onNavigateAll,
}) => {
  const { showToast } = useToast();
  const [items, setItems] = useState<BankSoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const res = await api.getBankSoal({ is_favorite: true, limit: 50 });
      setItems(res.items);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat daftar favorit', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFav = async (id: string) => {
    await onToggleFavorite(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <span>Soal Favorit Saya</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Kumpulan bank soal yang Anda beri tanda bintang untuk akses cepat dan persiapan mengajar.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30">
          {items.length} Tersimpan
        </span>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Memuat soal favorit...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4">
          <div className="font-mono text-2xl text-slate-500 font-bold">[]</div>
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-amber-400">
            <Star className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">Belum Ada Soal Favorit</h3>
          <p className="text-xs text-slate-400">
            Tandai ikon bintang (⭐) pada kartu bank soal mana pun untuk menyimpannya di halaman ini.
          </p>
          <button
            onClick={onNavigateAll}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white text-xs shadow-md"
          >
            Jelajahi Semua Bank Soal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((soal) => {
            const diffColor = getDifficultyColor(soal.tingkat_kesulitan);
            return (
              <div
                key={soal.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {soal.mata_pelajaran}
                    </span>
                    <button
                      onClick={() => handleRemoveFav(soal.id)}
                      className="p-1 text-amber-400 hover:text-rose-400 transition-colors"
                      title="Hapus dari Favorit"
                    >
                      <Star className="w-4 h-4 fill-amber-400" />
                    </button>
                  </div>

                  <h3
                    onClick={() => onPreview(soal)}
                    className="font-bold text-white text-sm hover:text-blue-400 cursor-pointer line-clamp-2 transition-colors"
                  >
                    {soal.judul}
                  </h3>

                  <div className="mt-2 text-xs text-slate-400 space-y-0.5">
                    <p className="truncate">
                      Kelas {soal.kelas} ({soal.jenjang}) • {soal.bab}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3 text-[10px]">
                    <span
                      className={`px-2 py-0.5 rounded-md border font-semibold ${diffColor.bg} ${diffColor.text} ${diffColor.border}`}
                    >
                      {soal.tingkat_kesulitan}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                      {soal.jenis_soal}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>{formatBytes(soal.ukuran_file)}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onPreview(soal)}
                      className="px-3 py-1 rounded-lg bg-blue-600/20 text-blue-300 hover:bg-blue-600 hover:text-white text-xs font-semibold"
                    >
                      Preview
                    </button>
                    <a
                      href={`/api/bank-soal/${soal.id}/download`}
                      download={soal.nama_file}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
