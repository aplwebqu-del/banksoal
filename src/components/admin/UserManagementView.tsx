import React, { useState } from "react";
import {
  Users,
  UserPlus,
  Shield,
  GraduationCap,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Lock,
  Search,
  Filter,
  Eye,
  EyeOff,
  UserCheck,
  Image as ImageIcon,
  Key,
  Copy,
  Sparkles,
} from "lucide-react";
import { UserProfile, UserRole } from "../../types";
import { AppStore } from "../../services/store";
import { toast } from "../ui/Toast";

interface UserManagementViewProps {
  currentUser: UserProfile;
  onRefresh: () => void;
}

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
];

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  currentUser,
  onRefresh,
}) => {
  const users = AppStore.getUsers();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  // Form states
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [role, setRole] = useState<UserRole>("GURU");
  const [nip, setNip] = useState("");
  const [subjectSpecialty, setSubjectSpecialty] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  const togglePasswordVisibility = (userId: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Tersalin ke Clipboard", `${label}: ${text}`);
  };

  const handleSwitchUser = (u: UserProfile) => {
    AppStore.setCurrentUser(u);
    toast.success("Beralih Pengguna Berhasil", `Sekarang login sebagai ${u.name} (${u.role})`);
    onRefresh();
  };

  const openAddModal = () => {
    setEditingUser(null);
    setName("");
    setUsername("");
    setEmail("");
    setPassword("guru");
    setAvatarUrl(PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)]);
    setRole("GURU");
    setNip("");
    setSubjectSpecialty("Matematika");
    setStatus("ACTIVE");
    setIsModalOpen(true);
  };

  const openEditModal = (u: UserProfile) => {
    setEditingUser(u);
    setName(u.name);
    setUsername(u.username || u.email.split("@")[0]);
    setEmail(u.email);
    setPassword(u.password || (u.role === "ADMIN" ? "admin" : "guru"));
    setAvatarUrl(u.avatar_url || PRESET_AVATARS[0]);
    setRole(u.role);
    setNip(u.nip || "");
    setSubjectSpecialty(u.subject_specialty || "");
    setStatus(u.status === "active" || u.status === "ACTIVE" ? "ACTIVE" : "INACTIVE");
    setIsModalOpen(true);
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file terlalu besar", "Maksimal ukuran foto avatar adalah 2 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatarUrl(event.target.result as string);
        toast.success("Foto avatar berhasil dimuat!");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteUser = (u: UserProfile) => {
    if (u.id === currentUser.id) {
      toast.warning("Tidak Dapat Dihapus", "Anda tidak dapat menghapus akun yang sedang aktif digunakan.");
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus akun pengajar "${u.name}" (${u.email})?`)) {
      AppStore.deleteUser(u.id);
      toast.success("Pengguna Dihapus", u.name);
      onRefresh();
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Nama & Email Wajib Diisi");
      return;
    }

    const finalUsername = username.trim() || email.split("@")[0];
    const finalPassword = password.trim() || (role === "ADMIN" ? "admin" : "guru");

    if (editingUser) {
      AppStore.updateUser(editingUser.id, {
        name: name.trim(),
        username: finalUsername,
        email: email.trim(),
        password: finalPassword,
        avatar_url: avatarUrl,
        role,
        nip: nip.trim(),
        subject_specialty: subjectSpecialty.trim(),
        status,
      });
      toast.success("Akun Pengguna Diperbarui", name);
    } else {
      AppStore.addUser({
        name: name.trim(),
        username: finalUsername,
        email: email.trim(),
        password: finalPassword,
        avatar_url: avatarUrl,
        role,
        nip: nip.trim(),
        subject_specialty: subjectSpecialty.trim(),
        status,
      });
      toast.success("Pengguna Baru Ditambahkan", name);
    }

    setIsModalOpen(false);
    onRefresh();
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.nip && u.nip.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.subject_specialty && u.subject_specialty.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div id="user-management-view" className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Tabel Pengguna & Kredensial Login
            </h2>
            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {users.length} Akun Terdaftar
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Kelola data Username, Email, Password, Foto Avatar pengajar, dan lakukan simulasi Switch User secara eksklusif dari panel admin.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02]"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pengajar Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, username, email, NIP, mapel..."
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Semua Peran</option>
            <option value="ADMIN">Administrator</option>
            <option value="GURU">Guru Pengajar</option>
          </select>
        </div>
      </div>

      {/* User Table with Credentials */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-850 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Pengajar & Avatar</th>
                <th className="py-3.5 px-4">Username (Email)</th>
                <th className="py-3.5 px-4">Kata Sandi</th>
                <th className="py-3.5 px-4">Peran & NIP</th>
                <th className="py-3.5 px-4">Mata Pelajaran</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    Tidak ada data pengguna yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  const isRevealed = Boolean(revealedPasswords[u.id]);
                  const passVal = u.password || (u.role === "ADMIN" ? "admin" : "guru");

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isCurrent ? "bg-blue-950/20" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar_url || PRESET_AVATARS[0]}
                            alt={u.name}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-700 bg-slate-800 shadow-sm shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-white text-sm truncate max-w-[160px]">{u.name}</p>
                              {isCurrent && (
                                <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[9px] font-bold px-1.5 py-0.2 rounded">
                                  Aktif
                                </span>
                              )}
                            </div>
                            <p className="text-slate-400 text-[11px] truncate max-w-[160px]">{u.school || "SMA Negeri"}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-xs font-semibold text-blue-300">
                              {u.username || u.email.split("@")[0]}
                            </span>
                            <button
                              onClick={() => handleCopyText(u.username || u.email.split("@")[0], "Username")}
                              title="Salin Username"
                              className="text-slate-400 hover:text-white p-0.5"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate max-w-[150px]">{u.email}</p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-750 px-2.5 py-1 rounded-lg w-fit">
                          <span className="font-mono text-xs text-amber-300">
                            {isRevealed ? passVal : "••••••••"}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(u.id)}
                            className="text-slate-400 hover:text-white p-0.5"
                            title={isRevealed ? "Sembunyikan" : "Tampilkan Sandi"}
                          >
                            {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyText(passVal, "Password")}
                            className="text-slate-400 hover:text-white p-0.5"
                            title="Salin Kata Sandi"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                              u.role === "ADMIN"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            }`}
                          >
                            {u.role}
                          </span>
                          <p className="font-mono text-[11px] text-slate-400">{u.nip || "-"}</p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-200">
                        {u.subject_specialty || "Semua Bidang"}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit ${
                            u.status.toUpperCase() === "ACTIVE"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-rose-500/20 text-rose-300"
                          }`}
                        >
                          {u.status.toUpperCase() === "ACTIVE" ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          <span>{u.status.toUpperCase()}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Switch User (Only Available in Admin Panel) */}
                          <button
                            onClick={() => handleSwitchUser(u)}
                            disabled={isCurrent}
                            className="px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed rounded-xl border border-blue-500/30 text-[11px] font-semibold transition-all flex items-center gap-1"
                            title={isCurrent ? "Sedang aktif digunakan" : "Beralih ke akun ini (Simulasi Login)"}
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Switch Akun</span>
                          </button>

                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors"
                            title="Edit Pengguna & Password"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteUser(u)}
                            disabled={isCurrent}
                            className="p-1.5 bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl border border-slate-700 hover:border-rose-800 transition-colors"
                            title={isCurrent ? "Akun sedang aktif" : "Hapus Pengguna"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Form Modal (With Password & Avatar controls) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-850">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">
                  {editingUser ? "Edit Profil & Kata Sandi Pengguna" : "Tambah Pengajar Baru"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              {/* Avatar Selection & Upload */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Foto Avatar Pengajar
                </label>
                <div className="flex items-center gap-3">
                  <img
                    src={avatarUrl || PRESET_AVATARS[0]}
                    alt="Preview Avatar"
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-500/50 bg-slate-800 shadow-md shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl border border-slate-700 cursor-pointer font-medium text-[11px] flex items-center gap-1.5 transition-colors">
                        <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                        <span>Upload Foto Baru</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {/* Preset Avatars Selector */}
                    <div className="flex items-center gap-1.5">
                      {PRESET_AVATARS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvatarUrl(preset)}
                          className={`w-6 h-6 rounded-lg overflow-hidden border transition-all ${
                            avatarUrl === preset
                              ? "border-blue-400 scale-110 shadow-sm"
                              : "border-slate-700 opacity-60 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={preset}
                            alt={`Preset ${idx + 1}`}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dra. Siti Rahmawati, M.Pd."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Username Login
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="contoh: siti.rahmawati"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Kata Sandi (Password)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="contoh: guru123"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                    />
                    <Key className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Alamat Email Sekolah</label>
                <input
                  type="email"
                  required
                  placeholder="email@guru.sch.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Peran (Role)</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="GURU">Guru Pengajar</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status Akun</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "ACTIVE" | "INACTIVE")}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="ACTIVE">Aktif (Bisa Login)</option>
                    <option value="INACTIVE">Non-Aktif (Blokir Login)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">NIP / Pegawai ID</label>
                  <input
                    type="text"
                    placeholder="19850101..."
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Mata Pelajaran</label>
                  <input
                    type="text"
                    placeholder="Matematika, Fisika, dll."
                    value={subjectSpecialty}
                    onChange={(e) => setSubjectSpecialty(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-md shadow-blue-600/30"
                >
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
