import React, { useState, useEffect } from 'react';
import { History, Eye, Download, Upload, Star, Edit3, Trash2, Clock } from 'lucide-react';
import { UserHistoryItem } from '../types';
import { api } from '../lib/api';
import { formatDate } from '../lib/utils';
import { useToast } from '../components/Toast';

export const HistoryView: React.FC = () => {
  const { showToast } = useToast();
  const [history, setHistory] = useState<UserHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await api.getUserHistory();
      setHistory(res.history);
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat riwayat aktivitas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'PREVIEW':
        return <Eye className="w-4 h-4 text-blue-400" />;
      case 'DOWNLOAD':
        return <Download className="w-4 h-4 text-teal-400" />;
      case 'UPLOAD':
        return <Upload className="w-4 h-4 text-emerald-400" />;
      case 'EDIT':
        return <Edit3 className="w-4 h-4 text-purple-400" />;
      case 'FAVORITE':
        return <Star className="w-4 h-4 text-amber-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'PREVIEW':
        return 'Membuka / Preview Dokumen';
      case 'DOWNLOAD':
        return 'Mengunduh File PDF';
      case 'UPLOAD':
        return 'Mengunggah Bank Soal Baru';
      case 'EDIT':
        return 'Memperbarui Metadata Soal';
      case 'FAVORITE':
        return 'Menandai Soal Favorit';
      default:
        return action;
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <span>Riwayat Aktivitas & Akses Soal</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Jejak aktivitas pencarian, pembukaan dokumen, dan pengunduhan file bank soal oleh akun Anda.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-bold text-xs border border-slate-700">
          {history.length} Catatan
        </span>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Memuat log aktivitas...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center max-w-md mx-auto space-y-4">
          <div className="font-mono text-2xl text-slate-500 font-bold">[]</div>
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <History className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">Belum Ada Aktivitas Terrekam</h3>
          <p className="text-xs text-slate-400">
            Setiap kali Anda membuka naskah soal atau mengunduhnya, riwayatnya akan muncul di sini.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl divide-y divide-slate-800">
          {history.map((item) => (
            <div key={item.id} className="p-4 hover:bg-slate-850 transition-colors flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 shrink-0">
                  {getActionIcon(item.action)}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-white text-xs sm:text-sm truncate">
                    {item.bank_soal_judul}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    <span className="font-medium text-slate-300">{getActionLabel(item.action)}</span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0 text-xs text-slate-500 font-mono">
                {formatDate(item.timestamp)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
