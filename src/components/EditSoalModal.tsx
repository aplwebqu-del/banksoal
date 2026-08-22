import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Edit3, Tag } from 'lucide-react';
import { BankSoal } from '../types';
import { api } from '../lib/api';
import { useToast } from './Toast';

interface EditSoalModalProps {
  soal: BankSoal | null;
  onClose: () => void;
  onSuccess: (updated: BankSoal) => void;
}

export const EditSoalModal: React.FC<EditSoalModalProps> = ({ soal, onClose, onSuccess }) => {
  const { showToast } = useToast();

  const [formData, setFormData] = useState<Partial<BankSoal>>({
    judul: '',
    mata_pelajaran: '',
    jenjang: '',
    kelas: '',
    kurikulum: '',
    bab: '',
    topik: '',
    subtopik: '',
    jenis_soal: '',
    tingkat_kesulitan: '',
    tahun: new Date().getFullYear(),
    semester: '1',
    sumber: '',
    pembuat_pengajar: '',
    deskripsi: '',
    tags: [],
  });

  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (soal) {
      setFormData({
        judul: soal.judul || '',
        mata_pelajaran: soal.mata_pelajaran || '',
        jenjang: soal.jenjang || '',
        kelas: soal.kelas || '',
        kurikulum: soal.kurikulum || '',
        bab: soal.bab || '',
        topik: soal.topik || '',
        subtopik: soal.subtopik || '',
        jenis_soal: soal.jenis_soal || '',
        tingkat_kesulitan: soal.tingkat_kesulitan || '',
        tahun: soal.tahun || new Date().getFullYear(),
        semester: soal.semester || '1',
        sumber: soal.sumber || '',
        pembuat_pengajar: soal.pembuat_pengajar || '',
        deskripsi: soal.deskripsi || '',
        tags: [...(soal.tags || [])],
      });
      setTagInput('');
    }
  }, [soal]);

  if (!soal) return null;

  const handleFieldChange = (field: keyof BankSoal, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const formatted = tagInput.trim().startsWith('#') ? tagInput.trim() : `#${tagInput.trim()}`;
    if (!formData.tags?.includes(formatted)) {
      setFormData((prev) => ({ ...prev, tags: [...(prev.tags || []), formatted] }));
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((t) => t !== tagToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul?.trim()) {
      showToast('Judul soal tidak boleh kosong.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await api.updateBankSoal(soal.id, formData);
      showToast('Metadata bank soal berhasil diperbarui!', 'success');
      onSuccess(res.item);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Gagal memperbarui bank soal', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <Edit3 className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-white text-base">Edit Metadata Bank Soal</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Judul Bank Soal</label>
            <input
              type="text"
              value={formData.judul || ''}
              onChange={(e) => handleFieldChange('judul', e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Mata Pelajaran</label>
              <input
                type="text"
                value={formData.mata_pelajaran || ''}
                onChange={(e) => handleFieldChange('mata_pelajaran', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Kelas / Jenjang</label>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="text"
                  placeholder="Kelas"
                  value={formData.kelas || ''}
                  onChange={(e) => handleFieldChange('kelas', e.target.value)}
                  className="px-2 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  required
                />
                <select
                  value={formData.jenjang || 'SMP'}
                  onChange={(e) => handleFieldChange('jenjang', e.target.value as any)}
                  className="px-2 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                >
                  <option value="SD">SD</option>
                  <option value="SMP">SMP</option>
                  <option value="SMA">SMA</option>
                  <option value="SMK">SMK</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Bab / Pokok Bahasan</label>
              <input
                type="text"
                value={formData.bab || ''}
                onChange={(e) => handleFieldChange('bab', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Topik</label>
              <input
                type="text"
                value={formData.topik || ''}
                onChange={(e) => handleFieldChange('topik', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Jenis Soal</label>
              <select
                value={formData.jenis_soal || 'Pilihan Ganda'}
                onChange={(e) => handleFieldChange('jenis_soal', e.target.value as any)}
                className="w-full px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
              >
                <option value="Pilihan Ganda">Pilihan Ganda</option>
                <option value="Essay">Essay</option>
                <option value="Campuran">Campuran</option>
                <option value="HOTS">HOTS</option>
                <option value="AKM">AKM</option>
                <option value="SNBT">SNBT</option>
                <option value="Tryout">Tryout</option>
                <option value="PAS">PAS</option>
                <option value="PAT">PAT</option>
                <option value="PTS">PTS</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Tingkat Kesulitan</label>
              <select
                value={formData.tingkat_kesulitan || 'Sedang'}
                onChange={(e) => handleFieldChange('tingkat_kesulitan', e.target.value as any)}
                className="w-full px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
              >
                <option value="Mudah">Mudah</option>
                <option value="Sedang">Sedang</option>
                <option value="Sulit">Sulit</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Tahun</label>
              <input
                type="number"
                value={formData.tahun || 2026}
                onChange={(e) => handleFieldChange('tahun', parseInt(e.target.value, 10))}
                className="w-full px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
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
                placeholder="Tambah tag lalu tekan Enter"
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 font-semibold"
              >
                Tambah
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {formData.tags?.map((t, idx) => (
                <span
                  key={idx}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-slate-800 text-slate-300 border border-slate-700"
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

          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Deskripsi</label>
            <textarea
              rows={2}
              value={formData.deskripsi || ''}
              onChange={(e) => handleFieldChange('deskripsi', e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
            />
          </div>

          {/* Buttons */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
