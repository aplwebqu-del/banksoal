import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Lock,
  GraduationCap,
  BookOpen,
  Phone,
  Building,
  Image as ImageIcon,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  Database,
  Upload,
} from "lucide-react";
import { UserProfile } from "../../types";
import { AppStore } from "../../services/store";
import { toast } from "./Toast";

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onProfileUpdated: (updatedUser: UserProfile) => void;
}

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
];

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated,
}) => {
  const [name, setName] = useState(currentUser.name || "");
  const [username, setUsername] = useState(currentUser.username || "");
  const [email, setEmail] = useState(currentUser.email || "");
  const [nip, setNip] = useState(currentUser.nip || "");
  const [subjectSpecialty, setSubjectSpecialty] = useState(currentUser.subject_specialty || "");
  const [phone, setPhone] = useState(currentUser.phone || "");
  const [school, setSchool] = useState(currentUser.school || "");
  const [password, setPassword] = useState(currentUser.password || "");
  const [showPassword, setShowPassword] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatar_url || PRESET_AVATARS[0]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(currentUser.name || "");
      setUsername(currentUser.username || currentUser.email.split("@")[0] || "");
      setEmail(currentUser.email || "");
      setNip(currentUser.nip || "");
      setSubjectSpecialty(currentUser.subject_specialty || "");
      setPhone(currentUser.phone || "");
      setSchool(currentUser.school || "");
      setPassword(currentUser.password || (currentUser.role === "ADMIN" ? "admin" : "guru"));
      setAvatarUrl(currentUser.avatar_url || PRESET_AVATARS[0]);
      setShowPassword(false);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleCustomAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Format Tidak Valid", "Pilih file gambar (JPG, PNG, WebP)");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Foto Terlalu Besar", "Maksimal ukuran foto profil adalah 2 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setAvatarUrl(dataUrl);
        toast.success("Foto Berhasil Dipilih", "Foto profil baru siap disimpan.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama Lengkap Wajib Diisi");
      return;
    }
    if (!username.trim()) {
      toast.error("Username Wajib Diisi");
      return;
    }
    if (!email.trim()) {
      toast.error("Email Wajib Diisi");
      return;
    }
    if (!password.trim()) {
      toast.error("Kata Sandi Wajib Diisi");
      return;
    }

    setIsSaving(true);

    try {
      const updatedUser: UserProfile = {
        ...currentUser,
        name: name.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        nip: nip.trim(),
        subject_specialty: subjectSpecialty.trim(),
        phone: phone.trim(),
        school: school.trim(),
        password: password.trim(),
        avatar_url: avatarUrl,
      };

      // 1. Save in AppStore
      AppStore.saveUser(updatedUser);
      AppStore.setCurrentUser(updatedUser);

      // 2. Trigger automatic realtime sync to Google Spreadsheet (USERS Table)
      AppStore.triggerAutoRealtimeSync();

      // 3. Record Audit log
      AppStore.recordAuditLog({
        action: "USER_UPDATE",
        target_type: "User",
        target_id: updatedUser.id,
        target_title: updatedUser.name,
        details: `Pengajar memperbarui profil data diri: ${updatedUser.name} (${updatedUser.role})`,
      });

      setIsSaving(false);
      toast.success(
        "Profil Berhasil Diperbarui!",
        "Data diri Anda telah tersimpan dan disinkronkan ke database Google Spreadsheet."
      );

      onProfileUpdated(updatedUser);
      onClose();
    } catch (err: any) {
      setIsSaving(false);
      toast.error("Gagal Menyimpan Profil", err.message || "Terjadi kesalahan sistem");
    }
  };

  return (
    <div
      id="profile-edit-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">Edit Informasi Data Diri</h3>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    currentUser.role === "ADMIN"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  }`}
                >
                  {currentUser.role}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pembaruan data diri akan otomatis tersinkron ke database Google Spreadsheet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleFormSubmit} className="p-4 sm:p-6 space-y-5">
          {/* Avatar Section */}
          <div className="p-4 bg-slate-850 border border-slate-800 rounded-2xl space-y-3">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Foto Profil / Avatar Pengajar
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <img
                src={avatarUrl || PRESET_AVATARS[0]}
                alt="Avatar Pengajar"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500/40 bg-slate-800 shadow-md"
                referrerPolicy="no-referrer"
              />
              <div className="space-y-2 flex-1 w-full">
                <div className="flex flex-wrap items-center gap-2">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(url)}
                      className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-all ${
                        avatarUrl === url
                          ? "border-blue-500 scale-110 shadow-lg shadow-blue-500/20"
                          : "border-slate-700 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={url}
                        alt={`Preset ${idx + 1}`}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-colors">
                    <Upload className="w-3.5 h-3.5 text-blue-400" />
                    <span>Upload Foto Sendiri</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCustomAvatarUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[11px] text-slate-400">Max 2MB (JPG/PNG)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Nama Lengkap */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>Nama Lengkap & Gelar:</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Dra. Hj. Siti Aminah, M.Pd."
                required
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* Username */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Username Akun (Untuk Login):</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Contoh: sitiaminah"
                required
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>Alamat Email:</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Contoh: siti.aminah@sekolah.sch.id"
                required
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* NIP / NUPTK */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                <span>NIP / NUPTK / No. Induk:</span>
              </label>
              <input
                type="text"
                value={nip}
                onChange={(e) => setNip(e.target.value)}
                placeholder="Contoh: 19820415 200801 2 007"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
              />
            </div>

            {/* Mata Pelajaran / Spesialisasi */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Mata Pelajaran yang Diampu:</span>
              </label>
              <input
                type="text"
                value={subjectSpecialty}
                onChange={(e) => setSubjectSpecialty(e.target.value)}
                placeholder="Contoh: Matematika & Fisika"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* Telepon / WhatsApp */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-green-400" />
                <span>Nomor WhatsApp / HP:</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
              />
            </div>

            {/* Sekolah / Lembaga */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-sky-400" />
                <span>Nama Sekolah / Lembaga:</span>
              </label>
              <input
                type="text"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="Contoh: SMA Negeri Unggulan 1"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* Kata Sandi */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                  <span>Kata Sandi Baru:</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] text-slate-400 hover:text-blue-400 flex items-center gap-1"
                >
                  {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showPassword ? "Sembunyikan" : "Lihat Sandi"}</span>
                </button>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi baru"
                required
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Sync Info Banner */}
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-xs text-emerald-300">
            <Database className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="leading-relaxed text-[11px]">
              Setiap perubahan profil akan otomatis menyinkronkan data Anda ke tabel <strong className="text-white">USERS</strong> di Google Spreadsheet terhubung.
            </p>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menyinkronkan ke Database...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan & Sinkronkan Data</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
