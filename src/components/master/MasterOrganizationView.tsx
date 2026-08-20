import React, { useState } from "react";
import {
  BookOpen,
  GraduationCap,
  Layers,
  FileCheck2,
  CalendarDays,
  Tag,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Save,
  X,
  Search,
  School,
  Sparkles,
} from "lucide-react";
import { CategoryMaster, TagItem, MasterCategoryType } from "../../types";
import { AppStore } from "../../services/store";
import { toast } from "../ui/Toast";

interface MasterOrganizationViewProps {
  initialTab?: string;
  categories: CategoryMaster[];
  tags: TagItem[];
  onRefresh: () => void;
}

export const MasterOrganizationView: React.FC<MasterOrganizationViewProps> = ({
  initialTab = "MATA_PELAJARAN",
  categories,
  tags,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form states
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3B82F6");

  // Determine current dataset
  const isTagTab = activeTab === "TAGS";
  const currentCategoryType = activeTab as MasterCategoryType;

  const currentCategories = isTagTab
    ? []
    : categories.filter((c) => c.type === currentCategoryType);

  const filteredItems = isTagTab
    ? tags.filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : currentCategories.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.code && c.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );

  const openAddModal = () => {
    setEditingItem(null);
    setName("");
    setCode("");
    setDescription("");
    setColor("#3B82F6");
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setName(item.name);
    setCode(item.code || "");
    setDescription(item.description || "");
    setColor(item.color || "#3B82F6");
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama Wajib Diisi");
      return;
    }

    if (isTagTab) {
      if (editingItem) {
        AppStore.updateTag(editingItem.id, { name: name.trim(), color });
        toast.success("Tag Diperbarui", name);
      } else {
        AppStore.addTag({ name: name.trim(), color });
        toast.success("Tag Ditambahkan", name);
      }
    } else {
      if (editingItem) {
        AppStore.updateCategory(editingItem.id, {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description.trim(),
          color,
        });
        toast.success("Kategori Diperbarui", name);
      } else {
        AppStore.addCategory({
          type: currentCategoryType,
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description.trim(),
          color,
        });
        toast.success("Kategori Ditambahkan", name);
      }
    }

    setIsModalOpen(false);
    onRefresh();
  };

  const handleDelete = (item: any) => {
    if (confirm(`Apakah Anda yakin ingin menghapus "${item.name}"?`)) {
      if (isTagTab) {
        AppStore.deleteTag(item.id);
      } else {
        AppStore.deleteCategory(item.id);
      }
      toast.warning("Data Dihapus", item.name);
      onRefresh();
    }
  };

  const tabs = [
    {
      id: "MATA_PELAJARAN",
      label: "Mata Pelajaran",
      icon: <BookOpen className="w-4 h-4" />,
      count: categories.filter((c) => c.type === "MATA_PELAJARAN").length,
    },
    {
      id: "JENJANG",
      label: "Jenjang",
      icon: <School className="w-4 h-4" />,
      count: categories.filter((c) => c.type === "JENJANG").length,
    },
    {
      id: "TINGKAT_KELAS",
      label: "Kelas",
      icon: <GraduationCap className="w-4 h-4" />,
      count: categories.filter((c) => c.type === "TINGKAT_KELAS").length,
    },
    {
      id: "KURIKULUM",
      label: "Kategori & Kurikulum",
      icon: <Layers className="w-4 h-4" />,
      count: categories.filter((c) => c.type === "KURIKULUM").length,
    },
    {
      id: "JENIS_UJIAN",
      label: "Jenis & Bentuk Soal",
      icon: <FileCheck2 className="w-4 h-4" />,
      count: categories.filter((c) => c.type === "JENIS_UJIAN").length,
    },
    {
      id: "TAHUN_AJARAN",
      label: "Tahun Ajaran",
      icon: <CalendarDays className="w-4 h-4" />,
      count: categories.filter((c) => c.type === "TAHUN_AJARAN").length,
    },
    {
      id: "TAGS",
      label: "Tag Soal",
      icon: <Tag className="w-4 h-4" />,
      count: tags.length,
    },
  ];

  const currentTabInfo = tabs.find((t) => t.id === activeTab) || tabs[0];

  const colorOptions = [
    { label: "Biru", value: "#3B82F6" },
    { label: "Hijau", value: "#10B981" },
    { label: "Ungu", value: "#8B5CF6" },
    { label: "Kuning / Amber", value: "#F59E0B" },
    { label: "Pink / Merah Muda", value: "#EC4899" },
    { label: "Merah", value: "#EF4444" },
    { label: "Teal / Cyan", value: "#14B8A6" },
    { label: "Indigo", value: "#6366F1" },
    { label: "Abu-abu", value: "#64748B" },
  ];

  return (
    <div id="master-organization-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Master Data & Taksonomi Soal
            </h2>
            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              7 Modul Master
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Kelola data master Mata Pelajaran, Jenjang, Kelas, Kategori/Kurikulum, Jenis Ujian, Bentuk Soal, dan Kumpulan Tag.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah {currentTabInfo.label}</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id);
                setSearchQuery("");
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                }`}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Bar for Current Tab */}
      <div className="flex items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Cari dalam ${currentTabInfo.label}...`}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="text-xs text-slate-400 font-medium hidden sm:block">
          Total: <span className="text-white font-bold">{filteredItems.length}</span> data
        </div>
      </div>

      {/* Main Table / Grid Content */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {isTagTab ? (
          /* Tags Grid View */
          <div className="p-6">
            {filteredItems.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Tidak ada tag yang sesuai dengan pencarian.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredItems.map((t: any) => (
                  <div
                    key={t.id}
                    className="p-3 bg-slate-850 hover:bg-slate-800 border border-slate-700/60 rounded-xl flex items-center justify-between gap-2 transition-colors group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: t.color || "#3B82F6" }}
                      />
                      <span className="text-xs font-semibold text-white truncate">#{t.name}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(t)}
                        className="p-1 text-slate-400 hover:text-white"
                        title="Edit Tag"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(t)}
                        className="p-1 text-slate-400 hover:text-rose-400"
                        title="Hapus Tag"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Category Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-850 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-5">Nama Data</th>
                  <th className="py-3.5 px-5">Kode / Singkatan</th>
                  <th className="py-3.5 px-5">Keterangan / Deskripsi</th>
                  <th className="py-3.5 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500 text-xs">
                      Tidak ada data yang cocok dengan kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((cat: any) => (
                    <tr key={cat.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-5 font-bold text-white flex items-center gap-2.5">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: cat.color || "#3B82F6" }}
                        />
                        <span className="text-sm">{cat.name}</span>
                      </td>
                      <td className="py-3 px-5 font-mono text-slate-300 font-medium">
                        {cat.code ? (
                          <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-[11px]">
                            {cat.code}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="py-3 px-5 text-slate-400 max-w-sm truncate">
                        {cat.description || "-"}
                      </td>
                      <td className="py-3 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(cat)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors"
                            title="Edit Data"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 hover:border-rose-800 transition-colors"
                            title="Hapus Data"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Master Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-850">
              <h3 className="text-sm font-bold text-white">
                {editingItem ? `Edit ${currentTabInfo.label}` : `Tambah ${currentTabInfo.label} Baru`}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nama {currentTabInfo.label} <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    isTagTab
                      ? "Contoh: Olimpiade"
                      : activeTab === "MATA_PELAJARAN"
                      ? "Contoh: Bahasa Jerman"
                      : activeTab === "JENJANG"
                      ? "Contoh: Madrasah Aliyah (MA)"
                      : activeTab === "TINGKAT_KELAS"
                      ? "Contoh: Kelas 10 (Fase E)"
                      : "Contoh: Nama Master"
                  }
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              {!isTagTab && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Kode / Singkatan</label>
                  <input
                    type="text"
                    placeholder="Contoh: B.JER / K10 / PTS"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-blue-500 uppercase"
                  />
                </div>
              )}

              {/* Color Picker */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Warna Aksen / Label</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {colorOptions.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setColor(c.value)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        color === c.value
                          ? "border-white scale-110 shadow-lg"
                          : "border-transparent opacity-75 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Deskripsi / Keterangan</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan cakupan materi, fase, atau standar..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
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
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

