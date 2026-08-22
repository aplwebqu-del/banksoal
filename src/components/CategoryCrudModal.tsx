import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  GraduationCap,
  Calculator,
  Languages,
  FlaskConical,
  Atom,
  TestTubes,
  Dna,
  Binary,
  TrendingUp,
  Landmark,
  Compass,
  Music,
  Palette,
  School,
  Sparkles,
  Globe,
  Award,
  Layers,
  FileSpreadsheet,
  Check,
  Tag,
} from 'lucide-react';
import { CategoryItem } from '../types';
import { api } from '../lib/api';
import { useToast } from './Toast';

export interface CategoryCrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: CategoryItem | null; // null for Create, object for Edit
  defaultType?: 'mata_pelajaran' | 'jenjang' | 'jenis_soal' | 'kurikulum';
  onSuccess: (saved: CategoryItem, isNew: boolean) => void;
}

const AVAILABLE_ICONS = [
  { name: 'BookOpen', label: 'Buku', Icon: BookOpen },
  { name: 'Calculator', label: 'Kalkulator', Icon: Calculator },
  { name: 'Languages', label: 'Bahasa', Icon: Languages },
  { name: 'FlaskConical', label: 'IPA / Lab', Icon: FlaskConical },
  { name: 'Atom', label: 'Fisika', Icon: Atom },
  { name: 'TestTubes', label: 'Kimia', Icon: TestTubes },
  { name: 'Dna', label: 'Biologi', Icon: Dna },
  { name: 'Binary', label: 'Informatika', Icon: Binary },
  { name: 'TrendingUp', label: 'Ekonomi', Icon: TrendingUp },
  { name: 'Landmark', label: 'Sejarah', Icon: Landmark },
  { name: 'Compass', label: 'Geografi', Icon: Compass },
  { name: 'Palette', label: 'Seni Rupa', Icon: Palette },
  { name: 'Music', label: 'Musik', Icon: Music },
  { name: 'GraduationCap', label: 'Jenjang', Icon: GraduationCap },
  { name: 'School', label: 'Sekolah', Icon: School },
  { name: 'Globe', label: 'Global', Icon: Globe },
  { name: 'Award', label: 'Prestasi', Icon: Award },
  { name: 'Sparkles', label: 'Umum / HOTS', Icon: Sparkles },
  { name: 'Layers', label: 'Klasifikasi', Icon: Layers },
  { name: 'FileSpreadsheet', label: 'Format Ujian', Icon: FileSpreadsheet },
];

const AVAILABLE_COLORS = [
  { name: 'from-blue-600 to-indigo-600', label: 'Biru Indigo', border: 'border-blue-500/40', badge: 'bg-blue-500/20 text-blue-300' },
  { name: 'from-emerald-600 to-teal-600', label: 'Hijau Emerald', border: 'border-emerald-500/40', badge: 'bg-emerald-500/20 text-emerald-300' },
  { name: 'from-rose-600 to-pink-600', label: 'Merah Rose', border: 'border-rose-500/40', badge: 'bg-rose-500/20 text-rose-300' },
  { name: 'from-amber-600 to-orange-600', label: 'Kuning Amber', border: 'border-amber-500/40', badge: 'bg-amber-500/20 text-amber-300' },
  { name: 'from-purple-600 to-violet-600', label: 'Ungu Violet', border: 'border-purple-500/40', badge: 'bg-purple-500/20 text-purple-300' },
  { name: 'from-cyan-600 to-blue-600', label: 'Cyan Sky', border: 'border-cyan-500/40', badge: 'bg-cyan-500/20 text-cyan-300' },
  { name: 'from-teal-600 to-emerald-600', label: 'Teal Laut', border: 'border-teal-500/40', badge: 'bg-teal-500/20 text-teal-300' },
  { name: 'from-stone-600 to-zinc-700', label: 'Netral Stone', border: 'border-stone-500/40', badge: 'bg-stone-500/20 text-stone-300' },
];

export const CategoryCrudModal: React.FC<CategoryCrudModalProps> = ({
  isOpen,
  onClose,
  category,
  defaultType = 'mata_pelajaran',
  onSuccess,
}) => {
  const { showToast } = useToast();
  const isEditing = !!category;

  const [type, setType] = useState<string>(defaultType);
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [icon, setIcon] = useState<string>('BookOpen');
  const [color, setColor] = useState<string>('from-blue-600 to-indigo-600');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (category) {
      setType(category.type || 'mata_pelajaran');
      setName(category.name || '');
      setCode(category.code || '');
      setTitle(category.title || '');
      setDescription(category.description || '');
      setIcon(category.icon || (category.type === 'jenjang' ? 'GraduationCap' : 'BookOpen'));
      setColor(category.color || 'from-blue-600 to-indigo-600');
    } else {
      setType(defaultType);
      setName('');
      setCode('');
      setTitle('');
      setDescription('');
      setIcon(defaultType === 'jenjang' ? 'GraduationCap' : 'BookOpen');
      setColor(defaultType === 'jenjang' ? 'from-amber-600 to-orange-600' : 'from-blue-600 to-indigo-600');
    }
  }, [category, defaultType, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Nama kategori wajib diisi.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && category) {
        const res = await api.updateCategory(category.id, {
          type,
          name: name.trim(),
          code: code.trim(),
          title: title.trim(),
          description: description.trim(),
          icon,
          color,
        });
        showToast(`Kategori "${name}" berhasil diperbarui!`, 'success');
        onSuccess(res.category, false);
      } else {
        const res = await api.createCategory({
          type,
          name: name.trim(),
          code: code.trim(),
          description: description.trim(),
          icon,
          color,
        });
        showToast(`Kategori "${name}" berhasil ditambahkan!`, 'success');
        onSuccess(res.category, true);
      }
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan kategori', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const SelectedIconComp = AVAILABLE_ICONS.find((i) => i.name === icon)?.Icon || BookOpen;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <SelectedIconComp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                {isEditing ? 'Ubah (Edit) Kategori' : 'Tambah Kategori Baru'}
              </h3>
              <p className="text-xs text-slate-400">
                {type === 'mata_pelajaran'
                  ? 'Master Klasifikasi Mata Pelajaran & Kurikulum'
                  : type === 'jenjang'
                  ? 'Master Klasifikasi Jenjang Pendidikan Sekolah'
                  : 'Master Pengaturan Klasifikasi Soal'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Tipe Kategori */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tipe Klasifikasi <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'mata_pelajaran', label: 'Mata Pelajaran' },
                { id: 'jenjang', label: 'Jenjang' },
                { id: 'jenis_soal', label: 'Jenis Soal' },
                { id: 'kurikulum', label: 'Kurikulum' },
              ].map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                    type === t.id
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Nama & Kode */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nama {type === 'mata_pelajaran' ? 'Mata Pelajaran' : type === 'jenjang' ? 'Jenjang' : 'Kategori'}{' '}
                <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  type === 'mata_pelajaran'
                    ? 'Misal: Seni Budaya & Prakarya'
                    : type === 'jenjang'
                    ? 'Misal: MA (Madrasah Aliyah)'
                    : 'Misal: Kurikulum Merdeka'
                }
                className="w-full px-3.5 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Kode / Singkatan
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Misal: SBP, MA"
                maxLength={8}
                className="w-full px-3.5 py-2 text-sm font-mono uppercase bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Judul Lengkap (khusus Jenjang / Kategori) */}
          {type === 'jenjang' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nama Kepanjangan / Gelar Jenjang
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Misal: Madrasah Aliyah Negeri & Swasta"
                className="w-full px-3.5 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
              />
            </div>
          )}

          {/* Deskripsi / Cakupan Materi */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Deskripsi / Cakupan Pokok Bahasan
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                type === 'mata_pelajaran'
                  ? 'Misal: Seni Rupa, Seni Musik, Seni Tari, Prakarya & Kerajinan'
                  : type === 'jenjang'
                  ? 'Misal: Setara SMA/SMK Kelas 10 sampai Kelas 12'
                  : 'Keterangan tambahan untuk kategori ini...'
              }
              className="w-full px-3.5 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Pilihan Ikon */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Pilihan Ikon Visual
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-36 overflow-y-auto p-1.5 bg-slate-950/60 rounded-xl border border-slate-800">
              {AVAILABLE_ICONS.map((item) => {
                const IComp = item.Icon;
                const isSelected = icon === item.name;
                return (
                  <button
                    type="button"
                    key={item.name}
                    onClick={() => setIcon(item.name)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-blue-600/30 border-blue-500 text-blue-300 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                    title={item.label}
                  >
                    <IComp className="w-4 h-4 mb-1" />
                    <span className="text-[10px] truncate max-w-full leading-tight font-medium">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pilihan Warna Tema Gradien */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tema Warna
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {AVAILABLE_COLORS.map((c) => {
                const isSelected = color === c.name;
                return (
                  <button
                    type="button"
                    key={c.name}
                    onClick={() => setColor(c.name)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-white bg-slate-800 shadow-md ring-1 ring-white/50'
                        : 'border-slate-800 bg-slate-900 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${c.name} shrink-0`} />
                    <span className="text-xs text-slate-200 truncate">{c.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 ml-auto shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="pt-2">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Pratinjau Tampilan Kartu
            </label>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-lg`}>
                  <SelectedIconComp className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-sm">{name || 'Nama Kategori'}</h4>
                    {code && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {code}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                    {description || (type === 'jenjang' ? title || 'Tingkat pendidikan sekolah' : 'Cakupan pokok bahasan')}
                  </p>
                </div>
              </div>
              <span className="text-xs text-blue-400 font-semibold px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
                0 Soal
              </span>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>{isEditing ? 'Simpan Perubahan' : 'Tambah Kategori'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
