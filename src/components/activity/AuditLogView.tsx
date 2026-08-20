import React, { useState } from "react";
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { AuditLog } from "../../types";
import { toast } from "../ui/Toast";

interface AuditLogViewProps {
  auditLogs: AuditLog[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ auditLogs }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");

  const filtered = auditLogs.filter((log) => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        log.user_name.toLowerCase().includes(q) ||
        log.entity_id.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (actionFilter !== "ALL" && log.action !== actionFilter) return false;
    return true;
  });

  const handleExportCsv = () => {
    const headers = "Timestamp,User,Role,Action,Entity,EntityID,IP,Status,Details\n";
    const rows = filtered
      .map(
        (l) =>
          `"${l.timestamp}","${l.user_name}","${l.user_role}","${l.action}","${l.entity_type}","${l.entity_id}","${l.ip_address}","${l.status}","${l.details.replace(/"/g, '""')}"`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `audit-trail-banksoal-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Audit Trail Diekspor", `${filtered.length} baris data CSV telah diunduh`);
  };

  return (
    <div id="audit-log-view" className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Audit Trail & Keamanan</h2>
            <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              Khusus Administrator
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Rekam jejak kepatuhan, histori akses, perubahan permission, dan integritas naskah soal.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari audit log..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-850 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Waktu</th>
                <th className="py-3.5 px-4">Pengguna</th>
                <th className="py-3.5 px-4">Aksi & Entitas</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Rincian Perubahan</th>
                <th className="py-3.5 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap text-[11px]">
                    {new Date(log.timestamp).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-white block">{log.user_name}</span>
                    <span className="text-[10px] text-slate-400">{log.user_role}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-blue-400 block">{log.action}</span>
                    <span className="text-[10px] text-slate-400">
                      {log.entity_type} ({log.entity_id})
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        log.status === "SUCCESS"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300 max-w-sm truncate">{log.details}</td>
                  <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{log.ip_address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
