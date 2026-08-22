import React, { useState, useEffect } from 'react';
import { X, User as UserIcon, Mail, Shield, School, BookOpen, CheckCircle2, UserCheck, UserX, KeyRound, Eye, EyeOff } from 'lucide-react';
import { User, UserRole, UserStatus } from '../types';

interface UserCrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (user: User, isNew: boolean) => void;
  editingUser: User | null;
}

export const UserCrudModal: React.FC<UserCrudModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  editingUser,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'GURU' as UserRole,
    status: 'ACTIVE' as UserStatus,
    school_institution: '',
    subject: '',
    avatar: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingUser) {
      setFormData({
        name: editingUser.name || '',
        email: editingUser.email || '',
        password: '',
        role: editingUser.role || 'GURU',
        status: editingUser.status || 'ACTIVE',
        school_institution: editingUser.school_institution || '',
        subject: editingUser.subject || '',
        avatar: editingUser.avatar || '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        password: 'password123',
        role: 'GURU',
        status: 'ACTIVE',
        school_institution: 'SMA Negeri 1 Teladan',
        subject: 'Matematika & IPA',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      });
    }
    setShowPassword(false);
    setErrors({});
  }, [editingUser, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Nama lengkap wajib diisi.';
    if (!formData.email.trim()) {
      errs.email = 'Email institusi/pengajar wajib diisi.';
    } else if (!formData.email.includes('@')) {
      errs.email = 'Format email tidak valid.';
    }
    if (!editingUser && !formData.password.trim()) {
      errs.password = 'Kata sandi akun wajib diisi.';
    } else if (formData.password && formData.password.length < 5) {
      errs.password = 'Kata sandi minimal 5 karakter.';
    }
    if (!formData.school_institution.trim()) errs.school_institution = 'Nama sekolah/institusi wajib diisi.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      if (editingUser) {
        const updatedUser: User = {
          ...editingUser,
          ...formData,
          ...(formData.password ? { password: formData.password } : {}),
        };
        onSaved(updatedUser, false);
      } else {
        const newUser: User = {
          id: `u-${Date.now()}`,
          ...formData,
        };
        onSaved(newUser, true);
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {editingUser ? 'Edit Akun & Kata Sandi Pengguna' : 'Tambah Pengajar / Pengguna Baru'}
              </h3>
              <p className="text-xs text-slate-400">
                Data tersimpan di basis data Google Sheets (Tabel USERS).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Nama */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-blue-400" />
              <span>Nama Lengkap & Gelar *</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Dra. Hj. Nurhayati, M.Pd."
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && <p className="text-rose-400 text-[11px] mt-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              <span>Email Institusi / Akun Google *</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="contoh: nama.guru@sekolah.sch.id"
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.email && <p className="text-rose-400 text-[11px] mt-1">{errors.email}</p>}
          </div>

          {/* Password Login */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>{editingUser ? 'Ganti Kata Sandi (Password)' : 'Kata Sandi Login (Password) *'}</span>
              </span>
              {editingUser && (
                <span className="text-[10px] text-slate-500 font-normal">Kosongkan jika tidak diubah</span>
              )}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingUser ? 'Ketik kata sandi baru untuk mengganti...' : 'Masukkan kata sandi login...'}
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-rose-400 text-[11px] mt-1">{errors.password}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Role */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span>Hak Akses (Role) *</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ADMIN">ADMIN (Akses Penuh & Konfigurasi)</option>
                <option value="GURU">GURU (Upload, Edit Soal Sendiri, Unduh)</option>
                <option value="EDITOR">EDITOR (Verifikasi & Edit Semua Soal)</option>
                <option value="VIEWER">VIEWER (Hanya Pratinjau & Unduh)</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Status Akun *</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ACTIVE">ACTIVE (Dapat Mengakses Sistem)</option>
                <option value="INACTIVE">INACTIVE (Akses Dinonaktifkan)</option>
              </select>
            </div>
          </div>

          {/* Sekolah / Institusi */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
              <School className="w-3.5 h-3.5 text-amber-400" />
              <span>Sekolah / Institusi Pendidikan *</span>
            </label>
            <input
              type="text"
              value={formData.school_institution}
              onChange={(e) => setFormData({ ...formData, school_institution: e.target.value })}
              placeholder="Contoh: SMA Negeri 1 Teladan Jakarta"
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.school_institution && (
              <p className="text-rose-400 text-[11px] mt-1">{errors.school_institution}</p>
            )}
          </div>

          {/* Mata Pelajaran yang Diampu */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mata Pelajaran / Bidang Keahlian</span>
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Contoh: Fisika, Matematika Wajib, Kimia"
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Avatar URL */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">URL Foto Profil (Avatar)</label>
            <input
              type="url"
              value={formData.avatar}
              onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
              placeholder="https://..."
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : editingUser ? 'Simpan Perubahan' : 'Tambah Pengguna'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

