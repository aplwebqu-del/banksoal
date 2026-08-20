import React, { useState } from "react";
import { X, Edit, Save, BookOpen, Layers, Sparkles } from "lucide-react";
import {
  BankSoal,
  CategoryMaster,
  TagItem,
  JenjangType,
  ExamType,
  DifficultyLevel,
} from "../../types";
import { AppStore } from "../../services/store";
import { toast } from "../ui/Toast";

interface EditMetadataModalProps {
  item: BankSoal | null;
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryMaster[];
  tags: TagItem[];
  onUpdated: (updated: BankSoal) => void;
}

export const EditMetadataModal: React.FC<EditMetadataModalProps> = ({
  item,
  isOpen,
  onClose,
  categories,
  tags,
  onUpdated,
}) => {
  if (!isOpen || !item) return null;

  const [title, setTitle] = useState(item.title);
  const [mataPelajaran, setMataPelajaran] = useState(item.mata_pelajaran);
  const [jenjang, setJenjang] = useState<JenjangType>(item.jenjang);
  const [kelas, setKelas] = useState(item.kelas);
  const [kurikulum, setKurikulum] = useState(item.kurikulum);
  const [bab, setBab] = useState(item.bab);
  const [topik, setTopik] = useState(item.topik);
  const [subtopik, setSubtopik] = useState(item.subtopik || "");
  const [jenisSoal, setJenisSoal] = useState<ExamType>(item.jenis_soal);
  const [tingkatKesulitan, setTingkatKesulitan] = useState<DifficultyLevel>(item.tingkat_kesulitan);
  const [tahunAjaran, setTahunAjaran] = useState(item.tahun_ajaran);
  const [semester, setSemester] = useState(item.semester);
  const [sumber, setSumber] = useState(item.sumber);
  const [deskripsi, setDeskripsi] = useState(item.deskripsi);
  const [selectedTags, setSelectedTags] = useState<string[]>(item.tags);
  const [newTagInput, setNewTagInput] = useState("");

  const subjects = categories.filter((c) => c.type === "MATA_PELAJARAN").map((c) => c.name);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTagInput.trim()) {
      e.preventDefault();
      const val = newTagInput.trim().replace(/^#/, "");
      if (!selectedTags.includes(val)) {
        setSelectedTags([...selectedTags, val]);
      }
      setNewTagInput("");
    }
  };

  const handleRemoveTag = (tagName: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tagName));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Judul Wajib Diisi");
      return;
    }

    const updated = AppStore.updateBankSoal(item.id, {
      title: title.trim(),
      mata_pelajaran: mataPelajaran,
      jenjang,
      kelas,
      kurikulum,
      bab: bab.trim(),
      topik: topik.trim(),
      subtopik: subtopik.trim(),
      jenis_soal: jenisSoal,
      tingkat_kesulitan: tingkatKesulitan,
      tahun_ajaran: tahunAjaran.trim(),
      semester,
      sumber: sumber.trim(),
      deskripsi: deskripsi.trim(),
      tags: selectedTags,
    });

    if (updated) {
      toast.success("Metadata Berhasil Diperbarui", updated.business_id);
      onUpdated(updated);
      onClose();
    }
  };

  return (
    <div
      id="edit-metadata-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Edit Metadata Naskah Soal</h3>
              <p className="text-xs text-slate-400">ID: {item.business_id}</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">Judul Naskah Soal</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Mata Pelajaran</label>
              <select
                value={mataPelajaran}
                onChange={(e) => setMataPelajaran(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Jenjang</label>
                <select
                  value={jenjang}
                  onChange={(e: any) => setJenjang(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="SD">SD</option>
                  <option value="SMP">SMP</option>
                  <option value="SMA">SMA</option>
                  <option value="SMK">SMK</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Kelas</label>
                <select
                  value={kelas}
                  onChange={(e) => setKelas(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={String(i + 1)}>
                      Kelas {i + 1}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Kurikulum</label>
              <select
                value={kurikulum}
                onChange={(e) => setKurikulum(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="Kurikulum Merdeka">Kurikulum Merdeka</option>
                <option value="Kurikulum 2013 (K13 Revisi)">Kurikulum 2013 (K13 Revisi)</option>
                <option value="Cambridge International">Cambridge International</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Bentuk Soal</label>
              <select
                value={jenisSoal}
                onChange={(e: any) => setJenisSoal(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="Pilihan Ganda">Pilihan Ganda</option>
                <option value="Uraian / Essay">Uraian / Essay</option>
                <option value="Campuran (PG & Essay)">Campuran (PG & Essay)</option>
                <option value="AKM (Asesmen Kompetensi)">AKM (Literasi/Numerasi)</option>
                <option value="HOTS (Higher Order Thinking)">HOTS</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Bab / Pokok Bahasan</label>
              <input
                type="text"
                value={bab}
                onChange={(e) => setBab(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Topik</label>
              <input
                type="text"
                value={topik}
                onChange={(e) => setTopik(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Tingkat Kesulitan</label>
              <select
                value={tingkatKesulitan}
                onChange={(e: any) => setTingkatKesulitan(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="Mudah">Mudah</option>
                <option value="Sedang">Sedang</option>
                <option value="Sulit">Sulit</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tahun Ajaran</label>
                <input
                  type="text"
                  value={tahunAjaran}
                  onChange={(e) => setTahunAjaran(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Semester</label>
                <select
                  value={semester}
                  onChange={(e: any) => setSemester(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="Ganjil">Ganjil</option>
                  <option value="Genap">Genap</option>
                </select>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">Tags</label>
              <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-800 border border-slate-700 rounded-xl">
                {selectedTags.map((t) => (
                  <span
                    key={t}
                    className="bg-blue-600/30 text-blue-300 text-xs px-2 py-0.5 rounded-md flex items-center gap-1"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-white"
                    >
                      ✕
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Ketik tag lalu Enter..."
                  className="bg-transparent text-slate-200 text-xs focus:outline-none flex-1 min-w-[120px]"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">Deskripsi</label>
              <textarea
                rows={2}
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-750 rounded-xl text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
