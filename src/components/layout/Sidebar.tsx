import React from "react";
import {
  LayoutDashboard,
  FolderArchive,
  Star,
  Trash2,
  BookOpen,
  Layers,
  GraduationCap,
  FileCheck2,
  CalendarDays,
  Tag,
  History,
  ShieldAlert,
  Users,
  HardDrive,
  Activity,
  Code2,
  Settings,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { UserProfile } from "../../types";

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  currentUser: UserProfile;
  stats: {
    totalBankSoal: number;
    totalFavorites: number;
    totalTrash: number;
    totalStorage: number;
  };
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  currentUser,
  stats,
  isMobileOpen,
  onCloseMobile,
}) => {
  const isAdmin = currentUser.role === "ADMIN";

  const handleNav = (view: string) => {
    onNavigate(view);
    onCloseMobile();
  };

  const navItems = [
    {
      group: "UTAMA",
      items: [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
        {
          id: "banksoal",
          label: "Bank Soal PDF",
          icon: <FolderArchive className="w-4 h-4" />,
          badge: stats.totalBankSoal,
          badgeColor: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
        },
        {
          id: "favorites",
          label: "Favorit Saya",
          icon: <Star className="w-4 h-4" />,
          badge: stats.totalFavorites,
          badgeColor: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
        },
        {
          id: "trash",
          label: "Keranjang Sampah",
          icon: <Trash2 className="w-4 h-4" />,
          badge: stats.totalTrash > 0 ? stats.totalTrash : undefined,
          badgeColor: "bg-rose-500/20 text-rose-400 border border-rose-500/30",
        },
      ],
    },
    {
      group: "MASTER ORGANISASI",
      items: [
        {
          id: "master-mapel",
          label: "Mata Pelajaran",
          icon: <BookOpen className="w-4 h-4" />,
        },
        {
          id: "master-jenjang",
          label: "Jenjang",
          icon: <GraduationCap className="w-4 h-4" />,
        },
        {
          id: "master-kelas",
          label: "Tingkat Kelas",
          icon: <Layers className="w-4 h-4" />,
        },
        {
          id: "master-kurikulum",
          label: "Kategori & Kurikulum",
          icon: <CalendarDays className="w-4 h-4" />,
        },
        {
          id: "master-ujian",
          label: "Jenis & Bentuk Soal",
          icon: <FileCheck2 className="w-4 h-4" />,
        },
        {
          id: "master-tahun",
          label: "Tahun Ajaran",
          icon: <CalendarDays className="w-4 h-4" />,
        },
        {
          id: "master-tags",
          label: "Tag Soal",
          icon: <Tag className="w-4 h-4" />,
        },
      ],
    },
    {
      group: "AKTIVITAS",
      items: [
        {
          id: "activity-history",
          label: "Riwayat Aktivitas",
          icon: <History className="w-4 h-4" />,
        },
        ...(isAdmin
          ? [
              {
                id: "audit-logs",
                label: "Audit Trail",
                icon: <ShieldAlert className="w-4 h-4" />,
                badge: "Admin",
                badgeColor: "bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px]",
              },
            ]
          : []),
      ],
    },
    ...(isAdmin
      ? [
          {
            group: "ADMINISTRASI",
            items: [
              {
                id: "users",
                label: "Manajemen Pengguna",
                icon: <Users className="w-4 h-4" />,
              },
              {
                id: "storage",
                label: "Penyimpanan Google",
                icon: <HardDrive className="w-4 h-4" />,
                badge: stats.totalStorage,
                badgeColor: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
              },
              {
                id: "system-health",
                label: "Kesehatan Sistem",
                icon: <Activity className="w-4 h-4" />,
              },
              {
                id: "apps-script-guide",
                label: "Panduan Apps Script",
                icon: <Code2 className="w-4 h-4" />,
              },
              {
                id: "settings",
                label: "Pengaturan Sistem",
                icon: <Settings className="w-4 h-4" />,
              },
            ],
          },
        ]
      : []),
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          {navItems.map((grp) => (
            <div key={grp.group} className="space-y-1">
              <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {grp.group}
              </p>
              <div className="space-y-0.5 mt-1">
                {grp.items.map((item) => {
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`sidebar-nav-${item.id}`}
                      onClick={() => handleNav(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                          : "text-slate-300 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={isActive ? "text-white" : "text-slate-400"}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            isActive
                              ? "bg-white/20 text-white"
                              : item.badgeColor || "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Card for AI & Google Status */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/50">
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Gemini 3.7 AI Ready</p>
                <p className="text-[10px] text-slate-400">Auto Metadata & Suggester</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
