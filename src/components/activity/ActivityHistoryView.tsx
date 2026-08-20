import React, { useState } from "react";
import {
  History,
  Search,
  Clock,
  User,
  Filter,
  FileText,
  Download,
  Trash2,
  Edit,
  Upload,
  RotateCcw,
} from "lucide-react";
import { ActivityHistory } from "../../types";

interface ActivityHistoryViewProps {
  activities: ActivityHistory[];
}

export const ActivityHistoryView: React.FC<ActivityHistoryViewProps> = ({ activities }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");

  const filtered = activities.filter((act) => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        act.user_name.toLowerCase().includes(q) ||
        act.item_title.toLowerCase().includes(q) ||
        act.details.toLowerCase().includes(q) ||
        act.action.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (actionFilter !== "ALL" && act.action !== actionFilter) return false;
    return true;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case "UPLOAD":
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">UPLOAD</span>;
      case "DOWNLOAD":
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">DOWNLOAD</span>;
      case "UPDATE":
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">UPDATE</span>;
      case "DELETE":
      case "TRASH":
        return <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">TRASH</span>;
      case "RESTORE":
        return <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">RESTORE</span>;
      default:
        return <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full">{action}</span>;
    }
  };

  return (
    <div id="activity-history-view" className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Riwayat Aktivitas Pengajar</h2>
            <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {filtered.length} Aktivitas
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Linimasa interaksi pengunggahan, pengunduhan, pengeditan, dan pemulihan naskah soal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari aktivitas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Semua Aksi</option>
            <option value="UPLOAD">Upload</option>
            <option value="DOWNLOAD">Download</option>
            <option value="UPDATE">Update</option>
            <option value="TRASH">Trash</option>
            <option value="RESTORE">Restore</option>
          </select>
        </div>
      </div>

      {/* Timeline List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="space-y-4">
          {filtered.map((act) => (
            <div
              key={act.id}
              className="p-4 bg-slate-850 hover:bg-slate-800/80 border border-slate-800 rounded-2xl flex items-start justify-between gap-4 transition-colors"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getActionBadge(act.action)}
                    <span className="text-sm font-bold text-white">{act.item_title}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{act.details}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1 font-mono">
                    <span className="flex items-center gap-1 text-slate-400 font-sans">
                      <User className="w-3 h-3" /> {act.user_name}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(act.timestamp).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
